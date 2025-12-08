import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { UsageSnapshot } from "../shared/models";

const usageContainer = containers.usageSnapshots;

export async function getUsageHistoryHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const top = parseInt(req.query.get("top") || "50", 10);

  const { resources } = await usageContainer.items
    .query<UsageSnapshot>({
      query:
        "SELECT TOP @top * FROM c WHERE c.tenantId = @tenantId ORDER BY c.timestamp DESC",
      parameters: [
        { name: "@top", value: top },
        { name: "@tenantId", value: auth.tenantId }
      ]
    })
    .fetchAll();

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("usage-history", {
  methods: ["GET"],
  route: "usage/history",
  authLevel: "anonymous",
  handler: getUsageHistoryHandler
});

