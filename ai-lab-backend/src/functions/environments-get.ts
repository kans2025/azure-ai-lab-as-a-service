import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized } from "../shared/auth";
import { Environment } from "../shared/models";

const envsContainer = containers.environments;

/**
 * List all non-deleted environments for the current tenant.
 * This is what the portal "Existing environments" grid calls.
 */
export async function getEnvironmentsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  // Very simple query: all envs for this tenant that are not softDeleted.
  const { resources } = await envsContainer.items
    .query<Environment>({
      query:
        "SELECT * FROM c WHERE c.tenantId = @tenantId AND (NOT IS_DEFINED(c.softDeleted) OR c.softDeleted != true)",
      parameters: [{ name: "@tenantId", value: auth.tenantId }]
    })
    .fetchAll();

  context.log(
    `Found ${resources.length} environments for tenant ${auth.tenantId} in environments-get handler`
  );

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("environments-get", {
  methods: ["GET"],
  route: "environments",
  authLevel: "anonymous", // protected by App Service / SWA auth in front
  handler: getEnvironmentsHandler
});
