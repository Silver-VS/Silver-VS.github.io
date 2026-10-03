# Silver's Workbench

A static public engineering workspace. Design direction: Claude Design's **2A Blueprint Console**, using the **3A full screen set** for collection and detail pages.

## 1. Local development

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run build
npm test
npm run preview
```

Open http://127.0.0.1:4321/. The preview server binds only to the local machine. `PORT` may override the default port.

## 2. Architecture

The repository already publishes GitHub Pages from `main` and the repository root. This implementation keeps that arrangement. Generated HTML is committed with the source; the build does not run in the browser. There is no backend, deployment Action, or recurring service.

| Source | Purpose |
| --- | --- |
| `src/content/nodes.json` | Typed catalog, stable IDs, fields, technologies, dates, relationships |
| `src/content/{work,notebook,lab}/*.md` | Article bodies |
| `src/build/model.mjs` | Catalog validation and protected-file checks |
| `src/build/build.mjs` | Shared layouts and static page generation |
| `src/workbench.css` | Responsive Blueprint Console design system |
| `src/workbench.js` | Search, filters, navigation, reading aids |
| `src/search-index.json` | Generated searchable catalog and article text |
| `src/build/generated.json` | Inventory of generated pages |

A small Node.js build plus Marked supplies the needed Markdown and static templates with one dependency. Astro is not required for this initial catalog. A future migration should preserve the content semantics and protected deployment namespace.

## 3. Authoring

See `/notebook/publishing-a-node/` or its source in `src/content/notebook/publishing-a-node.md`. Edit Markdown and catalog metadata, then build. Never edit generated pages directly.

IDs use `P-`, `N-`, `G-`, `W-`, and `X-` prefixes. Relationships reference IDs rather than slugs. Work and Lab states use controlled vocabularies. `promoted` Lab entries need a `promoted-to` relationship pointing to Work. Fields and technologies are separate.

The build validates the entire catalog before generating pages. It does not delete old generated routes. When changing a slug or removing an entry, review the previous inventory and deliberately preserve old URLs through redirects or remove the obsolete generated page after checking inbound links.

Markdown bodies are trusted repository-authored content; raw HTML is supported. Do not ingest unreviewed external Markdown as executable page content. Google Fonts is the only external UI resource and has local font fallbacks.

## 4. Interactions

Search opens with Ctrl+K, Cmd+K, `/`, or the search control. Arrow keys move through results, Enter opens a result, and Escape closes the palette. Tab works with native links and controls. Search covers article text, IDs, fields, and technologies; `field:software` and `tech:java` can be combined.

Collection filters compose state/type, field, and year. Work records expand with native `details`; list and grid views share the same records. Articles provide heading links, generated contents, incoming/outgoing relationships, copyable code, and reading progress. Mobile navigation uses a native modal dialog; narrow article layouts use disclosures. Reduced motion disables smooth scrolling and transitions.

Content and normal navigation remain usable without JavaScript. Filters and text search need JavaScript and have explicit fallbacks.

## 5. Content and deployment boundaries

The catalog is based on the public Silver-VS repository inventory: source-backed Work case files, original technical readings in Notebook, and explicitly unfinished questions in Lab. `/repositories/` records every reviewed public repository, including placeholders and material that does not warrant a case file. Private repositories are excluded. Collaborative work is credited, and shared class notes are linked without republishing them as sole-authored material.

Project status describes the artifact documented by the catalog, not whether GitHub has administratively archived a repository. A prototype does not imply a recently verified build. Each technical case identifies its upstream evidence and distinguishes source inspection from executed tests or measurements. Personal hardware details remain uncataloged.

`AGENTS.md` defines the protected boundaries. `upiita/**` and `googlebd435cdd0b631f3c.html` remain in place, byte-for-byte. The original Google meta verification block is retained in `src/build/verification.html` and included in generated page heads. The checked-in SHA-256 baseline covers the protected files, and both the build and tests verify it.

Publish by reviewing and committing generated pages with source, then merging into `main` through the existing GitHub Pages workflow. No deployment configuration, domain, analytics, or UPIITA navigation integration has been added.

## 6. Validation

`npm test` exercises catalog failures, relationship resolution, combined search/filter behavior, generated links and anchors, protected bytes, and HTTP routes. Browser QA should additionally cover keyboard focus, modal focus restoration, touch targets, responsive widths, reduced motion, code overflow, and JavaScript-disabled navigation.
