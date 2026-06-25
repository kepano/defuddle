---
name: defuddle
description: >
  Defuddle — extract main content from web pages as clean HTML or Markdown via NPX.
  Use when user says "test defuddle", "test this url", "defuddle for this url",
  or wants to extract/clean web page content.
---

# Defuddle Skill

Extract main content from any URL or HTML file using [Defuddle](https://github.com/kepano/defuddle) via `npx`. Strips clutter (sidebars, footers, comments) and returns clean HTML or Markdown with metadata.

## Quick Start

### Default test command

```bash
npx defuddle parse <url> -f -m -o storage/Deffudle-<name>.md
```

- `-f` — Prepend YAML frontmatter (title, author, source, etc.)
- `-m` — Convert content to Markdown
- `-o <file>` — Write output to file

### Basic patterns

```bash
# Parse a URL → stdout
npx defuddle parse https://example.com/article

# Parse URL → Markdown with frontmatter → file
npx defuddle parse https://example.com/page -f -m -o output.md

# Parse local HTML file
npx defuddle parse page.html

# Parse from stdin
cat page.html | npx defuddle parse

# JSON output (metadata + content)
npx defuddle parse https://example.com/page -j

# Extract single property
npx defuddle parse https://example.com/page -p title

# Debug mode
npx defuddle parse https://example.com/page --debug

# Custom User-Agent (bypass 403 errors)
npx defuddle parse https://example.com/page -u "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

## Options (aliases only)

| Alias | Description |
|-------|-------------|
| `-o <file>` | Write output to file |
| `-m` | Convert to Markdown |
| `-j` | JSON output with metadata |
| `-f` | Prepend YAML frontmatter |
| `-p <name>` | Extract single property (title, description, domain, etc.) |
| `--debug` | Enable debug logging |
| `-l <code>` | Preferred language (BCP 47: `en`, `fr`, `ja`) |
| `-u <string>` | Custom User-Agent header |

## Response properties

| Property | Type | Description |
|----------|------|-------------|
| title | string | Article title |
| author | string | Author name |
| content | string | Cleaned HTML or Markdown |
| description | string | Page description/summary |
| domain | string | Website domain |
| published | string | Publication date |
| wordCount | number | Word count |
| image | string | Main image URL |

## Usage examples

### 1. Extract article to Markdown with frontmatter

```bash
npx defuddle parse https://crawlee.dev/js/docs/examples/crawl-all-links -f -m -o storage/Deffudle-crawlee-links.md
```

### 2. Quick glance at metadata

```bash
npx defuddle parse https://example.com/article -j
```

### 3. Get just the title

```bash
npx defuddle parse https://example.com/article -p title
```

### 4. Handle stubborn sites (403 errors)

```bash
npx defuddle parse https://example.com/article -u "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

### 5. Specify language for i18n content

```bash
npx defuddle parse https://example.jp/article -l ja -m -o article.md
```
