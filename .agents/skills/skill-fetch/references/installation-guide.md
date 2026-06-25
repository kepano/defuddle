# Installation Guide

Complete installation workflow for skill-fetch. Referenced from SKILL.md Step 3.

---

### Step 3: Analyze, Select, Install

#### 3a. Display Comparison Analysis (plain-text)

Sort all deduplicated results by quality score. Maintain the full sorted list. Display 5 per page (1-5, 6-10, 11-15...):

```
🔍 Found {N} relevant skills, showing {start}-{end} of {N}:

{start}. {skill-name} [{source}] 🟢 {score}/100 | ⭐{stars} | Updated: {YYYY-MM}
   📦 {githubUrl or skillsmp URL}
   Content: {what the skill provides}
   Pros: {match with current task, coverage}
   Cons: {limitations or gaps}

{start+1}. {skill-name-2} [{source}] 🟡 {score}/100 | ⭐{stars} | Updated: {YYYY-MM}
   📦 {repo URL}
   ...

...5 items per page...

💡 Recommendation: #{N} {skill-name-X} ({score}/100 🟢)
   Reason: {1-2 sentences explaining why it best fits the need}

---
Reply with a number to install (e.g., `1`), comma-separated for multiple (e.g., `1,3`)
Reply `c` or "continue" to see next 5 ({end+1}-{end+5})
Reply "skip" to end search
```

