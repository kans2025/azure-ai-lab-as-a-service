import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Subscription, TierDefinition } from "../shared/models";
import { v4 as uuid } from "uuid";

const subsContainer = containers.subscriptions;
const tiersContainer = containers.tierDefinitions;

export async function createSubscriptionHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null) as { tierId?: string; prepaidCredits?: number } | null;
  if (!body?.tierId) {
    return { status: 400, jsonBody: { error: "tierId is required" } };
  }

  const tierId = body.tierId;
  const { resource: tier } = await tiersContainer.item(tierId, tierId).read<TierDefinition>().catch(() => ({
    resource: undefined
  }));

  if (!tier) {
    return { status: 404, jsonBody: { error: "Tier not found" } };
  }

  const now = new Date();
  const expires = new Date(now);
  const expiryDays = tier.limits?.labExpiryDays ?? 14;
  expires.setDate(now.getDate() + expiryDays);

  const prepaid = body.prepaidCredits ?? tier.defaultCredits ?? 2000;

  const sub: Subscription = {
    id: uuid(),
    tenantId: auth.tenantId,
    userId: auth.userId,
    tierId,
    status: "Active",
    prepaidCredits: prepaid,
    creditsRemaining: prepaid,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };

  const { resource } = await subsContainer.items.create(sub);

  return {
    status: 201,
    jsonBody: resource
  };
}

app.http("subscriptions-create", {
  methods: ["POST"],
  route: "subscriptions",
  authLevel: "anonymous",
  handler: createSubscriptionHandler
});

