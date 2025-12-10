import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized, forbidden } from "../shared/auth";
import { Environment } from "../shared/models";

const envsContainer = containers.environments;

async function getEnvironmentForTenant(
  tenantId: string,
  envId: string
): Promise<Environment | null> {
  const { resources } = await envsContainer.items
    .query<Environment>({
      query: "SELECT * FROM c WHERE c.id = @id AND c.tenantId = @tenantId",
      parameters: [
        { name: "@id", value: envId },
        { name: "@tenantId", value: tenantId }
      ]
    })
    .fetchAll();

  return resources[0] ?? null;
}

export async function deleteEnvironmentHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const id = req.params.id;
  const env = await getEnvironmentForTenant(auth.tenantId, id);

  if (!env || env.softDeleted) {
    return { status: 404, jsonBody: { error: "Environment not found" } };
  }

  if (env.tenantId !== auth.tenantId) {
    return forbidden();
  }

  env.status = "Deleted";
  env.softDeleted = true;

  await envsContainer.items.upsert(env);

  // TODO: trigger actual ARM/Bicep delete in production

  context.log(`Soft-deleted environment ${env.id} for tenant ${env.tenantId}`);

  return {
    status: 200,
    jsonBody: { success: true }
  };
}

app.http("environments-delete", {
  methods: ["DELETE"],
  route: "environments/{id}",
  authLevel: "anonymous",
  handler: deleteEnvironmentHandler
});
