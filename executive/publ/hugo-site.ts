import * as rfGovn from "../../governance/mod.ts";
import * as rfStd from "../../core/std/mod.ts";
import * as fsg from "../../core/originate/file-sys-globs.ts";
import * as publ from "./publication.ts";
import * as g from "../../lib/git/mod.ts";
import * as ds from "../../core/render/html/mod.ts";
import * as md from "../../core/resource/markdown.ts";
import * as tfsg from "../../core/originate/typical-file-sys-globs.ts";
import * as lds from "../../core/design-system/lightning/mod.ts";
import * as cpC from "../../core/content/control-panel.ts";

export interface HugoPageWeightSupplier {
  readonly weight?: number;
}

export interface HugoPageTitleSupplier {
  readonly title?: string;
}

export interface HugoPageProperties
  extends HugoPageWeightSupplier, HugoPageTitleSupplier {
  readonly mainMenuName?: string;
}

export function hugoPageProperties<Resource>(
  resource: Resource,
): HugoPageProperties {
  let weight: number | undefined;
  let title: string | undefined;
  let mainMenuName: string | undefined;
  if (rfStd.isFrontmatterSupplier(resource)) {
    const fmUntyped = resource.frontmatter;
    // deno-lint-ignore no-explicit-any
    const menu = fmUntyped.menu as any;
    weight = fmUntyped.weight || menu?.main?.weight;
    mainMenuName = menu?.main?.name;
    title = fmUntyped.title ? String(fmUntyped.title) : mainMenuName;
  }
  return {
    weight,
    title,
    mainMenuName,
  };
}

/**
 * Hugo-style page weight sorting comparator
 * @param a The left tree node
 * @param b The right tree node
 * @returns 0 if weights are equal, +1 or -1 for sort order
 */
const orderByWeight: (
  a: rfGovn.RouteTreeNode & HugoPageWeightSupplier,
  b: rfGovn.RouteTreeNode & HugoPageWeightSupplier,
) => number = (a, b) => {
  const weightA = a.weight;
  const weightB = b.weight;

  if (weightA && weightB) return weightA - weightB;
  if (weightA && !weightB) return -1;
  if (!weightA && weightB) return 1;
  return 0; // order doesn't matter if no weight
};

export class HugoResourcesTree extends publ.ResourcesTree {
}

export class HugoRoutes extends publ.PublicationRoutes {
  constructor(
    readonly routeFactory: rfGovn.RouteFactory,
    readonly contextBarLevel = 1,
  ) {
    super(routeFactory, new HugoResourcesTree(routeFactory));
  }

  prepareNavigationTree() {
    this.navigationTree.consumeRoute(
      cpC.diagnosticsObsRedirectRoute(this.routeFactory),
    );
    this.resourcesTree.consumeAliases();
    this.navigationTree.consumeTree(
      this.resourcesTree,
      (node) => {
        if (
          lds.isNavigationTreeContextBarNode(node) && node.isContextBarRouteNode
        ) {
          return true;
        }
        if (node.level < this.contextBarLevel) return false;
        return rfStd.isRenderableMediaTypeResource(
            node.route,
            rfStd.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false;
      },
      { order: orderByWeight },
    );
  }
}

export abstract class HugoSite extends publ.TypicalPublication {
  static readonly contextBarLevel = 1;

  constructor(config: publ.Configuration) {
    super(
      config,
      new HugoRoutes(config.fsRouteFactory, HugoSite.contextBarLevel),
    );
  }

  // deno-lint-ignore no-explicit-any
  originators(): rfGovn.ResourcesFactoriesSupplier<any>[] {
    const fsgoWatcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    fsgoWatcher.on("beforeYieldWalkEntry", async (we) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.consumedFileSysWalkPaths.add(we.path);
    });

    // use this file system routes parser to handle special rules and conditions;
    // this will not be used for non-file-system routes (such as control panel)
    const routeParser: rfStd.FileSysRouteParser = (fsp, ca) => {
      const hffsrp = rfStd.humanFriendlyFileSysRouteParser(fsp, ca);
      if (
        !hffsrp.parsedPath.base.endsWith(".md.ts") &&
        !hffsrp.parsedPath.base.match(".md")
      ) {
        return hffsrp;
      }

      const isHugoUnderscoreIndex = hffsrp.parsedPath.name === "_index";
      const routeUnit:
        & rfGovn.RouteUnit
        & publ.PublicationRouteEventsHandler<HugoPageProperties> = {
          ...hffsrp.routeUnit,
          unit: isHugoUnderscoreIndex
            ? ds.indexUnitName
            : hffsrp.routeUnit.unit,
          prepareResourceRoute: (rs) => {
            const hpp = hugoPageProperties(rs);
            const overrideLabel = hpp.title || hpp.mainMenuName;
            // deno-lint-ignore no-explicit-any
            const terminalUntyped = rs.route.terminal as any;
            if (terminalUntyped) {
              // by now the frontmatter route will have been consumed but it's
              // possible that the markdown title or mainMenu is also available
              if (overrideLabel) terminalUntyped.label = overrideLabel;
              terminalUntyped.weight = hpp.weight;
            }
            if (isHugoUnderscoreIndex) {
              // in Hugo, an _index.md controls the parent of the current node so
              // let's mimic that behavior
              const units = rs.route.units;
              if (units && units.length > 1) {
                // deno-lint-ignore no-explicit-any
                const parent = units[units.length - 2] as any;
                parent.label = terminalUntyped.label;
                if (hpp.weight) parent.weight = hpp.weight;
              }
              terminalUntyped.isHugoUnderscoreIndex = true;
            }
            return hpp;
          },
          prepareResourceTreeNode: (_rs, node, hpp) => {
            if (
              node?.level == HugoSite.contextBarLevel && hpp!.mainMenuName
            ) {
              (node as unknown as lds.MutableNavigationTreeContextBarNode)
                .isContextBarRouteNode = true;
            }
            if (isHugoUnderscoreIndex || node?.unit == ds.indexUnitName) {
              (node as unknown as ds.MutableNavigationTreeIndexNode)
                .isIndexNode = true;
            }
          },
        };
      return {
        parsedPath: hffsrp.parsedPath,
        routeUnit,
      };
    };

    const { contentRootPath, fsRouteFactory } = this.config;
    const mdRenderers = this.markdownRenderers();
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs<publ.PublicationState>(
            contentRootPath,
            fsRouteFactory,
            mdRenderers,
            this.state,
            routeParser,
          ),
          {
            humanFriendlyName: "Hugo Markdown Content",
            ownerFileSysPath: contentRootPath,
            lfsPaths: [{
              humanFriendlyName: `Hugo Markdown Content (${contentRootPath})`,
              fileSysPath: contentRootPath,
              globs: [{
                glob: "**/*.md",
                routeParser,
                factory: md.staticMarkdownFileSysResourceFactory(
                  // deno-lint-ignore no-explicit-any
                  rfStd.pipelineUnitsRefinery<any>(
                    rfStd.prepareFrontmatter(rfStd.yamlMarkdownFrontmatterRE),
                    mdRenderers.renderer(),
                  ),
                ),
              }],
              fileSysGitPaths: g.discoverGitWorkTree(contentRootPath),
            }],
            fsRouteFactory,
          },
          tfsg.htmlFileSysGlobs(contentRootPath, fsRouteFactory),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => fsgoWatcher,
        },
      ),
      ...this.controlPanelOriginators(),
    ];
  }
}