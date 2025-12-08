import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { AIExperiment, TierId } from "../shared/models";

const experimentsContainer = containers.aiExperiments;

export async function getExperimentsHandler(req: HttpRequest): Promise<HttpResponseInit> {
  const tierId = (req.query.get("tierId") as TierId | null) ?? null;

  if (tierId) {
    const { resources } = await experimentsContainer.items
      .query<AIExperiment>({
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(c.tierIds, @tierId)",
        parameters: [{ name: "@tierId", value: tierId }]
      })
      .fetchAll();

    return {
      status: 200,
      jsonBody: resources
    };
  } else {
    const { resources } = await experimentsContainer.items
      .query<AIExperiment>({ query: "SELECT * FROM c" })
      .fetchAll();

    return {
      status: 200,
      jsonBody: resources
    };
  }
}

app.http("experiments-get", {
  methods: ["GET"],
  route: "experiments",
  authLevel: "anonymous",
  handler: getExperimentsHandler
});

