import * as safety from "../safety/mod.ts";
import * as m from "../safety/merge.ts";
import * as ax from "./axiom.ts";

/**
 * An `AxiomSerDe` is an Axiom-typed "data definition" for defining type-safe
 * "serializable deserializable" (SerDe) atomic data components that can be
 * stored in the environment, a database, etc.
 *
 * A `serDeAxioms` object groups multiple Axiom-typed `AxiomSerDe` instances and
 * treats them as a collection so that they can be treated as a single unit.
 * `serDeAxioms` objects are special in that each AxiomSerDe can be independently
 * identifiable by using simple TypeScript object declarations.
 */

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export interface AixomSerDeLintIssueSupplier {
  readonly lintIssue: string;
  readonly location?: (options?: { maxLength?: number }) => string;
}

export const isAixomSerDeLintIssueSupplier = safety.typeGuard<
  AixomSerDeLintIssueSupplier
>("lintIssue");

export interface AxiomSerDeLintIssuesSupplier {
  readonly lintIssues: AixomSerDeLintIssueSupplier[];
}

export const isAxiomSerDeLintIssuesSupplier = safety.typeGuard<
  AxiomSerDeLintIssuesSupplier
>("lintIssues");

export type AxiomSerDeLabelsSupplier<Label extends string> = {
  readonly labels: Label[];
};

export function axiomSerDeLintIssue<TsValueType>(
  axiomSD: AxiomSerDe<TsValueType>,
  issue: string,
  location?: (options?: { maxLength?: number }) => string,
): AxiomSerDeLintIssuesSupplier & AxiomSerDe<TsValueType> {
  const lintIssue = { lintIssue: issue, location };
  if (isAxiomSerDeLintIssuesSupplier(axiomSD)) {
    axiomSD.lintIssues.push(lintIssue);
    return axiomSD;
  } else {
    const lintable = axiomSD as
      & safety.Writeable<AxiomSerDeLintIssuesSupplier>
      & AxiomSerDe<TsValueType>;
    lintable.lintIssues = [lintIssue];
    return lintable;
  }
}

export function isAxiomSerDeLabelsSupplier<Label extends string>(
  o: unknown,
): o is AxiomSerDeLabelsSupplier<Label> {
  const isLSD = safety.typeGuard<AxiomSerDeLabelsSupplier<Label>>("labels");
  return isLSD(o);
}

export type AxiomSerDeValueSupplier<TsValueType> = <Context>(
  ctx?: Context,
) => TsValueType;

export type AxiomSerDe<TsValueType> = ax.Axiom<TsValueType> & {
  readonly fromText: <Origin>(text: string, origin: Origin) => TsValueType;
  readonly isDefaultable?: <Context>(
    value?: TsValueType,
    ctx?: Context,
  ) => boolean;
  readonly defaultValue?: AxiomSerDeValueSupplier<TsValueType>;
  readonly isOptional: boolean;
};

export function isAxiomSerDe<TsValueType>(
  o: unknown,
): o is AxiomSerDe<TsValueType> {
  const isAT = safety.typeGuard<
    AxiomSerDe<TsValueType>
  >("isOptional");
  return isAT(o);
}

export type IdentifiableAxiomSerDe<
  TsValueType,
  SerDeIdentity extends string = string,
> =
  & AxiomSerDe<TsValueType>
  & { readonly identity: SerDeIdentity };

export function isIdentifiableAxiomSerDe<
  TsValueType,
  ToggleIdentity extends string = string,
>(o: unknown): o is IdentifiableAxiomSerDe<TsValueType, ToggleIdentity> {
  const isIASD = safety.typeGuard<
    IdentifiableAxiomSerDe<TsValueType, ToggleIdentity>
  >("identity");
  return isAxiomSerDe(o) && isIASD(o);
}

export type LabeledAxiomSerDe<TsValueType, Label extends string> =
  & AxiomSerDe<TsValueType>
  & AxiomSerDeLabelsSupplier<Label>;

export function isLabeledAxiomSerDe<TsValueType, Label extends string>(
  o: unknown,
): o is LabeledAxiomSerDe<TsValueType, Label> {
  const isLASD = safety.typeGuard<LabeledAxiomSerDe<TsValueType, Label>>(
    "labels",
  );
  return isAxiomSerDe(o) && isLASD(o);
}

