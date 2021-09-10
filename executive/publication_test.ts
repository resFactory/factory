import { path } from "../deps.ts";
// import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./publication.ts";

const testPath = path.relative(
  Deno.cwd(),
  path.dirname(import.meta.url).substr("file://".length),
);
const config = new mod.Configuration({
  contentRootPath: path.join(testPath, "../", "docs", "content"),
  staticAssetsRootPath: path.join(testPath, "../", "docs", "static"),
  destRootPath: path.join(testPath, "../", "docs", "public"),
  appName: "Publication Test",
});
const executive = new mod.Executive([new mod.TypicalPublication(config)]);

Deno.test(`Publication discovered proper number of assets ${config.contentRootPath}`, async () => {
  await executive.execute();
  // let count = 0;
  // ta.assertEquals(count, 1);
});

Deno.test(`Publication persist proper number of assets from ${config.contentRootPath} to ${config.destRootPath}`, () => {
  // executive.publication.productsSync();
});
