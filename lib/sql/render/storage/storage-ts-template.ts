// generated by ${TSTMPL_ORIGIN}. DO NOT EDIT.

// deno-lint-ignore no-explicit-any
type Any = any; // to ease lint warnings

export type CamelCase<S extends string> = S extends
  `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export type TableToObject<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Date ? T[K]
    : // deno-lint-ignore ban-types
    (T[K] extends object ? TableToObject<T[K]> : T[K]);
};

export interface SqlTextEmitOptions<Context> {
  readonly quotedLiteral: (value: unknown) => [value: unknown, quoted: string];
}

export interface SqlTextSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
> {
  readonly SQL: (ctx?: Context, options?: EmitOptions) => string;
}

export interface InsertStmtPreparer<
  Context,
  TableName,
  InsertableRecord,
  EmitOptions extends SqlTextEmitOptions<Context>,
> {
  (ir: InsertableRecord, options?: {
    readonly emitColumn?: (
      columnName: keyof InsertableRecord,
      record: InsertableRecord,
      tableName: TableName,
      eo?: EmitOptions,
      ctx?: Context,
    ) =>
      | [columNameSqlText: string, value: unknown, valueSqlText: string]
      | undefined;
    readonly prepareSqlText?: (
      suggested: string,
      tableName: TableName,
      record: InsertableRecord,
      names: (keyof InsertableRecord)[],
      values: [value: unknown, sqlText: string][],
      eo?: EmitOptions,
      ctx?: Context,
    ) => string;
  }): SqlTextSupplier<Context, EmitOptions>;
}

export function typicalInsertStmtPreparer<
  Context,
  TableName,
  InsertableRecord,
  EmitOptions extends SqlTextEmitOptions<Context>,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
>(
  tableName: TableName,
  candidateColumns: InsertableColumnName[],
): InsertStmtPreparer<Context, TableName, InsertableRecord, EmitOptions> {
  return (ir, pisOptions) => {
    return {
      SQL: (ctx, eo) => {
        const { emitColumn } = pisOptions ?? {};
        const names: InsertableColumnName[] = [];
        const values: [value: unknown, valueSqlText: string][] = [];
        candidateColumns.forEach((c) => {
          let ec: [
            columNameSqlText: string,
            value: unknown,
            valueSqlText: string,
          ] | undefined;
          if (emitColumn) {
            ec = emitColumn(c, ir, tableName, eo, ctx);
          } else {
            const { quotedLiteral = typicalQuotedLiteral } = eo ?? {};
            const qValue = quotedLiteral((ir as Any)[c]);
            ec = [c as string, ...qValue];
          }
          if (ec) {
            const [columNameSqlText, value, valueSqlText] = ec;
            names.push(columNameSqlText as InsertableColumnName);
            values.push([value, valueSqlText]);
          }
        });
        const SQL = `INSERT INTO ${tableName} (${names.join()}) VALUES (${
          values.map((value) => value[1]).join()
        })`;
        return pisOptions?.prepareSqlText
          ? pisOptions?.prepareSqlText(
            SQL,
            tableName,
            ir,
            names,
            values,
            eo,
            ctx,
          )
          : SQL;
      },
    };
  };
}

export interface GovernedTable<TableName> {
  readonly tableName: TableName;
}

export interface TableDataTransferSuppliers<
  TableName,
  TableRecord,
  TsObject,
  InsertableRecord,
  InsertableObject,
> extends GovernedTable<TableName> {
  readonly fromTable: (t: TableRecord) => TsObject;
  readonly toTable: (o: TsObject) => TableRecord;
  readonly insertable: (o: InsertableObject) => InsertableRecord;
}

export interface TableDmlSuppliers<
  Context,
  TableName,
  InsertableRecord,
  EmitOptions extends SqlTextEmitOptions<Context>,
> extends GovernedTable<TableName> {
  readonly prepareInsertStmt: InsertStmtPreparer<
    Context,
    TableName,
    InsertableRecord,
    EmitOptions
  >;
}

// ${TSTMPL_BODY} each table will generate its own body

export const typicalQuotedLiteral = (
  value: unknown,
): [value: unknown, quoted: string] => {
  if (typeof value === "undefined") return [value, "NULL"];
  if (typeof value === "string") {
    return [value, `'${value.replaceAll("'", "''")}'`];
  }
  return [value, String(value)];
};

export function typicalSqlEmitOptions<Context>(
  inherit?: SqlTextEmitOptions<Context>,
): SqlTextEmitOptions<Context> {
  return {
    quotedLiteral: typicalQuotedLiteral,
    ...inherit,
  };
}
