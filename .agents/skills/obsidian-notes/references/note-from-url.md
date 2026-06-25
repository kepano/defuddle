# Note from URL — Scrape Web Page → Obsidian Note

Use this reference when user provides a URL and wants to create an Obsidian note from it.

## Workflow

1. Fetch URL content with `npx defuddle parse <url> -f -m -o <output-path>`
2. The `-f` flag prepends YAML frontmatter (title, author, source, date, domain)
3. The `-m` flag converts to Markdown
4. The `-o` flag writes to file

## Command pattern

```bash
npx defuddle parse <url> -f -m -o storage/<filename>.md
```

## Post-processing

After defuddle creates the file:

1. Run the keyword script to get tags (overwrites defuddle's tags):
   ```bash
   node .opencode/skills/obsidian-notes/scripts/extract-keywords.js < storage/<filename>.md
   ```
2. Read the file and merge/rewrite frontmatter with Obsidian fields:

   ```yaml
   ---
   tags: [web-clip, <domain>, <...tags from script>]
   source: <url>
   date: <YYYY-MM-DD>
   status: processed
   ---
   ```

   Keep `web-clip` and domain as hardcoded tags, then append the 10 tags from the script output.

## Notes

- Default output folder: `storage/`
- Use domain as a tag (e.g., `youtube.com` → tag `youtube`)
- If the URL is a YouTube video, add `video` tag and include the video ID if possible
