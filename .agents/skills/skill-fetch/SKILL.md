---
name: skill-fetch
description: >
  This skill should be used when the user asks to "fetch skill", "install skill",
  "search for a skill", or when a hook outputs "MISSING EXTERNAL SKILL".
  Searches 9 registries (SkillsMP, GitHub, Anthropic Skills, ClawSkillHub, skills.sh,
  PolySkill, SkillHub, Skills Directory) with multi-variant search, quality scoring,
  security labels, pagination, and local/global installation.
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "WebFetch", "shell", "read_file", "write_file", "execute_command", "fetch", "curl"]
---

# Skill Fetch

Search, score, and install agent skills from multiple registries in parallel.

## When to Use

- A skill-eval hook outputs "MISSING EXTERNAL SKILL"
- The current task requires domain expertise not available locally
- The user asks to "fetch skill", "search for a skill", or "install a skill"

## Critical Rules

1. **Never use `skillsmp_get_skill_content` to preview before deciding** — search descriptions are sufficient. Only use as a fallback if installation fails.
2. **Stop on first results, continue only on zero** (max 5 rounds) — any round with ≥1 result proceeds to analysis.
3. **Only the user can decide to skip** — the LLM must never skip installation on its own.
4. **Always use plain-text interaction** — do not use AskUserQuestion. Output analysis and wait for the user to reply with a number or command.
5. **Show up to 5 results per page** — with full analysis (content, pros, cons, repo URL) so the user can make an informed decision.

## Platform Compatibility

This skill works across 6+ AI coding agents (Claude Code, Cursor, Codex, Gemini CLI, Windsurf, Amp). Tool names adapt automatically. See `references/platform-adapters.md` for the full mapping table.

## Procedure

### Step 0: SkillsMP MCP Self-Check (Claude Code only)

Before searching, verify that the SkillsMP MCP server is available:

1. **First, try loading deferred tools**: Run `ToolSearch("skillsmp")` to load any deferred SkillsMP MCP tools. In Claude Code, MCP tools are often deferred (not loaded until requested) and have namespaced names like `mcp__skillsmp__skillsmp_search`. The `ToolSearch` call resolves these.
2. After ToolSearch, check if any `skillsmp_*` or `mcp__skillsmp__*` tool is now available
3. If **available** → proceed to Step 1
4. If **still not available** → run: `claude mcp add --scope user skillsmp -- npx -y skillsmp-mcp-server`
5. Inform the user: "SkillsMP MCP server has been registered. It will be available after restarting the session. Continuing search with the remaining 7 sources for now."
6. Proceed to Step 1 (SkillsMP sources will be skipped this session, but available in future sessions)

> **Tool name note**: SkillsMP tools may appear with MCP namespace prefix: `mcp__skillsmp__skillsmp_search` instead of `skillsmp_search`. Both forms work — use whichever is available.

> **Non-Claude Code agents**: Skip this step. SkillsMP tools are Claude Code-specific.

### Step 0.5: Load API Keys (MANDATORY — execute before Step 2)

Sources 8-9 require API keys. Read the config file to determine availability:

1. **Read `~/.claude/skills/.fetch-config.json` NOW** — do not assume keys are absent without reading the file
2. Expected format:
   ```json
   {
     "SKILLHUB_API_KEY": "sk-sh-...",
     "SKILLS_DIRECTORY_API_KEY": "sk_live_..."
   }
   ```
3. **Record the result** — set two flags for use in Step 2b:
   - `HAS_SKILLHUB_KEY`: true/false
   - `HAS_SKILLS_DIR_KEY`: true/false
4. If config file does not exist → both flags = false, inform user they can create the file
5. If config file exists but a specific key is missing → that flag = false

> **⚠️ COMMON FAILURE MODE: LLM skips reading the config file and assumes "no key". This causes Sources 8-9 to be incorrectly skipped even when keys ARE configured. Always read the file first.**

### Step 1: Determine Search Keywords and Source

**URL mode:** If `$ARGUMENTS` is a URL (starts with `https://github.com/...` or any `https://`), skip directly to Step 3 installation flow.

**Search mode:**
- **Has `$ARGUMENTS`**: Use directly as search terms
- **No search terms** (auto-triggered): Prefer `Suggested search terms` from hook output, otherwise extract 2-3 queries from task context

### Step 2: Parallel Search — ALL 9 Sources (mandatory)

**⚠️ MANDATORY: You MUST fire ALL 9 sources. Do NOT proceed to scoring until all 9 sources have returned or failed.**

