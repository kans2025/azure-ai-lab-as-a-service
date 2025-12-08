import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Environment } from "../shared/models";

const envsContainer = containers.environments;

export async function getEnvironmentsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const { resources } = await envsContainer.items
    .query<Environment>({
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.softDeleted != true",
      parameters: [{ name: "@tenantId", value: auth.tenantId }]
    })
    .fetchAll();

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("environments-get", {
  methods: ["GET"],
  route: "environments",
  authLevel: "anonymous",
  handler: getEnvironmentsHandler
});

