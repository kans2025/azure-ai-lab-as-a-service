import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Subscription } from "../shared/models";

const subsContainer = containers.subscriptions;

export async function getCreditsHandler(
  _req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(_req, context);
  if (!auth) return unauthorized();

  const { resources } = await subsContainer.items
    .query<Subscription>({
      query: "SELECT c.id, c.tierId, c.creditsRemaining, c.prepaidCredits FROM c WHERE c.tenantId = @tenantId",
      parameters: [{ name: "@tenantId", value: auth.tenantId }]
    })
    .fetchAll();

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("usage-credits", {
  methods: ["GET"],
  route: "usage/credits",
  authLevel: "anonymous",
  handler: getCreditsHandler
});

