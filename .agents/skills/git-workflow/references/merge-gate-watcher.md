# Merge-Gate Watcher

Canonical polling loop to drive a PR to merge once review threads are handled. Hand-rolling this per PR invites classification bugs (a soft check counted as hard ⇒ false HOLD; a missed one ⇒ premature merge).

## Check taxonomy

Classify every failing check BEFORE reacting:

| Class | Examples | Reaction |
|-------|----------|----------|
| **Hard** | unit/integration/E2E tests, lint, build | HOLD and fix — except known infra flakes (Docker Hub pull timeout, buildx setup): one `gh run rerun <id> --failed` |
| **Soft, self-healing** | `codecov/*` while sibling jobs still run (partial uploads) | Ignore while `pending > 0`; if persisting after completion: one full `gh run rerun <id>` |
| **Soft, structural** | SonarCloud PR gate on refactor PRs | Introspect before deciding (below) |

## Sonar gate introspection

Never merge on a red Sonar gate without knowing *why* it is red:

```bash
AUTH="Authorization: Bearer $SONAR_TOKEN"
curl -s -H "$AUTH" "https://sonarcloud.io/api/qualitygates/project_status?projectKey=$KEY&pullRequest=$PR" \
  | jq -r '[.projectStatus.conditions[]|select(.status!="OK")|.metricKey]|join(",")'
curl -s -H "$AUTH" "https://sonarcloud.io/api/issues/search?componentKeys=$KEY&pullRequest=$PR&resolved=false&ps=1" | jq .total
```

Merge-despite is defensible only when the sole failing condition is a touched-line re-attribution metric (`new_duplicated_lines_density`, patch coverage on refactor-moved lines), open PR issues are 0, and the PR body documents the rationale. Real findings: fix them.

## Watcher skeleton

```bash
R=owner/repo; PR=123; BR=branch; RERUN_DONE=0
for i in $(seq 1 100); do
  sleep 30
  STATE=$(gh pr view $PR --repo $R --json state,mergeStateStatus) || continue
  [ "$(jq -r .state <<<"$STATE")" = "MERGED" ] && exit 0
  MS=$(jq -r .mergeStateStatus <<<"$STATE")
  UNRES=$(gh api graphql -f query="{repository(owner:\"${R%/*}\",name:\"${R#*/}\"){pullRequest(number:$PR){reviewThreads(first:100){nodes{isResolved}}}}}" \
    --jq '[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved|not)]|length') || continue
  CHECKS=$(gh pr checks $PR --repo $R 2>/dev/null)
  PENDING=$(grep -c -E "pending|in_progress" <<<"$CHECKS" || true)
  HARD=$(grep "fail" <<<"$CHECKS" | grep -v -c -E "codecov|SonarCloud Code Analysis" || true)
  SOFT=$(grep "fail" <<<"$CHECKS" | grep -c -E "codecov|SonarCloud Code Analysis" || true)
  [ "$MS" = "BLOCKED" ] && [ "$UNRES" -gt 0 ] && { echo "HOLD: $UNRES threads"; exit 1; }
  if [ "$HARD" -gt 0 ] && [ "$PENDING" -eq 0 ]; then
    # one rerun for infra flakes only, then HOLD
    if [ "$RERUN_DONE" -eq 0 ] && grep "fail" <<<"$CHECKS" | grep -qE "E2E|Integration|docker"; then
      gh run rerun "$(gh run list --repo $R --branch $BR --workflow CI --limit 1 --json databaseId --jq '.[0].databaseId')" --repo $R --failed
      RERUN_DONE=1; sleep 60; continue
    fi
    echo "HOLD: hard fails"; grep fail <<<"$CHECKS"; exit 1
  fi
  if [ "$PENDING" -eq 0 ] && [ "$UNRES" -eq 0 ] && { [ "$MS" = "CLEAN" ] || [ "$MS" = "UNSTABLE" ]; } && [ "$HARD" -eq 0 ] && [ "$SOFT" -eq 0 ]; then
    gh pr merge $PR --repo $R --merge && exit 0
  fi
done
```

Pitfalls baked in: `grep -c` exits 1 on zero matches (`|| true`); decide hard-fail only at `PENDING -eq 0` (codecov posts transient FAILURE mid-run); never count a check class you did not explicitly list.

## Two facts the loop depends on

**`gh run rerun` reuses the original `GITHUB_SHA`.** For `pull_request` events that is the merge commit computed at first run — a rerun after a base-branch fix still tests against the broken base. Rerun is only for flakes; to pick up a repaired base, rebase the branch and push.

**Review bots converge over multiple rounds.** Every push invalidates the review (ruleset `copilot_code_review` needs a fresh review on the latest head), so re-request after each push: `gh api repos/$R/pulls/$PR/requested_reviewers -X POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`. Later rounds may flag UNCHANGED lines adjacent to the diff (latent legacy bugs) — triage each finding on its merits; expect 3–6 rounds on large refactor PRs, with finding severity decreasing per round. Re-arm the watcher after every push.

## Post-merge: confirm merge-triggered jobs by commit SHA, not by run list

After merge, the base branch (`main`) fires its own runs (CI, release, deploy). To confirm those, query the **commit's** checks keyed on the merge SHA — never filter `gh run list` by `headSha`:

```bash
SHA=$(gh pr view $PR --repo $R --json mergeCommit --jq '.mergeCommit?.oid')
gh api repos/$R/commits/$SHA/check-runs --jq '.check_runs[]?|{name,status,conclusion}'
gh api repos/$R/commits/$SHA/status      --jq '{state, total:(.statuses|length)}'   # legacy commit statuses (Sonar/codecov)
```

`gh run list --json … --jq 'select(.headSha=="'$SHA'")'` is unreliable here: the list window is small and time-ordered, so a still-running `main` job scrolls out behind unrelated activity and the filter returns empty — which then feeds a `gh run view ""` (HTTP 404) and tempts a hand-rolled `sleep`-poll loop that just times out. The check-runs/status API is authoritative and SHA-addressed. For PR-head checks, `gh pr checks $PR --watch` already blocks to completion — prefer it over any custom loop.

**Pre-existing red ≠ your regression.** If a post-merge gate (e.g. SonarCloud "Quality Gate failed" on N Security Hotspots) is red, check the *prior* base commit before owning it: `gh api repos/$R/commits/<prev-sha>/check-runs --jq '.check_runs[]?|select(.name=="<gate>")|.conclusion'`. Identical red on the parent + a diff that touched no relevant code = a pre-existing backlog to report, not a regression to fix.
