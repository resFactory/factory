import * as ldsGovn from "../../governance.ts";

const mermaid = "mermaid";
const kroki = "kroki";

function diagramScripts(fmProperty: unknown): string {
  const html: string[] = [];
  const specs: unknown[] = Array.isArray(fmProperty)
    ? fmProperty
    : [fmProperty];
  for (const spec of specs) {
    if (typeof spec === "string") {
      switch (spec) {
        case mermaid:
          html.push(
            `<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>\n<script>mermaid.initialize({startOnLoad:true});</script>`,
          );
          break;

        case kroki:
          // TODO: fix /lighting so that it uses baseURL
          html.push(
            `<script type="module" src="/lightning/component/kroki-diagram.js"></script>`,
          );
          break;
      }
    }
  }
  return html.join("\n");
}

/**
 * Place this in the <head> of your layouts to automatically include diagrams
 * generator code when layout.frontmatter.diagrams is true.
 * @param layout the active layout strategy execution instance
 * @returns diagrams scripts for <head> component
 */
// deno-fmt-ignore (because we don't want ${...} wrapped)
export const clientDiagramsContributionsPartial: ldsGovn.LightningPartial = (layout) => 
(layout?.frontmatter?.diagrams ? diagramScripts(layout.frontmatter.diagrams) 
  : '<!-- layout.frontmatter.diagrams is false -->');
