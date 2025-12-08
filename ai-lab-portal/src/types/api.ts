export type TierId = "student" | "starter" | "professional" | "enterprise-lite" | string;

export interface TierDefinition {
  id: TierId;
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
}

export interface Subscription {
  id: string;
  tenantId: string;
  userId: string;
  tierId: TierId;
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
  tierId: TierId;
  name: string;
  resourceGroupName: string;
  region: string;
  status: EnvironmentStatus;
  createdAt: string;
  expiresAt: string;
  softDeleted?: boolean;
}

export interface UserProfile {
  userId: string;
  tenantId: string;
  displayName: string;
  roles: string[];
  subscriptions: Subscription[];
}

export interface UsageCreditSummary {
  id: string;
  tierId: TierId;
  prepaidCredits: number;
  creditsRemaining: number;
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

export interface ExperimentRunResponse {
  reply: string;
  approxTokensUsed: number;
  creditsRemaining: number;
}

