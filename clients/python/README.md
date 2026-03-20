# Defuddle Python SDK

This is the official Python client for [Defuddle](https://github.com/kepano/defuddle), designed to extract the main content from web pages using local Node.js backends or serverless API backends.

## Installation

```bash
pip install defuddle
```

## Quick Start

```python
import asyncio
from defuddle import DefuddleClient

async def main():
    # Use the local backend (requires zero network latency and npx locally)
    client = DefuddleClient(backend="local")
    article = await client.parse_async("https://example.com")
    print(article.title)
    print(article.content)

if __name__ == "__main__":
    asyncio.run(main())
```
