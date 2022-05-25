import * as safety from "../../../safety/mod.ts";
import * as t from "../text.ts";

export interface TableDefinitionSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly tableDefn: TableDefinition<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >;
}

export interface TableColumnNameSupplier<ColumnName extends string> {
  readonly columnName: ColumnName;
}

export interface TableColumnPrimaryKeySupplier {
  readonly isPrimaryKey: boolean;
}

export interface ForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
> {
  readonly foreignKeyTableColDefn: (
    columnName?: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableColumnDefinition<ColumnName>;
}

export interface TableColumnForeignKeySupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly foreignKey:
    & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
    & {
      tableColumnDefn:
        & TableColumnNameSupplier<ColumnName>
        // deno-lint-ignore no-explicit-any
        & TableColumnDataTypeSupplier<any, any>;
    };
}

export interface TableColumnNullabilitySupplier {
  readonly isNullable: boolean;
}

export interface TableColumnDataTypeSupplier<SqlType, TsType> {
  readonly sqlDataType: SqlType;
  readonly tsDataType: safety.TypeGuard<TsType>;
}

export interface TableColumnDeclareWeightSupplier {
  readonly declarationWeight: number;
}

export interface TableColumnDmlContributions {
  readonly isInInsertColumnsList: <Record>(record?: Record) => boolean;
  readonly isInUpdateColumnsList: <Record>(record?: Record) => boolean;
}

export interface TableColumnDmlContributionsSupplier {
  readonly sqlDmlContributions: TableColumnDmlContributions;
}

export interface TableAutoIncPrimaryKeyColumnDefinition<
  ColumnName extends string,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"INTEGER", number>,
  ForeignKeyTableColumnDefnFactory<ColumnName>,
  TableColumnDmlContributionsSupplier {
}

export interface TableIntegerColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"INTEGER", number>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableDateTimeColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"DATETIME", Date>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableCreationStampColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"DATETIME", Date>,
    TableColumnDmlContributionsSupplier {
}

export interface TableTextColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"TEXT", string>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableJsonColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"JSON", Record<string, unknown>>,
    Partial<TableColumnNullabilitySupplier> {
}

export type TableColumnDefinition<ColumnName extends string> =
  TableColumnNameSupplier<ColumnName>;

export interface TableColumnDefinitionSupplier<ColumnName extends string> {
  readonly tableColumnDefn: TableColumnDefinition<ColumnName>;
}

export type TableDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>;

export type TableColumnDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
  & TableColumnDefinitionSupplier<ColumnName>;

export interface TableDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends t.SqlTextSupplier<Context, EmitOptions> {
  readonly tableName: TableName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition<ColumnName>[];
  readonly decorators: t.SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName, EmitOptions>,
    EmitOptions
  >[];
}
