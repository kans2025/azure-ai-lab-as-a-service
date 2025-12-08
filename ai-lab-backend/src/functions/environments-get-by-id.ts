import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { getAuthContext, unauthorized, forbidden } from "../shared/auth";
import { Environment } from "../shared/models";

const envsContainer = containers.environments;

export async function getEnvironmentByIdHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = getAuthContext(req, context);
  if (!auth) return unauthorized();

  const id = req.params.id;
  const { resource: env } = await envsContainer.item(id, auth.tenantId).read<Environment>().catch(() => ({
    resource: undefined
  }));

  if (!env || env.softDeleted) {
    return { status: 404, jsonBody: { error: "Environment not found" } };
  }

  if (env.tenantId !== auth.tenantId) {
    return forbidden();
  }

  return {
    status: 200,
    jsonBody: env
  };
}

app.http("environments-get-by-id", {
  methods: ["GET"],
  route: "environments/{id}",
  authLevel: "anonymous",
  handler: getEnvironmentByIdHandler
});