**⚠️ COMMON FAILURE MODE: LLM fires sources 1-2 (SkillsMP), gets results, then skips sources 3-9. This is WRONG. SkillsMP results alone are insufficient — GitHub, ClawhHub, skills.sh, and PolySkill contain different skills not indexed by SkillsMP.**

**⚠️ EXECUTION ORDER: You MUST complete BOTH Step 2a AND Step 2b before proceeding to Step 2.5. Step 2a alone is NOT sufficient.**

#### Step 2a: Fire SkillsMP sources (1-2)

| # | Source | Tool Call | Fallback |
|---|--------|-----------|----------|
| 1 | **SkillsMP AI** | `skillsmp_ai_search` × 3 query variants (parallel) | Skip if MCP unavailable |
| 2 | **SkillsMP keyword** | `skillsmp_search(query)` | Skip if MCP unavailable |

#### Step 2b: Fire non-SkillsMP sources (3-9) — DO NOT SKIP

**⚠️ You MUST fire these sources even if Step 2a already returned results. These sources contain skills NOT in SkillsMP.**

| # | Source | Tool Call | Fallback |
|---|--------|-----------|----------|
| 3 | **GitHub repos** | `gh search repos "{query}" --json name,description,url,stargazersCount,updatedAt --limit 5 --sort stars` (do NOT append "skill SKILL.md") | `gh search code "{query}" --filename SKILL.md --limit 5` |
| 4 | **Anthropic Skills** | `gh search code "{query}" --repo anthropics/skills --filename SKILL.md --limit 5` | `gh api` tree fallback |
| 5 | **ClawhHub** | `npx -y clawhub search "{query}"` | Skip on failure |
| 6 | **skills.sh** | `WebFetch("https://skills.sh/api/search?q={query}&limit=5")` | `curl -s` via Bash |
| 7 | **PolySkill** | `npx -y @polyskill/cli search "{single_keyword}" --limit 5` (extract most specific single keyword from query — multi-word queries return 0) | Skip on failure (no REST API) |
| 8 | **SkillHub** | If `HAS_SKILLHUB_KEY` = true (from Step 0.5): `bash {SKILL_BASE_DIR}/scripts/fetch-skillhub.sh "{query}"`. If false: `npx -y @skill-hub/cli search "{query}" --limit 5` (timeout: 10000) | CLI fallback on failure |
| 9 | **Skills Directory** | If `HAS_SKILLS_DIR_KEY` = true (from Step 0.5): `bash {SKILL_BASE_DIR}/scripts/fetch-skills-directory.sh "{query}"`. If false: skip. **Never use curl directly or WebFetch.** | Skip only if key is confirmed absent in Step 0.5 |

> **⚠️ Sources 8-9 REQUIRE Step 0.5 to have been executed.** If Step 0.5 was skipped, go back and read `~/.claude/skills/.fetch-config.json` NOW before marking Sources 8-9 as skipped. `{SKILL_BASE_DIR}` = the base directory of this skill (shown at the top when skill loads).

> See `references/search-sources.md` for detailed parameters, response formats, query variant examples, and curl fallback commands.

**⚠️ POST-SEARCH CHECKLIST (mandatory before proceeding to Step 2.5):**

Before scoring, output this checklist with actual status for EVERY source:
```
Step 0.5 config: HAS_SKILLHUB_KEY={true/false} HAS_SKILLS_DIR_KEY={true/false}
Sources queried: [1] SkillsMP AI ✅ [2] SkillsMP KW ✅ [3] GitHub ✅/❌ [4] Anthropic ✅/❌ [5] ClawhHub ✅/❌ [6] skills.sh ✅/❌ [7] PolySkill ✅/❌ [8] SkillHub ✅/❌ [9] Skills Dir ✅/❌
```

**Validation rules — go back and fix before proceeding:**
- If sources 3-7 are ALL ❌ → re-execute sources 3-7 NOW
- If `HAS_SKILLHUB_KEY=true` but [8] is ❌ → execute `bash {SKILL_BASE_DIR}/scripts/fetch-skillhub.sh` NOW
- If `HAS_SKILLS_DIR_KEY=true` but [9] is ❌ → execute `bash {SKILL_BASE_DIR}/scripts/fetch-skills-directory.sh` NOW
- If Step 0.5 was never executed (no config line above) → read `~/.claude/skills/.fetch-config.json` NOW, then re-evaluate sources 8-9

**After ALL sources return** → deduplicate (see `references/search-sources.md`) → proceed to Step 2.5.

