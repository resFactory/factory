import { testingAsserts as ta } from "./deps-test.ts";
import { path } from "./deps.ts";
import * as ws from "../../text/whitespace.ts";
import * as pubCtl from "./pubctl.ts";
import * as SQLa from "../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

// deno-lint-ignore no-empty-interface
interface SyntheticTmplContext extends SQLa.SqlEmitContext {
}

const stContext = (): SyntheticTmplContext => SQLa.typicalSqlEmitContext();

Deno.test("SQL Aide (SQLa) type-safe string template", () => {
  const ctx = stContext();
  const dbDefn = pubCtl.pubCtlDatabaseDefn<SyntheticTmplContext>();
  const persist = (
    sts: SQLa.SqlTextSupplier<SyntheticTmplContext>,
    basename: string,
  ) => {
    const result: SQLa.PersistableSqlText<SyntheticTmplContext> = {
      sqlTextSupplier: sts,
      persistDest: (_, index) => `${index}_${basename}`,
    };
    return result;
  };

  const tablesDeclared = new Set<
    SQLa.TableDefinition<Any, SyntheticTmplContext>
  >();
  const viewsDeclared = new Set<
    SQLa.ViewDefinition<Any, SyntheticTmplContext>
  >();

  // deno-fmt-ignore
  const catalog = (sts: SQLa.SqlTextSupplier<SyntheticTmplContext>) => {
    if (SQLa.isTableDefinition<Any, SyntheticTmplContext>(sts)) {
      tablesDeclared.add(sts);
    }
    if (SQLa.isViewDefinition<Any, SyntheticTmplContext>(sts)) {
      viewsDeclared.add(sts);
    }
  }

  const ddlOptions = SQLa.typicalSqlTextSupplierOptions({
    prepareEvents: (spEE) => {
      spEE.on("sqlEmitted", (_, sts) => catalog(sts));
      spEE.on(
        "sqlPersisted",
        (_ctx, _destPath, psts) => catalog(psts.sqlTextSupplier),
      );
      return spEE;
    },
  });
  const lintState = SQLa.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
  // deno-fmt-ignore
  const DDL = SQLa.SQL<SyntheticTmplContext>(ddlOptions)`
    -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.
    -- Governance:
    -- * use 3rd normal form for tables
    -- * use views to wrap business logic
    -- * when denormalizing is required, use views (don't denormalize tables)
    -- * each table name MUST be singular (not plural) noun
    -- * each table MUST have a \`table_name\`_id primary key (typicalTableDefn will do this automatically)
    -- * each table MUST have \`created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\` column (typicalTableDefn will do this automatically)
    -- * if table's rows are mutable, it MUST have a \`updated_at DATETIME\` column (not having an updated_at means it's immutable)
    -- * if table's rows are deleteable, it MUST have a \`deleted_at DATETIME\` column for soft deletes (not having an deleted_at means it's immutable)

    -- TODO: create a govn_* set of tables that would contain business logic, assurance, presentation, and other details
    --       govn_entity would be a table that stores table meta data (descriptions, immutability, presentation, migration instructions, etc.)
    --       govn_entity_property would be a table that stores table column meta data (descriptions, immutability, presentation, migration instructions, etc.)
    --       govn_entity_relationship would be a table that stores entity/property relationships (1:N, 1:M, etc.) for literate programming documentation, etc.
    --       govn_entity_activity would be a table that stores governance history and activity data in JSON format for documentation, migration status, etc.

    ${lintState.sqlTextLintSummary}

    ${dbDefn.publHost}
    ${persist(dbDefn.publHost, "publ-host.sql")}

    ${dbDefn.publHost.view}

    ${dbDefn.publBuildEvent}

    ${dbDefn.publServerService}

    ${dbDefn.publServerStaticAccessLog}

    ${dbDefn.publServerErrorLog}

    ${dbDefn.publHost.insertDML({ host: "test", host_identity: "testHI", mutation_count: 0, numeric_enum: dbDefn.numericEnumModel.seedEnum.code1 })}

    ${dbDefn.publHost.select({ host_identity: "testHI" })}

    ${dbDefn.numericEnumModel}

    ${dbDefn.textEnumModel}

    -- TypeScript numeric enum object entries as RDBMS rows
    ${dbDefn.numericEnumModel.seedDML}

    -- TypeScript text enum object entries as RDBMS rows
    ${dbDefn.textEnumModel.seedDML}

    ${lintState.sqlTmplEngineLintSummary}`;

  const syntheticSQL = DDL.SQL(ctx);
  if (DDL.stsOptions.sqlTextLintState?.lintedSqlText.lintIssues?.length) {
    console.dir(DDL.stsOptions.sqlTextLintState?.lintedSqlText.lintIssues);
  }
  ta.assertEquals(syntheticSQL, fixturePrime);
  ta.assertEquals(
    0,
    DDL.stsOptions.sqlTextLintState?.lintedSqlText.lintIssues?.length,
  );
  ta.assertEquals(tablesDeclared.size, 7);
  ta.assertEquals(viewsDeclared.size, 1);
});

