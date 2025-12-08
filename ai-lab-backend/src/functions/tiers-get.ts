import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { TierDefinition } from "../shared/models";

const tiersContainer = containers.tierDefinitions;

export async function getTiersHandler(_req: HttpRequest): Promise<HttpResponseInit> {
  const { resources } = await tiersContainer.items
    .query<TierDefinition>({ query: "SELECT * FROM c" })
    .fetchAll();

  return {
    status: 200,
    jsonBody: resources
  };
}

app.http("tiers-get", {
  methods: ["GET"],
  route: "tiers",
  authLevel: "anonymous",
  handler: getTiersHandler
});
