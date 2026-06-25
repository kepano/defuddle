# Spec-Cleanup — Keep Intermediate Planning Artifacts Out of the Base Branch

Dev-time planning artifacts — superpowers specs/plans (`docs/superpowers/**`),
ad-hoc `PLAN.md` scratch files, output from other planning tools — are throwaway
working notes. When they get committed to a feature branch they ride into the
base branch on merge, rot there, and pollute history (the HMKG-2227 incident:
~5000 lines of specs/plans dragged across branches via `develop`).

This capability has two layers, wired into the merge gate and `/pr-finish`:

- **Guard** — deterministic, **read-only**. Detects the artifacts and blocks the
  gate. Safe to run in CI.
- **Capture** — interactive, in-session. Distils durable knowledge into an ADR
  (proposed as a reviewable diff), then removes the raw files **recoverably**.

## Guard — `scripts/spec-cleanup-guard.sh`

Read-only **invariant**: the Guard never deletes, stages, or modifies any file.
It detects the *presence* of configured intermediate paths in three states and
exits non-zero if any are found. It is branch-local (presence ⇒ fail), so there
is no base-branch resolution to get wrong.

| State | Mechanism |
|-------|-----------|
| tracked (committed) | `git ls-files` |
| staged | `git diff --cached --name-only --diff-filter=AM` |
| untracked | `git ls-files --others --exclude-standard` |

```bash
bash skills/git-workflow/scripts/spec-cleanup-guard.sh            # enforce: exit 1 on matches
bash skills/git-workflow/scripts/spec-cleanup-guard.sh --dry-run  # manifest only, exit 0
bash skills/git-workflow/scripts/spec-cleanup-guard.sh --selftest # internal fixtures
```

Config globs are normalized to **git pathspecs** (these are NOT shell globs):
a directory glob `docs/superpowers/**` → directory pathspec `docs/superpowers/`
(recurses); a suffix glob → `:(glob)docs/superpowers/**/*.plan.md` (anchored —
a bare `**/*.plan.md` is forbidden because it sweeps in real files like
`src/foo.plan.md`). `exclude:` entries become `:(exclude)` pathspecs (or
`:(exclude,glob)` when the pattern contains glob characters).

## Config — `.spec-cleanup.yml` (optional)

Single machine-readable source of truth for paths. See
`.spec-cleanup.yml.example`. Without a config the baked-in defaults apply
(`docs/superpowers/**`, `claudedocs/**`, `docs/working/**`,
`docs/superpowers/**/*.plan.md`). If the file **is** present but `yq`
(mikefarah v4) is not installed, the Guard **fails closed** (exit 2) rather than
silently under-enforcing.

```yaml
intermediate_paths:
  - docs/superpowers/**
exclude:
  - docs/superpowers/specs/**/KEEP-*.md
capture_targets:
  adr: docs/adr/          # v1 target (append new file)
mode: convert             # convert | remove
```

## Capture — the `/pr-finish` spec-cleanup step (before Rebase)

Runs in-session so the branch is clean before the gate. Sequence:

1. **Manifest + confirm.** Print every match grouped by tracked/staged/untracked.
   The untracked subset is called out separately — it is the only class not
   recoverable from git by default. Require explicit confirmation.
2. **Convert (default).** A sub-agent reads the artifacts and **proposes an ADR
   diff** into `capture_targets.adr`. Routing heuristic for v1: *a decision with
   alternatives considered → ADR*. (PRD update-in-place and user-doc stubs are
   deferred phase-2 targets.) Human reviews the diff; on accept, commit the docs.
3. **Verify before removing.** Assert the docs commit exists and contains the
   intended paths (`git show --stat HEAD`) and the tree no longer reports them
   uncommitted. On any failure (blocked hook, signing failure, empty diff),
   **abort removal** and surface the error.
4. **Recoverable removal.** Stage **only the manifested artifact paths**
   (`git add -- <path>`, never `git add -A/-u`, so unrelated working-tree changes
   are not absorbed) so they enter history, then commit their deletion as
   `chore: remove working specs/plans (captured in <ADR>)`. Recoverability holds
   **only** for merge/rebase-merged PRs (never squashed); in a squash-merge repo
   the captured ADR is the sole durable record — confirm it landed first. **Bare
   `rm` of untracked content is forbidden** — every removal is a git deletion of a
   tracked file.
5. **Acknowledge path.** If nothing is durable (or `mode: remove`), skip step 2;
   still manifest+confirm and removal, and record a `Spec-Cleanup: acknowledged`
   trailer on the removal commit listing the removed paths. The acknowledging
   actor is whoever runs `/pr-finish`; the trailer commit is signed/DCO-compliant.

**Mode precedence:** `mode` is the default offered; a human may escalate to a
stricter outcome (decline conversion → remove) but the tooling never silently
loosens.

**Discovery vs enforcement:** the Guard (and CI) enforce only the declared
globs. In-session, Capture may additionally surface session-known artifacts that
match no glob (ad-hoc `PLAN.md`, other-tool output) and propose **adding them to
`.spec-cleanup.yml`** so the deterministic Guard catches them thereafter — it
never silently deletes a non-globbed path. CI cannot see session-only paths;
that residual gap is closed only once discovery registers them in config.

## Wiring

- **Merge gate** — a Pre-Merge Checklist item + command recipe in
  `references/pull-request-workflow.md` runs the Guard and blocks on non-zero.
- **Optional runtime block** — extend the `merge-gate.sh` PreToolUse hook recipe
  in `references/claude-code-hooks.md`, or add an **off-by-default** git
  `pre-commit` template under `Build/hooks/` (a *git* hook — distinct from the
  Claude-hook config in `hooks/hooks.json`). Off by default because committing
  working notes mid-branch is fine; only reaching the base branch is not.

## Adoption

Other repos adopt by shipping their own `.spec-cleanup.yml` (own globs + ADR
target). No forked logic; composes with existing QA agents (e.g.
`oro-qa-reviewer`). Note: the `git-workflow-skill` repo ships only
`.spec-cleanup.yml.example` (no active config), so the Guard is not wired into its
own merge gate/CI. Run manually with the baked-in defaults it *does* flag the
dogfooded design spec under `docs/superpowers/specs/` — the intended
self-demonstration (design §8).
