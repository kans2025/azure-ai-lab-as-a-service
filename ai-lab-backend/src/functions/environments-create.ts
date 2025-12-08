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

async function countActiveEnvironments(tenantId: string, subscriptionId: string) {
  const { resources } = await envsContainer.items
    .query<Environment>({
      query:
        "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.subscriptionId = @subId AND c.status != 'Deleted' AND c.softDeleted != true",
      parameters: [
        { name: "@tenantId", value: tenantId },
        { name: "@subId", value: subscriptionId }
      ]
    })
    .fetchAll();
  return resources.length;
}

// Stubbed provisioning – POC only
function getResourceGroupName(tenantId: string, envId: string) {
  return `${rgPrefix}-${tenantId}-${envId}`.toLowerCase();
}

export async function createEnvironmentHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null) as {
    subscriptionId?: string;
    name?: string;
    tierId?: string;
    region?: string;
  } | null;

  if (!body?.subscriptionId || !body?.name) {
    return { status: 400, jsonBody: { error: "subscriptionId and name are required" } };
  }

  // Get subscription
  const { resource: sub } = await subsContainer.item(body.subscriptionId, auth.tenantId).read<Subscription>().catch(
    () => ({ resource: undefined })
  );
  if (!sub || sub.status !== "Active") {
    return { status: 400, jsonBody: { error: "Subscription not found or not active" } };
  }

  // Get tier
  const tierId = body.tierId ?? sub.tierId;
  const { resource: tier } = await tiersContainer.item(tierId, tierId).read<TierDefinition>().catch(() => ({
    resource: undefined
  }));
  if (!tier) {
    return { status: 400, jsonBody: { error: "Tier not found" } };
  }

  // Enforce max environments per tier
  const envCount = await countActiveEnvironments(auth.tenantId, sub.id);
  if (envCount >= tier.limits.maxEnvironments) {
    return {
      status: 400,
      jsonBody: { error: "Max environments reached for this tier" }
    };
  }

  const envId = uuid();
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(now.getDate() + (tier.limits.labExpiryDays ?? 14));

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

  const { resource } = await envsContainer.items.create(env);

  // TODO: Replace with asynchronous ARM/Bicep deployment using Managed Identity.
  // For now, mark environment as Active immediately for POC.
  env.status = "Active";
  await envsContainer.item(env.id, env.tenantId).replace(env);

  context.log(`Created logical environment ${env.id} for tenant ${env.tenantId}`);

  return {
    status: 201,
    jsonBody: resource
  };
}

app.http("environments-create", {
  methods: ["POST"],
  route: "environments",
  authLevel: "anonymous",
  handler: createEnvironmentHandler
});

