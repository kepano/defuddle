# Defuddle Python SDK

This is the official Python client for [Defuddle](https://github.com/kepano/defuddle), designed to extract the main content from web pages using either a local Node.js CLI or a serverless HTTP API.

## Installation

```bash
pip install defuddle
```

## Quick Start

The SDK uses a **Hybrid Backend** strategy. You must explicitly choose your execution context:

```python
import asyncio
from defuddle import DefuddleClient

async def main():
    # 1. LOCAL BACKEND (Default & Recommended)
    # Uses `subprocess` to call `npx defuddle` on your local CPU.
    # Zero network latency, perfect for high-volume scraping.
    local_client = DefuddleClient(backend="local")
    article = await local_client.parse_async("https://example.com")
    
    # 2. API BACKEND (Serverless / Fallback)
    # Uses `httpx` to call https://defuddle.md/
    # Best for lightweight environments where Node.js cannot be installed.
    api_client = DefuddleClient(backend="api")
    article_from_api = await api_client.parse_async("https://example.com")
    
    print(article.title)
    print(article.content)

if __name__ == "__main__":
    asyncio.run(main())
```
