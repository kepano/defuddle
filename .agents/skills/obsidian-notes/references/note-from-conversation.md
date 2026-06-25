# Note from Conversation — Summarize Discussion → Obsidian Note

Use this reference when user says something like "save a note about X", "make a note of this", "summarize our conversation about Y", or wants to capture information discussed in the chat.

## Workflow

1. Read conversation history to extract relevant information about the requested topic
2. Create a Markdown file with proper Obsidian frontmatter
3. Save to default or user-specified location

## Command pattern

No external CLI tool needed — generate the note directly from conversation context.

```bash
# Save the generated note file
New-Item -ItemType File -Path "storage/<Note Title>.md" -Force
```

## Post-processing

1. Write the note to file (content + basic frontmatter)
2. Run the keyword script on the saved file to get word count + 10 tags:
   ```bash
   node .opencode/skills/obsidian-notes/scripts/extract-keywords.js < storage/<filename>.md
   ```
3. Read back the file, inject `wordCount` and `tags` into frontmatter
4. Write final version

## Notes

- Default output folder: `storage/`
- If user provides a title, use it as filename (slugified)
- If no title, derive one from the topic of conversation
- Ask user for confirmation before saving if the content is unclear
