import { CosmosClient, Database, Container } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;
const databaseName = process.env.COSMOS_DATABASE_NAME || "ailab-control";

if (!endpoint || !key) {
  // During local dev, you'll see this if you haven't configured env variables
  console.warn("[Cosmos] Missing COSMOS_ENDPOINT or COSMOS_KEY");
}

const client = new CosmosClient({ endpoint, key });
export const db: Database = client.database(databaseName);

export const containers = {
  users: db.container("Users"),
  subscriptions: db.container("Subscriptions"),
  tierDefinitions: db.container("TierDefinitions"),
  environments: db.container("Environments"),
  usageSnapshots: db.container("UsageSnapshots"),
  aiExperiments: db.container("AIExperiments")
};

export type ContainerName = keyof typeof containers;

export function getContainer(name: ContainerName): Container {
  return containers[name];
}
