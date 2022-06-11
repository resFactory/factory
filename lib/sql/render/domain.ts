import * as safety from "../../safety/mod.ts";
import * as ax from "../../safety/axiom.ts";
import * as tmpl from "./template/mod.ts";

/**
 * A `domain` is an Axiom-typed "data definition" valuable for many use cases:
 * - defining a column of a table that may generate create table DDL
 * - defining a column in a select clause
 * - defining a column of a view that may generate create view DDL
 * - defining an argument of a stored function or procedure
 *
 * A domain should be a simple JS/TS object that has no other relationships or
 * dependencies (see 'domains' below for relationships). Domains are effective
 * when they remain type-safe through Axiom and should be composable through
 * simple functions and spread operators. This allows, e.g., a column defined
 * for a "create table" DDL defintion to be used as an argument definition for
 * a stored function and vice-versa. Favoring composability over inheritance
 * is the reason why a data definition domain remains a simple JS object
 * instead of a class.
 *
 * A `domains` object groups multiple Axiom-typed "data definition" domains
 * and treats them as a collection. Domains are abstract types valuable for
 * these use cases:
 * - defining a list of coumns in a table for DDL
 * - defining a list of select clause columns in SQL statement
 * - defining a list of arguments for a stored function
 */

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export type AxiomSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = ax.Axiom<TsValueType> & {
  readonly sqlDataType: (
    purpose:
      | "create table column"
      | "stored routine arg"
      | "stored function returns scalar"
      | "stored function returns table column"
      | "type field"
      | "table foreign key ref"
      | "PostgreSQL domain",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlPartial?: (
    destination:
      | "create table, full column defn"
      | "create table, column defn decorators"
      | "create table, after all column definitions",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>[] | undefined;
  readonly referenceASD: () => AxiomSqlDomain<
    TsValueType,
    EmitOptions,
    Context
  >;
  readonly isNullable: boolean;
};

export function isAxiomSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(o: unknown): o is AxiomSqlDomain<TsValueType, EmitOptions, Context> {
  const isASD = safety.typeGuard<
    AxiomSqlDomain<TsValueType, EmitOptions, Context>
  >("sqlDataType");
  return isASD(o);
}

export type IdentifiableSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  DomainIdentity extends string = string,
> =
  & AxiomSqlDomain<TsValueType, EmitOptions, Context>
  & {
    readonly reference: <ForeignIdentity>(
      options?: {
        readonly foreignIdentity?: ForeignIdentity;
      },
    ) => Omit<IdentifiableSqlDomain<Any, EmitOptions, Context>, "reference">;
    readonly identity: DomainIdentity;
  };

export function isIdentifiableSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  DomainIdentity extends string = string,
>(
  o: unknown,
): o is IdentifiableSqlDomain<
  TsValueType,
  EmitOptions,
  Context,
  DomainIdentity
> {
  const isISD = safety.typeGuard<
    IdentifiableSqlDomain<TsValueType, EmitOptions, Context, DomainIdentity>
  >("identity");
  return isAxiomSqlDomain(o) && isISD(o);
}

export function textNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: true,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function text<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function date<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, EmitOptions, Context>>,
): AxiomSqlDomain<Date, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: false,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, EmitOptions, Context>>,
): AxiomSqlDomain<Date | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: true,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateTime<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, EmitOptions, Context>>,
): AxiomSqlDomain<Date, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: false,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function dateTimeNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, EmitOptions, Context>>,
): AxiomSqlDomain<Date | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: true,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function integer<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<number> = ax.$.number,
  asdOptions?: Partial<AxiomSqlDomain<number, EmitOptions, Context>>,
): AxiomSqlDomain<number, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: false,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function integerNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  asdOptions?: Partial<AxiomSqlDomain<number, EmitOptions, Context>>,
): AxiomSqlDomain<number | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: true,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function bigint<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<bigint> = ax.$.bigint,
  asdOptions?: Partial<AxiomSqlDomain<bigint, EmitOptions, Context>>,
): AxiomSqlDomain<bigint, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `BIGINT` }),
    isNullable: false,
    referenceASD: () => bigint(),
    ...asdOptions,
  };
}

export function bigintNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<bigint | undefined> = ax.$.bigint.optional(),
  asdOptions?: Partial<AxiomSqlDomain<bigint, EmitOptions, Context>>,
): AxiomSqlDomain<bigint | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `BIGINT` }),
    isNullable: true,
    referenceASD: () => bigint(),
    ...asdOptions,
  };
}

export function jsonText<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: false,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export function jsonTextNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: true,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export interface SqlDomainsSupplier<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  TsValueType = Any,
> {
  domains: IdentifiableSqlDomain<
    TsValueType,
    EmitOptions,
    Context
  >[];
}

export function isSqlDomainsSupplier<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  TsValueType = Any,
>(o: unknown): o is SqlDomainsSupplier<EmitOptions, Context, TsValueType> {
  const isSDS = safety.typeGuard<
    SqlDomainsSupplier<EmitOptions, Context, TsValueType>
  >("domains");
  return isSDS(o);
}

export function sqlDomains<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  props: TPropAxioms,
  sdOptions?: {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotAxiomSqlDomain } = sdOptions ?? {};
  const domains: IdentifiableSqlDomain<
    Any,
    EmitOptions,
    Context
  >[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomSqlDomain<Any, EmitOptions, Context>(axiom)) {
      const mutatableISD = axiom as safety.Writeable<
        IdentifiableSqlDomain<Any, EmitOptions, Context>
      >;
      mutatableISD.identity = name as Any;
      mutatableISD.reference = (rOptions) => {
        const result: Omit<
          IdentifiableSqlDomain<Any, EmitOptions, Context>,
          "reference"
        > = {
          identity: (rOptions?.foreignIdentity ?? name) as string,
          ...axiom.referenceASD(),
        };
        return result;
      };
      domains.push(mutatableISD);
    } else {
      onPropertyNotAxiomSqlDomain?.(name, axiom, domains);
    }
  });

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to SqlDomainsSupplier contract
  return {
    ...axiom,
    domains,
  };
}