export function label<TsValueType, Label extends string>(
  toggle: AxiomSerDe<TsValueType>,
  ...labels: Label[]
): LabeledAxiomSerDe<TsValueType, Label> {
  return {
    ...toggle,
    labels,
  };
}

export function defaultable<TsValueType>(
  toggle: AxiomSerDe<TsValueType>,
  defaultValue: AxiomSerDeValueSupplier<TsValueType>,
  isDefaultable?: <Context>(value?: TsValueType, ctx?: Context) => boolean,
): AxiomSerDe<TsValueType> {
  return { ...toggle, defaultValue, isDefaultable };
}

export function untyped(
  axiom: ax.Axiom<unknown> = ax.$.unknown,
  atOptions?: Partial<AxiomSerDe<unknown>>,
): AxiomSerDe<unknown> {
  return {
    ...axiom,
    fromText: (text) => text,
    isOptional: false,
    ...atOptions,
  };
}

export function untypedOptional(
  axiom: ax.Axiom<unknown | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomSerDe<unknown>>,
): AxiomSerDe<unknown | undefined> {
  return { ...axiom, fromText: (text) => text, isOptional: true, ...atOptions };
}

export function text(
  axiom: ax.Axiom<string> = ax.$.string,
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string> {
  return {
    ...axiom,
    fromText: (text) => text,
    isOptional: false,
    ...atOptions,
  };
}

export function textOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string | undefined> {
  return { ...axiom, fromText: (text) => text, isOptional: true, ...atOptions };
}

export function date(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomSerDe<Date>>,
): AxiomSerDe<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomSerDe<Date | undefined>>,
): AxiomSerDe<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function dateTime(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomSerDe<Date>>,
): AxiomSerDe<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateTimeOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomSerDe<Date | undefined>>,
): AxiomSerDe<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function boolean(
  axiom: ax.Axiom<boolean> = ax.$.boolean,
  atOptions?: Partial<AxiomSerDe<boolean>>,
): AxiomSerDe<boolean> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function booleanOptional(
  axiom: ax.Axiom<boolean | undefined> = ax.$.boolean.optional(),
  atOptions?: Partial<AxiomSerDe<boolean>>,
): AxiomSerDe<boolean | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export function integer(
  axiom: ax.Axiom<number> = ax.$.number,
  atOptions?: Partial<AxiomSerDe<number>>,
): AxiomSerDe<number> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: false,
    ...atOptions,
  };
}

export function integerOptional(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  atOptions?: Partial<AxiomSerDe<number>>,
): AxiomSerDe<number | undefined> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: true,
    ...atOptions,
  };
}

export function bigint(
  axiom: ax.Axiom<bigint> = ax.$.bigint,
  atOptions?: Partial<AxiomSerDe<bigint>>,
): AxiomSerDe<bigint> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: false,
    ...atOptions,
  };
}

export function bigintOptional(
  axiom: ax.Axiom<bigint | undefined> = ax.$.bigint.optional(),
  atOptions?: Partial<AxiomSerDe<bigint>>,
): AxiomSerDe<bigint | undefined> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: true,
    ...atOptions,
  };
}

