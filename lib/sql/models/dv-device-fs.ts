import { fs, path } from "../render/deps.ts";
import * as SQLa from "../render/mod.ts";
import * as dv from "./data-vault.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type PathParts = path.ParsedPath & {
  modifiersList: string[];
  modifiersText: string;
};

/**
 * pathParts splits a file system path into components; it's only novel job
 * is to find multiple extensions like `name.ext1.ext2.tailext` and consider
 * the `.tailext` as the primary extension and `.ext1.ext2` as "modifiers".
 * @param parseablePath
 * @returns path.ParsedPath plus modifiers
 */
export function pathParts(
  parseablePath: string,
) {
  const pp: PathParts = {
    modifiersList: [],
    modifiersText: "" as string,
    ...path.parse(parseablePath),
  };
  if (pp.name.indexOf(".") > 0) {
    let ppn = pp.name;
    let modifier = path.extname(ppn);
    while (modifier && modifier.length > 0) {
      pp.modifiersList.push(modifier);
      pp.modifiersText += modifier;
      ppn = ppn.substring(0, ppn.length - modifier.length);
      modifier = path.extname(ppn);
    }
    pp.name = ppn;
  }
  return pp;
}

export function deviceFileSysModels<Context extends SQLa.SqlEmitContext>() {
  const stso = SQLa.typicalSqlTextSupplierOptions<Context>();
  const dvg = dv.dataVaultGovn<Context>(stso);
  const { text, textNullable } = dvg.domains;
  const { digestPkMember: pkDigest } = dvg;

  const deviceHub = dvg.hubTable("device", {
    hub_device_id: dvg.digestPrimaryKey(),
    host: { ...pkDigest(text()), isUnique: true },
    host_ipv4_address: { ...pkDigest(text()), isUnique: true },
  });

  const fileHub = dvg.hubTable("file", {
    hub_file_id: dvg.digestPrimaryKey(),
    abs_path: { ...pkDigest(text()), isUnique: true },
  });

  const filePathPartsSat = fileHub.satTable("path_parts", {
    hub_file_id: fileHub.foreignKeyRef.hub_file_id(),
    sat_file_path_parts_id: dvg.ulidPrimaryKey(),
    file_abs_path_and_file_name_extn: text(),
    file_grandparent_path: text(),
    file_root: textNullable(), // TODO: add example/doc/remark that e.g. `C:\` on Windows, `/` on Linux/MacOS
    file_parent_path: text(),
    file_name_without_extn: text(),
    file_name_with_extn: text(),
    file_extn_tail: textNullable(),
    file_extn_modifiers: textNullable(),
    file_extn_full: textNullable(),
    // TODO: add mtime, ctime, size, etc. `stat`?
  }); // TODO: add unique constraints from fs.ts

  const fsWalkHub = dvg.hubTable("fs_walk", {
    hub_fs_walk_id: dvg.digestPrimaryKey(),
    root_path: pkDigest(text()),
    glob: pkDigest(text()),
  });

  const fsWalkPathPartsSat = fsWalkHub.satTable("path_parts", {
    hub_fs_walk_id: fsWalkHub.foreignKeyRef.hub_fs_walk_id(),
    sat_fs_walk_path_parts_id: dvg.ulidPrimaryKey(),
    file_abs_path_and_file_name_extn: text(),
    file_rel_path_and_file_name_extn: text(), // rel is relative to fs_walk.root_path
    file_grandparent_rel_path: text(), // rel is relative to fs_walk.root_path
    file_parent_rel_path: text(), // rel is relative to fs_walk.root_path
    file_name_without_extn: text(),
    file_name_with_extn: text(),
    file_extn_tail: textNullable(),
    file_extn_modifiers: textNullable(),
    file_extn_full: textNullable(),
    // TODO: add mtime, ctime, size, etc. `stat`?
  }); // TODO: add unique constraints from fs.ts

  const deviceFileLink = dvg.linkTable("device_file", {
    link_device_file_id: dvg.digestPrimaryKey(),
    hub_device_id: pkDigest(deviceHub.foreignKeyRef.hub_device_id()),
    hub_file_id: pkDigest(fileHub.foreignKeyRef.hub_file_id()),
  });

  const deviceFsWalkFileLink = dvg.linkTable("device_fs_walk_file", {
    link_device_fs_walk_file_id: dvg.digestPrimaryKey(),
    hub_device_id: pkDigest(deviceHub.foreignKeyRef.hub_device_id()),
    hub_fs_walk_id: pkDigest(fsWalkHub.foreignKeyRef.hub_fs_walk_id()),
    hub_file_id: pkDigest(fileHub.foreignKeyRef.hub_file_id()),
  });

  // deno-fmt-ignore
  const seedDDL = SQLa.SQL<Context>(stso)`
    -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.

    ${dvg.sqlTextLintSummary}

    ${deviceHub}

    ${fileHub}

    ${filePathPartsSat}

    ${fsWalkHub}

    ${fsWalkPathPartsSat}

    ${deviceFileLink}

    ${deviceFsWalkFileLink}

    ${dvg.sqlTmplEngineLintSummary}
    ${dvg.sqlTextLintSummary}`;

  return {
    stso,
    dvg,
    deviceHub,
    fileHub,
    filePathPartsSat,
    fsWalkHub,
    fsWalkPathPartsSat,
    deviceFileLink,
    deviceFsWalkFileLink,
    seedDDL,
    isValid: () => {
      const stls = seedDDL.stsOptions.sqlTextLintState;
      if (stls?.lintedSqlText.lintIssues.find((li) => stls.isFatalIssue(li))) {
        return 100;
      }
      if (
        stls?.lintedSqlTmplEngine.lintIssues.find((li) => stls.isFatalIssue(li))
      ) {
        return 101;
      }
      return true;
    },
  };
}

