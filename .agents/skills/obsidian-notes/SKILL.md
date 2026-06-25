---
name: obsidian-notes
description: >
  Create Obsidian-compatible Markdown notes from two sources:
  (1) URL scraping — "save a note from this URL", "scrape this page",
  "extract this article to Obsidian", "save this YouTube video as note";
  (2) Conversation notes — "save a note about X", "make a note of this",
  "summarize our conversation about Y", "create an Obsidian note on Z".
  Trigger on any request involving Obsidian note creation, web page
  scraping to Markdown, or saving conversation summaries as notes.
---

# Obsidian Notes Skill

## Overview

Create Obsidian-compatible notes saved as `.md` files. Two modes:

1. **From URL** — scrape a web page via defuddle and save as note
2. **From conversation** — summarize/generate note from chat content

Read the appropriate reference file depending on user input:

- [note-from-url.md](references/note-from-url.md) — User provides a URL and wants a note from it
- [note-from-conversation.md](references/note-from-conversation.md) — User wants a note from conversation/summary

## Tag generation script

Run `extract-keywords.js` on the note content to get word count + 10 tags:

```bash
node .opencode/skills/obsidian-notes/scripts/extract-keywords.js < storage/note.md
# → {"wordCount": 1240, "tags": ["machine-learning", "neural-networks", ...]}
```

The script is standalone (zero deps). Pipes the tags array into frontmatter.

### When to run it

- **URL notes** — run after defuddle creates the file to overwrite defuddle's tags
- **Conversation notes** — run after writing the note content to file

## Default save location

```
storage/<Note-Name>.md
```

Unless the user specifies a custom path.

## Obsidian note structure

Every note must have:

### Frontmatter (YAML)

```yaml
---
title: "Note Title"
created: 2026-06-23
tags: [tag1, tag2]
source: "url or conversation"
status: draft|processed
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Note title (quoted string) |
| `created` | Yes | Date in `YYYY-MM-DD` format |
| `tags` | Yes | Array of tags (lowercase, hyphenated) |
| `source` | Yes | Where content came from (URL or "conversation") |
| `status` | No | `draft` or `processed` |

### Body

- First heading is `# Title` (matches frontmatter title)
- Use ATX headings (`##`, `###`)
- Empty line between sections
- Use `---` for horizontal rules sparingly

### WikiLinks (Obsidian internal links)

Use `[[Note Name]]` to link to other notes.
Use `[[Note Name|Display Text]]` for aliased links.
Use `![[Image.png]]` for embedded images (rare in text notes).

### Tags

Inline tags: `#tag` inside body.
Frontmatter tags array for index/search.

### Callouts / Admonitions

Callout Options: `!NOTE`, `!TIP`, `!WARNING`, `!IMPORTANT`, `!ERROR`, `!CAUTION`, `!INFO`, `!TODO`, `!SUMMARY`, `!QUOTE`, `!EXAMPLE`, `!QUESTION`, `!SUCCESS`, `!FAILURE`, `!DANGER`, `!BUG`, `!FAQ`

```markdown
> [!note] (Title optional)
> Content

> [!warning] (Title optional)
> Content

> [!tip] (Title optional)
> Content
```

## File naming

- Slugify the title: lowercase, hyphens for spaces, no special chars
- Example: "My Awesome Note" → `storage/my-awesome-note.md`
- Keep filenames under 80 chars

## Example note

```markdown
---
title: "Example Note Title"
created: 2026-06-23
tags: [example, reference]
source: "https://example.com/article"
status: processed
---

# Example Note Title

Summary of the note content here.

## Section One

Content with [[Related Note]] and regular text.

> [!note] Key Insight
> Important observation.

## Section Two

More content with #inline-tag usage.
```
