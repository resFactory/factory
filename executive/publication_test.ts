import { path } from "../deps.ts";
// import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./publication.ts";
import * as fsLink from "../lib/fs/link.ts";

const testPath = path.relative(
  Deno.cwd(),
  path.dirname(import.meta.url).substr("file://".length),
);
const config = new mod.Configuration({
  contentRootPath: path.join(testPath, "../", "docs", "content"),
  persistClientCargo: async (publishDest) => {
    await fsLink.symlinkDirectoryChildren(
      path.join(path.join(testPath, "../", "docs", "client-cargo")),
      path.join(publishDest),
      undefined,
      //fsLink.symlinkDirectoryChildrenConsoleReporters,
    );
  },
  destRootPath: path.join(testPath, "../", "docs", "public"),
  appName: "Publication Test",
  envVarNamesPrefix: "PUBCTL_",
  routeGitRemoteResolver: (route, _branch) => ({
    // TODO: implement properly
    gitObjectPath: route.terminal?.qualifiedPath || "??",
    remoteURL: route.terminal?.qualifiedPath || "??",
    textContent: route.terminal?.qualifiedPath || "??",
  }),
});
const executive = new mod.Executive([new mod.TypicalPublication(config)]);

Deno.test(`Publication discovered proper number of assets ${config.contentRootPath}`, async () => {
  await executive.execute();
  // TODO: help find async leaks in executive.execute()
  // console.dir(Deno.metrics());
  // let count = 0;
  // ta.assertEquals(count, 1);
});

Deno.test(`Publication persist proper number of assets from ${config.contentRootPath} to ${config.destRootPath}`, () => {
  // executive.publication.productsSync();
});
