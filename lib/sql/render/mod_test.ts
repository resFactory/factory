import { path, testingAsserts as ta } from "./deps-test.ts";
import * as ws from "../../text/whitespace.ts";
import * as mdf from "./mod_test-fixtures.ts";
import * as mod from "./template/sql.ts";
import * as tbl from "./ddl/table.ts";
import * as vw from "./ddl/view.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

// deno-lint-ignore no-empty-interface
interface SyntheticTmplContext {
}

Deno.test("SQL assembler (SQLa) type-safe string template", () => {
  const ctx: SyntheticTmplContext = {};
  const schema = mdf.syntheticTableDefns<
    SyntheticTmplContext,
    mod.SqlTextEmitOptions<SyntheticTmplContext>
  >();
  const persist = (
    sts: mod.SqlTextSupplier<SyntheticTmplContext>,
    basename: string,
  ) => {
    const result: mod.PersistableSqlText<SyntheticTmplContext> = {
      sqlTextSupplier: sts,
      persistDest: (_, index) => `${index}_${basename}`,
    };
    return result;
  };

  const tablesDeclared = new Set<
    tbl.TableDefinition<
      Any,
      mod.SqlTextEmitOptions<SyntheticTmplContext>,
      SyntheticTmplContext
    >
  >();
  const viewsDeclared = new Set<vw.ViewDefinition<Any, Any, Any>>();

  // deno-fmt-ignore
  const catalog = (sts: mod.SqlTextSupplier<SyntheticTmplContext, Any>) => {
    if (tbl.isTableDefinition<Any, mod.SqlTextEmitOptions<SyntheticTmplContext>, SyntheticTmplContext>(sts)) {
      tablesDeclared.add(sts);
    }
    if (vw.isViewDefinition<Any, mod.SqlTextEmitOptions<SyntheticTmplContext>, SyntheticTmplContext>(sts)) {
      viewsDeclared.add(sts);
    }
  }

  // deno-fmt-ignore
  const DDL = mod.SQL<SyntheticTmplContext>(mod.typicalSqlTextSupplierOptions({
    prepareEvents: (spEE) => {
      spEE.on("sqlEmitted", (_, sts) => catalog(sts));
      spEE.on("sqlPersisted", (_ctx, _destPath, psts) => catalog(psts.sqlTextSupplier));
      return spEE;
    }
  }))`
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

    ${mod.typicalSqlTextLintSummary}

    ${schema.publHost.tableDefn}
    ${persist(schema.publHost.tableDefn, "publ-host.sql")}

    ${schema.publHost.tableViewWrapper}

    ${schema.publBuildEvent}

    ${schema.publServerService}

    ${schema.publServerStaticAccessLog}

    ${schema.publServerErrorLog}

    ${schema.publHost.tableDefn.insertDML({ host: "test", host_identity: "testHI", mutation_count: 0 }, { isColumnEmittable: (name) => name == "created_at" ? false : true })}`;

  const syntheticSQL = DDL.SQL(ctx, mod.typicalSqlTextEmitOptions());
  if (DDL.lintIssues?.length) {
    console.dir(DDL.lintIssues);
  }
  ta.assertEquals(syntheticSQL, fixturePrime);
  ta.assertEquals(0, DDL.lintIssues?.length);
  ta.assertEquals(tablesDeclared.size, 5);
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

  -- no SQL lint issues

  CREATE TABLE IF NOT EXISTS "publ_host" (
      "publ_host_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "host" TEXT NOT NULL,
      "host_identity" JSON,
      "mutation_count" INTEGER NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("host")
  );
  -- encountered persistence request for 1_publ-host.sql

  CREATE VIEW IF NOT EXISTS "publ_host_vw"("publ_host_id", "host", "host_identity", "mutation_count", "created_at") AS
      SELECT "publ_host_id", "host", "host_identity", "mutation_count", "created_at"
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
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("publ_host_id") REFERENCES "publ_host"("publ_host_id")
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

  INSERT INTO "publ_host" ("host", "host_identity", "mutation_count") VALUES ('test', 'testHI', 0);`);
