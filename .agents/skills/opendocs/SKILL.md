---
name: opendocs
description: Automated web crawling and documentation generation for the GC-DOC-CRAWLER-CLI project. Maps URLs, extracts content, and generates markdown documentation. Use when crawling websites to create documentation, mapping site structures, or downloading web content as markdown files. Triggers on commands related to web scraping, documentation generation, URL mapping, or content extraction from websites.
---

# Opendocs

## Overview

Automated command-line web crawler that maps website structures and optionally downloads content as markdown files. Generates a `map.md` file tracking all crawled URLs.

## Quick Start

### Basic Usage

```bash
# Map URLs only (no content download)
bun start
bun start <URL>
bun start <URL> <number>

# Map URLs + download content
bun start <URL> <number> --download
```

### Parameters

- `<URL>`: Starting URL to crawl (default: from config.ts)
- `<number>`: Maximum pages to crawl (default: 1)
- `--download`: Flag to enable content download and markdown generation

## Configuration

### Default Settings (config.ts)

```typescript
export const config = {
    options: {
        startUrl: 'https://example.com',
        number: 1,
        downloadContent: false,  // Default: false
    }
};
```

### Key Behaviors

1. **downloadContent: false** (default)
   - Crawls and enqueues URLs
   - Generates `map.md` with URL structure
   - Skips content extraction and markdown file generation

2. **downloadContent: true** (via `--download` flag)
   - Full crawl with content extraction
   - Generates markdown files for each page
   - Updates `map.md` with file paths

## Architecture

### Core Files

- **config.ts**: Default configuration options
- **main.ts**: CLI entry point, argument parsing, crawler initialization
- **routes.ts**: Playwright router for multi-page crawling
- **single-page-scraper.ts**: Handler for single-page extraction
- **storage-map.ts**: URL-to-file mapping and map.md generation

### File Structure

```
storage/
└── <domain>/
    ├── map.md                    # Always generated
    ├── page-1.md                 # Only with --download
    ├── page-2.md                 # Only with --download
    └── ...
```

## Usage Patterns

### Pattern 1: Quick Site Mapping

Map website structure without downloading content:

```bash
bun start https://docs.example.com 50
```

Output: `map.md` with 50 URLs, no content files.

### Pattern 2: Full Documentation Crawl

Map and download all content:

```bash
bun start https://docs.example.com 50 --download
```

Output: `map.md` + 50 markdown files in `storage/<domain>/`.

### Pattern 3: Single Page Extraction

Crawl a single page (number <= 1):

```bash
bun start https://example.com/page --download
```

Uses `single-page-scraper.ts` for detailed extraction.

## CLI Arguments

Parsed in `main.ts`:

1. **URL detection**: Valid URL strings override `startUrl`
2. **Number detection**: Numeric strings set page limit
3. **--download flag**: Overrides `downloadContent` to `true`

Example parsing:
```
bun start https://api.docs.com 25 --download
→ startUrl = 'https://api.docs.com'
→ number = 25
→ downloadContent = true
```

## Storage and Output

### map.md Format

Always generated at crawl completion with the format:

```markdown
# Documentation Map - <domain>-docs

Generated: 2024-01-15T10:30:00.000Z
Total pages: 3

---

- [Quick Start](https://docs.example.com/quick-start): Getting started guide and overview
  `storage/example-docs/quick-start.md`

- [API Reference](https://docs.example.com/api): Complete API documentation
  `storage/example-docs/api-reference.md`

- [Configuration](https://docs.example.com/config): Configuration options and settings
```

**Format rules:**
- `- [Title](URL): description` for each page
- File path shown below entry only when `downloadContent: true`
- Description from meta description or readability excerpt (max 220 chars)
- Title from readability title, page title, or URL fallback

### Markdown Files

Generated per page when `downloadContent: true`:
- Frontmatter with title, source URL, description
- Converted HTML to markdown content
- Readability-optimized text extraction

## Error Handling

- Crawler errors logged to console
- Individual page failures don't stop crawl
- Fallback extraction methods for complex pages
- Duplicate URL detection prevents overwrites