#!/usr/bin/env node
/**
 * Seeds demo data into an existing APIHarbor account through the public API
 * (keys are KMS-encrypted at rest, so direct DB inserts would be unreadable).
 *
 * Usage:
 *   APIHARBOR_EMAIL=you@example.com APIHARBOR_PASSWORD=... node scripts/seed-demo.mjs
 *
 * Optional:
 *   APIHARBOR_URL   backend base URL (default: the Railway production API)
 *
 * What it creates:
 *   - "My Project" (if missing) with 6 tracked API keys in a realistic health
 *     mix (healthy / needs-rotation / failing), budgets, and 30 days of usage
 *   - a "Staging" project with 2 keys, to demo the project switcher
 *   - a "certificates" cert-manager project with an internal root CA
 */

const BASE_URL = (process.env.APIHARBOR_URL || "https://apiharbor-backend-production.up.railway.app").replace(/\/$/, "");
const EMAIL = process.env.APIHARBOR_EMAIL;
const PASSWORD = process.env.APIHARBOR_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error("Set APIHARBOR_EMAIL and APIHARBOR_PASSWORD environment variables first.");
    process.exit(1);
}

let token = "";

const api = async (method, path, body, { allowFail = false } = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }
    if (!res.ok) {
        if (allowFail) return null;
        throw new Error(`${method} ${path} -> ${res.status}: ${data?.message ?? text?.slice(0, 300)}`);
    }
    return data;
};

const day = (offset) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
};

// Deterministic-ish jitter so charts look organic without Math.random noise.
const jitter = (base, spread, salt) => Math.max(0, Math.round(base + Math.sin(salt * 2.7) * spread));

const login = async () => {
    console.log(`Logging in as ${EMAIL} at ${BASE_URL} ...`);
    const loginRes = await api("POST", "/api/v3/auth/login", { email: EMAIL, password: PASSWORD });
    token = loginRes.accessToken;

    const orgs = await api("GET", "/api/v1/organization");
    const org = orgs.organizations?.[0];
    if (!org) throw new Error("Account has no organization");
    console.log(`Using organization: ${org.name} (${org.id})`);

    const selected = await api("POST", "/api/v3/auth/select-organization", { organizationId: org.id });
    if (selected.isMfaEnabled) {
        throw new Error("This account requires MFA — temporarily disable MFA to run the seeder, then re-enable it.");
    }
    token = selected.token;
};

const ensureProject = async (name, type) => {
    const list = await api("GET", `/api/v1/projects?type=${type}`);
    const existing = (list.projects ?? []).find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        console.log(`Project "${name}" already exists (${existing.id})`);
        return existing;
    }
    const created = await api("POST", "/api/v1/projects", { projectName: name, type });
    console.log(`Created project "${name}" (${created.project.id})`);
    return created.project;
};

const ensureKey = async (projectId, spec) => {
    const list = await api("GET", `/api/v1/api-keys?projectId=${projectId}`);
    const existing = (list.apiKeys ?? []).find((k) => k.name === spec.name);
    if (existing) {
        console.log(`  key "${spec.name}" already exists — skipping create`);
        return existing;
    }
    const created = await api("POST", "/api/v1/api-keys", {
        projectId,
        name: spec.name,
        provider: spec.provider,
        apiKey: spec.apiKey,
        description: spec.description,
        ...(spec.validationConfig ? { validationConfig: spec.validationConfig } : {}),
    });
    const key = created.apiKey;
    console.log(`  created key "${spec.name}" [${spec.provider}] -> health: ${key.healthStatus}`);

    if (spec.monthlyBudgetUsd) {
        await api("PATCH", `/api/v1/api-keys/${key.id}`, { monthlyBudgetUsd: spec.monthlyBudgetUsd });
    }

    // A couple of extra validations build up health-check history for the
    // key details sheet.
    for (let i = 0; i < 2; i += 1) {
        await api("POST", `/api/v1/api-keys/${key.id}/validate`, undefined, { allowFail: true });
    }

    if (spec.usage) {
        for (let offset = 29; offset >= 0; offset -= 1) {
            const weekend = [0, 6].includes(new Date(day(offset)).getUTCDay());
            const requests = jitter(spec.usage.requests * (weekend ? 0.45 : 1), spec.usage.requests * 0.3, offset);
            if (!requests) continue;
            const tokens = spec.usage.tokensPerRequest ? requests * spec.usage.tokensPerRequest : undefined;
            const costUsd = Number((requests * spec.usage.costPerRequestUsd).toFixed(4));
            await api("POST", `/api/v1/api-keys/${key.id}/usage`, {
                requests,
                ...(tokens ? { tokens } : {}),
                costUsd,
                date: day(offset),
            });
        }
        console.log(`    recorded 30 days of usage for "${spec.name}"`);
    }
    return key;
};

