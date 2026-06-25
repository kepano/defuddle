---
name: git-workflow
description: "Use when establishing branching strategies, implementing Conventional Commits, creating or reviewing PRs, resolving PR review comments, merging PRs (including CI verification, auto-merge queues, and post-merge cleanup), managing PR review threads, merging PRs with signed commits, handling merge conflicts, creating releases, integrating Git with CI/CD, setting up git hooks (lefthook, captainhook, husky, pre-commit), or debugging hook-install failures in git worktrees."
license: "(MIT AND CC-BY-SA-4.0). See LICENSE-MIT and LICENSE-CC-BY-SA-4.0"
compatibility: "Requires git, gh CLI; yq for .spec-cleanup.yml."
metadata:
  author: Netresearch DTT GmbH
  version: "1.18.1"
  repository: https://github.com/netresearch/git-workflow-skill
allowed-tools: Bash(git:*) Bash(gh:*) Read Write
---

# Git Workflow Skill

Expert patterns for Git: branching, commits, collaboration, CI/CD.

## Critical Rules (Non-Negotiable)

1. **No direct push to main** — always open a PR.
2. **No merge before all threads resolved** — see `references/pull-request-workflow.md`.
3. **No squash unless asked** — preserves atomic commits, signatures, bisection.
4. **No "tested/verified/working" without pasted command output** — else say so.
5. **No edits to installed skill/plugin cache paths** (`~/.claude/skills/`, `~/.claude/plugins/cache/`, `**/.bare/**`) — always the repo worktree, verified by `pwd`.
6. **Force-push only with `--force-with-lease`** — never plain `--force`.
7. **Commit before rebase** — `add → commit → fetch → rebase → push`. Dirty tree aborts rebase.

See `references/pull-request-workflow.md` for merge-gate and atomic-commit patterns.

## Reference Files

Load references on demand:

| Reference | Content Triggers |
|-----------|-----------------|
| `references/branching-strategies.md` | Branching model, Git Flow, GitHub Flow, trunk-based, branch protection |
| `references/commit-conventions.md` | Commit messages, conventional commits, DCO sign-off, semantic versioning, commitlint |
| `references/pull-request-workflow.md` | PR create/review/merge, thread resolution, merge strategies, CODEOWNERS, signed commits + rebase |
| `references/ci-cd-integration.md` | GitHub Actions, GitLab CI, semantic release, deployment |
| `references/advanced-git.md` | Rebase, cherry-pick, bisect, stash, worktrees, reflog, submodules, recovery |
| `references/github-releases.md` | Release management, immutable releases, `--latest=false`, multi-branch |
| `references/git-hooks-setup.md` | Hook frameworks, detection, recommended hooks per stage |
| `references/claude-code-hooks.md` | Claude Code `settings.json` hooks — merge gate, cache-path rejection, auto-lint |
| `references/code-quality-tools.md` | shellcheck, shfmt, git-absorb, difftastic |
| `references/merge-gate-watcher.md` | Merge-driver loop, hard/soft check taxonomy, rerun stale-SHA, review-bot rounds |
| `references/spec-cleanup.md` | Keep planning artifacts off the base branch; guard + capture-to-ADR |

## Conventional Commits

```
<type>[scope]: <description>
```

**Types**: `feat` (MINOR), `fix` (PATCH), `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Breaking change**: Add `!` after type or `BREAKING CHANGE:` in footer.

## Branch Naming

```
feature/TICKET-123-description
fix/TICKET-456-bug-name
release/1.2.0
hotfix/1.2.1-security-patch
```

## Hook Detection

Detect hooks before first commit:

```bash
ls lefthook.yml .lefthook.yml captainhook.json .pre-commit-config.yaml .husky/pre-commit 2>/dev/null || echo "No hooks"
```

Install: `lefthook install` | `composer install` | `npm install` | `pre-commit install`

## Critical Release Rules

1. **Immutable releases**: deleted releases block tag reuse; bump version.
2. **Multi-branch releases**: Use `--latest=false` from non-default branches.
3. **Pre-release**: Version bumped, CI green, CHANGELOG updated, `git pull` BEFORE `gh release create`.

## PR Merge Requirements

Before merging: threads resolved, CI green (incl. annotations), rebased, signed. Rebase-only + signed: `git merge --ff-only`.

## Verification

```bash
./scripts/verify-git-workflow.sh /path/to/repository
```

---

> **Contributing:** <https://github.com/netresearch/git-workflow-skill>
