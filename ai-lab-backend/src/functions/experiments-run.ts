import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { AIExperiment, Environment, Subscription } from "../shared/models";
import { runChatCompletion } from "../shared/openaiClient";
import { recordUsage } from "../shared/usage";

const experimentsContainer = containers.aiExperiments;
const envsContainer = containers.environments;
const subsContainer = containers.subscriptions;

interface RunBody {
  environmentId: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

export async function runExperimentHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const experimentId = req.params.id;

  const body = await req.json().catch(() => null) as RunBody | null;
  if (!body?.environmentId || !Array.isArray(body.messages)) {
    return { status: 400, jsonBody: { error: "environmentId and messages[] are required" } };
  }

  // Get experiment
  const { resource: experiment } = await experimentsContainer
    .item(experimentId, experimentId)
    .read<AIExperiment>()
    .catch(() => ({ resource: undefined }));

  if (!experiment) {
    return { status: 404, jsonBody: { error: "Experiment not found" } };
  }

  // Get environment
  const { resource: env } = await envsContainer
    .item(body.environmentId, auth.tenantId)
    .read<Environment>()
    .catch(() => ({ resource: undefined }));

  if (!env || env.tenantId !== auth.tenantId) {
    return { status: 404, jsonBody: { error: "Environment not found" } };
  }

  // Get subscription
  const { resource: sub } = await subsContainer
    .item(env.subscriptionId, auth.tenantId)
    .read<Subscription>()
    .catch(() => ({ resource: undefined }));

  if (!sub || sub.status !== "Active") {
    return { status: 400, jsonBody: { error: "Subscription not active" } };
  }

  if (sub.creditsRemaining <= 0) {
    return { status: 400, jsonBody: { error: "No credits remaining" } };
  }

  // Build messages with system prompt
  const systemMsg = {
    role: "system" as const,
    content: experiment.systemPrompt
  };

  const userMsgs = body.messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content
  }));

  const allMessages = [systemMsg, ...userMsgs];

  // Call Azure OpenAI
  const { reply, tokensUsed } = await runChatCompletion(allMessages, experiment.maxTokensPerCall);

  // Record usage & decrement subscription credits
  const usage = await recordUsage({
    tenantId: auth.tenantId,
    subscriptionId: sub.id,
    environmentId: env.id,
    tokensUsed,
    operation: "OpenAIChat",
    experimentId
  });

  sub.creditsRemaining = Math.max(0, sub.creditsRemaining - usage.creditsConsumed);
  await subsContainer.item(sub.id, sub.tenantId).replace(sub);

  return {
    status: 200,
    jsonBody: {
      reply,
      approxTokensUsed: tokensUsed,
      creditsRemaining: sub.creditsRemaining
    }
  };
}

app.http("experiments-run", {
  methods: ["POST"],
  route: "experiments/{id}/run",
  authLevel: "anonymous",
  handler: runExperimentHandler
});