// deno-fmt-ignore
const fixturePrime = ws.unindentWhitespace(`
  -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.
  -- Governance:
  -- * use 3rd normal form for tables
  -- * use views to wrap business logic
  -- * when denormalizing is required, use views (don't denormalize tables)
  -- * each table name MUST be singular (not plural) noun
  -- * each table MUST have a \`table_name\`_id primary key (typicalTableDefn will do this automatically)
  -- * each table MUST have \`created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\` column (typicalTableDefn will do this automatically)
  -- * if table's rows are mutable, it MUST have a \`updated_at DATETIME\` column (not having an updated_at means it's immutable)
  -- * if table's rows are deleteable, it MUST have a \`deleted_at DATETIME\` column for soft deletes (not having an deleted_at means it's immutable)

  -- TODO: create a govn_* set of tables that would contain business logic, assurance, presentation, and other details
  --       govn_entity would be a table that stores table meta data (descriptions, immutability, presentation, migration instructions, etc.)
  --       govn_entity_property would be a table that stores table column meta data (descriptions, immutability, presentation, migration instructions, etc.)
  --       govn_entity_relationship would be a table that stores entity/property relationships (1:N, 1:M, etc.) for literate programming documentation, etc.
  --       govn_entity_activity would be a table that stores governance history and activity data in JSON format for documentation, migration status, etc.

  -- no SQL lint issues (typicalSqlTextLintManager)

  CREATE TABLE IF NOT EXISTS "publ_host" (
      "publ_host_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "host" TEXT NOT NULL,
      "host_identity" JSON,
      "mutation_count" INTEGER NOT NULL,
      "numeric_enum" INTEGER NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("host"),
      FOREIGN KEY("numeric_enum") REFERENCES "synthetic_enum_numeric"("code")
  );
  -- encountered persistence request for 1_publ-host.sql

  CREATE VIEW IF NOT EXISTS "publ_host_vw"("publ_host_id", "host", "host_identity", "mutation_count", "numeric_enum", "created_at") AS
      SELECT "publ_host_id", "host", "host_identity", "mutation_count", "numeric_enum", "created_at"
        FROM "publ_host";

  CREATE TABLE IF NOT EXISTS "publ_build_event" (
      "publ_build_event_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "publ_host_id" INTEGER NOT NULL,
      "iteration_index" INTEGER NOT NULL,
      "build_initiated_at" DATETIME NOT NULL,
      "build_completed_at" DATETIME NOT NULL,
      "build_duration_ms" INTEGER NOT NULL,
      "resources_originated_count" INTEGER NOT NULL,
      "resources_persisted_count" INTEGER NOT NULL,
      "resources_memoized_count" INTEGER NOT NULL,
      "text_enum" TEXT NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("publ_host_id") REFERENCES "publ_host"("publ_host_id"),
      FOREIGN KEY("text_enum") REFERENCES "synthetic_enum_text"("code")
  );

  CREATE TABLE IF NOT EXISTS "publ_server_service" (
      "publ_server_service_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "service_started_at" DATETIME NOT NULL,
      "listen_host" TEXT NOT NULL,
      "listen_port" INTEGER NOT NULL,
      "publish_url" TEXT NOT NULL,
      "publ_build_event_id" INTEGER NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("publ_build_event_id") REFERENCES "publ_build_event"("publ_build_event_id")
  );

  CREATE TABLE IF NOT EXISTS "publ_server_static_access_log" (
      "publ_server_static_access_log_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "status" INTEGER NOT NULL,
      "asset_nature" TEXT NOT NULL,
      "location_href" TEXT NOT NULL,
      "filesys_target_path" TEXT NOT NULL,
      "filesys_target_symlink" TEXT,
      "publ_server_service_id" INTEGER NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("publ_server_service_id") REFERENCES "publ_server_service"("publ_server_service_id")
  );

  CREATE TABLE IF NOT EXISTS "publ_server_error_log" (
      "publ_server_error_log_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "location_href" TEXT NOT NULL,
      "error_summary" TEXT NOT NULL,
      "error_elaboration" JSON,
      "publ_server_service_id" INTEGER NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("publ_server_service_id") REFERENCES "publ_server_service"("publ_server_service_id")
  );

  INSERT INTO "publ_host" ("host", "host_identity", "mutation_count", "numeric_enum") VALUES ('test', 'testHI', 0, 0);

  SELECT "publ_host_id" FROM "publ_host" WHERE "host_identity" = 'testHI';

  CREATE TABLE IF NOT EXISTS "synthetic_enum_numeric" (
      "code" INTEGER PRIMARY KEY,
      "value" TEXT NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "synthetic_enum_text" (
      "code" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- TypeScript numeric enum object entries as RDBMS rows
  INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (0, 'code1');
  INSERT INTO "synthetic_enum_numeric" ("code", "value") VALUES (1, 'code2');

  -- TypeScript text enum object entries as RDBMS rows
  INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code1', 'value1');
  INSERT INTO "synthetic_enum_text" ("code", "value") VALUES ('code2', 'value2');

  -- no template engine lint issues (typicalSqlTextLintManager)`);