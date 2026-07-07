import { Knex } from "knex";

import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

export type TApiKeyDALFactory = ReturnType<typeof apiKeyDALFactory>;

export type TUsageRow = {
  usageDate: string;
  requests: number;
  tokens: number | null;
  costCents: number;
  apiKeyId?: string;
  provider?: string;
  name?: string;
};

export const apiKeyDALFactory = (db: TDbClient) => {
  const apiKeyOrm = ormify(db, TableName.ApiHarborKey);
  const healthCheckOrm = ormify(db, TableName.ApiHarborKeyHealthCheck);

  const findHealthChecks = async (apiKeyId: string, limit = 20, tx?: Knex) => {
    try {
      return await (tx || db.replicaNode())(TableName.ApiHarborKeyHealthCheck)
        .where({ apiKeyId })
        .orderBy("checkedAt", "desc")
        .limit(limit);
    } catch (error) {
      throw new DatabaseError({ error, name: "Find API key health checks" });
    }
  };

  // Used by the health-monitoring cron to sweep every key that has monitoring enabled.
  const findMonitoredKeys = async (tx?: Knex) => {
    try {
      return await (tx || db.replicaNode())(TableName.ApiHarborKey).where({ monitoringEnabled: true });
    } catch (error) {
      throw new DatabaseError({ error, name: "Find monitored API keys" });
    }
  };

  // Increment (upsert) the daily usage aggregate for a key.
  const recordUsage = async (
    apiKeyId: string,
    data: { usageDate: string; requests: number; tokens: number | null; costCents: number },
    tx?: Knex
  ) => {
    try {
      const [row] = await (tx || db)(TableName.ApiHarborKeyUsage)
        .insert({
          apiKeyId,
          usageDate: data.usageDate,
          requests: data.requests,
          tokens: data.tokens,
          costCents: data.costCents
        })
        .onConflict(["apiKeyId", "usageDate"])
        .merge({
          requests: db.raw("?? + ?", [`${TableName.ApiHarborKeyUsage}.requests`, data.requests]),
          costCents: db.raw("?? + ?", [`${TableName.ApiHarborKeyUsage}.costCents`, data.costCents]),
          tokens: db.raw("COALESCE(??, 0) + ?", [
            `${TableName.ApiHarborKeyUsage}.tokens`,
            data.tokens ?? 0
          ]),
          updatedAt: new Date()
        })
        .returning("*");
      return row;
    } catch (error) {
      throw new DatabaseError({ error, name: "Record API key usage" });
    }
  };

  const findUsageByKey = async (
    apiKeyId: string,
    sinceDate: string,
    tx?: Knex
  ): Promise<TUsageRow[]> => {
    try {
      return await (tx || db.replicaNode())(TableName.ApiHarborKeyUsage)
        .where({ apiKeyId })
        .andWhere("usageDate", ">=", sinceDate)
        .orderBy("usageDate", "asc")
        .select("usageDate", "requests", "tokens", "costCents");
    } catch (error) {
      throw new DatabaseError({ error, name: "Find API key usage" });
    }
  };

  // All usage rows for a project's keys since a date, joined with provider/name.
  const findUsageByProject = async (
    projectId: string,
    sinceDate: string,
    tx?: Knex
  ): Promise<TUsageRow[]> => {
    try {
      return await (tx || db.replicaNode())(TableName.ApiHarborKeyUsage)
        .join(
          TableName.ApiHarborKey,
          `${TableName.ApiHarborKeyUsage}.apiKeyId`,
          `${TableName.ApiHarborKey}.id`
        )
        .where(`${TableName.ApiHarborKey}.projectId`, projectId)
        .andWhere(`${TableName.ApiHarborKeyUsage}.usageDate`, ">=", sinceDate)
        .select(
          `${TableName.ApiHarborKeyUsage}.apiKeyId`,
          `${TableName.ApiHarborKeyUsage}.usageDate`,
          `${TableName.ApiHarborKeyUsage}.requests`,
          `${TableName.ApiHarborKeyUsage}.tokens`,
          `${TableName.ApiHarborKeyUsage}.costCents`,
          `${TableName.ApiHarborKey}.provider`,
          `${TableName.ApiHarborKey}.name`
        );
    } catch (error) {
      throw new DatabaseError({ error, name: "Find project API key usage" });
    }
  };

  const countByProjectId = async (projectId: string, tx?: Knex) => {
    try {
      const [res] = await (tx || db.replicaNode())(TableName.ApiHarborKey)
        .where({ projectId })
        .count({ count: "*" });
      return Number((res as { count?: string | number }).count || 0);
    } catch (error) {
      throw new DatabaseError({ error, name: "Count api keys" });
    }
  };

  return {
    ...apiKeyOrm,
    countByProjectId,
    createHealthCheck: healthCheckOrm.create,
    findHealthChecks,
    findMonitoredKeys,
    recordUsage,
    findUsageByKey,
    findUsageByProject
  };
};
