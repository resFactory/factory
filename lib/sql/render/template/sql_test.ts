import { path, testingAsserts as ta } from "../deps-test.ts";
import * as ws from "../../../text/whitespace.ts";
import * as mod from "./sql.ts";
import * as ddl from "../ddl/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as ns from "../namespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easy on linter

type HousekeepingColumnsDefns<Context extends mod.SqlEmitContext> = {
  readonly created_at: d.AxiomSqlDomain<Date | undefined, Context>;
};

function housekeeping<
  Context extends mod.SqlEmitContext,
>(): HousekeepingColumnsDefns<Context> {
  return {
    created_at: d.dateTimeNullable(undefined, {
      sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
    }),
  };
}

interface SyntheticTmplContext extends mod.SqlEmitContext {
  readonly syntheticBehavior1: mod.SqlTextBehaviorSupplier<
    SyntheticTmplContext
  >;
  readonly syntheticBehavior2: mod.SqlTextBehaviorSupplier<
    SyntheticTmplContext
  >;
}

const stContext = () => {
  const behaviorState = {
    state1Value: 0,
    state2Value: 0,
  };
  const ctx: SyntheticTmplContext = {
    ...mod.typicalSqlEmitContext(),
    // for this behavior we want to execute and then emit some output
    syntheticBehavior1: {
      executeSqlBehavior: () => {
        behaviorState.state1Value++;
        return {
          SQL: () => {
            return `behavior 1 state value: ${behaviorState.state1Value}`;
          },
        };
      },
    },
    // for this behavior we want to execute and then "eat" the emitted output
    syntheticBehavior2: {
      executeSqlBehavior: () => {
        behaviorState.state2Value++;
        return mod.removeLineFromEmitStream;
      },
    },
  };
  return {
    ...ctx,
    behaviorState,
  };
};

const table = <
  TableName extends string,
  TPropAxioms extends
    & Record<string, ax.Axiom<Any>>
    & Record<`${TableName}_id`, ax.Axiom<Any>>,
>(
  tableName: TableName,
  props: TPropAxioms,
  sqlNS?: ns.SqlNamespaceSupplier,
) => {
  return {
    ...ddl.tableDefinition(tableName, props, { sqlNS }),
    ...ddl.tableDomainsRowFactory(tableName, props),
  };
};

Deno.test("SQL Aide (SQLa) template", () => {
  const syntheticTable1Defn = table("synthetic_table1", {
    synthetic_table1_id: ddl.autoIncPrimaryKey(d.integer()),
    column_one_text: d.text(),
    column_two_text_nullable: d.textNullable(),
    column_unique: ddl.unique(d.text()),
    ...housekeeping(),
  });
  const syntheticTable1ViewWrapper = ddl.tableDomainsViewWrapper(
    "synthetic_table1_view",
    syntheticTable1Defn.tableName,
    syntheticTable1Defn.axiomObjectDecl,
  );

  const syntheticTable2Defn = table("synthetic_table2", {
    synthetic_table2_id: ddl.autoIncPrimaryKey(d.integer()),
    column_three_text: d.text(),
    column_four_int_nullable: d.integerNullable(),
    column_unique: ddl.unique(d.text()),
    ...housekeeping(),
  }, ddl.sqlSchemaDefn("synthetic_schema"));

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
    ddl.TableDefinition<Any, SyntheticTmplContext>
  >();
  const viewsDeclared = new Set<
    ddl.ViewDefinition<Any, SyntheticTmplContext>
  >();

  // deno-fmt-ignore
  const catalog = (sts: mod.SqlTextSupplier<SyntheticTmplContext>) => {
    if (ddl.isTableDefinition<Any, SyntheticTmplContext>(sts)) {
      tablesDeclared.add(sts);
    }
    if (ddl.isViewDefinition<Any, SyntheticTmplContext>(sts)) {
      viewsDeclared.add(sts);
    }
  }

  const ctx = stContext();

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
    -- ${ctx.syntheticBehavior1}

    ${syntheticTable1Defn}
    ${persist(syntheticTable1Defn, "publ-host.sql")}

    ${syntheticTable1ViewWrapper}
    ${ctx.syntheticBehavior2} -- the behavior will execute but this entire line will be removed from the interpolated result

    ${syntheticTable1Defn.insertDML({ column_one_text: "test", column_unique: "testHI" })}

    ${syntheticTable2Defn}

    -- ${ctx.syntheticBehavior1}`;

  const syntheticSQL = DDL.SQL(ctx);
  if (DDL.lintIssues?.length) {
    console.dir(DDL.lintIssues);
  }
  ta.assertEquals(syntheticSQL, fixturePrime);
  ta.assertEquals(0, DDL.lintIssues?.length);
  ta.assertEquals(tablesDeclared.size, 2);
  ta.assertEquals(viewsDeclared.size, 1);
  ta.assertEquals(ctx.behaviorState.state1Value, 2);
  ta.assertEquals(ctx.behaviorState.state2Value, 1);
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
  -- behavior 1 state value: 1

  CREATE TABLE "synthetic_table1" (
      "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "column_one_text" TEXT NOT NULL,
      "column_two_text_nullable" TEXT,
      "column_unique" TEXT NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("column_unique")
  );
  -- encountered persistence request for 1_publ-host.sql

  CREATE VIEW IF NOT EXISTS "synthetic_table1_view"("synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "created_at") AS
      SELECT "synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "created_at"
        FROM "synthetic_table1";

  INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('test', NULL, 'testHI', NULL);

  CREATE TABLE "synthetic_schema"."synthetic_table2" (
      "synthetic_table2_id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "column_three_text" TEXT NOT NULL,
      "column_four_int_nullable" INTEGER,
      "column_unique" TEXT NOT NULL,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("column_unique")
  );

  -- behavior 1 state value: 2`);
