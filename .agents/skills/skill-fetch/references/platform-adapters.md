# Platform Adapters Reference

## Supported Platforms

skill-fetch works across 6+ AI coding agents. Each platform has different tool names but equivalent capabilities.

## Tool Mapping

### File Operations

| Operation | Claude Code | Cursor | Codex | Gemini CLI | Windsurf | Amp |
|-----------|-------------|--------|-------|------------|----------|-----|
| Read file | `Read` | `read_file` | `read_file` | `ReadFile` | `read_file` | `ReadFile` |
| Write file | `Write` | `write_to_file` | `write_file` | `WriteFile` | `write_to_file` | `WriteFile` |
| Edit file | `Edit` | `replace_in_file` | `patch_file` | `EditFile` | `replace_in_file` | `EditFile` |
| Search files | `Glob` | `list_files` | `glob` | `ListFiles` | `list_files` | `Glob` |
| Search content | `Grep` | `search_files` | `grep` | `SearchFiles` | `search_files` | `Grep` |

### System Operations

| Operation | Claude Code | Cursor | Codex | Gemini CLI | Windsurf | Amp |
|-----------|-------------|--------|-------|------------|----------|-----|
| Run shell | `Bash` | `execute_command` | `shell` | `RunCommand` | `execute_command` | `Shell` |
| Web fetch | `WebFetch` | `fetch` | N/A (use curl) | `WebFetch` | `fetch` | N/A (use curl) |
| Ask user | Plain text | Plain text | Plain text | Plain text | Plain text | Plain text |

### Skill-Specific Operations

| Operation | Claude Code | Other Platforms |
|-----------|-------------|-----------------|
| SkillsMP search | `skillsmp_ai_search` / `skillsmp_search` | N/A — skip to GitHub/curl sources |
| SkillsMP install | `skillsmp_install_skill` | N/A — use GitHub download |
| Activate skill | `Skill("name")` | Auto-available after file write |
| MCP tools | Available if configured | Varies by platform |

## Installation Paths

| Agent | Config Dir | Global Skill Path | Local Skill Path |
|-------|-----------|-------------------|------------------|
| Claude Code | `~/.claude/` | `~/.claude/skills/{name}/` | `.claude/skills/{name}/` |
| Cursor | `~/.cursor/` | `~/.cursor/skills/{name}/` | `.cursor/skills/{name}/` |
| Codex | `~/.codex/` | `~/.codex/skills/{name}/` | `.codex/skills/{name}/` |
| Gemini CLI | `~/.gemini/` | `~/.gemini/skills/{name}/` | `.gemini/skills/{name}/` |
| Windsurf | `~/.windsurf/` | `~/.windsurf/skills/{name}/` | `.windsurf/skills/{name}/` |
| Amp | `~/.amp/` | `~/.amp/skills/{name}/` | `.amp/skills/{name}/` |

## Fallback Strategies

### When SkillsMP is unavailable
- Skip Sources 1-2 entirely
- GitHub (Source 3) becomes the primary search method
- Sources 4-7 (CCPM, ClawSkillHub, skills.sh, prompts.chat) provide supplementary results

### When WebFetch is unavailable
- Use `curl` via shell command as fallback:
  ```bash
  curl -s "https://skills.sh/api/search?q={query}&limit=5"
  curl -s "https://prompts.chat/skills?q={query}"
  ```

### When gh CLI is unavailable
- Use curl to access GitHub API directly:
  ```bash
  curl -s "https://api.github.com/search/repositories?q={query}+claude+skill&sort=stars&per_page=5"
  ```

### When npx is unavailable
- Skip CCPM and ClawSkillHub sources (Sources 4-5)
- These are supplementary and their absence doesn't affect core functionality

## Platform Detection

To detect which agent is running, check:
1. Available tool names (each platform has unique tool naming)
2. Config directory existence (`~/.claude/`, `~/.cursor/`, etc.)
3. Environment variables (e.g., `CLAUDE_CODE`, `CURSOR_SESSION`)

## Cross-Platform Installation Flow

```
1. Search (all platforms)
   ├── SkillsMP (Claude Code only)
   ├── GitHub (all — gh or curl)
   ├── CCPM/ClawSkillHub (npx required)
   └── skills.sh/prompts.chat (WebFetch or curl)

2. Score & Display (all platforms — plain text output)

3. Download (all platforms)
   ├── SkillsMP install (Claude Code only)
   └── GitHub raw download (all — curl or WebFetch)

4. Write files (platform-specific tool names)

5. Verify (platform-specific tool names)

6. Activate
   ├── Claude Code: Skill("name")
   └── Others: auto-available after write
```
