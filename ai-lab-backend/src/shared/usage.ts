import { v4 as uuid } from "uuid";
import { containers } from "./cosmosClient";
import { UsageSnapshot } from "./models";

const usageContainer = containers.usageSnapshots;

// 1 token = 0.1 credit (POC rule) – adjust as needed
const TOKENS_TO_CREDITS_RATIO = 0.1;

export function tokensToCredits(tokens: number): number {
  return Math.ceil(tokens * TOKENS_TO_CREDITS_RATIO);
}

export async function recordUsage(params: {
  tenantId: string;
  subscriptionId: string;
  environmentId?: string;
  tokensUsed: number;
  operation: string;
  experimentId?: string;
}) {
  const creditsConsumed = tokensToCredits(params.tokensUsed);

  const snapshot: UsageSnapshot = {
    id: uuid(),
    tenantId: params.tenantId,
    subscriptionId: params.subscriptionId,
    environmentId: params.environmentId,
    timestamp: new Date().toISOString(),
    tokensUsed: params.tokensUsed,
    creditsConsumed,
    operation: params.operation,
    experimentId: params.experimentId
  };

  await usageContainer.items.create(snapshot);

  return snapshot;
}

