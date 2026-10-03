## Three collections

Work describes things built. Notebook preserves things documented. Lab records questions and investigations. Separating them avoids making an unfinished experiment look like a released tool, while keeping the writing connected to the artifact it explains.

Notebook has one URL collection. A note, guide, or writeup differs by intent, not by folder depth or article length.

## Identity and location

Each entry has a human-readable ID and a URL slug. An ID is the identity used by relationships. A slug is the location used by a reader.

| Prefix | Meaning | URL collection |
| --- | --- | --- |
| P | Work artifact | `/work/` |
| N | Note | `/notebook/` |
| G | Reproducible guide | `/notebook/` |
| W | Investigation writeup | `/notebook/` |
| X | Lab investigation | `/lab/` |

Changing a slug requires considering redirects for existing links. It does not require changing relationships that reference the stable ID.

## Fields and technologies

A field expresses the area a reader is exploring, such as software or networking. A technology expresses a specific tool or platform, such as Java or Linux. The catalog stores them separately so that a field can connect work built with different tools.

## Explicit relationships

The relationship between two entries carries meaning. A guide may document a project; an experiment may be promoted into a formal artifact. A generic list of tags cannot capture those distinctions.

```json
{
  "target": "P-001",
  "type": "implementation"
}
```

The build verifies that every target exists. Detail pages show outgoing relationships alongside incoming relationships, so an entry can be discovered from either end of a link.

## Views rather than new entities

Archive aggregates entries chronologically. Fields aggregate them by subject. Search spans the same catalog. None of these views introduces a new kind of content, and their counts are derived from the catalog rather than written into the interface.
