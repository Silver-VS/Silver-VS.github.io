## Prerequisites

Use Node.js 22 or later. From the website repository, install the locked build dependency:

```sh
npm ci
```

GitHub Pages continues serving the repository root. Building locally creates the HTML that will be committed alongside the source.

## Write the body

Create a Markdown file under `src/content/work/`, `src/content/notebook/`, or `src/content/lab/`. Use level-two headings for article sections. The build derives a table of contents and stable heading anchors from them.

Markdown supports fenced code, inline code, tables, images, lists, and blockquotes. Bodies are trusted repository content and may contain HTML; review them before publishing.

## Add the catalog record

Append a record to `src/content/nodes.json`. Choose an unused ID, a URL-safe slug, the collection, dates, classifications, and the path to the Markdown body relative to `src/content/`.

```json
{
  "id": "N-002",
  "kind": "notebook",
  "entryType": "note",
  "slug": "your-note",
  "title": "Your note",
  "summary": "A concrete description of what this entry explains.",
  "created": "2026-10-02",
  "updated": "2026-10-02",
  "fields": ["software"],
  "technologies": ["Java"],
  "body": "notebook/your-note.md",
  "relations": []
}
```

Work entries require `type` and `status`. Lab entries require `status`, `hypothesis`, `observation`, and `result`. A promoted Lab entry must link to a Work entry with a `promoted-to` relationship.

## Build and check

```sh
npm run build
npm test
npm run preview
```

Open `http://localhost:4321/`. Check the new detail page, related nodes, search results, and field view. Verify the page at a narrow width and navigate it with the keyboard.

## Review the publication

Review the Git diff before committing. It should include the Markdown, catalog change, and generated pages and search index. Do not edit generated HTML directly: the next build replaces it.

The build does not modify `upiita/` or the Google verification file. If a protection check fails, investigate the changed file rather than updating the protection baseline to hide the failure.
