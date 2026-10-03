## Problem

Projects, technical notes, and experiments need different kinds of context. A repository can hold implementation files, but it does not by itself explain the question behind a project, the decisions made, or the investigations that led to it.

Silver's Workbench brings those surfaces together without treating every investigation as a finished project.

## Architecture

The site is generated as static HTML. Markdown provides the article body; a JSON catalog provides typed metadata and relationships. The build renders reusable layouts, collection indexes, field views, a chronological archive, and a search index.

| Layer | Responsibility |
| --- | --- |
| Markdown | Technical explanations, code, tables, and figures |
| Node catalog | Stable IDs, slugs, classifications, dates, and relations |
| Static build | Validation and reusable HTML templates |
| Browser enhancements | Filtering, keyboard search, navigation, and reading aids |

The public pages are published from the repository root. The independent UPIITA application stays in its existing namespace.

## Technical decisions

Human IDs remain stable when a title or slug changes. Relationships refer to IDs, and the build resolves those IDs to URLs. Fields describe areas of work; technologies describe implementation tools.

The initial build uses one Markdown dependency and the Node.js standard library. A larger static generator can be introduced if the authoring requirements outgrow this implementation. The rendered content remains available without browser JavaScript.

## Implementation

```js
relations: [
  { target: 'N-001', type: 'documentation' },
  { target: 'G-001', type: 'guide' }
]
```

The build rejects duplicate IDs, conflicting URLs, invalid state labels, missing bodies, and unresolved relationships before writing pages. A separate protection check verifies the existing UPIITA files and Google verification file against a byte-level baseline.

## Current state

This entry describes the initial redesign implementation. It is a prototype, with a deliberately small starting catalog. The projects and investigations shown in the design reference are examples rather than claims about completed work.
