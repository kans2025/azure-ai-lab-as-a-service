import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { containers } from "../shared/cosmosClient";
import { AIExperiment } from "../shared/models";

const experimentsContainer = containers.aiExperiments;

export async function getExperimentByIdHandler(req: HttpRequest): Promise<HttpResponseInit> {
  const id = req.params.id;

  const { resource } = await experimentsContainer
    .item(id, id)
    .read<AIExperiment>()
    .catch(() => ({ resource: undefined }));

  if (!resource) {
    return { status: 404, jsonBody: { error: "Experiment not found" } };
  }

  return {
    status: 200,
    jsonBody: resource
  };
}

app.http("experiments-get-by-id", {
  methods: ["GET"],
  route: "experiments/{id}",
  authLevel: "anonymous",
  handler: getExperimentByIdHandler
});

