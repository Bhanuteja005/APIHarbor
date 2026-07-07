// Wire types for the APIHarbor backend. Field names mirror the backend zod
// schemas exactly — do not rename.

export type ApiKeyProvider = "openai" | "anthropic" | "stripe" | "github" | "generic";

export type ApiKeyHealthStatus = "unknown" | "healthy" | "invalid" | "error";

export interface TApiKey {
    id: string;
    projectId: string;
    name: string;
    provider: ApiKeyProvider;
    description?: string | null;
    healthStatus: ApiKeyHealthStatus;
    lastCheckedAt?: string | null;
    lastLatencyMs?: number | null;
    lastHttpStatus?: number | null;
    lastMessage?: string | null;
    lastUsedAt?: string | null;
    quotaLimit?: number | null;
    quotaRemaining?: number | null;
    monthlyBudgetCents?: number | null;
    monitoringEnabled: boolean;
    maskedKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface TSpendCounts {
    total: number;
    healthy: number;
    invalid: number;
    error: number;
    unknown: number;
    lowQuota: number;
}

export interface TSpendByProvider {
    provider: string;
    costCents: number;
    requests: number;
}

export interface TSpendByDay {
    date: string;
    costCents: number;
    requests: number;
}

export interface TSpendKeySummary {
    id: string;
    name: string;
    provider: string;
    healthStatus: string;
    monthlyBudgetCents: number | null;
    spentCents: number;
    requests: number;
    overBudget: boolean;
}

export interface TSpendSummary {
    totalCostCents: number;
    totalRequests: number;
    counts: TSpendCounts;
    byProvider: TSpendByProvider[];
    byDay: TSpendByDay[];
    keys: TSpendKeySummary[];
}

export interface TOrganization {
    id: string;
    name: string;
    slug?: string;
}

export interface TProject {
    id: string;
    name: string;
    type: string;
    orgId: string;
    slug?: string;
}

export interface TUser {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string;
}

export interface THealthCheck {
    id: string;
    apiKeyId: string;
    status: string;
    httpStatus?: number | null;
    latencyMs?: number | null;
    message?: string | null;
    checkedAt: string;
}

export interface TKeyUsage {
    usageDate: string;
    requests: number;
    tokens?: number | null;
    costCents: number;
}

export interface TAuditLog {
    id: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    userAgentType?: string | null;
    createdAt: string;
    event: { type: string; metadata?: unknown };
    actor: { type: string; metadata?: { email?: string; userId?: string; name?: string } & Record<string, unknown> };
}

export interface TSession {
    id: string;
    ip: string;
    userAgent?: string | null;
    lastUsed: string;
    createdAt: string;
}

export interface TProductStats {
    secretManager: { secretsCount: number; environmentsCount: number; projectsCount: number };
    certificateManager: { certificatesCount: number; certificateAuthoritiesCount: number; signersCount: number };
    kms: { keysCount: number; clientsCount: number; projectsCount: number };
    secretScanning: { dataSourcesCount: number; resourcesCount: number; projectsCount: number };
    pam: { accountsCount: number; resourcesCount: number; projectsCount: number };
}

export interface TAppConnection {
    id: string;
    name: string;
    app: string;
    method: string;
    description?: string | null;
    version?: number;
    orgId?: string;
    createdAt: string;
    updatedAt?: string;
}

// Shape of GET /api/v1/projects/:projectId/cas — a flat record (the
// internal-CA fields are joined in, not nested under `configuration`).
export interface TCertificateAuthority {
    id: string;
    name: string;
    // internal CA type: "root" | "intermediate"
    type: string;
    status: string;
    enableDirectIssuance?: boolean;
    friendlyName?: string | null;
    commonName?: string | null;
    organization?: string | null;
    keyAlgorithm?: string | null;
    serialNumber?: string | null;
    notBefore?: string | null;
    notAfter?: string | null;
    createdAt?: string;
}

export interface TCertificate {
    id: string;
    friendlyName?: string | null;
    commonName?: string | null;
    serialNumber?: string | null;
    status?: string | null;
    notBefore?: string | null;
    notAfter?: string | null;
    altNames?: string | null;
}

export interface TAccount {
    id: string;
    email?: string | null;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    isMfaEnabled?: boolean | null;
    selectedMfaMethod?: string | null;
}
