import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Environment, Subscription, TierDefinition } from "../shared/models";
import { v4 as uuid } from "uuid";

const envsContainer = containers.environments;
const subsContainer = containers.subscriptions;
const tiersContainer = containers.tierDefinitions;

const defaultRegion = process.env.DEFAULT_REGION || "southindia";
const rgPrefix = process.env.LAB_RESOURCE_GROUP_PREFIX || "rg-ailab";

async function getSubscriptionById(
  tenantId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const { resources } = await subsContainer.items
    .query<Subscription>({
      query: "SELECT * FROM c WHERE c.id = @id AND c.tenantId = @tenantId",
      parameters: [
        { name: "@id", value: subscriptionId },
        { name: "@tenantId", value: tenantId }
      ]
    })
    .fetchAll();

  return resources[0] ?? null;
}

async function getTierById(tierId: string): Promise<TierDefinition | null> {
  // Use query instead of item(...) so it works regardless of partition key config
  const { resources } = await tiersContainer.items
    .query<TierDefinition>({
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: tierId }]
    })
    .fetchAll();

  return resources[0] ?? null;
}

async function countActiveEnvironments(tenantId: string, subscriptionId: string) {
  const { resources } = await envsContainer.items
    .query<Environment>({
      query:
        "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.subscriptionId = @subId AND c.status != 'Deleted' AND (NOT IS_DEFINED(c.softDeleted) OR c.softDeleted != true)",
      parameters: [
        { name: "@tenantId", value: tenantId },
        { name: "@subId", value: subscriptionId }
      ]
    })
    .fetchAll();
  return resources.length;
}

function getResourceGroupName(tenantId: string, envId: string) {
  return `${rgPrefix}-${tenantId}-${envId}`.toLowerCase();
}

export async function createEnvironmentHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const body = (await req.json().catch(() => null)) as {
    subscriptionId?: string;
    name?: string;
    tierId?: string;
    region?: string;
  } | null;

  if (!body?.subscriptionId || !body?.name) {
    return { status: 400, jsonBody: { error: "subscriptionId and name are required" } };
  }

  // 1) Get subscription robustly
  const sub = await getSubscriptionById(auth.tenantId, body.subscriptionId);
  if (!sub) {
    return {
      status: 400,
      jsonBody: { error: "Subscription not found for this tenant" }
    };
  }
  if (sub.status !== "Active") {
    return {
      status: 400,
      jsonBody: { error: `Subscription is not Active (status=${sub.status})` }
    };
  }

  // 2) Get tier (either from body or subscription)
  const tierId = body.tierId ?? sub.tierId;
  const tier = await getTierById(tierId);
  if (!tier) {
    return {
      status: 400,
      jsonBody: { error: `Tier '${tierId}' not found. Check TierDefinitions data.` }
    };
  }

  // 3) Enforce max environments per tier
  const envCount = await countActiveEnvironments(auth.tenantId, sub.id);
  if (envCount >= tier.limits.maxEnvironments) {
    return {
      status: 400,
      jsonBody: {
        error: `Max environments (${tier.limits.maxEnvironments}) reached for this subscription and tier.`
      }
    };
  }

  // 4) Create environment document
  const envId = uuid();
  const now = new Date();
  const expires = new Date(now);
  const expiryDays = tier.limits.labExpiryDays ?? 14;
  expires.setDate(now.getDate() + expiryDays);

  const env: Environment = {
    id: envId,
    tenantId: auth.tenantId,
    subscriptionId: sub.id,
    tierId,
    name: body.name,
    resourceGroupName: getResourceGroupName(auth.tenantId, envId),
    region: body.region ?? defaultRegion,
    status: "Provisioning",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };

  const { resource: created } = await envsContainer.items.create(env);

  // For POC, mark Active immediately
  env.status = "Active";
  await envsContainer.items.upsert(env);

  context.log(`Created logical environment ${env.id} for tenant ${env.tenantId}`);

  return {
    status: 201,
    jsonBody: created
  };
}

app.http("environments-create", {
  methods: ["POST"],
  route: "environments",
  authLevel: "anonymous",
  handler: createEnvironmentHandler
});