**Pagination rules:**
- First page shows items 1-5 with recommendation
- User replies `c` or "continue" → show next 5 (6-10), ranking continues, no re-search
- Can keep paging until list is exhausted; last page shows "All {N} results displayed"
- User can reply with a number on any page (numbers are global, e.g., `7` on page 2 = item #7)
- Recommendation is only shown on the first page

**Scoring formula:** See `references/quality-signals.md` and SKILL.md Step 2.5 for the full scoring algorithm.

**Analysis principles:**
- Sort by total score descending; break ties by relevance first
- Each header line shows score and color grade (🟢/🟡/🔴)
- Add `⚠️` for skills not updated in 6+ months
- Apply security labels per `references/quality-signals.md` §6: `🔒 Official`, `🔒 Verified`, `⚠️ Partial`, `⚠️ Unverified`, `⚠️ Security Concerns`
- When multiple skills have different strengths, explain the differences so the user can decide

#### 3b. Wait for User Reply

- **Number** (e.g., `1` or `7`) → Install the selected skill (global numbering, works across pages)
- **Multiple** (e.g., `1,3`) → Install multiple skills
- **`c` or "continue"** → Show next 5 results (ranking continues, no re-search)
- **"skip"** → Output `External skill fetch: user chose to skip installation.` and continue task
- **New keywords** → Return to Step 2 and re-search

#### 3c. Choose Installation Location (MANDATORY — must ask before installing)

**⚠️ MANDATORY: Always display this menu and wait for user reply. Never auto-select based on default.**

Before installing, ask the user for installation scope (if not already specified):

```
📦 Install location:
  [G] Global (available to all projects) → ~/.claude/skills/{skill-name}/
  [L] Local (this project only) → .claude/skills/{skill-name}/

👉 Reply G or L to continue.
```

**Installation path reference:**

| Scope | Path | Use Case |
|-------|------|----------|
| Global | `~/.claude/skills/{skill-name}/` | General skills (shared across projects) |
| Local | `{project-root}/.claude/skills/{skill-name}/` | Project-specific skills (travels with repo) |

**Claude Code Skill Discovery order** (first found wins):
1. `{project}/.claude/skills/` — Project local
2. `~/.claude/skills/` — User global

**Cross-platform skill directories:**

| Agent | Global Path | Local Path |
|-------|-------------|------------|
| Claude Code | `~/.claude/skills/{name}/` | `.claude/skills/{name}/` |
| Cursor | `~/.cursor/skills/{name}/` | `.cursor/skills/{name}/` |
| Codex | `~/.codex/skills/{name}/` | `.codex/skills/{name}/` |
| Gemini CLI | `~/.gemini/skills/{name}/` | `.gemini/skills/{name}/` |
| Windsurf | `~/.windsurf/skills/{name}/` | `.windsurf/skills/{name}/` |
| Amp | `~/.amp/skills/{name}/` | `.amp/skills/{name}/` |

**Auto-detection:** Check which agent directories exist and install to the detected agent's path. If multiple agents are detected, ask the user which to install for.

#### 3d. Execute Installation

**SkillsMP source (trust-but-verify):**
1. Use `skillsmp_install_skill` to install. If it doesn't support the target path: use `skillsmp_get_skill_content` to get content → write to target path.
2. **Post-install security scan**: Read the installed `SKILL.md` + `references/` + `scripts/` (if present)
3. Execute security review (Categories A-F per `references/interaction-patterns.md`)
4. Findings found → warn user with details, offer `confirm install` to keep or `remove` to uninstall
5. Clean scan → continue to verification

**GitHub source (MANDATORY: fetch the full skill bundle, not just SKILL.md):**

> ⚠️ **Common failure mode:** downloading only `SKILL.md` while ignoring sibling files (`references/`, `scripts/`, `assets/`, `templates/`, `prompts/`, `data/`, `examples/`, etc.). Many skills are broken without those files — SKILL.md often delegates to reference docs or invokes bundled scripts. Always install the complete bundle.

1. **Enumerate the skill root directory.** Parse the source URL to obtain `owner`, `repo`, `ref`, and the `skill_root` path (the parent directory of `SKILL.md`, or the directory itself if the URL points at `tree/...`; repo root if no path is given). Then list every file under that directory via the git tree API:
   ```bash
   gh api "repos/{owner}/{repo}/git/trees/{ref}?recursive=1" \
     --jq '.tree[] | select(.type=="blob") | .path' \
     | grep -E "^{skill_root}(/|$)"
   ```
   Do **not** hardcode the list to `SKILL.md` + `references/*.md` + `scripts/*.sh` — take whatever the repo actually contains.

2. **Preferred path: bundled helper.** Delegate the enumeration + download to the bundled script, which handles URL parsing, tree enumeration, and directory-preserving download in one call:
   ```bash
   bash {SKILL_BASE_DIR}/scripts/fetch-skill-bundle.sh "{github-url}" "{target-path}/{skill-name}"
   ```
   The script accepts `blob`, `tree`, and `raw.githubusercontent.com` URLs; when given a SKILL.md URL it automatically derives the skill root. On success it prints a one-line JSON summary (`{"status":"ok","files":N,...}`).

3. **Fallback:** if the bundled script is unavailable, run the tree enumeration from step 1 manually, then for each path download via:
   ```bash
   gh api "repos/{owner}/{repo}/contents/{path}?ref={ref}" \
     -H "Accept: application/vnd.github.raw" > "{target-path}/{skill-name}/{relative-path}"
   ```
   Create parent directories as needed; preserve the subtree layout.

4. **Pre-install security scan — every file in the bundle.** Scan every downloaded file against Categories A-F (see `references/interaction-patterns.md`). Do not limit the scan to known subdirs:
   - `SKILL.md` and every `*.md` under the bundle → Categories A-F (including prompt injection)
   - every `*.sh`, `*.bash`, `*.zsh`, `*.py`, `*.js`, `*.ts` → Categories A-E (extra-strict script review)
   - other text config (`*.json`, `*.yaml`, `*.toml`) → Categories D, F
   - binary / media files → note path; skip content scan

5. If concerns are found → display findings with file, line, and category → wait for `confirm install` or `skip`.

6. On clean scan or user confirmation → files are already written in place by the bundle helper; otherwise finalize the manual downloads.

**Direct URL source:**

A "direct URL" may point at a single file (raw markdown, Gist) or at a file inside a GitHub-hosted skill bundle. Treat GitHub URLs as bundles, not as single files:

1. **If the URL is a GitHub URL** (`github.com/...` or `raw.githubusercontent.com/...`):
   - Use the GitHub source flow above (`fetch-skill-bundle.sh`) so sibling files travel with `SKILL.md`.
2. **If the URL is a Gist URL** (`gist.github.com/...`):
   - Fetch all files in the Gist (`gh api gists/{gist_id} --jq '.files | keys[]'`), not just the first one.
3. **If the URL is a truly standalone file** (not part of a Gist or repo — e.g., a pastebin):
   - `WebFetch` to get the content and write it as `{skill-name}/SKILL.md`.
4. **Pre-install security scan**: same Categories A-F as GitHub source, applied to every file obtained.
5. If concerns found → display and wait for confirmation.
6. On clean scan or confirmation → write all files to `{skill-name}/` at the target path, preserving any subtree layout.

#### 3e. Post-Installation Verification

After installation, run the following checks to ensure the skill can be discovered:

1. **File existence check**: Use Glob to confirm `{target-path}/{skill-name}/SKILL.md` exists.
2. **Frontmatter check**: Read the first 10 lines of SKILL.md, confirm valid `---` frontmatter (with `name` and `description`).
3. **Conflict check**: Confirm no same-name skill exists at the other installation path (avoid local/global conflicts).
4. **Bundle completeness check**: If SKILL.md references `references/...`, `scripts/...`, or any other relative paths (e.g., `bash scripts/foo.sh`, `See references/bar.md`), confirm those paths were actually installed. A skill installed without its referenced files is broken — if any referenced file is missing, re-run the bundle fetch.
5. **Integrity hash**: Calculate SHA-256 for **every** installed file in the bundle (walk the skill directory; do not limit to `SKILL.md`/`references/*.md`/`scripts/*.sh`). Record each relative path and hash in metadata (see Step 3f).

On verification failure, output specific errors with fix suggestions.

#### 3f. Update Metadata

Read and update `~/.claude/skills/.fetch-metadata.json`:
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

**Hash generation**: After all files are written, walk the installed skill directory recursively (`find "{target-path}/{skill-name}" -type f`) and calculate SHA-256 for every file. Record each relative path and hash in the `integrity.files` map — do not cherry-pick only `SKILL.md` and known subdirs.

**Integrity verification**: When a skill is loaded in a future session, compare current file hashes against recorded hashes. On mismatch:
```
⚠️ Integrity check failed for skill "{skill-name}":
  Modified: SKILL.md (expected: abc123..., actual: def456...)

The skill has been modified since installation. This could be a legitimate edit or tampering.
Continue using this skill? Reply "yes" or "reinstall".
```

#### 3g. Activate and Confirm

1. **Claude Code:** Call `Skill("{skill-name}")` to load and activate
2. **Other agents:** The skill is available immediately after file installation — no activation step needed
3. Inform the user of installed skill name, path, source, and scope
4. Output: "Installed {skill-name}. Ready to use? Reply 'confirm' or 'skip'."
5. Wait for user confirmation before continuing with the original task
