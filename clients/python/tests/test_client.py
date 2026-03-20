from unittest.mock import MagicMock, patch

import pytest

from pytest_httpx import HTTPXMock

from defuddle import DefuddleClient


@pytest.fixture
def api_client() -> DefuddleClient:
    return DefuddleClient(backend="api")


@pytest.fixture
def local_client() -> DefuddleClient:
    return DefuddleClient(backend="local")


def test_api_parse_sync(api_client: DefuddleClient, httpx_mock: HTTPXMock) -> None:
    mock_response = """---
title: "Example Domain"
source: "https://example.com"
language: "en"
word_count: 17
---

This domain is for use in documentation examples."""

    httpx_mock.add_response(
        url="https://defuddle.md/https://example.com", text=mock_response
    )

    result = api_client.parse("https://example.com")
    assert result.title == "Example Domain"
    assert result.source == "https://example.com"
    assert result.word_count == 17
    assert result.content == "This domain is for use in documentation examples."


def test_api_parse_sync_with_published_timestamp(
    api_client: DefuddleClient, httpx_mock: HTTPXMock
) -> None:
    mock_response = """---
title: "Timestamped Article"
published: 2025-10-20T00:00:00+00:00
---

Timestamped content"""

    httpx_mock.add_response(
        url="https://defuddle.md/https://timestamped.com", text=mock_response
    )

    result = api_client.parse("https://timestamped.com")
    assert result.title == "Timestamped Article"
    assert result.published == "2025-10-20T00:00:00+00:00"
    assert result.content == "Timestamped content"


@pytest.mark.asyncio
async def test_api_parse_async(api_client: DefuddleClient, httpx_mock: HTTPXMock) -> None:
    mock_response = """---
title: Async Title
---
Async content"""
    httpx_mock.add_response(
        url="https://defuddle.md/https://async.com", text=mock_response
    )

    result = await api_client.parse_async("https://async.com")
    assert result.title == "Async Title"
    assert result.content == "Async content"


@patch("subprocess.run")
def test_local_parse_sync(mock_run: MagicMock, local_client: DefuddleClient) -> None:
    mock_result = MagicMock()
    # Simulate a JSON payload embedded after some debug lines, simulating `npx` output logs
    mock_result.stdout = 'Installing package...\n{"title": "Local Title", "content": "Local Content", "wordCount": 10}'
    mock_run.return_value = mock_result

    result = local_client.parse("https://local.com")
    assert result.title == "Local Title"
    assert result.content == "Local Content"
    assert result.word_count == 10


@patch("subprocess.run")
def test_local_parse_sync_with_cli_metadata(
    mock_run: MagicMock, local_client: DefuddleClient
) -> None:
    mock_result = MagicMock()
    mock_result.stdout = """{
  "title": "Local Title",
  "content": "Local Content",
  "wordCount": 10,
  "metaTags": [{"name": "description", "property": null, "content": "Summary"}],
  "schemaOrgData": []
}"""
    mock_run.return_value = mock_result

    result = local_client.parse("https://local.com")
    assert result.title == "Local Title"
    assert result.content == "Local Content"
    assert result.word_count == 10
    assert result.meta_tags == [
        {"name": "description", "property": None, "content": "Summary"}
    ]
    assert result.schema_org_data == []


@pytest.mark.asyncio
@patch("asyncio.create_subprocess_exec")
async def test_local_parse_async(mock_exec: MagicMock, local_client: DefuddleClient) -> None:
    mock_process = MagicMock()
    mock_process.returncode = 0
    mock_process.communicate = MagicMock(
        return_value=(b'{"title": "Local Async", "content": "async"}', b"")
    )

    # We need communicate to be an awaitable (coroutine)
    async def mock_communicate() -> tuple[bytes, bytes]:
        return b'{"title": "Local Async", "content": "async"}', b""

    mock_process.communicate.side_effect = mock_communicate

    # create_subprocess_exec is also a coroutine
    async def mock_create(*args: str, **kwargs: str) -> MagicMock:
        return mock_process

    mock_exec.side_effect = mock_create

    result = await local_client.parse_async("https://local-async.com")
    assert result.title == "Local Async"
    assert result.content == "async"