export function object<TPropAxioms extends Record<string, ax.Axiom<Any>>>(
  axiom: TPropAxioms,
  atOptions?: Partial<AxiomSerDe<string>>,
) {
  return {
    ...ax.$.object(axiom),
    fromText: (text: string) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function objectOptional<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
>(axiom: TPropAxioms) {
  return {
    ...ax.$.object(axiom).optional(),
    fromText: (text: string) => JSON.parse(text),
    isOptional: true,
  };
}

export function jsonText(
  axiom: ax.Axiom<string> = ax.$.string,
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function jsonTextOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export interface AxiomsSerDeSupplier<TsValueType = Any> {
  readonly serDeAxioms: IdentifiableAxiomSerDe<TsValueType>[];
}

export type SerDeAxiomDefns<TPropAxioms extends Record<string, ax.Axiom<Any>>> =
  {
    [Property in keyof TPropAxioms]: IdentifiableAxiomSerDe<
      TPropAxioms[Property] extends ax.Axiom<infer T> ? T : never
    >;
  };

export function isAxiomsSerDeSupplier<TsValueType>(
  o: unknown,
): o is AxiomsSerDeSupplier<TsValueType> {
  const isSDS = safety.typeGuard<AxiomsSerDeSupplier<TsValueType>>(
    "serDeAxioms",
  );
  return isSDS(o);
}

export function axiomSerDeObject<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
>(
  props: TPropAxioms,
  sdaOptions?: {
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      toggles: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotSerDeAxiom } = sdaOptions ?? {};
  const axiomProps: IdentifiableAxiomSerDe<Any>[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomSerDe<Any>(axiom)) {
      const mutatableIT = axiom as safety.Writeable<
        IdentifiableAxiomSerDe<Any>
      >;
      mutatableIT.identity = name as Any;
      axiomProps.push(mutatableIT);
    } else {
      onPropertyNotSerDeAxiom?.(name, axiom, axiomProps);
    }
  });

  type SerDeRecord = ax.AxiomType<typeof axiom>;

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to AxiomsSerDeSupplier contract
  const result = {
    ...axiom,
    axiomProps,
    /**
     * Construct an empty record filled with default
     * @param initValues Start with values from this optional object
     * @param ctx arbitrary context to pass into AxiomSerDe defaultValue() function
     * @returns an "empty" typed SerDeRecord with defaults filled in
     */
    prepareRecord: <Context>(initValues?: SerDeRecord, ctx?: Context) => {
      const defaults = (initValues ?? {}) as Record<string, Any>;

      for (const a of axiomProps) {
        if (a.defaultValue) {
          if (a.isDefaultable) {
            if (!a.isDefaultable<Context>(defaults[a.identity], ctx)) {
              continue;
            }
          }
          defaults[a.identity] = a.defaultValue(ctx);
        }
      }

      return defaults as SerDeRecord;
    },
    missingValues: (
      values: SerDeRecord,
      ...validate: (keyof SerDeRecord)[]
    ) => {
      const missingProps: IdentifiableAxiomSerDe<Any>[] = [];
      for (const prop of validate) {
        const axiomSD = axiomProps.find((asd) => asd.identity == prop);
        // axiomSD.isDefaultable will be true if value is not set
        if (
          axiomSD &&
          axiomSD.isDefaultable &&
          axiomSD.isDefaultable(values[prop] as Any)
        ) {
          missingProps.push(axiomSD);
        }
      }
      return missingProps;
    },
    fromJsonText: <Context>(
      jsonTextSupplier: string | ((ctx?: Context) => string),
      options?: {
        readonly ctx?: Context;
        readonly initValues?: SerDeRecord | ((ctx?: Context) => SerDeRecord);
      },
    ) => {
      const { ctx, initValues } = options ?? {};
      const jsonText = typeof jsonTextSupplier === "function"
        ? jsonTextSupplier(ctx)
        : jsonTextSupplier;
      const jsonValue = JSON.parse(jsonText) as SerDeRecord;

      const init =
        (typeof initValues === "function" ? initValues(ctx) : initValues) ??
          result.prepareRecord();
      const serDeAxiomRecord = m.safeMerge(
        { ...init },
        jsonValue,
      ) as unknown as SerDeRecord;

      return {
        ...axiom,
        jsonText,
        jsonValue,
        serDeAxiomRecord,
      };
    },
    fromTextRecord: (textRecord: Record<string, unknown>) => {
      for (const a of axiomProps) {
        const value = textRecord[a.identity];
        if (typeof value === "string") {
          textRecord[a.identity] = a.fromText(value, "textRecord");
        }
      }
      return textRecord as unknown as SerDeRecord;
    },
    labeled: function* <Label extends string, TsValueType = Any>(
      include: (
        ap:
          & IdentifiableAxiomSerDe<TsValueType, string>
          & LabeledAxiomSerDe<TsValueType, Label>,
      ) => boolean,
    ) {
      for (const ap of axiomProps) {
        if (isLabeledAxiomSerDe<TsValueType, Label>(ap) && include(ap)) {
          yield ap;
        }
      }
    },
  };
  return result;
}

export function* axiomsSerDeLintIssues<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  sdaOptions?: {
    readonly ctx?: Context;
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      iasd: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) {
  const asdo = axiomSerDeObject(props, sdaOptions);
  for (const ap of asdo.axiomProps) {
    if (isAxiomSerDeLintIssuesSupplier(ap)) {
      for (const li of ap.lintIssues) {
        yield { ap, ...li };
      }
    }
  }
}