export interface WalkGlob {
  readonly rootPath: string;
  readonly label: string;
  readonly glob: string;
  readonly include: (we: fs.WalkEntry) => boolean;
  readonly options?: (path: string) => fs.ExpandGlobOptions;
}

export function walkGlobbedFilesExcludeGit(
  rootPath: string,
  glob = "**/*",
  inherit?: Partial<Omit<WalkGlob, "rootPath" | "glob">>,
): WalkGlob {
  return {
    rootPath,
    glob,
    label: inherit?.label ?? rootPath,
    include: inherit?.include ?? ((we) => we.isFile),
    options: inherit?.options ?? ((path) => ({
      root: path,
      includeDirs: false,
      globstar: true,
      extended: true,
      exclude: [".git"],
    })),
  };
}

export function deviceFileSysContent<Context extends SQLa.SqlEmitContext>() {
  const fsm = deviceFileSysModels<Context>();
  const {
    deviceHub,
    fileHub,
    filePathPartsSat,
    fsWalkHub,
    fsWalkPathPartsSat,
    deviceFileLink,
    deviceFsWalkFileLink,
  } = fsm;

  return {
    models: fsm,
    entriesDML: async (ctx: Context, ...globs: WalkGlob[]) => {
      const uniqueDML = new Set<string>();
      const memoizeSQL = <STS extends SQLa.SqlTextSupplier<Context>>(
        sts: STS,
      ) => {
        uniqueDML.add(sts.SQL(ctx));
        return sts;
      };

      const activeHost = memoizeSQL(
        await deviceHub.insertDML({
          host: Deno.hostname(),
          host_ipv4_address: Deno.hostname(), // TODO: add IPv4 address
        }),
      );
      const { hub_device_id } = activeHost.returnable(activeHost.insertable);

      for (const srcGlob of globs) {
        for await (
          const we of fs.expandGlob(
            srcGlob.glob,
            srcGlob.options?.(srcGlob.rootPath),
          )
        ) {
          const activeWalkerRootPath = path.resolve(srcGlob.rootPath);
          const activeWalker = memoizeSQL(
            await fsWalkHub.insertDML({
              root_path: activeWalkerRootPath,
              glob: srcGlob.glob,
            }),
          );
          const { hub_fs_walk_id } = activeWalker.returnable(
            activeWalker.insertable,
          );

          const dfDML = memoizeSQL(
            await fileHub.insertDML({ abs_path: we.path }),
          );
          const { hub_file_id } = dfDML.returnable(dfDML.insertable);
          const absPP = pathParts(we.path);
          memoizeSQL(
            await filePathPartsSat.insertDML({
              hub_file_id,
              file_abs_path_and_file_name_extn: we.path,
              file_parent_path: absPP.dir,
              file_grandparent_path: path.dirname(absPP.dir),
              file_name_with_extn: absPP.base,
              file_name_without_extn: absPP.name,
              file_root: absPP.root, // e.g. C:\ on Windows, / on Linux/MacOS
              file_extn_tail: absPP.ext.length > 0 ? absPP.ext : undefined,
              file_extn_modifiers: absPP.modifiersList.length > 0
                ? absPP.modifiersText
                : undefined,
              file_extn_full: absPP.ext.length > 0
                ? absPP.modifiersText + absPP.ext
                : undefined,
            }),
          );

          const weRelPath = path.relative(activeWalkerRootPath, we.path);
          const relPP = pathParts(weRelPath);
          memoizeSQL(
            await fsWalkPathPartsSat.insertDML({
              hub_fs_walk_id,
              file_abs_path_and_file_name_extn: we.path,
              file_rel_path_and_file_name_extn: weRelPath,
              file_parent_rel_path: relPP.dir,
              file_grandparent_rel_path: path.dirname(relPP.dir),
              file_name_with_extn: relPP.base,
              file_name_without_extn: relPP.name,
              file_extn_tail: relPP.ext.length > 0 ? relPP.ext : undefined,
              file_extn_modifiers: relPP.modifiersList.length > 0
                ? relPP.modifiersText
                : undefined,
              file_extn_full: relPP.ext.length > 0
                ? relPP.modifiersText + relPP.ext
                : undefined,
            }),
          );

          memoizeSQL(
            await deviceFileLink.insertDML({
              hub_device_id,
              hub_file_id,
            }),
          );
          memoizeSQL(
            await deviceFsWalkFileLink.insertDML({
              hub_device_id,
              hub_fs_walk_id,
              hub_file_id,
            }),
          );
        }
      }
      return uniqueDML;
    },
  };
}

