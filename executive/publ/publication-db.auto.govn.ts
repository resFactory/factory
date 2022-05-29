// generated by publication-db.sqla.ts. DO NOT EDIT.

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

export type UnknownJSON = string;

export interface mutable_publ_host {
  publ_host_id: number; // INTEGER, NOT NULL, primary key
  host: string; // TEXT, NOT NULL
  host_identity?: UnknownJSON; // JSON
  mutation_count: number; // INTEGER, NOT NULL
  created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
}

export const PublHostTableName = "publ_host" as const;
export type publ_host = Readonly<mutable_publ_host>;
export type MutablePublHost = TableToObject<mutable_publ_host>;
export type PublHost = Readonly<MutablePublHost>;
export type publ_host_insertable =
  & Omit<publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<publ_host, "created_at">>;
export type mutable_publ_host_insertable =
  & Omit<mutable_publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<mutable_publ_host, "created_at">>;
export type PublHostInsertable =
  & Omit<PublHost, "publHostId" | "createdAt">
  & Partial<Pick<PublHost, "createdAt">>;
export type publ_host_updateable =
  & Omit<publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<publ_host, "created_at">>;
export type PublHostUpdatable =
  & Omit<PublHost, "publHostId" | "createdAt">
  & Partial<Pick<PublHost, "createdAt">>;

export const publHostDT: TableDataTransferSuppliers<
  typeof PublHostTableName,
  publ_host,
  PublHost,
  publ_host_insertable,
  PublHostInsertable
