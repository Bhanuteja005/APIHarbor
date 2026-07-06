import axios from "axios";

import { blockLocalAndPrivateIpAddresses } from "@app/lib/validator";

import { ApiKeyHealthStatus, ApiKeyProvider, TApiKeyGenericValidationConfig } from "./api-key-types";

export type TApiKeyValidationResult = {
  status: ApiKeyHealthStatus; // healthy | invalid | error
  httpStatus?: number;
  latencyMs: number;
  message?: string;
  quotaLimit?: number;
  quotaRemaining?: number;
};

const REQUEST_TIMEOUT_MS = 10_000;

const toInt = (val: unknown): number | undefined => {
  if (val === undefined || val === null) return undefined;
  const n = Number(Array.isArray(val) ? val[0] : val);
  return Number.isFinite(n) ? n : undefined;
};

// Pull the most common rate-limit headers that providers expose so we can surface quota/usage.
const extractQuota = (headers: Record<string, unknown>) => {
  const quotaLimit =
    toInt(headers["x-ratelimit-limit"]) ??
    toInt(headers["x-ratelimit-limit-requests"]) ??
    toInt(headers["ratelimit-limit"]);
  const quotaRemaining =
    toInt(headers["x-ratelimit-remaining"]) ??
    toInt(headers["x-ratelimit-remaining-requests"]) ??
    toInt(headers["ratelimit-remaining"]);
  return { quotaLimit, quotaRemaining };
};

type TProviderCheck = {
  method: "get" | "post";
  url: string;
  headers: (apiKey: string) => Record<string, string>;
};

// Read-only "whoami"-style endpoints per provider: a 2xx proves the key works without mutating anything.
const PROVIDER_CHECKS: Record<Exclude<ApiKeyProvider, ApiKeyProvider.Generic>, TProviderCheck> = {
  [ApiKeyProvider.OpenAI]: {
    method: "get",
    url: "https://api.openai.com/v1/models",
    headers: (k) => ({ Authorization: `Bearer ${k}` })
  },
  [ApiKeyProvider.Anthropic]: {
    method: "get",
    url: "https://api.anthropic.com/v1/models",
    headers: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01" })
  },
  [ApiKeyProvider.Stripe]: {
    method: "get",
    url: "https://api.stripe.com/v1/balance",
    headers: (k) => ({ Authorization: `Bearer ${k}` })
  },
  [ApiKeyProvider.GitHub]: {
    method: "get",
    url: "https://api.github.com/user",
    headers: (k) => ({
      Authorization: `Bearer ${k}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    })
  }
};

const statusFromHttp = (httpStatus: number): ApiKeyHealthStatus => {
  if (httpStatus >= 200 && httpStatus < 300) return ApiKeyHealthStatus.Healthy;
  if (httpStatus === 401 || httpStatus === 403) return ApiKeyHealthStatus.Invalid;
  return ApiKeyHealthStatus.Error;
};

export const validateApiKeyWithProvider = async (
  provider: ApiKeyProvider,
  apiKey: string,
  validationConfig?: TApiKeyGenericValidationConfig | null
): Promise<TApiKeyValidationResult> => {
  const start = Date.now();

  let method: "get" | "post" = "get";
  let url: string;
  let headers: Record<string, string>;

  if (provider === ApiKeyProvider.Generic) {
    const testUrl = validationConfig?.testUrl;
    if (!testUrl) {
      return {
        status: ApiKeyHealthStatus.Error,
        latencyMs: 0,
        message: "Generic provider requires a testUrl in validationConfig"
      };
    }
    // Prevent SSRF: never let a stored generic key probe internal/link-local addresses.
    try {
      await blockLocalAndPrivateIpAddresses(testUrl);
    } catch (err) {
      return {
        status: ApiKeyHealthStatus.Error,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Test URL is not allowed"
      };
    }
    url = testUrl;
    const headerName = validationConfig?.headerName || "Authorization";
    const scheme = validationConfig?.headerScheme ?? "Bearer";
    headers = { [headerName]: scheme ? `${scheme} ${apiKey}` : apiKey };
  } else {
    const check = PROVIDER_CHECKS[provider];
    method = check.method;
    url = check.url;
    headers = check.headers(apiKey);
  }

  try {
    const response = await axios.request({
      method,
      url,
      headers,
      timeout: REQUEST_TIMEOUT_MS,
      // Never throw on HTTP status — we interpret 2xx/401/403/etc. ourselves.
      validateStatus: () => true
    });
    const latencyMs = Date.now() - start;
    const status = statusFromHttp(response.status);
    const { quotaLimit, quotaRemaining } = extractQuota((response.headers ?? {}) as Record<string, unknown>);

    let message: string;
    if (status === ApiKeyHealthStatus.Healthy) message = "Key is valid";
    else if (status === ApiKeyHealthStatus.Invalid) message = `Provider rejected the key (HTTP ${response.status})`;
    else message = `Unexpected response from provider (HTTP ${response.status})`;

    return { status, httpStatus: response.status, latencyMs, message, quotaLimit, quotaRemaining };
  } catch (err) {
    return {
      status: ApiKeyHealthStatus.Error,
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Failed to reach provider"
    };
  }
};