**Round strategy (max 5 rounds):** The "≥1 result → stop" rule applies to **rounds**, not individual sources. Within a single round, ALL 9 sources must be queried. Only if ALL 9 sources return 0 results in a round should you proceed to the next round with broader keywords. If any source returns ≥1 result in a round, proceed to scoring (do NOT start another round).

### Step 2.5: Scoring and Ranking

Calculate a quality score (0-100) for each deduplicated result. See `references/quality-signals.md` for details.

**Scoring formula:** `Total = Relevance(0-40) + Freshness(0-25) + Community(0-20) + Trust(0-15) + External Bonus(0-5)`

**Supplementary lookup:** For the top 5 results, use `gh api repos/{owner}/{repo} --jq '{pushed_at,stargazers_count}'` to get update time and GitHub stars. Skip lookup for high-star (≥50) results with precisely matching descriptions. Maximum 3 `gh api` calls.

**Grade labels:** `🟢 85+` Strongly Recommended | `🟢 70-84` Recommended | `🟡 55-69` Worth Considering | `🟡 40-54` Marginal | `🔴 <40` Not Recommended

### Step 3: Analyze, Select, Install

See `references/installation-guide.md` for the complete installation workflow.

**Quick reference — flow:**
1. **3a.** Display sorted results (5 per page, score + pros/cons)
2. **3b.** Wait for user reply (number to install, `c` for next page, `skip` to end)
3. **3c.** Ask installation location (G=global, L=local) — MANDATORY
4. **3d.** Execute installation (SkillsMP → trust-but-verify, GitHub → **fetch the full bundle**, not just SKILL.md, then pre-install scan every file). Use `scripts/fetch-skill-bundle.sh` for GitHub URLs.
5. **3e.** Post-install verification (file existence, frontmatter, conflict check, **bundle completeness**, SHA-256 on every installed file)
6. **3f.** Update `~/.claude/skills/.fetch-metadata.json`
7. **3g.** Activate and confirm with user

> **⚠️ Critical:** When installing from GitHub, the skill is its entire directory — `SKILL.md` plus `references/`, `scripts/`, `assets/`, `templates/`, `prompts/`, `data/`, etc. Downloading only `SKILL.md` will produce a broken install for any skill that delegates to those files. Always fetch the complete bundle.

### Step 4: Digest the Installed Bundle

An installed skill is a **directory**, not a single `SKILL.md`. Many skills split their content across subdirectories — `references/` (docs), `scripts/` (helpers), `assets/`, `templates/`, `prompts/`, `data/`, `examples/`, etc. If you only read `SKILL.md` you may miss instructions the skill author expects you to load on demand.

1. Use Glob to list the full installed tree: `{install-path}/{skill-name}/**/*`.
2. **Verify bundle completeness.** If SKILL.md references relative paths (`bash scripts/foo.sh`, `See references/bar.md`, `Load assets/template.json`) and those files are missing, the install is incomplete — re-run the GitHub bundle fetch (see `references/installation-guide.md` §3d).
3. Read files **directly relevant to the current task** (check the first 30 lines for relevance). Don't limit this to `references/` — the relevant file may live under `prompts/`, `templates/`, or another subdir.
4. Summarize key knowledge for use in subsequent planning.

After completion, output: `External skill installed successfully: {skill-name}`

## Completion Phrases

- Success: `External skill installed successfully: {name}`
- Skipped: `External skill fetch: user chose to skip installation.`

## Additional Resources

> **Rationalization Table and Red Flags** are in `references/interaction-patterns.md`. Consult when rationalizing skipping steps.

- **`references/interaction-patterns.md`** — Output templates, user reply handling, security review
- **`references/quality-signals.md`** — Quality assessment dimensions, lookup methods, ranking algorithm
- **`references/search-sources.md`** — Source-specific commands, error handling, deduplication rules
- **`references/platform-adapters.md`** — Cross-platform tool mapping, installation paths, fallback strategies
- **`references/installation-guide.md`** — Complete Step 3 installation workflow (3a-3g)
- **`references/local-index.md`** — Local skill/plugin scan implementation for pre-search deduplication
- **`scripts/fetch-skillhub.sh`** — SkillHub API search (reads key from `~/.claude/skills/.fetch-config.json`)
- **`scripts/fetch-skills-directory.sh`** — Skills Directory API search (reads key from config)
- **`scripts/fetch-skill-bundle.sh`** — Download a complete skill bundle (SKILL.md + all sibling files/subdirs) from any GitHub `blob`/`tree`/`raw` URL, preserving directory layout
