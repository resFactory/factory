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
  Context extends tmpl.SqlEmitContext,
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
  ) => tmpl.SqlTextSupplier<Context>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context>;
  readonly sqlPartial?: (
    destination:
      | "create table, full column defn"
      | "create table, column defn decorators"
      | "create table, after all column definitions",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  readonly referenceASD: () => AxiomSqlDomain<
    TsValueType,
    Context
  >;
  readonly isNullable: boolean;
};

export function isAxiomSqlDomain<
  TsValueType,
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is AxiomSqlDomain<TsValueType, Context> {
  const isASD = safety.typeGuard<
    AxiomSqlDomain<TsValueType, Context>
  >("sqlDataType");
  return isASD(o);
}

export type IdentifiableSqlDomain<
  TsValueType,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
> =
  & AxiomSqlDomain<TsValueType, Context>
  & {
    readonly reference: <ForeignIdentity>(
      options?: {
        readonly foreignIdentity?: ForeignIdentity;
      },
    ) => Omit<IdentifiableSqlDomain<Any, Context>, "reference">;
    readonly identity: DomainIdentity;
  };

export function isIdentifiableSqlDomain<
  TsValueType,
  Context extends tmpl.SqlEmitContext,
  DomainIdentity extends string = string,
>(
  o: unknown,
): o is IdentifiableSqlDomain<
  TsValueType,
  Context,
  DomainIdentity
> {
  const isISD = safety.typeGuard<
    IdentifiableSqlDomain<TsValueType, Context, DomainIdentity>
  >("identity");
  return isAxiomSqlDomain(o) && isISD(o);
}

export type LabeledSqlDomain<
  TsValueType,
  Context extends tmpl.SqlEmitContext,
  Label extends string,
> =
  & AxiomSqlDomain<TsValueType, Context>
  & { readonly labels: Label[] };

export function isLabeledSqlDomain<
  TsValueType,
  Context extends tmpl.SqlEmitContext,
  Label extends string,
>(
  o: unknown,
): o is LabeledSqlDomain<
  TsValueType,
  Context,
  Label
> {
  const isTSD = safety.typeGuard<
    LabeledSqlDomain<TsValueType, Context, Label>
  >("labels");
  return isAxiomSqlDomain(o) && isTSD(o);
}

export function label<
  TsValueType,
  Label extends string,
  Context extends tmpl.SqlEmitContext,
>(
  domain: AxiomSqlDomain<TsValueType, Context>,
  ...labels: Label[]
): LabeledSqlDomain<TsValueType, Context, Label> {
  return {
    ...domain,
    labels,
  };
}

export function textNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, Context>>,
): AxiomSqlDomain<string | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: true,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function text<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, Context>>,
): AxiomSqlDomain<string, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function date<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, Context>>,
): AxiomSqlDomain<Date, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: false,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, Context>>,
): AxiomSqlDomain<Date | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: true,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateTime<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, Context>>,
): AxiomSqlDomain<Date, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: false,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function dateTimeNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, Context>>,
): AxiomSqlDomain<Date | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: true,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function integer<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<number> = ax.$.number,
  asdOptions?: Partial<AxiomSqlDomain<number, Context>>,
): AxiomSqlDomain<number, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: false,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function integerNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  asdOptions?: Partial<AxiomSqlDomain<number, Context>>,
): AxiomSqlDomain<number | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: true,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function bigint<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<bigint> = ax.$.bigint,
  asdOptions?: Partial<AxiomSqlDomain<bigint, Context>>,
): AxiomSqlDomain<bigint, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `BIGINT` }),
    isNullable: false,
    referenceASD: () => bigint(),
    ...asdOptions,
  };
}

export function bigintNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<bigint | undefined> = ax.$.bigint.optional(),
  asdOptions?: Partial<AxiomSqlDomain<bigint, Context>>,
): AxiomSqlDomain<bigint | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `BIGINT` }),
    isNullable: true,
    referenceASD: () => bigint(),
    ...asdOptions,
  };
}

export function jsonText<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, Context>>,
): AxiomSqlDomain<string, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: false,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export function jsonTextNullable<
  Context extends tmpl.SqlEmitContext,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  asdOptions?: Partial<AxiomSqlDomain<string, Context>>,
): AxiomSqlDomain<string | undefined, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: true,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export interface SqlDomainsSupplier<
  Context extends tmpl.SqlEmitContext,
  TsValueType = Any,
> {
  domains: IdentifiableSqlDomain<
    TsValueType,
    Context
  >[];
}

export function isSqlDomainsSupplier<
  Context extends tmpl.SqlEmitContext,
  TsValueType,
>(o: unknown): o is SqlDomainsSupplier<Context, TsValueType> {
  const isSDS = safety.typeGuard<
    SqlDomainsSupplier<Context, TsValueType>
  >("domains");
  return isSDS(o);
}

export function sqlDomains<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  props: TPropAxioms,
  sdOptions?: {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: IdentifiableSqlDomain<Any, Context>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotAxiomSqlDomain } = sdOptions ?? {};
  const domains: IdentifiableSqlDomain<
    Any,
    Context
  >[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomSqlDomain<Any, Context>(axiom)) {
      const mutatableISD = axiom as safety.Writeable<
        IdentifiableSqlDomain<Any, Context>
      >;
      mutatableISD.identity = name as Any;
      mutatableISD.reference = (rOptions) => {
        const result: Omit<
          IdentifiableSqlDomain<Any, Context>,
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

export function* labeledSqlDomains<
  Label extends string,
  Context extends tmpl.SqlEmitContext,
  TsValueType = Any,
>(
  sds: SqlDomainsSupplier<Context, TsValueType>,
  include: (
    d:
      & IdentifiableSqlDomain<TsValueType, Context, string>
      & LabeledSqlDomain<TsValueType, Context, Label>,
  ) => boolean,
): Generator<
  & IdentifiableSqlDomain<TsValueType, Context, string>
  & LabeledSqlDomain<TsValueType, Context, Label>,
  void
> {
  for (const d of sds.domains) {
    if (isLabeledSqlDomain<TsValueType, Context, Label>(d) && include(d)) {
      yield d;
    }
  }
}
