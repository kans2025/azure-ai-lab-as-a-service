import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Subscription } from "../shared/models";

const subsContainer = containers.subscriptions;

export async function getSubscriptionsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const { resources } = await subsContainer.items
    .query<Subscription>({
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.userId = @userId",
      parameters: [
        { name: "@tenantId", value: auth.tenantId },
        { name: "@userId", value: auth.userId }
      ]
    })
    .fetchAll();

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("subscriptions-get", {
  methods: ["GET"],
  route: "subscriptions",
  authLevel: "anonymous",
  handler: getSubscriptionsHandler
});

