# Search Sources — Detailed Reference

Complete instructions for each of the 9 search sources used by skill-fetch.

## Sources 1-2: SkillsMP (Primary — Claude Code with SkillsMP MCP only)

> **Cross-platform note:** SkillsMP tools (`skillsmp_ai_search`, `skillsmp_search`) are only available when the SkillsMP MCP server is configured. If unavailable, skip to Sources 3-9 which work on all platforms.

**Setup:** Requires a `SKILLSMP_API_KEY` from https://skillsmp.com. Install command:
```bash
claude mcp add --scope user skillsmp -- npx -y skillsmp-mcp-server --env SKILLSMP_API_KEY={key}
```
The key can also be stored in `~/.claude/skills/.fetch-config.json` for reference.

### Source 1: `skillsmp_ai_search` (semantic search)

AI understands intent, but results are non-deterministic.
**Must use 2-3 query variants in parallel**, merge and deduplicate, to compensate for single-search randomness:
- Variant A: Original query (e.g., `testing React Native mobile app`)
- Variant B: Reorder keywords or use synonyms (e.g., `React Native test automation framework`)
- Variant C: Focus on core technology (e.g., `React Native Jest testing library`)

Merging results from 3 calls significantly improves recall.

### Source 2: `skillsmp_search` (keyword search)

Exact match, stable results, sorted by stars. Serves as a stable baseline for AI search.

```
skillsmp_search(query)
```

## Source 3: GitHub

**Primary (search for SKILL.md files containing the query — highest precision):**
```bash
gh search code "{query}" --filename SKILL.md --json path,repository --limit 5
```

This finds repos that actually contain agent skills matching the query. Much higher hit rate than repo search for niche topics.

**Supplementary (search repos by topic — broadens coverage):**
```bash
gh search repos "{query}" --json name,description,url,stargazersCount,updatedAt --limit 5 --sort stars
```

> Do NOT append "skill" or "SKILL.md" to the repo query — it makes results too restrictive. Use the raw query only.

Run both commands in parallel. If code search returns collection repos (e.g., awesome-agent-skills), use `gh api` to search their tree for SKILL.md files containing `{query}`.

## Source 4: ClawSkillHub

```bash
npx -y clawhub search "{query}"
```

Returns slug, description. Skip this source if npx fails.

## Source 5: skills.sh

**WebFetch (preferred):**
```
WebFetch("https://skills.sh/api/search?q={query}&limit=5",
         prompt="Extract skill names, sources (owner/repo), install counts, and URLs from the JSON response")
```

Returns JSON `{ skills: [{ name, source, installs, id }] }`. Each result URL is `https://skills.sh/{id}`.
Skip this source if the API returns an error or times out.

**curl fallback** (when WebFetch is unavailable):
```bash
curl -s "https://skills.sh/api/search?q={query}&limit=5"
```

## Source 6: Anthropic Skills (GitHub)

