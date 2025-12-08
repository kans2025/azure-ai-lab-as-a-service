export type TierId = "student" | "starter" | "professional" | "enterprise-lite";

export interface User {
  id: string;          // same as userId
  tenantId: string;
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface TierDefinition {
  id: TierId | string;
  name: string;
  description: string;
  defaultCredits: number;
  limits: {
    maxEnvironments: number;
    maxTokensPerDay: number;
    maxConcurrentCalls: number;
    labExpiryDays: number;
  };
  allowedServices: string[];
  bicepParameterSet?: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  userId: string;
  tierId: string;
  status: "Active" | "Expired" | "Cancelled";
  prepaidCredits: number;
  creditsRemaining: number;
  createdAt: string;
  expiresAt: string;
}

export type EnvironmentStatus = "Provisioning" | "Active" | "Deleting" | "Deleted" | "Error";

export interface Environment {
  id: string;
  tenantId: string;
  subscriptionId: string;
  tierId: string;
  name: string;
  resourceGroupName: string;
  region: string;
  status: EnvironmentStatus;
  createdAt: string;
  expiresAt: string;
  softDeleted?: boolean;
}

export interface UsageSnapshot {
  id: string;
  tenantId: string;
  subscriptionId: string;
  environmentId?: string;
  timestamp: string;
  tokensUsed: number;
  creditsConsumed: number;
  operation: string;     // e.g. "OpenAIChat"
  experimentId?: string;
}

export interface AIExperiment {
  id: string;
  title: string;
  tierIds: TierId[];
  description: string;
  systemPrompt: string;
  maxTokensPerCall: number;
  maxDailyTokensPerUser: number;
  samplePrompts: string[];
}
