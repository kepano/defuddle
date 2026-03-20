# Defuddle Python SDK

Official Python client for [Defuddle](https://github.com/kepano/defuddle). It extracts readable content from web pages using either the local Defuddle CLI or the hosted `defuddle.md` API.

## Installation

```bash
pip install defuddle
```

## Choose a Backend

- `backend="local"`: default and recommended. Runs `npx -y defuddle parse ... --json` on your machine. Best for repeated parsing and higher-volume usage. Requires Node.js.
- `backend="api"`: calls `https://defuddle.md/<url>`. Good fallback when Node.js is not available.

## Quick Start

```python
from defuddle import DefuddleClient

client = DefuddleClient(backend="local")
article = client.parse("https://example.com")

print(article.title)
print(article.content)
print(article.word_count)
```

Use `backend="api"` if you want the hosted service instead:

```python
client = DefuddleClient(backend="api")
article = client.parse("https://example.com")
```

## Async Usage

```python
import asyncio
from defuddle import DefuddleClient


async def main():
    client = DefuddleClient(backend="local")
    article = await client.parse_async("https://example.com")
    print(article.title)


asyncio.run(main())
```

## Response

`parse()` and `parse_async()` both return `DefuddleResponse`, which includes:

- `content`: extracted article body
- `title`, `author`, `description`, `site`
- `source`, `domain`, `language`, `published`
- `word_count`, `parse_time`
- `meta_tags`, `schema_org_data`, and other backend-specific metadata when available

## Errors

```python
from defuddle import DefuddleAPIError, DefuddleClient, DefuddleLocalError

try:
    article = DefuddleClient(backend="local").parse("https://example.com")
except DefuddleLocalError:
    print("Local CLI execution failed.")
except DefuddleAPIError:
    print("API request failed.")
```
