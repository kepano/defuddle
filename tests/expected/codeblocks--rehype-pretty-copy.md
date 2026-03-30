```json
{
  "title": "Weekly Project Review",
  "author": "Jane Smith",
  "site": "Jane Smith",
  "published": ""
}
```

Some intro text here to make the article long enough for defuddle to pick it up as content. This is a test article with enough words to pass the word count threshold. We need to make sure defuddle picks this up properly so we can test the code block behavior with rehype-pretty-copy output.

The rehype-pretty-copy plugin injects a copy button and a style element directly inside the code element. These should be stripped from the extracted content.

```yaml
tags:
  - Projects/Open       # status: Open, Inbox, Hold, Dropped, Done
area: next-act           # life area the project belongs to
review-cycle: 7          # days before the project is considered stale
start-date: 2026-01-15
complete-date:            # set when marked done
```

Each project file uses YAML front matter to track status and review cadence.