import asyncio
import json
import logging
import subprocess
from typing import Any, Literal

import httpx
import yaml

from .exceptions import DefuddleAPIError, DefuddleLocalError, ParseError
from .models import DefuddleResponse

logger = logging.getLogger(__name__)


class DefuddleClient:
    """
    A Python SDK client for parsing web content using Defuddle.
    Supports a 'local' backend using npx, or an 'api' backend using an HTTP endpoint.
    """

    def __init__(
        self,
        backend: Literal["local", "api"] = "local",
        api_url: str = "https://defuddle.md",
        timeout: float = 30.0,
    ) -> None:
        if backend not in ("local", "api"):
            raise ValueError(f"Invalid backend: {backend}. Must be 'local' or 'api'.")
        self.backend = backend
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout

    def parse(self, target_url: str, **kwargs: Any) -> DefuddleResponse:
        """Synchronously parse a URL using the configured backend."""
        if self.backend == "local":
            return self._parse_local_sync(target_url, **kwargs)
        else:
            return self._parse_api_sync(target_url, **kwargs)

    async def parse_async(self, target_url: str, **kwargs: Any) -> DefuddleResponse:
        """Asynchronously parse a URL using the configured backend."""
        if self.backend == "local":
            return await self._parse_local_async(target_url, **kwargs)
        else:
            return await self._parse_api_async(target_url, **kwargs)

    def _parse_local_sync(self, target_url: str, **kwargs: Any) -> DefuddleResponse:
        cmd = self._build_local_cmd(target_url, **kwargs)
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, check=True, timeout=self.timeout
            )
        except subprocess.TimeoutExpired as e:
            raise DefuddleLocalError(f"Command timed out after {self.timeout}s: {e}")
        except subprocess.CalledProcessError as e:
            raise DefuddleLocalError(f"CLI error (exit {e.returncode}): {e.stderr}")
        except FileNotFoundError:
            raise DefuddleLocalError(
                "Command 'npx' not found. Please ensure Node.js is installed to use the local backend."
            )

        return self._parse_json_stdout(result.stdout)

    async def _parse_local_async(
        self, target_url: str, **kwargs: Any
    ) -> DefuddleResponse:
        cmd = self._build_local_cmd(target_url, **kwargs)
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(), timeout=self.timeout
            )

            if process.returncode != 0:
                raise DefuddleLocalError(
                    f"CLI error (exit {process.returncode}): {stderr_bytes.decode()}"
                )

        except asyncio.TimeoutError:
            raise DefuddleLocalError(f"Command timed out after {self.timeout}s.")
        except FileNotFoundError:
            raise DefuddleLocalError(
                "Command 'npx' not found. Please ensure Node.js is installed."
            )

        return self._parse_json_stdout(stdout_bytes.decode())

    def _build_local_cmd(self, target_url: str, **kwargs: Any) -> list[str]:
        cmd = ["npx", "-y", "defuddle", "parse", target_url, "--json"]
        if kwargs.get("markdown"):
            cmd.append("--markdown")
        if kwargs.get("debug"):
            cmd.append("--debug")
        # Handle other kwargs as potential flags if necessary
        return cmd

    def _parse_api_sync(self, target_url: str, **kwargs: Any) -> DefuddleResponse:
        endpoint = f"{self.api_url}/{target_url}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(endpoint)
                response.raise_for_status()
                return self._parse_markdown_frontmatter(response.text)
        except httpx.HTTPError as e:
            raise DefuddleAPIError(f"API request failed: {e}")

    async def _parse_api_async(
        self, target_url: str, **kwargs: Any
    ) -> DefuddleResponse:
        endpoint = f"{self.api_url}/{target_url}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(endpoint)
                response.raise_for_status()
                return self._parse_markdown_frontmatter(response.text)
        except httpx.HTTPError as e:
            raise DefuddleAPIError(f"API request failed: {e}")

    def _parse_json_stdout(self, stdout: str) -> DefuddleResponse:
        try:
            # Defuddle might output Node.js warnings before the JSON object
            start_idx = stdout.find("{")
            if start_idx == -1:
                raise ParseError("No JSON object found in stdout")
            data = json.loads(stdout[start_idx:])
            return DefuddleResponse(**data)
        except Exception as e:
            raise ParseError(
                f"Failed to parse CLI output: {e}\nOutput was: {stdout[:200]}..."
            )

    def _parse_markdown_frontmatter(self, text: str) -> DefuddleResponse:
        """Parses output from defuddle.md which contains YAML frontmatter and a markdown body."""
        try:
            if not text.startswith("---"):
                return DefuddleResponse(content=text)

            parts = text.split("---", 2)
            if len(parts) >= 3:
                frontmatter_text = parts[1]
                content = parts[2].strip()
                metadata = yaml.safe_load(frontmatter_text) or {}

                # Defuddle.md returns values like: word_count, site, title, language
                return DefuddleResponse(content=content, **metadata)
            else:
                return DefuddleResponse(content=text)
        except Exception as e:
            raise ParseError(f"Failed to parse API output: {e}")
