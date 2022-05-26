import { path, testingAsserts as ta } from "./deps-test.ts";
import * as ws from "../../text/whitespace.ts";
import * as mod from "./mod.ts";

interface TestContext {
  readonly tdfs: mod.TableDefnFactoriesSupplier<
    TestContext,
    mod.SqlTextEmitOptions
  >;
  readonly vdf: mod.ViewDefnFactory<TestContext, mod.SqlTextEmitOptions>;
}

export function testTableDefns(ctx: TestContext) {
  const { tdfs } = ctx;

  const publHost = mod.typicalTableDefnDML<
    { host: string; host_identity: unknown; mutation_count: number },
    TestContext,
    "publ_host",
    mod.SqlTextEmitOptions
  >(ctx, "publ_host", ["host", "host_identity", "mutation_count"], tdfs)(
    (
      defineColumns,
      { columnsFactory: cf, decoratorsFactory: df },
    ) => {
      defineColumns(
        cf.text("host"),
        cf.JSON("host_identity", { isNullable: true }),
        cf.integer("mutation_count"),
      );
      df.unique("host");
    },
  );
  const publHostView = mod.tableDefnViewWrapper(
    ctx,
    publHost.tableDefn,
    "publ_host_vw",
    ctx.vdf,
    { isIdempotent: true },
  );

  const publBuildEvent = mod.typicalStaticTableDefn(ctx, "publ_build_event", [
    "publ_host_id",
    "iteration_index",
    "build_initiated_at",
    "build_completed_at",
    "build_duration_ms",
    "resources_originated_count",
    "resources_persisted_count",
    "resources_memoized_count",
  ], tdfs)(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        publHost.primaryKeyColDefn.foreignKeyTableColDefn(),
        cf.integer("iteration_index"),
        cf.dateTime("build_initiated_at"),
        cf.dateTime("build_completed_at"),
        cf.integer("build_duration_ms"),
        cf.integer("resources_originated_count"),
        cf.integer("resources_persisted_count"),
        cf.integer("resources_memoized_count"),
      );
    },
  );

  const publServerService = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_service",
    [
      "service_started_at",
      "listen_host",
      "listen_port",
      "publish_url",
      "publ_build_event_id",
    ],
    tdfs,
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.dateTime("service_started_at"),
        cf.text("listen_host"),
        cf.integer("listen_port"),
        cf.text("publish_url"),
        publBuildEvent.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_static_access_log",
    [
      "status",
      "asset_nature",
      "location_href",
      "filesys_target_path",
      "filesys_target_symlink",
      "publ_server_service_id",
    ],
    tdfs,
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.integer("status"),
        cf.text("asset_nature"),
        cf.text("location_href"),
        cf.text("filesys_target_path"),
        cf.text("filesys_target_symlink", { isNullable: true }),
        publServerService.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_error_log",
    [
      "location_href",
      "error_summary",
      "error_elaboration",
      "publ_server_service_id",
    ],
    tdfs,
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.text("location_href"),
        cf.text("error_summary"),
        cf.JSON("error_elaboration", { isNullable: true }),
        publServerService.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  return {
    publHost: { ...publHost, viewWrapper: publHostView },
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  };
}

Deno.test("SQLa (assembler)", () => {
  const ctx: TestContext = {
    tdfs: mod.sqliteTableDefnFactories<TestContext, mod.SqlTextEmitOptions>(),
    vdf: mod.typicalSqlViewDefnFactory<TestContext, mod.SqlTextEmitOptions>(),
  };
  const schema = testTableDefns(ctx);
  const persist = (
    sts: mod.SqlTextSupplier<TestContext, mod.SqlTextEmitOptions>,
    basename: string,
  ) => {
    const result: mod.PersistableSqlText<TestContext, mod.SqlTextEmitOptions> =
      {
        sqlTextSupplier: sts,
        persistDest: (_, index) => `${index}_${basename}`,
      };
    return result;
  };

  // deno-fmt-ignore
  const DDL = mod.SQL<TestContext, mod.SqlTextEmitOptions>()`
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

    ${schema.publHost.viewWrapper}

    ${schema.publBuildEvent.tableDefn}

    ${schema.publServerService.tableDefn}

    ${schema.publServerStaticAccessLog.tableDefn}

    ${schema.publServerErrorLog.tableDefn}

    ${schema.publHost.insertDML({ host: "test", hostIdentity: "testHI", mutationCount: 0 })}`;

  const syntheticSQL = DDL.SQL(ctx, mod.typicalSqlTextEmitOptions());
  if (DDL.lintIssues?.length) {
    console.dir(DDL.lintIssues);
  }
  ta.assertEquals(syntheticSQL, fixturePrime);
  ta.assertEquals(0, DDL.lintIssues?.length);
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

  CREATE TABLE IF NOT EXISTS publ_host (
      publ_host_id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      host_identity JSON,
      mutation_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(host)
  );
  -- encountered persistence request for 1_publ-host.sql

  CREATE VIEW IF NOT EXISTS publ_host_vw AS
      SELECT publ_host_id, host, host_identity, mutation_count, created_at
      FROM publ_host;

  CREATE TABLE IF NOT EXISTS publ_build_event (
      publ_build_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      publ_host_id INTEGER NOT NULL,
      iteration_index INTEGER NOT NULL,
      build_initiated_at DATETIME NOT NULL,
      build_completed_at DATETIME NOT NULL,
      build_duration_ms INTEGER NOT NULL,
      resources_originated_count INTEGER NOT NULL,
      resources_persisted_count INTEGER NOT NULL,
      resources_memoized_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(publ_host_id) REFERENCES publ_host(publ_host_id)
  );

  CREATE TABLE IF NOT EXISTS publ_server_service (
      publ_server_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_started_at DATETIME NOT NULL,
      listen_host TEXT NOT NULL,
      listen_port INTEGER NOT NULL,
      publish_url TEXT NOT NULL,
      publ_build_event_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(publ_build_event_id) REFERENCES publ_build_event(publ_build_event_id)
  );

  CREATE TABLE IF NOT EXISTS publ_server_static_access_log (
      publ_server_static_access_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      status INTEGER NOT NULL,
      asset_nature TEXT NOT NULL,
      location_href TEXT NOT NULL,
      filesys_target_path TEXT NOT NULL,
      filesys_target_symlink TEXT,
      publ_server_service_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
  );

  CREATE TABLE IF NOT EXISTS publ_server_error_log (
      publ_server_error_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_href TEXT NOT NULL,
      error_summary TEXT NOT NULL,
      error_elaboration JSON,
      publ_server_service_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
  );

  INSERT INTO publ_host (host, host_identity, mutation_count) VALUES ('test', 'testHI', 0);`);