Search the official Anthropic skills repo ([github.com/anthropics/skills](https://github.com/anthropics/skills)). Skip silently if the repo is unavailable or the command fails.

```bash
gh search code "{query}" --repo anthropics/skills --filename SKILL.md --json path,repository --limit 5
```

**Fallback** (if `gh search code` is unavailable):
```bash
gh api repos/anthropics/skills/git/trees/main?recursive=1 --jq '.tree[].path | select(test("SKILL.md$"))'
```
Then filter paths by `{query}` keyword match.

**Response format:** Path list, each corresponding to a skill (e.g., `skills/pdf/SKILL.md`).

## Source 7: PolySkill

> **Note:** PolySkill has no public REST API. Use CLI as the only method.
> ⚠️ **PolySkill only supports single-keyword search.** Multi-word queries (e.g., "react native testing") return 0 results. Extract the **most specific single keyword** from the query (e.g., "testing" or "react"). If the query has multiple distinct topics, fire 2 parallel searches with different keywords.

**CLI (only method):**
```bash
npx -y @polyskill/cli search "{single_keyword}" --limit 5
```

**Keyword extraction examples:**
- "react native testing" → search "testing" (most specific to the task)
- "React Native Expo Jest" → search "react" + search "jest" (2 parallel)
- "mobile app development" → search "mobile"

Returns text output with skill name, description, and security scan status. Skip if CLI fails or returns "No skills found". Timeout: 20s.

## Source 8: SkillHub

> **Note:** SkillHub CLI enters interactive mode after listing results. Prefer REST API via shell script when API key is available.
> ⚠️ **Never use curl directly** — API key would be exposed in the command line. Always use the bundled shell script.

**REST API via bundled script (preferred — requires `SKILLHUB_API_KEY`):**

The script is bundled at `scripts/fetch-skillhub.sh`. Execute from the skill's base directory:
```bash
bash scripts/fetch-skillhub.sh "{query}"
```

**Fallback order** if bundled script is unavailable:
1. Check `~/.claude/skills/.fetch-skillhub.sh` (user-installed copy)
2. Create it with Write tool using the template from `scripts/fetch-skillhub.sh`

Returns JSON with AI quality scoring (grade S/A/B, score/10, 5 dimensions). Skip on 401/403 or if no API key.

**CLI (fallback — no API key needed):**
```bash
npx -y @skill-hub/cli search "{query}" --limit 5
```

⚠️ The CLI enters interactive picker mode after listing results. Set **Bash tool timeout to 10 seconds** (`timeout: 10000`) — results print before the prompt, so the output is fully usable even when the process is killed by timeout.

## Source 9: Skills Directory

> **Note:** Skills Directory REST API requires API key. Supports both `Authorization: Bearer sk_live_xxx` and `x-api-key: sk_live_xxx` headers. Free tier allows 100 requests/day (resets midnight UTC).
> ⚠️ **Never use curl directly** — API key would be exposed in the command line. Always use the bundled shell script.
> ⚠️ WebFetch **does not support** custom auth headers. Do not use WebFetch for Skills Directory.

**REST API via bundled script (requires `SKILLS_DIRECTORY_API_KEY`):**

The script is bundled at `scripts/fetch-skills-directory.sh`. Execute from the skill's base directory:
```bash
bash scripts/fetch-skills-directory.sh "{query}"
```

**Fallback order** if bundled script is unavailable:
1. Check `~/.claude/skills/.fetch-skills-directory.sh` (user-installed copy)
2. Create it with Write tool using the template from `scripts/fetch-skills-directory.sh`

Additional query parameters (append to URL):
- `verified` (boolean): Filter verified skills only
- `securityGrade` (string): Max grade A-F (default: A)
- `minSecurityScore` (integer): Minimum score 0-100
- `sort` (string): `recent` | `votes` | `stars`
- `offset` (integer): Pagination offset

**Semantic search** (Pro/Enterprise only — change URL path to `/api/v1/skills/search`).

**Response format:**
```json
{
  "data": [{ "name": "...", "description": "...", "securityGrade": "A", "securityScore": 95, ... }],
  "pagination": { "page": 1, "limit": 5, "totalCount": 100, "hasNextPage": true },
  "meta": { "requestsRemaining": 99, "tier": "free" }
}
```

Returns JSON with security grade (A-F, 0-100 scale) based on 50+ detection rules across 10 categories.

**No CLI available.** Skip this source entirely if no API key is configured. The source provides security grades as External Bonus signals — when unavailable, other sources still provide adequate coverage.

> ⚠️ 不要用 `&&` 串連命令 — 某些專案的 hooks 會擋住。分成「Write script → Bash 執行」兩步。
> 若 shell script 也被權限擋，則跳過此來源。

## Error Handling & Timeouts

All sources follow unified error handling:
- **HTTP errors** (401/403/429/5xx) → skip source silently
- **Network errors / timeouts** → skip source silently
- **Per-source timeout**: 15 seconds (WebFetch/curl), 20 seconds (npx CLI)
- **No global timeout**: 9 sources fire in parallel; slow sources auto-skip without blocking others
- **All sources fail** → display "All sources unavailable, check network connection"

## Deduplication Rules

After merging all source results, deduplicate:
1. **Same-name skill** appearing in multiple sources → keep the version with highest stars/installs, tag all sources
2. **Same GitHub repo** appearing in multiple registries → merge into one entry, tag as `[SkillsMP + SkillHub]` etc.
3. **Highly similar descriptions but different names** → keep both but mark as potentially duplicate in analysis
4. **Same skill in SkillsMP + SkillHub + Skills Directory** → merge, take highest Trust score, accumulate External Bonus (cap +5)
5. **Anthropic Skills repo skill also in other sources** → use Anthropic version as primary (Trust 15/15)

## Round Strategy (max 5 rounds)

**≥1 result (from any source) → stop and proceed to analysis.** Only continue to next round if all sources return 0 results.

| Round | Strategy | Example |
|-------|----------|---------|
| 1 | Hook-suggested / original search terms | `react native animation` |
| 2 | Synonyms or broader category | `react native ui effects` |
| 3 | Split (core technology name) | `reanimated` |
| 4 | Related alternatives | `motion`, `gesture` |
| 5 | Most generalized category | `react native` |

## Metadata JSON Schema

After installation, record metadata in `~/.claude/skills/.fetch-metadata.json`:

```json
{
  "skill-name": {
    "source": "skillsmp|github|url",
    "query": "<search terms or URL>",
    "scope": "global|local",
    "path": "<actual installation path>",
    "installedAt": "<ISO>",
    "integrity": {
      "algorithm": "sha256",
      "files": {
        "SKILL.md": "<sha256-hash>",
        "references/example.md": "<sha256-hash>",
        "scripts/helper.sh": "<sha256-hash>",
        "assets/diagram.svg": "<sha256-hash>"
      }
    },
    "securityLabel": "Official|Verified|Partial|Unverified|Security Concerns",
    "scanResult": "clean|warnings|concerns"
  }
}
```

**Integrity hash calculation** (cross-platform):
- macOS/Linux: `shasum -a 256 <file> | cut -d' ' -f1`
- Node.js fallback: `node -e "const c=require('crypto');const f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync(process.argv[1])).digest('hex'))" <file>`

**Integrity verification**: On future skill load, compare current hashes against recorded. On mismatch, warn user and offer "yes" or "reinstall".