const KEYS_MAIN = [
    {
        name: "billing-service",
        provider: "generic",
        apiKey: "svc_live_9f4e2a71c8d05b3641a9",
        description: "Internal billing API used by the invoicing workers.",
        validationConfig: { testUrl: "https://example.com", headerName: "Authorization", headerScheme: "Bearer" },
        monthlyBudgetUsd: 150,
        usage: { requests: 4200, costPerRequestUsd: 0.00042 },
    },
    {
        name: "search-api",
        provider: "generic",
        apiKey: "srch_prod_77b1e0aa54c2d98f30e6",
        description: "Product search cluster - read only key.",
        validationConfig: { testUrl: "https://example.com", headerName: "X-Api-Key", headerScheme: "" },
        usage: { requests: 9800, costPerRequestUsd: 0.00011 },
    },
    {
        name: "notifications-api",
        provider: "generic",
        apiKey: "ntf_live_c31d88f2ab904e57d1c0",
        description: "Push + email notification gateway.",
        validationConfig: { testUrl: "https://example.com", headerName: "Authorization", headerScheme: "Bearer" },
        monthlyBudgetUsd: 60,
        usage: { requests: 2600, costPerRequestUsd: 0.00035 },
    },
    {
        name: "openai-prod",
        provider: "openai",
        apiKey: "demo-sk-proj-4200000000000000000000000000000000000000000",
        description: "GPT-4o completions for the support copilot. ROTATED OUT - demo of rotation alerting.",
        monthlyBudgetUsd: 120,
        usage: { requests: 1800, tokensPerRequest: 900, costPerRequestUsd: 0.0031 },
    },
    {
        name: "stripe-live",
        provider: "stripe",
        // Deliberately NOT an sk_live_/sk_test_ prefix — GitHub push
        // protection flags those patterns even for fake keys.
        apiKey: "sk_demo_placeholder0000000000000",
        description: "Payments - live mode restricted key.",
        monthlyBudgetUsd: 40,
        usage: { requests: 420, costPerRequestUsd: 0.0008 },
    },
    {
        name: "legacy-webhook",
        provider: "generic",
        apiKey: "whk_old_5f6a7b8c9d0e1f2a3b4c",
        description: "Deprecated partner webhook - endpoint is being decommissioned.",
        validationConfig: { testUrl: "https://example.com/health", headerName: "Authorization", headerScheme: "Bearer" },
        usage: { requests: 60, costPerRequestUsd: 0.0002 },
    },
];

const KEYS_STAGING = [
    {
        name: "staging-billing",
        provider: "generic",
        apiKey: "svc_test_11aa22bb33cc44dd55ee",
        description: "Billing API - staging environment.",
        validationConfig: { testUrl: "https://example.com", headerName: "Authorization", headerScheme: "Bearer" },
        usage: { requests: 300, costPerRequestUsd: 0.0001 },
    },
    {
        name: "anthropic-staging",
        provider: "anthropic",
        apiKey: "demo-sk-ant-00000000000000000000000000000000000000",
        description: "Claude staging key for the eval pipeline.",
        usage: { requests: 240, tokensPerRequest: 1200, costPerRequestUsd: 0.0027 },
    },
];

const ensureCa = async (projectId) => {
    const existing = await api("GET", `/api/v1/projects/${projectId}/cas`, undefined, { allowFail: true });
    if (existing?.cas?.length) {
        console.log("Root CA already exists — skipping");
        return;
    }
    // A root CA only self-signs at create when notAfter is provided.
    const notBefore = new Date();
    const notAfter = new Date(notBefore);
    notAfter.setFullYear(notAfter.getFullYear() + 10);
    const ca = await api(
        "POST",
        "/api/v1/cert-manager/ca/internal",
        {
            name: "internal-root-ca",
            projectId,
            status: "active",
            configuration: {
                type: "root",
                friendlyName: "Internal Root CA",
                commonName: "apiharbor.internal",
                organization: "APIHarbor Demo",
                ou: "",
                country: "",
                province: "",
                locality: "",
                keyAlgorithm: "RSA_2048",
                maxPathLength: -1,
                notBefore: notBefore.toISOString(),
                notAfter: notAfter.toISOString(),
            },
        },
        { allowFail: true }
    );
    console.log(ca ? `Created internal root CA (${ca.id})` : "Could not create root CA (endpoint may be gated) — skipped");
};

const main = async () => {
    await login();

    const main = await ensureProject("My Project", "secret-manager");
    console.log("Seeding keys into My Project:");
    for (const spec of KEYS_MAIN) await ensureKey(main.id, spec);

    const staging = await ensureProject("Staging", "secret-manager");
    console.log("Seeding keys into Staging:");
    for (const spec of KEYS_STAGING) await ensureKey(staging.id, spec);

    const certs = await ensureProject("certificates", "cert-manager");
    await ensureCa(certs.id);

    console.log("\nDone. Open the dashboard and refresh — stats, charts, health mix, and the org overview cards should all be populated.");
};

main().catch((err) => {
    console.error(`\nSeed failed: ${err.message}`);
    process.exit(1);
});