export function deviceFileSysPlantUmlDiagram() {
  const ctx = SQLa.typicalSqlEmitContext();
  type Context = typeof ctx;

  const fsc = deviceFileSysContent<Context>();
  console.log(fsc.models.dvg.plantUmlIE(
    ctx,
    "main",
    Object.values(fsc.models).filter((m) =>
      SQLa.isTableDefinition(m) && SQLa.isSqlDomainsSupplier(m)
    ) as Any,
  ));
}

export async function deviceFileSysSQL(rootPath: string, ...globs: string[]) {
  const ctx = SQLa.typicalSqlEmitContext();
  type Context = typeof ctx;
  if (globs.length == 0) globs = ["**/*"];

  const fsc = deviceFileSysContent<Context>();
  console.log(fsc.models.seedDDL.SQL(ctx));

  const validity = fsc.models.isValid();
  if (typeof validity === "number") {
    console.error("FATAL errors in SQL (see lint messages in emitted SQL)");
    Deno.exit(validity);
  }

  const entries = await fsc.entriesDML(
    ctx,
    ...globs.map((glob) => walkGlobbedFilesExcludeGit(rootPath, glob)),
  );
  entries.forEach((sql) => console.log(sql, ";"));
}

if (import.meta.main) {
  // - If we're being called as a CLI, we emit text to STDOUT.
  // - `deno run -A --unstable ./dv-device-fs.ts (walk|er-diagram-puml) rootPath ...globs`
  //
  // - Examples assuming we're running from resFactory/factory root:
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts walk
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts walk /tmp/X
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts walk /tmp/X "**/*.ts"
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts er-diagram-puml
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts er-diagram-puml > diagram.puml
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts er-diagram-puml | java -jar plantuml.jar -pipe -ttxt > diagram.txt
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts er-diagram-puml | java -jar plantuml.jar -pipe -tsvg > diagram.svg
  //   $ deno run -A --unstable lib/sql/models/dv-device-fs.ts er-diagram-puml | java -jar plantuml.jar -pipe > diagram.png
  //
  // - You can also create a SQLite database using the output:
  //   $ (deno run -A --unstable lib/sql/models/dv-device-fs.ts ; echo "\n.dump\n") | sqlite3 ":memory:" > lib/sql/models/dv-device-fs.dump.sql
  //   $ (deno run -A --unstable lib/sql/models/dv-device-fs.ts ; echo "\n.dump\n") | sqlite3 ":memory:" | sqlite3 lib/sql/models/dv-device-fs.db
  // - sending into SQLite memory first and then dumping afterwards is much faster
  //   because we're using static SQL with lookups for foreign keys.
  // - A good way to "test" is to use this CLI from $RF_HOME:
  //   $ sudo apt-get -y -qq install sqlite3
  //   $ rm -f lib/sql/models/dv-device-fs.db && $ (deno run -A --unstable lib/sql/models/dv-device-fs.ts ; echo "\n.dump\n") | sqlite3 ":memory:" | sqlite3 lib/sql/models/dv-device-fs.db
  //   then, open `dv-device-fs.sql` with VS Code SQL notebook for exploring the content
  //
  // - The same functionality is available through a single TS task in `lib/task/fs-walk-dv.ts`.
  //
  const cmd = Deno.args.length > 0 ? Deno.args[0] : "walk";
  if (cmd === "er-diagram-puml") {
    deviceFileSysPlantUmlDiagram();
  } else {
    const rootPath = Deno.args.length > 1 ? Deno.args[1] : Deno.cwd();
    deviceFileSysSQL(rootPath, ...Deno.args.slice(2));
  }
}
