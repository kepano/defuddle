## Summary
Improve code block language detection for scraped markdown output.

## What changed
- Better inference of programming language for fenced code blocks
- More cases now output a language tag instead of an empty fence
- Existing fallback behavior is preserved when the language cannot be determined reliably

## Why
Defuddle already detects code block languages in some cases, but it misses some pages. This change improves the generated Obsidian markdown so syntax highlighting is more accurate and code blocks are easier to read.

## Testing
I tested this on:
- https://github.com/kepano/defuddle
- Other pages I used during manual testing
- A mix of GitHub and non-GitHub pages with code blocks
- Tests:
	- https://kieran.casa/aws-sdk-waiters-ts/
	- https://expressjs.com/en/guide/routing/

## Notes
This branch is `work/better-detect-code-lang`.
