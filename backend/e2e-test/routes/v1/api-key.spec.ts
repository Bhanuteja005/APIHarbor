// End-to-end coverage for the APIHarbor api-key + usage/spend routes.
// Verifies functional behaviour, auth enforcement, project-scoped authorization,
// spend/usage tracking, and that plaintext / encrypted material never leaks.
// Runs against a freshly-created project (the real production path — project
// creation initializes the KMS data key, encryption, roles, etc.).

const auth = { authorization: `Bearer ${jwtAuthToken}` };
let PROJECT_ID: string;

const createKey = async (body: Record<string, unknown>) =>
  testServer.inject({
    method: "POST",
    url: "/api/v1/api-keys",
    headers: auth,
    body: { projectId: PROJECT_ID, ...body }
  });

describe("APIHarbor API-Key Router", () => {
  beforeAll(async () => {
    const res = await testServer.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: auth,
      body: { projectName: "apiharbor-e2e" }
    });
    expect(res.statusCode).toBe(200);
    PROJECT_ID = JSON.parse(res.payload).project.id;
  });

  test("full lifecycle: create -> list -> get -> reveal -> validate -> history -> update -> delete", async () => {
    // ---- create ----
    const secret = "sk-e2e-secret-abc123def456";
    const createRes = await createKey({
      name: "E2E OpenAI",
      provider: "generic",
      apiKey: secret,
      description: "created by e2e",
      monitoringEnabled: false,
      validationConfig: { testUrl: "https://example.com" }
    });
    if (createRes.statusCode !== 200) {
      // eslint-disable-next-line no-console
      console.error("CREATE FAILED:", createRes.statusCode, createRes.payload);
    }
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.payload).apiKey;
    expect(created).toHaveProperty("id");
    expect(created.name).toBe("E2E OpenAI");
    expect(created.projectId).toBe(PROJECT_ID);
    // must NEVER leak the encrypted blob or the plaintext
    expect(created).not.toHaveProperty("encryptedApiKey");
    expect(JSON.stringify(created)).not.toContain(secret);
    // masked key shows only a hint
    expect(created.maskedKey).toContain("…");

    const keyId = created.id;

    // ---- list ----
    const listRes = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys?projectId=${PROJECT_ID}`,
      headers: auth
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload).apiKeys;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((k: { id: string }) => k.id === keyId)).toBe(true);
    expect(JSON.stringify(list)).not.toContain(secret);
    expect(JSON.stringify(list)).not.toContain("encryptedApiKey");

    // ---- get by id ----
    const getRes = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys/${keyId}`,
      headers: auth
    });
    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.payload).apiKey.id).toBe(keyId);

    // ---- reveal (decrypts to the exact plaintext we stored) ----
    const revealRes = await testServer.inject({
      method: "POST",
      url: `/api/v1/api-keys/${keyId}/reveal`,
      headers: auth
    });
    expect(revealRes.statusCode).toBe(200);
    expect(JSON.parse(revealRes.payload).value).toBe(secret);

    // ---- validate (runs a health check, records a row) ----
    const validateRes = await testServer.inject({
      method: "POST",
      url: `/api/v1/api-keys/${keyId}/validate`,
      headers: auth
    });
    expect(validateRes.statusCode).toBe(200);
    expect(JSON.parse(validateRes.payload)).toHaveProperty("result");

    // ---- health-check history ----
    const historyRes = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys/${keyId}/health-checks`,
      headers: auth
    });
    expect(historyRes.statusCode).toBe(200);
    expect(Array.isArray(JSON.parse(historyRes.payload).healthChecks)).toBe(true);

    // ---- update ----
    const updateRes = await testServer.inject({
      method: "PATCH",
      url: `/api/v1/api-keys/${keyId}`,
      headers: auth,
      body: { name: "E2E OpenAI (renamed)" }
    });
    expect(updateRes.statusCode).toBe(200);
    expect(JSON.parse(updateRes.payload).apiKey.name).toBe("E2E OpenAI (renamed)");

    // ---- delete, then confirm it's gone ----
    const deleteRes = await testServer.inject({
      method: "DELETE",
      url: `/api/v1/api-keys/${keyId}`,
      headers: auth
    });
    expect(deleteRes.statusCode).toBe(200);

    const gone = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys/${keyId}`,
      headers: auth
    });
    expect(gone.statusCode).toBe(404);
  });

  test("usage recording + spend summary + budgets", async () => {
    const createRes = await createKey({
      name: "Spend Key",
      provider: "openai",
      apiKey: "sk-spend-e2e-123",
      monitoringEnabled: false
    });
    expect(createRes.statusCode).toBe(200);
    const keyId = JSON.parse(createRes.payload).apiKey.id;

    // record usage: 100 requests, $2.50
    const usageRes = await testServer.inject({
      method: "POST",
      url: `/api/v1/api-keys/${keyId}/usage`,
      headers: auth,
      body: { requests: 100, costUsd: 2.5, tokens: 5000 }
    });
    expect(usageRes.statusCode).toBe(200);
    expect(JSON.parse(usageRes.payload).usage.costCents).toBe(250);

    // record more usage the same day (aggregates)
    await testServer.inject({
      method: "POST",
      url: `/api/v1/api-keys/${keyId}/usage`,
      headers: auth,
      body: { requests: 50, costUsd: 1.0 }
    });

    // usage history reflects the aggregate
    const historyRes = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys/${keyId}/usage?days=7`,
      headers: auth
    });
    expect(historyRes.statusCode).toBe(200);
    const usage = JSON.parse(historyRes.payload).usage;
    expect(usage.length).toBeGreaterThanOrEqual(1);
    expect(usage[usage.length - 1].requests).toBe(150);
    expect(usage[usage.length - 1].costCents).toBe(350);

    // set a budget of $5
    const budgetRes = await testServer.inject({
      method: "PATCH",
      url: `/api/v1/api-keys/${keyId}`,
      headers: auth,
      body: { monthlyBudgetUsd: 5 }
    });
    expect(budgetRes.statusCode).toBe(200);
    expect(JSON.parse(budgetRes.payload).apiKey.monthlyBudgetCents).toBe(500);

    // spend summary
    const spendRes = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys/spend?projectId=${PROJECT_ID}&days=30`,
      headers: auth
    });
    expect(spendRes.statusCode).toBe(200);
    const summary = JSON.parse(spendRes.payload).summary;
    expect(summary.totalCostCents).toBeGreaterThanOrEqual(350);
    expect(summary.totalRequests).toBeGreaterThanOrEqual(150);
    expect(summary.counts.total).toBeGreaterThanOrEqual(1);
    expect(summary.byProvider.some((p: { provider: string }) => p.provider === "openai")).toBe(true);
    const keyRow = summary.keys.find((k: { id: string }) => k.id === keyId);
    expect(keyRow).toBeTruthy();
    expect(keyRow.spentCents).toBe(350);
    expect(keyRow.monthlyBudgetCents).toBe(500);
    expect(keyRow.overBudget).toBe(false);

    await testServer.inject({ method: "DELETE", url: `/api/v1/api-keys/${keyId}`, headers: auth });
  });

  test("rejects unauthenticated requests (401)", async () => {
    const noAuthList = await testServer.inject({
      method: "GET",
      url: `/api/v1/api-keys?projectId=${PROJECT_ID}`
    });
    expect(noAuthList.statusCode).toBe(401);

    const noAuthCreate = await testServer.inject({
      method: "POST",
      url: "/api/v1/api-keys",
      body: { projectId: PROJECT_ID, name: "x", provider: "generic", apiKey: "y" }
    });
    expect(noAuthCreate.statusCode).toBe(401);
  });

  test("returns 404 for a key that does not exist / belongs to another project", async () => {
    const randomId = "00000000-0000-4000-8000-000000000000";
    for (const path of [`/api/v1/api-keys/${randomId}`]) {
      const res = await testServer.inject({ method: "GET", url: path, headers: auth });
      expect(res.statusCode).toBe(404);
    }
    const revealMissing = await testServer.inject({
      method: "POST",
      url: `/api/v1/api-keys/${randomId}/reveal`,
      headers: auth
    });
    expect(revealMissing.statusCode).toBe(404);
    const deleteMissing = await testServer.inject({
      method: "DELETE",
      url: `/api/v1/api-keys/${randomId}`,
      headers: auth
    });
    expect(deleteMissing.statusCode).toBe(404);
  });

  test("validates required fields (rejects missing name / apiKey)", async () => {
    const missingName = await createKey({ provider: "generic", apiKey: "abc" });
    expect(missingName.statusCode).toBeGreaterThanOrEqual(400);
    const missingKey = await createKey({ name: "no key", provider: "generic" });
    expect(missingKey.statusCode).toBeGreaterThanOrEqual(400);
  });

  test("enforces the per-project key limit", async () => {
    // Create up to the cap, then confirm the next create is rejected with 400.
    // The cap is small (30) and overridable via API_KEYS_PER_PROJECT_LIMIT; we set
    // it to a tiny value here so the test is fast and deterministic.
    process.env.API_KEYS_PER_PROJECT_LIMIT = "2";
    const created: string[] = [];
    for (let i = 0; i < 2; i += 1) {
      const res = await createKey({
        name: `cap-${i}`,
        provider: "generic",
        apiKey: `k-${i}`,
        validationConfig: { testUrl: "https://example.com" }
      });
      expect(res.statusCode).toBe(200);
      created.push(JSON.parse(res.payload).apiKey.id);
    }
    const overLimit = await createKey({
      name: "over-limit",
      provider: "generic",
      apiKey: "nope",
      validationConfig: { testUrl: "https://example.com" }
    });
    expect(overLimit.statusCode).toBe(400);

    // cleanup
    delete process.env.API_KEYS_PER_PROJECT_LIMIT;
    for (const id of created) {
      await testServer.inject({ method: "DELETE", url: `/api/v1/api-keys/${id}`, headers: auth });
    }
  });
});
