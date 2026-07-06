export enum ApiKeyProvider {
  OpenAI = "openai",
  Anthropic = "anthropic",
  Stripe = "stripe",
  GitHub = "github",
  Generic = "generic"
}

export enum ApiKeyHealthStatus {
  Unknown = "unknown",
  Healthy = "healthy",
  Invalid = "invalid",
  Error = "error"
}

export type TApiKey = {
  id: string;
  projectId: string;
  name: string;
  provider: ApiKeyProvider | string;
  description?: string | null;
  healthStatus: ApiKeyHealthStatus | string;
  lastCheckedAt?: string | null;
  lastLatencyMs?: number | null;
  lastHttpStatus?: number | null;
  lastMessage?: string | null;
  lastUsedAt?: string | null;
  quotaLimit?: number | null;
  quotaRemaining?: number | null;
  monthlyBudgetCents?: number | null;
  monitoringEnabled: boolean;
  maskedKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type TApiKeyHealthCheck = {
  id: string;
  apiKeyId: string;
  status: string;
  httpStatus?: number | null;
  latencyMs?: number | null;
  message?: string | null;
  checkedAt: string;
};

export type TApiKeyValidationResult = {
  status: string;
  httpStatus?: number;
  latencyMs: number;
  message?: string;
  quotaLimit?: number;
  quotaRemaining?: number;
};

export type TGenericValidationConfig = {
  testUrl: string;
  headerName?: string;
  headerScheme?: string;
};

export type TCreateApiKeyDto = {
  projectId: string;
  name: string;
  provider: ApiKeyProvider;
  apiKey: string;
  description?: string;
  monitoringEnabled?: boolean;
  validationConfig?: TGenericValidationConfig;
};

export type TUpdateApiKeyDto = {
  apiKeyId: string;
  projectId: string;
  name?: string;
  description?: string;
  apiKey?: string;
  monitoringEnabled?: boolean;
  monthlyBudgetUsd?: number | null;
};

export type TDeleteApiKeyDto = { apiKeyId: string; projectId: string };
export type TValidateApiKeyDto = { apiKeyId: string; projectId: string };
export type TRevealApiKeyDto = { apiKeyId: string; projectId: string };

export type TApiKeySpendByProvider = {
  provider: string;
  costCents: number;
  requests: number;
};

export type TApiKeySpendByDay = {
  date: string;
  costCents: number;
  requests: number;
};

export type TApiKeySpendCounts = {
  total: number;
  healthy: number;
  invalid: number;
  error: number;
  unknown: number;
  lowQuota: number;
};

export type TApiKeySpendKeySummary = {
  id: string;
  name: string;
  provider: string;
  healthStatus: string;
  monthlyBudgetCents: number | null;
  spentCents: number;
  requests: number;
  overBudget: boolean;
};

export type TApiKeySpendSummary = {
  totalCostCents: number;
  totalRequests: number;
  counts: TApiKeySpendCounts;
  byProvider: TApiKeySpendByProvider[];
  byDay: TApiKeySpendByDay[];
  keys: TApiKeySpendKeySummary[];
};

export type TApiKeyUsageEntry = {
  usageDate: string;
  requests: number;
  tokens: number | null;
  costCents: number;
};

export type TRecordApiKeyUsageDto = {
  apiKeyId: string;
  projectId: string;
  requests?: number;
  tokens?: number;
  costUsd?: number;
  date?: string;
};
