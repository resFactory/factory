import { testingAsserts as ta } from "./deps-test.ts";
import * as SQLa from "../render/mod.ts";
import * as mod from "./data-vault.ts";
import { unindentWhitespace as uws } from "../../text/whitespace.ts";
// import * as ax from "../../axiom/mod.ts";
// import * as axsdc from "../../axiom/axiom-serde-crypto.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("Data Vault governance", () => {
  const stso = SQLa.typicalSqlTextSupplierOptions();
  const dvg = mod.dataVaultGovn(stso);
  ta.assert(dvg);
  ta.assert(dvg.domains);
  ta.assert(dvg.digestPrimaryKey);
  ta.assert(dvg.digestPkLintRule);
  ta.assert(dvg.autoIncPrimaryKey);
  ta.assert(dvg.housekeeping);
  ta.assert(dvg.tableName);
  ta.assert(dvg.table);
  ta.assert(dvg.hubTableName);
  ta.assert(dvg.hubTable);
  ta.assert(dvg.satelliteTableName);
  ta.assert(dvg.satelliteTable);
  ta.assert(dvg.tableLintRules);
});

Deno.test("Data Vault models", async (tc) => {
  const stso = SQLa.typicalSqlTextSupplierOptions();
  const ctx = SQLa.typicalSqlEmitContext();
  const dvg = mod.dataVaultGovn(stso);

  const syntheticHub1 = dvg.hubTable("synthethic1", {
    hub_synthethic1_id: dvg.digestPrimaryKey(),
    key: dvg.domains.text(),
  });

  await tc.step("hubs", () => {
    ta.assertEquals(
      syntheticHub1.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "hub_synthethic1" (
            "hub_synthethic1_id" TEXT PRIMARY KEY,
            "key" TEXT NOT NULL,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
        )`),
    );
  });

  // satellites should be created through the hub instance;
  // sats will automatically be linked via an auto-generated type-safe FK to hub
  const satellite2 = syntheticHub1.satTable("attrs2", {
    sat_synthethic1_attrs2_id: dvg.digestPrimaryKey(),
  });

  // satellites can be created "manually" through dataVaultGovn too (if necessary)
  const satellite1 = dvg.satelliteTable(syntheticHub1, "attrs1", {
    sat_synthethic1_attrs1_id: dvg.digestPrimaryKey(),
  });

  await tc.step("satellites", () => {
    ta.assertEquals(
      satellite1.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "sat_synthethic1_attrs1" (
            "hub_synthethic1_id" TEXT NOT NULL,
            "sat_synthethic1_attrs1_id" TEXT PRIMARY KEY,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY("hub_synthethic1_id") REFERENCES "hub_synthethic1"("hub_synthethic1_id")
        )`),
    );
    ta.assertEquals(
      satellite2.SQL(ctx),
      uws(`
        CREATE TABLE IF NOT EXISTS "sat_synthethic1_attrs2" (
            "hub_synthethic1_id" TEXT NOT NULL,
            "sat_synthethic1_attrs2_id" TEXT PRIMARY KEY,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY("hub_synthethic1_id") REFERENCES "hub_synthethic1"("hub_synthethic1_id")
        )`),
    );
  });
});
