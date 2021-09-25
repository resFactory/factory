import * as govn from "../../../../../governance/mod.ts";
import * as ldsGovn from "../../governance.ts";
import * as icon from "./icon.ts";

export const contextBarPartial: ldsGovn.LightningPartial = (layout) => {
  const cbs = layout.dsArgs.branding.contextBarSubject;
  const subject = typeof cbs === "function"
    ? cbs(layout, layout.dsArgs.assets)
    : cbs;
  let subjectLabel, subjectHref;
  if (typeof subject === "string") {
    subjectLabel = subject;
    subjectHref = layout.dsArgs.navigation.home;
  } else {
    subjectLabel = subject[0];
    subjectHref = subject[1];
  }
  const cbsis = layout.dsArgs.branding.contextBarSubjectImageSrc;
  const subjectImgSrc = typeof cbsis === "function"
    ? cbsis(layout.dsArgs.assets, layout)
    : cbsis;
  let subjectImgSrcText, subjectImgSrcHref;
  if (typeof subjectImgSrc === "string") {
    subjectImgSrcText = subjectImgSrc;
    subjectImgSrcHref = subjectHref;
  } else {
    subjectImgSrcText = subjectImgSrc[0];
    subjectImgSrcHref = subjectImgSrc[1];
  }
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return `
  <!-- Primary Navigation (see https://www.lightningdesignsystem.com/components/global-navigation) -->
  ${layout.dsArgs.navigation.routeTree ? `
  <div class="slds-context-bar">
    <div class="slds-context-bar__primary">
      <div class="slds-context-bar__icon-action">
        <a href="${subjectImgSrcHref}"><img src="${subjectImgSrcText}" alt="" class="site-brand-prime-logo"></a>
      </div>
      <span class="slds-context-bar__label-action slds-context-bar__app-name">
        <span class="slds-truncate" title="${subjectLabel}"><a href="${subjectHref}">${subjectLabel}</a></span>
      </span>
    </div>
    <nav class="slds-context-bar__primary" role="navigation">
      <ul class="slds-grid">
        ${layout.dsArgs.navigation.contextBarItems(layout).map(item => { return `
        <li class="slds-context-bar__item${layout.activeRoute?.inRoute(item) ? ' slds-is-active' : ''}">
          <a href="${layout.dsArgs.navigation.location(item)}" class="slds-context-bar__label-action" ${item.hint ? `title="${item.hint}"` : '' }">
            <span class="slds-truncate"${item.hint ? ` title="${item.hint}"` : '' }>${item.label}</span>
          </a>
        </li>`}).join("\n")}
      </ul>
    </nav>
  </div>` : '<!-- contextBar: No ctx, state, or route tree -->'}`
};

export function routeTreePartial(
  node: govn.RouteTreeNode | undefined,
  layout: ldsGovn.LightningLayout,
  level = 0,
): string {
  // deno-fmt-ignore
  return node ? `<ul role="group">
    ${node.children.map(rtn => {
      const caption = rtn.label;
      // deno-fmt-ignore
      return `<li aria-expanded="true" aria-level="${level}"${(layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath) ? ' aria-selected="true" ' : ''}role="treeitem" tabindex="0">
      <div class="slds-tree__item">
          <button class="slds-button slds-button_icon slds-m-right_x-small slds-hidden" aria-hidden="true" tabindex="-1" title="Expand ${caption}">
              ${icon.renderedButtonIcon(layout, "chevronright")}
              <span class="slds-assistive-text">Expand ${caption}</span>
          </button>
          <span class="slds-tree__item-label" title="${rtn.hint || caption}"><a href="${layout.dsArgs.navigation.location(rtn)}">${caption}<a/></span>
      </div>
      ${rtn.children.length > 0 ? routeTreePartial(rtn, layout, level+1) : '<!-- leaf node -->'}
    </li>`}).join("\n")}
  </ul>` : `<!-- node not provided -->`;
}

