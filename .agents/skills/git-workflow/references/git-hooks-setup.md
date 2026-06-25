# Git Hooks Setup

## Why Hooks Matter

Git hooks catch issues before they reach CI — faster feedback, fewer wasted CI runs.
For autonomous agents, hooks are essential: they enforce commit message format,
prevent secrets, and ensure code quality without requiring the agent to "remember" rules.

## Hook Frameworks

| Framework | Language | Config File | Install |
|-----------|----------|-------------|---------|
| **lefthook** | Go binary | `lefthook.yml` | `go install github.com/evilmartians/lefthook@latest && lefthook install` |
| **captainhook** | PHP | `captainhook.json` | `composer install` (auto via plugin) |
| **husky** | Node.js | `.husky/` | `npm install` (auto via prepare) |
| **pre-commit** | Python | `.pre-commit-config.yaml` | `pip install pre-commit && pre-commit install` |

## Detection — One Command

```bash
ls lefthook.yml .lefthook.yml captainhook.json .pre-commit-config.yaml .husky/pre-commit 2>/dev/null || echo "No hook framework configured"
```

Then install based on what's found:
- `lefthook.yml` → `lefthook install` (or `make setup`)
- `captainhook.json` → `composer install` (auto)
- `.husky/` → `npm install` (auto)
- `.pre-commit-config.yaml` → `pre-commit install`
- Nothing → suggest adding one based on project language

## Recommended Hooks by Stage

### pre-commit (fast, <5s)
- Code formatting (gofmt, php-cs-fixer, prettier)
- Import sorting
- YAML/JSON validation
- Secret detection

### commit-msg
- Conventional commits validation
- DCO sign-off enforcement
- Minimum message length

### pre-push (can be slower)
- Full linting (golangci-lint, phpstan)
- Smoke tests
- Security scanning

## Rules for Agents

- NEVER skip hooks with `--no-verify`
- If a hook fails, fix the underlying issue
- If hooks aren't installed, install them before first commit
- If no hook framework exists, suggest adding one in the PR

## Hooks Are Fast Feedback — CI Is the Gate

Local hooks are per-checkout, individually bypassable, and **absent in fresh
clones and in most secondary worktrees**. Treat them as fast feedback, not as an
enforcement boundary. The actual gate must be CI: every substantive check a hook
runs locally (format, lint, static analysis, tests, secret scan, commit-message
validation) needs an equivalent job in the pipeline. A check that runs only in a
local hook is silently unenforced for anyone who never installed it. When
auditing a repo, confirm that parity — a missing local hook is only a real gap
if CI doesn't cover the same check.

This also means it is legitimate to deliberately leave a repo with **no** local
hooks when the hook can't run reliably outside its container (e.g. a pre-commit
that needs a Docker-only service) — provided CI runs the equivalent check.
Forcing such a hook onto every checkout just turns it into a landmine.

## Auditing Installed Hooks (`--git-path` cwd gotcha)

To find where a checkout's hooks live, prefer the path git computes itself:

```bash
cd "$repo" && git rev-parse --git-path hooks
```

**Run it from inside the repo.** For a plain (non-worktree) clone,
`git rev-parse --git-path hooks` returns a path **relative to the current
directory** (`.git/hooks`). Resolve or `find` it from elsewhere and you look in
the wrong place and false-report "no hooks installed". (Worktrees and a
configured `core.hooksPath` return absolute paths, which masks the bug — so it
only bites on ordinary clones.) `cd` into the repo first, or resolve the path
against the repo root, before inspecting it.

## Troubleshooting

### CaptainHook + git worktrees (FAQ)

- **Symptom**: `composer install` fails with
  `Shiver me timbers! CaptainHook could not install yer git hooks! (invalid .git path)`
  when run in a secondary git worktree.
- **Cause**: Git worktrees use a `.git` *pointer file* (e.g. `gitdir: /path/to/bare/worktrees/NAME`),
  not a directory. `captainhook/hook-installer` ≤ 1.x does not resolve the pointer correctly
  and aborts.
- **Fix (recommended)**: `mkdir -p "$(git rev-parse --git-path hooks)" && composer install` —
  creates the hooks dir at the effective hooks path (honors `core.hooksPath` if configured,
  falls back to `<git-dir>/hooks` otherwise). Works with captainhook's plugin in place, so other
  Composer plugins (phpstan/extension-installer, TYPO3 composer installers, etc.) continue to
  auto-register normally.
- **Fix (last-resort fallback)**: `composer install --no-plugins` — only if the hooks-dir
  workaround above doesn't resolve it. Be aware this disables *all* Composer plugins for that
  install, which has broader side effects: phpstan extensions won't auto-register, TYPO3
  composer installers won't place extensions, and captainhook itself won't install hooks. Hooks
  still work in the primary worktree where `.git` is a real directory.
- **When this matters**: Repos using a bare-repo + worktrees layout (see
  [git-worktree(1)](https://git-scm.com/docs/git-worktree)) hit this on every `composer install`
  in a secondary worktree, since `.git` is a pointer file rather than a directory.
- **Cross-reference**: The `netresearch/typo3-ci-workflows` meta-package bundles
  `captainhook/hook-installer`; its README section "Git Worktree + captainhook Workaround"
  is the canonical source.

### Hooks fail in worktrees / hang on host-unreachable services (FAQ)

- **Symptom A**: `git commit` in a secondary worktree fails with
  `./bin/captainhook: not found` — even though `--no-verify` was passed to
  `git commit`.
- **Cause A**: hooks installed by the primary checkout run with the worktree as
  CWD and reference `./bin/captainhook` relatively; the worktree has no
  `vendor/`/`bin/`. The commit-level `--no-verify` has a blind spot:
  it skips only `pre-commit` and `commit-msg` — **`prepare-commit-msg` always
  runs**, so a broken hook of that type still fails the commit. (`git push`
  has its *own* `--no-verify`, which does skip `pre-push` entirely; the
  commit-level flag simply does not cover it.)
- **Symptom B**: a pre-commit hook that runs the test suite hangs forever on
  the host because the tests need a docker-only service (e.g. a test DB only
  resolvable inside the compose network). Killing the runner can leave a
  zombie process holding the index lock. Note that in a worktree `.git` is a
  pointer **file**, not a directory — the lock lives at
  `$(git rev-parse --git-dir)/index.lock`. First confirm no git or hook
  process is still alive (`pgrep -fl 'git|captainhook'`); only then remove
  the stale lock and retry — deleting it under a live process corrupts the
  index.
- **Controlled bypass** (the only sanctioned exception to "never skip hooks"):
  first run the hook's checks *manually via equivalent commands* (linters and
  static analysis on the changed files, the test suite inside its docker
  environment), then bypass the broken hook explicitly and disclose it:
  `git -c core.hooksPath="$(mktemp -d)" commit -s ...` (an empty hooks
  directory disables all hook types for that one command and — unlike
  `/dev/null` — is portable to Windows) and `git push --no-verify`. Never
  make the bypass the default; fix the hook environment or commit from the
  primary checkout when possible.