> = {
  tableName: PublHostTableName,
  fromTable: (record) => ({
    publHostId: record.publ_host_id,
    host: record.host,
    hostIdentity: record.host_identity,
    mutationCount: record.mutation_count,
    createdAt: record.created_at,
  }),
  toTable: (o) => ({
    publ_host_id: o.publHostId,
    host: o.host,
    host_identity: o.hostIdentity,
    mutation_count: o.mutationCount,
    created_at: o.createdAt,
  }),
  insertable: (o) => {
    const insertable: mutable_publ_host_insertable = {
      host: o.host,
      host_identity: o.hostIdentity,
      mutation_count: o.mutationCount,
      created_at: o.createdAt,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export function publHostDML<
  Context = unknown,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
>(): TableDmlSuppliers<
  Context,
  typeof PublHostTableName,
  publ_host_insertable,
  EmitOptions
> {
  return {
    tableName: PublHostTableName,
    prepareInsertStmt: typicalInsertStmtPreparer(PublHostTableName, [
      "host",
      "host_identity",
      "mutation_count",
      "created_at",
    ]),
  };
}

export interface mutable_publ_build_event {
  publ_build_event_id: number; // INTEGER, NOT NULL, primary key
  publ_host_id: number; // INTEGER, NOT NULL, FK: publ_host.publ_host_id
  iteration_index: number; // INTEGER, NOT NULL
  build_initiated_at: Date; // DATETIME, NOT NULL
  build_completed_at: Date; // DATETIME, NOT NULL
  build_duration_ms: number; // INTEGER, NOT NULL
  resources_originated_count: number; // INTEGER, NOT NULL
  resources_persisted_count: number; // INTEGER, NOT NULL
  resources_memoized_count: number; // INTEGER, NOT NULL
  created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
}

export const PublBuildEventTableName = "publ_build_event" as const;
export type publ_build_event = Readonly<mutable_publ_build_event>;
export type MutablePublBuildEvent = TableToObject<mutable_publ_build_event>;
export type PublBuildEvent = Readonly<MutablePublBuildEvent>;
export type publ_build_event_insertable =
  & Omit<publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<publ_build_event, "created_at">>;
export type mutable_publ_build_event_insertable =
  & Omit<mutable_publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<mutable_publ_build_event, "created_at">>;
export type PublBuildEventInsertable =
  & Omit<PublBuildEvent, "publBuildEventId" | "createdAt">
  & Partial<Pick<PublBuildEvent, "createdAt">>;
export type publ_build_event_updateable =
  & Omit<publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<publ_build_event, "created_at">>;
export type PublBuildEventUpdatable =
  & Omit<PublBuildEvent, "publBuildEventId" | "createdAt">
  & Partial<Pick<PublBuildEvent, "createdAt">>;

export const publBuildEventDT: TableDataTransferSuppliers<
  typeof PublBuildEventTableName,
  publ_build_event,
  PublBuildEvent,
  publ_build_event_insertable,
  PublBuildEventInsertable
> = {
  tableName: PublBuildEventTableName,
  fromTable: (record) => ({
    publBuildEventId: record.publ_build_event_id,
    publHostId: record.publ_host_id,
    iterationIndex: record.iteration_index,
    buildInitiatedAt: record.build_initiated_at,
    buildCompletedAt: record.build_completed_at,
    buildDurationMs: record.build_duration_ms,
    resourcesOriginatedCount: record.resources_originated_count,
    resourcesPersistedCount: record.resources_persisted_count,
    resourcesMemoizedCount: record.resources_memoized_count,
    createdAt: record.created_at,
  }),
  toTable: (o) => ({
    publ_build_event_id: o.publBuildEventId,
    publ_host_id: o.publHostId,
    iteration_index: o.iterationIndex,
    build_initiated_at: o.buildInitiatedAt,
    build_completed_at: o.buildCompletedAt,
    build_duration_ms: o.buildDurationMs,
    resources_originated_count: o.resourcesOriginatedCount,
    resources_persisted_count: o.resourcesPersistedCount,
    resources_memoized_count: o.resourcesMemoizedCount,
    created_at: o.createdAt,
  }),
  insertable: (o) => {
    const insertable: mutable_publ_build_event_insertable = {
      publ_host_id: o.publHostId,
      iteration_index: o.iterationIndex,
      build_initiated_at: o.buildInitiatedAt,
      build_completed_at: o.buildCompletedAt,
      build_duration_ms: o.buildDurationMs,
      resources_originated_count: o.resourcesOriginatedCount,
      resources_persisted_count: o.resourcesPersistedCount,
      resources_memoized_count: o.resourcesMemoizedCount,
      created_at: o.createdAt,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export function publBuildEventDML<
  Context = unknown,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
>(): TableDmlSuppliers<
  Context,
  typeof PublBuildEventTableName,
  publ_build_event_insertable,
  EmitOptions
> {
  return {
    tableName: PublBuildEventTableName,
    prepareInsertStmt: typicalInsertStmtPreparer(PublBuildEventTableName, [
      "publ_host_id",
      "iteration_index",
      "build_initiated_at",
      "build_completed_at",
      "build_duration_ms",
      "resources_originated_count",
      "resources_persisted_count",
      "resources_memoized_count",
      "created_at",
    ]),
  };
}

export interface mutable_publ_server_service {
  publ_server_service_id: number; // INTEGER, NOT NULL, primary key
  service_started_at: Date; // DATETIME, NOT NULL
  listen_host: string; // TEXT, NOT NULL
  listen_port: number; // INTEGER, NOT NULL
  publish_url: string; // TEXT, NOT NULL
  publ_build_event_id: number; // INTEGER, NOT NULL, FK: publ_build_event.publ_build_event_id
  created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
}

export const PublServerServiceTableName = "publ_server_service" as const;
export type publ_server_service = Readonly<mutable_publ_server_service>;
export type MutablePublServerService = TableToObject<
  mutable_publ_server_service
>;
export type PublServerService = Readonly<MutablePublServerService>;
export type publ_server_service_insertable =
  & Omit<publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<publ_server_service, "created_at">>;
export type mutable_publ_server_service_insertable =
  & Omit<mutable_publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<mutable_publ_server_service, "created_at">>;
export type PublServerServiceInsertable =
  & Omit<PublServerService, "publServerServiceId" | "createdAt">
  & Partial<Pick<PublServerService, "createdAt">>;
export type publ_server_service_updateable =
  & Omit<publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<publ_server_service, "created_at">>;
export type PublServerServiceUpdatable =
  & Omit<PublServerService, "publServerServiceId" | "createdAt">
  & Partial<Pick<PublServerService, "createdAt">>;

export const publServerServiceDT: TableDataTransferSuppliers<
  typeof PublServerServiceTableName,
  publ_server_service,
  PublServerService,
  publ_server_service_insertable,
  PublServerServiceInsertable
> = {
  tableName: PublServerServiceTableName,
  fromTable: (record) => ({
    publServerServiceId: record.publ_server_service_id,
    serviceStartedAt: record.service_started_at,
    listenHost: record.listen_host,
    listenPort: record.listen_port,
    publishUrl: record.publish_url,
    publBuildEventId: record.publ_build_event_id,
    createdAt: record.created_at,
  }),
  toTable: (o) => ({
    publ_server_service_id: o.publServerServiceId,
    service_started_at: o.serviceStartedAt,
    listen_host: o.listenHost,
    listen_port: o.listenPort,
    publish_url: o.publishUrl,
    publ_build_event_id: o.publBuildEventId,
    created_at: o.createdAt,
  }),
  insertable: (o) => {
    const insertable: mutable_publ_server_service_insertable = {
      service_started_at: o.serviceStartedAt,
      listen_host: o.listenHost,
      listen_port: o.listenPort,
      publish_url: o.publishUrl,
      publ_build_event_id: o.publBuildEventId,
      created_at: o.createdAt,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export function publServerServiceDML<
  Context = unknown,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
>(): TableDmlSuppliers<
  Context,
  typeof PublServerServiceTableName,
  publ_server_service_insertable,
  EmitOptions
> {
  return {
    tableName: PublServerServiceTableName,
    prepareInsertStmt: typicalInsertStmtPreparer(PublServerServiceTableName, [
      "service_started_at",
      "listen_host",
      "listen_port",
      "publish_url",
      "publ_build_event_id",
      "created_at",
    ]),
  };
}

export interface mutable_publ_server_static_access_log {
  publ_server_static_access_log_id: number; // INTEGER, NOT NULL, primary key
  status: number; // INTEGER, NOT NULL
  asset_nature: string; // TEXT, NOT NULL
  location_href: string; // TEXT, NOT NULL
  filesys_target_path: string; // TEXT, NOT NULL
  filesys_target_symlink?: string; // TEXT
  publ_server_service_id: number; // INTEGER, NOT NULL, FK: publ_server_service.publ_server_service_id
  created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
}

export const PublServerStaticAccessLogTableName =
  "publ_server_static_access_log" as const;
export type publ_server_static_access_log = Readonly<
  mutable_publ_server_static_access_log
>;
export type MutablePublServerStaticAccessLog = TableToObject<
  mutable_publ_server_static_access_log
>;
export type PublServerStaticAccessLog = Readonly<
  MutablePublServerStaticAccessLog
>;
export type publ_server_static_access_log_insertable =
  & Omit<
    publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<publ_server_static_access_log, "created_at">>;
export type mutable_publ_server_static_access_log_insertable =
  & Omit<
    mutable_publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<mutable_publ_server_static_access_log, "created_at">>;
export type PublServerStaticAccessLogInsertable =
  & Omit<PublServerStaticAccessLog, "publServerStaticAccessLogId" | "createdAt">
  & Partial<Pick<PublServerStaticAccessLog, "createdAt">>;
export type publ_server_static_access_log_updateable =
  & Omit<
    publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<publ_server_static_access_log, "created_at">>;
export type PublServerStaticAccessLogUpdatable =
  & Omit<PublServerStaticAccessLog, "publServerStaticAccessLogId" | "createdAt">
  & Partial<Pick<PublServerStaticAccessLog, "createdAt">>;

export const publServerStaticAccessLogDT: TableDataTransferSuppliers<
  typeof PublServerStaticAccessLogTableName,
  publ_server_static_access_log,
  PublServerStaticAccessLog,
  publ_server_static_access_log_insertable,
  PublServerStaticAccessLogInsertable
> = {
  tableName: PublServerStaticAccessLogTableName,
  fromTable: (record) => ({
    publServerStaticAccessLogId: record.publ_server_static_access_log_id,
    status: record.status,
    assetNature: record.asset_nature,
    locationHref: record.location_href,
    filesysTargetPath: record.filesys_target_path,
    filesysTargetSymlink: record.filesys_target_symlink,
    publServerServiceId: record.publ_server_service_id,
    createdAt: record.created_at,
  }),
  toTable: (o) => ({
    publ_server_static_access_log_id: o.publServerStaticAccessLogId,
    status: o.status,
    asset_nature: o.assetNature,
    location_href: o.locationHref,
    filesys_target_path: o.filesysTargetPath,
    filesys_target_symlink: o.filesysTargetSymlink,
    publ_server_service_id: o.publServerServiceId,
    created_at: o.createdAt,
  }),
  insertable: (o) => {
    const insertable: mutable_publ_server_static_access_log_insertable = {
      status: o.status,
      asset_nature: o.assetNature,
      location_href: o.locationHref,
      filesys_target_path: o.filesysTargetPath,
      filesys_target_symlink: o.filesysTargetSymlink,
      publ_server_service_id: o.publServerServiceId,
      created_at: o.createdAt,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export function publServerStaticAccessLogDML<
  Context = unknown,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
>(): TableDmlSuppliers<
  Context,
  typeof PublServerStaticAccessLogTableName,
  publ_server_static_access_log_insertable,
  EmitOptions
> {
  return {
    tableName: PublServerStaticAccessLogTableName,
    prepareInsertStmt: typicalInsertStmtPreparer(
      PublServerStaticAccessLogTableName,
      [
        "status",
        "asset_nature",
        "location_href",
        "filesys_target_path",
        "filesys_target_symlink",
        "publ_server_service_id",
        "created_at",
      ],
    ),
  };
}

export interface mutable_publ_server_error_log {
  publ_server_error_log_id: number; // INTEGER, NOT NULL, primary key
  location_href: string; // TEXT, NOT NULL
  error_summary: string; // TEXT, NOT NULL
  error_elaboration?: UnknownJSON; // JSON
  publ_server_service_id: number; // INTEGER, NOT NULL, FK: publ_server_service.publ_server_service_id
  created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
}

export const PublServerErrorLogTableName = "publ_server_error_log" as const;
export type publ_server_error_log = Readonly<mutable_publ_server_error_log>;
export type MutablePublServerErrorLog = TableToObject<
  mutable_publ_server_error_log
>;
export type PublServerErrorLog = Readonly<MutablePublServerErrorLog>;
export type publ_server_error_log_insertable =
  & Omit<publ_server_error_log, "publ_server_error_log_id" | "created_at">
  & Partial<Pick<publ_server_error_log, "created_at">>;
export type mutable_publ_server_error_log_insertable =
  & Omit<
    mutable_publ_server_error_log,
    "publ_server_error_log_id" | "created_at"
  >
  & Partial<Pick<mutable_publ_server_error_log, "created_at">>;
export type PublServerErrorLogInsertable =
  & Omit<PublServerErrorLog, "publServerErrorLogId" | "createdAt">
  & Partial<Pick<PublServerErrorLog, "createdAt">>;
export type publ_server_error_log_updateable =
  & Omit<publ_server_error_log, "publ_server_error_log_id" | "created_at">
  & Partial<Pick<publ_server_error_log, "created_at">>;
export type PublServerErrorLogUpdatable =
  & Omit<PublServerErrorLog, "publServerErrorLogId" | "createdAt">
  & Partial<Pick<PublServerErrorLog, "createdAt">>;

export const publServerErrorLogDT: TableDataTransferSuppliers<
  typeof PublServerErrorLogTableName,
  publ_server_error_log,
  PublServerErrorLog,
  publ_server_error_log_insertable,
  PublServerErrorLogInsertable
> = {
  tableName: PublServerErrorLogTableName,
  fromTable: (record) => ({
    publServerErrorLogId: record.publ_server_error_log_id,
    locationHref: record.location_href,
    errorSummary: record.error_summary,
    errorElaboration: record.error_elaboration,
    publServerServiceId: record.publ_server_service_id,
    createdAt: record.created_at,
  }),
  toTable: (o) => ({
    publ_server_error_log_id: o.publServerErrorLogId,
    location_href: o.locationHref,
    error_summary: o.errorSummary,
    error_elaboration: o.errorElaboration,
    publ_server_service_id: o.publServerServiceId,
    created_at: o.createdAt,
  }),
  insertable: (o) => {
    const insertable: mutable_publ_server_error_log_insertable = {
      location_href: o.locationHref,
      error_summary: o.errorSummary,
      error_elaboration: o.errorElaboration,
      publ_server_service_id: o.publServerServiceId,
      created_at: o.createdAt,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export function publServerErrorLogDML<
  Context = unknown,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
>(): TableDmlSuppliers<
  Context,
  typeof PublServerErrorLogTableName,
  publ_server_error_log_insertable,
  EmitOptions
> {
  return {
    tableName: PublServerErrorLogTableName,
    prepareInsertStmt: typicalInsertStmtPreparer(PublServerErrorLogTableName, [
      "location_href",
      "error_summary",
      "error_elaboration",
      "publ_server_service_id",
      "created_at",
    ]),
  };
}

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
