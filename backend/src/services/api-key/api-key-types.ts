import { TProjectPermission } from "@app/lib/types";

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

// Config used only by the "generic" provider so any HTTP API key can be validated.
export type TApiKeyGenericValidationConfig = {
  testUrl: string;
  headerName?: string; // defaults to "Authorization"
  headerScheme?: string; // e.g. "Bearer" => `Bearer <key>`; empty string => raw key
};

export type TCreateApiKeyDTO = {
  name: string;
  provider: ApiKeyProvider;
  apiKey: string;
  description?: string;
  monitoringEnabled?: boolean;
  validationConfig?: TApiKeyGenericValidationConfig;
} & TProjectPermission;

export type TUpdateApiKeyDTO = {
  apiKeyId: string;
  name?: string;
  description?: string;
  apiKey?: string;
  monitoringEnabled?: boolean;
  validationConfig?: TApiKeyGenericValidationConfig;
  monthlyBudgetUsd?: number | null;
} & Omit<TProjectPermission, "projectId">;

export type TRecordApiKeyUsageDTO = {
  apiKeyId: string;
  requests?: number;
  tokens?: number;
  costUsd?: number;
  date?: string; // YYYY-MM-DD; defaults to today (UTC)
} & Omit<TProjectPermission, "projectId">;

export type TGetApiKeyUsageDTO = {
  apiKeyId: string;
  days?: number;
} & Omit<TProjectPermission, "projectId">;

export type TGetSpendSummaryDTO = {
  days?: number;
} & TProjectPermission;

export type TDeleteApiKeyDTO = {
  apiKeyId: string;
} & Omit<TProjectPermission, "projectId">;

export type TGetApiKeyDTO = {
  apiKeyId: string;
} & Omit<TProjectPermission, "projectId">;

export type TRevealApiKeyDTO = {
  apiKeyId: string;
} & Omit<TProjectPermission, "projectId">;

export type TListApiKeysDTO = TProjectPermission;

export type TValidateApiKeyDTO = {
  apiKeyId: string;
} & Omit<TProjectPermission, "projectId">;

export type TGetApiKeyHealthHistoryDTO = {
  apiKeyId: string;
  limit?: number;
} & Omit<TProjectPermission, "projectId">;

// Free plan cap. Enterprise lifts this (see pricing) — kept as a constant so it is trivial to gate by plan later.
export const MAX_API_KEYS_PER_PROJECT = 30;
