```json
{
  "title": "Fix rendering when malformed elements nest content · Pull Request #42 · test-owner/test-repo",
  "author": "author-one",
  "site": "GitHub - test-owner/test-repo",
  "published": "2026-01-15T10:30:00Z"
}
```

## Summary

This fixes a regression where content was clipped partway through extraction.

The root cause was a malformed `<figure>` in the source HTML.

## Changes

- Skip processing when element contains unexpected content
- Preserve remaining content after extraction
- Add regression fixture and test coverage

## Testing

- `npm test`

---

## Comments

> **reviewer-bot** · 2026-01-15
> 
> Consider removing just the image element instead of the entire anchor, to preserve any text content inside the link.

> **reviewer-bot** · 2026-01-15
> 
> The early return here might skip valid figures that happen to contain extra whitespace nodes. Consider checking for actual block-level content instead.

> **author-one** · 2026-01-15
> 
> Posted a follow-up commit to address the review comments.
> 
> - Preserve linked text when stripping the image
> - Check for block-level content instead of early return