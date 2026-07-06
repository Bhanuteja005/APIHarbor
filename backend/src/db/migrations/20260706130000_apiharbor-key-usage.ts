import { Knex } from "knex";

import { TableName } from "@app/db/schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "@app/db/utils";

export async function up(knex: Knex): Promise<void> {
  // Per-key monthly budget (in US cents; null = no budget set)
  if (await knex.schema.hasTable(TableName.ApiHarborKey)) {
    const hasBudget = await knex.schema.hasColumn(TableName.ApiHarborKey, "monthlyBudgetCents");
    if (!hasBudget) {
      await knex.schema.alterTable(TableName.ApiHarborKey, (t) => {
        t.integer("monthlyBudgetCents"); // nullable
      });
    }
  }

  // Daily usage/spend aggregate per key
  if (!(await knex.schema.hasTable(TableName.ApiHarborKeyUsage))) {
    await knex.schema.createTable(TableName.ApiHarborKeyUsage, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.uuid("apiKeyId").notNullable();
      t.foreign("apiKeyId").references("id").inTable(TableName.ApiHarborKey).onDelete("CASCADE");
      t.date("usageDate").notNullable();
      t.integer("requests").notNullable().defaultTo(0);
      t.integer("tokens"); // nullable — LLM token count when known
      t.integer("costCents").notNullable().defaultTo(0); // spend for the day in US cents
      t.timestamps(true, true, true);
      t.unique(["apiKeyId", "usageDate"]);
      t.index(["apiKeyId"]);
    });
    await createOnUpdateTrigger(knex, TableName.ApiHarborKeyUsage);
  }
}

export async function down(knex: Knex): Promise<void> {
  await dropOnUpdateTrigger(knex, TableName.ApiHarborKeyUsage);
  await knex.schema.dropTableIfExists(TableName.ApiHarborKeyUsage);
  if (await knex.schema.hasColumn(TableName.ApiHarborKey, "monthlyBudgetCents")) {
    await knex.schema.alterTable(TableName.ApiHarborKey, (t) => {
      t.dropColumn("monthlyBudgetCents");
    });
  }
}
