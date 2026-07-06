import { Knex } from "knex";

import { TableName } from "@app/db/schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "@app/db/utils";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.ApiHarborKey))) {
    await knex.schema.createTable(TableName.ApiHarborKey, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.string("projectId").notNullable();
      t.foreign("projectId").references("id").inTable(TableName.Project).onDelete("CASCADE");
      t.string("name").notNullable();
      t.string("provider").notNullable(); // openai | anthropic | stripe | github | generic
      t.string("description");
      // AES-256-GCM cipherTextBlob from the project KMS data key (IV + tag + ciphertext packed in one blob)
      t.binary("encryptedApiKey").notNullable();
      t.string("healthStatus").notNullable().defaultTo("unknown"); // unknown | healthy | invalid | error
      t.timestamp("lastCheckedAt");
      t.integer("lastLatencyMs");
      t.integer("lastHttpStatus");
      t.string("lastMessage", 1000);
      t.timestamp("lastUsedAt");
      t.integer("quotaLimit");
      t.integer("quotaRemaining");
      t.jsonb("validationConfig"); // generic provider: { testUrl, headerName, headerScheme }
      t.boolean("monitoringEnabled").notNullable().defaultTo(true);
      t.timestamps(true, true, true);
      t.index(["projectId"]);
    });
    await createOnUpdateTrigger(knex, TableName.ApiHarborKey);
  }

  if (!(await knex.schema.hasTable(TableName.ApiHarborKeyHealthCheck))) {
    await knex.schema.createTable(TableName.ApiHarborKeyHealthCheck, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.uuid("apiKeyId").notNullable();
      t.foreign("apiKeyId").references("id").inTable(TableName.ApiHarborKey).onDelete("CASCADE");
      t.string("status").notNullable(); // healthy | invalid | error
      t.integer("httpStatus");
      t.integer("latencyMs");
      t.string("message", 1000);
      t.timestamp("checkedAt").notNullable().defaultTo(knex.fn.now());
      t.index(["apiKeyId"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.ApiHarborKeyHealthCheck);
  await dropOnUpdateTrigger(knex, TableName.ApiHarborKey);
  await knex.schema.dropTableIfExists(TableName.ApiHarborKey);
}