export const contentTreePartial: ldsGovn.LightningPartial = (layout) => {
  const contentTree = layout.dsArgs.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<div class="slds-box slds-box_x-small slds-text-align_center slds-m-around_x-small">
    <aside class="content-tree">
    <div class="slds-tree_container">
      <h4 class="slds-tree__group-header" id="treeheading">${contentTree.label}</h4>
      <ul aria-labelledby="treeheading" class="slds-tree" role="tree">
      ${routeTreePartial(contentTree, layout)} 
      <ul>
    </div>
    </aside>
    </div>` : `<!-- no contentTree -->`
};

export const verticalNavigationPartial: ldsGovn.LightningPartial = (layout) => {
  const contentTree = layout.dsArgs.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<nav class="slds-nav-vertical" aria-label="Sub page">
    <div class="slds-nav-vertical__section">
      <h2 id="entity-header" class="slds-nav-vertical__title">${contentTree.label}</h2>
      <ul aria-describedby="entity-header">        
        ${contentTree.children.map(rtn => {
          const isActive = layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath;
          return `<li class="slds-nav-vertical__item ${isActive ? 'slds-is-active' : ''}">
            <a href="${layout.dsArgs.navigation.location(rtn)}" class="slds-nav-vertical__action"${isActive ? ' aria-current="true"' : ''}>${rtn.label}</a>
          </li>`;
        }).join('\n')}
      </ul>
    </div>
  </nav>` : `<!-- no vertical navigation -->`
};

export const verticalNavigationShadedPartial: ldsGovn.LightningPartial = (
  layout,
) => {
  const contentTree = layout.dsArgs.navigation.contentTree(layout);
  // deno-fmt-ignore (because we don't want ${...} wrapped)
  return contentTree ? `<div class="content-tree" style="background-color:#FAFAFB">
    <div class="slds-nav-vertical__section">
      <div>
      <fieldset class="slds-nav-vertical slds-nav-vertical_compact slds-nav-vertical_shade">
        <legend class="slds-nav-vertical__title">${contentTree.label}</legend>               
        ${contentTree.children.map(rtn => {
          const isActive = layout.activeTreeNode && rtn.qualifiedPath == layout.activeTreeNode.qualifiedPath;
          const notification = layout.dsArgs.navigation?.notification(rtn);
          return `<span class="slds-nav-vertical__item">
            <input type="radio" id="unique-id-03-recent" value="unique-id-03-recent" name="unique-id-shade"${isActive ? ' checked=""' : ''} />
            <label class="slds-nav-vertical__action" for="unique-id-03-recent">
              <a href="${layout.dsArgs.navigation.location(rtn)}">
                <span class="slds-nav-vertical_radio-faux">${rtn.label}</span>               
              </a>
              ${notification ? `<span class="slds-badge slds-col_bump-left">
                <span class="slds-assistive-text">:</span>${notification.count}
                ${notification.assistiveText ? `<span class="slds-assistive-text">${notification.assistiveText}</span>` : ''}
              </span>` : '<!-- no notifications -->'}
            </label>
          </span>`;
        }).join('\n')}                
      </fieldset>
      </div>
    </div> 
  </div>` : `<!-- no vertical shaded navigation -->`
};

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const breadcrumbsPartial: ldsGovn.LightningPartial = (layout) => `
${layout?.activeRoute ?
`<!-- Breadcrumbs Navigation (see https://www.lightningdesignsystem.com/components/breadcrumbs/) -->
<nav role="navigation" aria-label="Breadcrumbs">
  <ol class="slds-breadcrumb slds-list_horizontal slds-wrap">
    ${layout?.activeTreeNode?.ancestors.reverse().map(r => {
      return r.qualifiedPath == layout.activeTreeNode?.qualifiedPath ? '' : `<li class="slds-breadcrumb__item"><a href="${layout.dsArgs.navigation.location(r)}">${r.label}</a></li>`
    }).join("\n")} 
  </ol>
</nav>`: '<!-- no breadcrumbs -->'}`

// deno-fmt-ignore (because we don't want ${...} wrapped)
export const breadcrumbsWithoutTerminalPartial: ldsGovn.LightningPartial = (layout) => `
${layout?.activeRoute ?
`<!-- Breadcrumbs Navigation (see https://www.lightningdesignsystem.com/components/breadcrumbs/) -->
<nav role="navigation" aria-label="Breadcrumbs">
  <ol class="slds-breadcrumb slds-list_horizontal slds-wrap">
    ${layout?.activeTreeNode?.ancestors.slice(1).reverse().map(r => {
      return r.qualifiedPath == layout.activeTreeNode?.qualifiedPath ? '' : `<li class="slds-breadcrumb__item"><a href="${layout.dsArgs.navigation.location(r)}">${r.label}</a></li>`
    }).join("\n")} 
  </ol>
</nav>`: '<!-- no breadcrumbs -->'}`