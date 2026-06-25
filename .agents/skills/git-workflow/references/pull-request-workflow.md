# Pull Request Workflow

## PR Best Practices

### Size Guidelines

| Size | Lines Changed | Review Time | Defect Risk |
|------|--------------|-------------|-------------|
| XS | 0-10 | < 5 min | Very Low |
| S | 11-100 | 15-30 min | Low |
| M | 101-400 | 30-60 min | Medium |
| L | 401-1000 | 1-2 hours | High |
| XL | 1000+ | Multiple sessions | Very High |

**Target**: Keep PRs under 400 lines when possible.

### PR Structure

```markdown
## Summary
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Changes Made
- Added user authentication service
- Implemented JWT token generation
- Added login/logout endpoints

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
[Before/After screenshots for UI changes]

## Related Issues
Fixes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests pass locally
```

## Creating PRs

### GitHub CLI

```bash
# Create PR with title and body
gh pr create \
  --title "feat(auth): add user authentication" \
  --body "## Summary
Implements JWT-based authentication.

## Changes
- Add AuthService
- Add login/logout endpoints
- Add auth middleware

Fixes #123"

# Create draft PR
gh pr create --draft

# Create PR and assign reviewers
gh pr create \
  --title "fix: resolve memory leak" \
  --reviewer "@team-lead,@senior-dev" \
  --assignee "@me"

# Create PR from template
gh pr create --template .github/PULL_REQUEST_TEMPLATE.md
```

### PR Templates

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->
## Description
<!-- Describe your changes in detail -->

## Motivation and Context
<!-- Why is this change required? What problem does it solve? -->

## How Has This Been Tested?
<!-- Describe how you tested your changes -->

## Types of Changes
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have updated the documentation accordingly
- [ ] I have added tests to cover my changes
- [ ] All new and existing tests passed
```

### Multiple Templates

```
.github/
├── PULL_REQUEST_TEMPLATE.md          # Default
└── PULL_REQUEST_TEMPLATE/
    ├── feature.md
    ├── bugfix.md
    └── documentation.md
```

## Code Review Process

### Reviewer Responsibilities

1. **Code Quality**
   - Readability and maintainability
   - Adherence to coding standards
   - Appropriate error handling

2. **Functionality**
   - Logic correctness
   - Edge cases handled
   - Requirements met

3. **Testing**
   - Test coverage adequate
   - Tests meaningful and correct
   - Edge cases tested

4. **Security**
   - No obvious vulnerabilities
   - Sensitive data handling
   - Input validation

5. **Performance**
   - No obvious bottlenecks
   - Resource usage appropriate
   - Scaling considerations

### Review Comments

```markdown
# Levels of feedback

# 🔴 Blocking - Must be addressed
This introduces a security vulnerability. User input is not sanitized
before being used in the SQL query.

# 🟡 Suggestion - Should consider
Consider extracting this logic into a separate function for reusability
and testing.

# 🟢 Nit - Minor issue
Nit: This variable name could be more descriptive.
`data` → `userProfileData`

# 💡 Question - Seeking understanding
Question: What's the reasoning behind using a Map here instead of an Object?

# 👍 Praise - Positive feedback
Nice catch handling the edge case where the array might be empty!
```

### Review Checklist

```markdown
## Code Review Checklist

### Code Quality
- [ ] Code is readable and self-documenting
- [ ] No unnecessary complexity
- [ ] DRY principle followed
- [ ] SOLID principles followed

### Testing
- [ ] Unit tests present and passing
- [ ] Edge cases covered
- [ ] Integration tests if needed
- [ ] No flaky tests introduced

### Security
- [ ] No hardcoded credentials
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities

### Performance
- [ ] No N+1 queries
- [ ] Appropriate data structures used
- [ ] No memory leaks
- [ ] Caching considered

### Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Comments for complex logic
- [ ] CHANGELOG entry added
```

## Atomic Commits (Default — No Squash Unless Asked)

**The project default is atomic commits preserved end-to-end.** Squash is destructive: it loses GPG signatures, collapses bisection granularity, and destroys narrative. Never squash unless the user asks for it in this task.

### What "atomic" means

- One commit = one self-contained logical change
- Each commit builds and passes tests independently
- No "WIP", "fixup", or "oops" commits in final history — rebase them away before merge
- Mixed changes get split (`git add -p`, `git commit --fixup`, `git rebase --autosquash`)

### Preferred merge strategies (in order)

1. **Rebase + merge commit** (`gh pr merge --merge` after `git rebase origin/main`): linear feature history with an explicit merge point. Preserves signatures. This is the default for Netresearch repos.
2. **Fast-forward merge** (local `git merge --ff-only`): when signed commits are required AND only rebase is allowed (see "Signed Commits with Rebase Merge" below).
3. **Squash**: only when the user explicitly asks.

### If you catch yourself typing `--squash`

Stop. Re-read the task. Did the user say "squash"? If not, use `--merge` or `--rebase` (with the signed-commits caveat). The correction "no squash! atomic commits!" is a repeat interruption — prevent it by defaulting to merge-commit.

## Review Thread Resolution (SHA Citation Required)

**Never reply with "Addressed" or "Fixed" without citing the resolving commit SHA.** Review threads are resolved on GitHub's side, not by agent assertion.

### Correct reply pattern

```bash
# After pushing the fix
SHA=$(git rev-parse HEAD)

gh api graphql -f query='
  mutation($body: String!, $id: ID!) {
    addPullRequestReviewThreadReply(input: {body: $body, pullRequestReviewThreadId: $id}) {
      comment { id }
    }
  }' \
  -f body="Fixed in ${SHA:0:7} — <1-sentence explanation of what changed and why>." \
  -f id="PRRT_xxx"

# Then resolve the thread
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "PRRT_xxx"}) { thread { isResolved } } }'
```

### Refusing the lazy pattern

These replies are banned:
- `Addressed` (no SHA, no explanation)
- `Fixed — merged` (merged what? where?)
- `Done` (done how?)
- `Good point, updated` (updated what, in which commit?)

Every resolving reply must include: commit SHA (7+ chars), one sentence of what changed, one sentence of why if not obvious from the diff.

### Verifying AI-reviewer claims before acting

AI reviewers (GitHub Copilot, Gemini Code Assist, SonarCloud) mix correct findings with confident hallucinations. Before applying **or** declining a review comment, verify its load-bearing factual claim against an authoritative source — the framework/library code, official docs, or a quick local probe — not the reviewer's assertion alone.

- **Applying blindly** ships wrong code (e.g. an edit based on a false API claim, which may also fail your own linter/type-checker).
- **Declining blindly** dismisses real bugs — the same reviewer is often right about the next comment.

Reply citing the evidence either way. When you applied a change, the reply must still carry the commit SHA and the what/why required above (e.g. `Verified against <source>: <fact> — applied in <SHA>, which …`); when you declined, state the source and fact (e.g. `Verified against <source>: <fact> — declining.`). When the suggestion is a code change, run the project's checks (lint, types, tests) on it before resolving, so the reply cites a green result rather than a guess.

### Verifying thread state from GitHub, not memory

Before declaring a PR review-complete, re-fetch thread state from GitHub. Never trust your own belief about what you resolved:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes { id isResolved comments(first: 1) { nodes { body author { login } } } }
        }
      }
    }
  }' -f owner=OWNER -f repo=REPO -F pr=NUMBER \
  | jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {id, first_comment: .comments.nodes[0].body[:80]}'
```

If that returns any rows, the PR is not merge-ready.

## Merge Strategies

### Merge Commit

```bash
# Creates a merge commit, preserves all history
git checkout main
git merge --no-ff feature/my-feature

# Result:
#   * Merge branch 'feature/my-feature'
#   |\
#   | * feat: add feature part 2
#   | * feat: add feature part 1
#   |/
#   * Previous main commit
```

**Use when:**
- Want to preserve complete branch history
- Complex features with meaningful intermediate commits
- Audit trail required

### Squash and Merge

```bash
# Combines all commits into one
git checkout main
git merge --squash feature/my-feature
git commit -m "feat: complete feature implementation"

# Result:
#   * feat: complete feature implementation
#   * Previous main commit
```

**Use when:**
- Feature branch has messy history
- WIP commits, fixups, "oops" commits
- Want clean linear history

### Rebase and Merge

```bash
# Replays commits on top of main
git checkout feature/my-feature
git rebase main
git checkout main
git merge --ff-only feature/my-feature

# Result:
#   * feat: add feature part 2
#   * feat: add feature part 1
#   * Previous main commit
```

**Use when:**
- Clean commit history in feature branch
- Each commit is meaningful and tested
- Want linear history without merge commits

### Comparison

| Strategy | History | Complexity | Traceability |
|----------|---------|------------|--------------|
| Merge | Preserved | High | High |
| Squash | Combined | Low | Medium |
| Rebase | Linear | Low | Medium |

## Automated Checks

### GitHub Actions for PRs

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build

  pr-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check PR size
        run: |
          ADDITIONS=$(gh pr view ${{ github.event.pull_request.number }} --json additions -q '.additions')
          if [ "$ADDITIONS" -gt 1000 ]; then
            echo "::warning::Large PR detected ($ADDITIONS lines). Consider splitting."
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Required Status Checks

```yaml
# Branch protection settings
required_status_checks:
  strict: true
  contexts:
    - lint
    - test
    - build
    - security-scan
```

### CODEOWNERS

```bash
# .github/CODEOWNERS

# Default owners for everything
* @default-team

# Frontend owners
/src/components/ @frontend-team
/src/styles/ @frontend-team @design-team

# Backend owners
/src/api/ @backend-team
/src/database/ @backend-team @dba-team

# DevOps owners
/.github/ @devops-team
/docker/ @devops-team
/terraform/ @devops-team

# Documentation
/docs/ @docs-team
*.md @docs-team

# Security-sensitive files
/src/auth/ @security-team @backend-team
/src/crypto/ @security-team
```

## PR Lifecycle

### States

```
Draft → Ready for Review → Changes Requested → Approved → Merged
         ↑_____________________|
```

### Commands

```bash
# Check PR status
gh pr status
gh pr view 123

# Request review
gh pr edit 123 --add-reviewer "@reviewer1,@reviewer2"

# Mark ready for review
gh pr ready 123

# Convert to draft
gh pr ready 123 --undo

# Approve PR
gh pr review 123 --approve

# Request changes
gh pr review 123 --request-changes --body "Please fix X"

# Merge PR
gh pr merge 123 --squash --delete-branch

# Close without merging
gh pr close 123
```

### Handling Stale PRs

```yaml
# .github/workflows/stale.yml
name: Mark Stale PRs

on:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          stale-pr-message: 'This PR has been inactive for 14 days. Please update or close.'
          days-before-stale: 14
          days-before-close: 7
          stale-pr-label: 'stale'
```

## Conflict Resolution

### Before Merging

```bash
# Update feature branch with latest main
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# If conflicts occur
# 1. Edit conflicting files
# 2. Stage resolved files
git add <resolved-file>
# 3. Continue rebase
git rebase --continue

# Force push (only on feature branches!)
git push --force-with-lease
```

### Merge Conflicts in PR

```bash
# Option 1: Rebase (preferred for clean history)
git checkout feature/my-feature
git fetch origin
git rebase origin/main
# Resolve conflicts
git push --force-with-lease

# Option 2: Merge main into feature
git checkout feature/my-feature
git merge origin/main
# Resolve conflicts
git commit
git push
```

### Commit Before Rebase — Correct Push Ordering

When you have uncommitted local changes that need to be pushed, the order matters:

```bash
# ✅ Correct — commit first, then sync, then push
git add <files>
git commit -m "message"
git fetch origin
git rebase origin/<branch>
git push

# ❌ Wrong — rebase aborts with "please commit your changes or stash them"
git fetch origin
git rebase origin/<branch>   # aborts with error if working tree is dirty
git add <files>
git commit -m "message"
git push                     # rejected as non-fast-forward
```

The "fetch+rebase before push" rule means **before pushing**, not before committing. `git rebase` requires a clean working tree — it aborts with an error when uncommitted changes are present, leaving the branch behind the remote. The subsequent push is then rejected as non-fast-forward, requiring an extra fix cycle.

### `--force-with-lease` Rejected with "stale info"

On PRs that bots touch (auto-approve, Renovate/Dependabot, a CI step that pushes), `git push --force-with-lease` can be rejected with `stale info` even when your local work is correct: a bot updated the remote branch since your last fetch, so the lease's expected ref (your `origin/<branch>` tracking ref) no longer matches and the push aborts. This is the safety check working — don't escalate to plain `--force`.

Fetch, see what arrived, then push — the lease now matches the ref you just fetched:

```bash
BR=feature/my-feature
git fetch origin "$BR"
git log HEAD..origin/"$BR"               # what the bot pushed — safe to discard?
git push --force-with-lease origin "$BR" # lease compares against the fetched tracking ref
```

If a bot keeps pushing inside the fetch→push window so the plain lease never matches, pin it to the head you just inspected. This pins, not skips, the check — it accepts exactly that SHA, so only run it right after the `git log` above confirms those commits are safe to discard:

```bash
git push --force-with-lease="$BR:$(git rev-parse origin/"$BR")" origin "$BR"
```

### Complex Conflicts

```bash
# Use a merge tool
git mergetool

# Or use specific tool
git mergetool --tool=vscode
git mergetool --tool=meld

# Configure default tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

## PR Analytics

### Metrics to Track

1. **PR Size**: Average lines changed
2. **Review Time**: Time from creation to first review
3. **Time to Merge**: Creation to merge
4. **Review Rounds**: Number of change requests
5. **Throughput**: PRs merged per week

### GitHub Insights

```bash
# List PR stats
gh pr list --state merged --json number,title,createdAt,mergedAt,additions,deletions

# PR age analysis
gh pr list --state open --json number,createdAt | jq 'map({number, age: (now - (.createdAt | fromdateiso8601)) / 86400})'
```

## Review Thread Management

### Replying to Review Threads

When addressing review feedback, reply directly to the thread (not a new comment):

```bash
# Find the thread ID for a comment
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --jq '.[] | {id, node_id, body}'

# Reply to a review thread via GraphQL
gh api graphql -f query='
  mutation($body: String!, $threadId: ID!) {
    addPullRequestReviewThreadReply(input: {
      body: $body,
      pullRequestReviewThreadId: $threadId
    }) {
      comment { id }
    }
  }' \
  -f body="Fixed in commit abc123" \
  -f threadId="PRRT_xxxxx"
```

### Resolving Review Threads

After addressing feedback and pushing fixes:

```bash
# Resolve a review thread
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { isResolved }
    }
  }' \
  -f threadId="PRRT_xxxxx"

# List unresolved threads
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 50) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes { body }
            }
          }
        }
      }
    }
  }' -f owner=OWNER -f repo=REPO -F pr=NUMBER
```

## Diagnosing CI Failures (Annotations First)

> Failure first-step, not pre-merge gate. The Merge Gate below uses `annotations_count` as a *warnings present?* signal after success. This section is the inverse: when a workflow has *failed* and you don't yet know why, read the annotation text **first**, before any other diagnostic action.

### Anti-pattern

When a GitHub Actions run fails — especially with `startup_failure`, "no jobs ran", "config invalid", or any failure where the PR summary view shows just a red X with no detail — do **not**:

- Speculate about transient infra issues
- Blame upstream commits or reusable-workflow regressions
- Diff the workflow YAML against the last known good revision
- Re-run the workflow hoping it passes

…before reading the check-runs annotations. The literal validator error is almost always sitting there in one line. Annotations are **invisible in the PR summary view** — they're only rendered in the Actions UI under each job's "Annotations" panel, easy to miss.

### Recipe

```bash
SHA=$(git rev-parse HEAD)  # or the failing commit SHA

# 1. Find every check run on that commit that has annotations
#    {owner}/{repo} are gh api placeholders — auto-resolved from cwd or $GH_REPO
gh api "repos/{owner}/{repo}/commits/$SHA/check-runs" --paginate \
  --jq '.check_runs[] | select(.output?.annotations_count? // 0 > 0) | "\(.id)\t\(.name)"' |
while IFS=$'\t' read -r run_id name; do
  echo "=== $name ==="
  # 2. Print the annotation text (level, file, line, message).
  #    --paginate guards against runs with > 100 annotations (rare for startup
  #    failures, common for linters like reviewdog).
  gh api "repos/{owner}/{repo}/check-runs/$run_id/annotations" --paginate \
    --jq '.[] | "[\(.annotation_level)] \(.path):\(.start_line) \(.message)"'
  echo ""
done
```

Drop this into the troubleshooting flow as **step 0**. If the annotations are empty, *then* fall back to logs (`gh run view RUN_ID --log-failed`) and YAML diffs.

### Real-world example

A reusable-workflow caller failed with `startup_failure` and zero jobs. Multiple turns were spent blaming upstream `netresearch/typo3-ci-workflows@main` commits and even pinning to a known-good SHA as a workaround. The annotation said the actual cause in one line:

> Error calling workflow '...'. The nested job 'preflight' is requesting 'actions: read', but is only allowed 'actions: none'.

Fix: one-line `actions: read` add to the caller's `permissions:` block ([t3x-nr-passkeys-be@0533835](https://github.com/netresearch/t3x-nr-passkeys-be/commit/0533835)). Reading the annotations first would have collapsed a 6-step diagnostic loop into a 2-step fix.

### Relationship to the Merge Gate annotations check

| Stage | Question | Endpoint |
|-------|----------|----------|
| Failure diagnosis (this section) | "Why did the run fail?" | `/check-runs/{id}/annotations` (read messages) |
| Pre-merge gate (below) | "Are there warnings to clear before merging green CI?" | `/commits/{sha}/check-runs` (count > 0) |

Same endpoint family, different question — read the annotation text on failure, count it on success.

## Merge Gate

Before merging any PR, run this gate. If any check fails, stop and fix the underlying issue rather than overriding.

### Pre-Merge Checklist

- [ ] **All review threads resolved** — no unresolved conversations
- [ ] **No ongoing review, and the bot's latest review is on the head commit** (if assigned) — a `copilot_code_review` ruleset can re-block when the head changes; see "Rulesets" below
- [ ] **Rulesets checked** — `gh api repos/{owner}/{repo}/rules/branches/BASE`, not just classic branch protection
- [ ] **Branch rebased on target** — no stray merge commits in PR branch
- [ ] **All CI checks pass** — green status on every required check
- [ ] **No CI annotations** — check job annotations, not just pass/fail (see below)
- [ ] **Signed commits** — every commit in the PR is signed (see "Signing and DCO Failures" below if blocked)
- [ ] **DCO sign-off** — every commit has a `Signed-off-by:` trailer matching `git config user.{name,email}` (required when the `probot/dco` check is enabled)
- [ ] **No intermediate planning artifacts** — `bash skills/git-workflow/scripts/spec-cleanup-guard.sh` exits 0; superpowers specs/plans (`docs/superpowers/**`) and other scratch planning files must not reach the base branch (see "Spec-Cleanup Guard" below and `references/spec-cleanup.md`)

### Auto-Merge / Merge-Queue Arming Gate

`gh pr merge --auto` is a **deferred merge with no human in the loop** — and a
merge queue only re-runs *required checks*; it does **not** wait for review
threads, bot reviews in flight, or Sonar-style informational checks. Arming at
PR creation therefore merges over unaddressed review feedback the moment CI is
green.

Arm auto-merge / enqueue **only when all three hold**:

1. **Zero unresolved review threads** (GraphQL `reviewThreads`, not the UI).
2. **All checks green** — including non-required ones you intend to honor.
3. **No pending review request** (`gh pr view --json reviewRequests` is `[]`)
   — a re-requested bot review that has not landed yet counts as pending.

Bot reviews (Copilot, Gemini) land 2–5 minutes after each push — wait that
window out before concluding "no threads".

**Review on an earlier head + `CLEAN`: decide via the timeline, not the
review list.** After a follow-up push (docs-only changes often do not
re-trigger Copilot), the only review on record may sit on a previous commit
while `mergeStateStatus` reports `CLEAN` off it. Whether that is mergeable
depends on one question: was any review (re)announced *after* the latest
push? The reviews list cannot answer it — query the timeline events:

```bash
R=<owner/repo>; PR=<number>
gh api repos/$R/issues/$PR/timeline --jq \
  '[.[] | select(.event=="review_requested" or .event=="reviewed")
        | {event, actor: (.actor.login // .user.login), at: (.created_at // .submitted_at)}]'
```

- Last `review_requested` is **before** the latest push and a matching
  `reviewed` followed it, no newer request → no review is in flight; the
  old-head review + `CLEAN` is mergeable.
- A `review_requested` **after** the latest push with no `reviewed` yet →
  a review is in flight; wait (see *Never merge over an announced review*).

**Recovery when armed too early:**

```bash
# A PR already picked up by the queue rejects --disable-auto AND branch pushes
# ("Pull request is already queued to merge"). Dequeue it via GraphQL:
PRID=$(gh api graphql -F owner=OWNER -F repo=REPO -F pr=NUMBER \
  -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){id}}}' \
  --jq .data.repository.pullRequest.id)
gh api graphql -F id="$PRID" \
  -f query='mutation($id:ID!){ dequeuePullRequest(input:{id:$id}) { mergeQueueEntry { id } } }'
# Branch is pushable again; fix threads, then re-arm through this gate.
```

### Signing and DCO Failures

When `mergeStateStatus: BLOCKED` and the blocking check is `dco` or a "Commits must have verified signatures" branch-protection rule, act on these in order:

**Step 1 — Verify git identity is correct (not swapped).**
A swapped name/email pair silently produces a malformed `Signed-off-by:` trailer that the DCO bot rejects:

```bash
git config user.name   # must look like "Firstname Lastname", NOT an email address
git config user.email  # must contain "@", NOT a plain name

# Fix if swapped:
git config --global user.name "Firstname Lastname"
git config --global user.email "you@example.com"
```

**Step 2 — Add missing sign-offs to all commits in the branch.**
Rebase with `--exec` to amend every commit at once. Use `--signoff` for DCO, `-S` for signature, or both:

```bash
# Both DCO sign-off and GPG/SSH signature in one pass:
git rebase origin/main --exec 'git commit --amend --no-edit --signoff -S'
git push --force-with-lease
```

**Step 3 — If signatures still show `reason: unknown_key`, the SSH key is not registered as a *Signing Key* on GitHub.**
Auth keys and signing keys are separate registrations. An authentication key cannot verify commits:

```bash
# Check commit verification after pushing:
gh api /repos/{owner}/{repo}/commits/HEAD --jq '.commit.verification | {verified, reason}'
# "reason":"valid"        → OK
# "reason":"unknown_key"  → key is not registered as a signing key
# "reason":"unsigned"     → -S flag was not used or signing config is missing
```

If `unknown_key`: go to *github.com → Settings → SSH and GPG keys*, find your key, and add it again under *New signing key* (same public key, different "Key type"). After adding, re-verify with the API call above.

### Merge-Gate Command

```bash
# The gate is TWO queries. `reviewThreads` is NOT a valid `gh pr view --json`
# field — gh errors "Unknown JSON field: reviewThreads" (its whitelist has
# reviews / reviewRequests / reviewDecision, not reviewThreads), and passing it
# fails the WHOLE call. Thread resolution is only available via GraphQL.
#
# (1) PR-level fields via gh pr view (--json takes a no-spaces comma list):
gh pr view NUMBER --json reviewDecision,mergeStateStatus,mergeable,statusCheckRollup

# (2) unresolved-thread count via GraphQL (must be 0):
gh api graphql -f query='{repository(owner:"OWNER",name:"REPO"){pullRequest(number:NUMBER){
  reviewThreads(first:100){nodes{isResolved}}}}}' \
  --jq '[.data.repository.pullRequest?.reviewThreads?.nodes[]? | select(.isResolved==false)] | length'

# Merge-ready requires ALL of:
#   reviewDecision                            == "APPROVED" OR "" (empty = no
#                                                human-approval rule; CLEAN then
#                                                already encodes the gate — do
#                                                NOT treat "" as a blocker)
#   mergeStateStatus                          == "CLEAN"
#   mergeable                                 == "MERGEABLE"
#   every statusCheckRollup[].conclusion      == "SUCCESS"
#   unresolved-thread count (query 2)         == 0
```

**The gate and the merge are two separate invocations.** Run the gate query,
read its output, and only then issue `gh pr merge` as a new command. Never
chain them (`gate-query && gh pr merge`, or query-then-merge in one
heredoc/compound command): shell chaining decides on **exit codes**, not on
the gate's content — `gh pr view` exits 0 whether it reports zero unresolved
threads or three, so the merge fires before anyone has read the gate's
output. And `mergeStateStatus: CLEAN` does **not** imply zero unresolved
threads — GitHub only couples the two when the "require conversation
resolution" branch-protection rule is enabled, which most repos don't turn on.

```bash
# ❌ Wrong — merge already executed by the time the gate output is visible
gh pr view 42 --json mergeStateStatus && gh pr merge 42 --merge

# ✅ Right — run the gate queries, READ the output, then merge as a new command
gh pr view 42 --json reviewDecision,mergeStateStatus,mergeable,statusCheckRollup
gh api graphql -f query='{repository(owner:"OWNER",name:"REPO"){pullRequest(number:42){reviewThreads(first:100){nodes{isResolved}}}}}' --jq '[.data.repository.pullRequest?.reviewThreads?.nodes[]?|select(.isResolved==false)]|length'
# READ both: all threads resolved (count 0)? all checks green? Only then:
gh pr merge 42 --merge
```

#### Diagnosing `mergeStateStatus: BLOCKED`

`BLOCKED` tells you the PR is not mergeable; it never tells you **why**. Derive the cause from the gate fields above — not from the branch-protection / ruleset inventory (`gh api repos/{repo}/rules/branches/{branch}` or `…/branches/{branch}/protection`). That inventory lists which rules *exist*, not which one is *currently failing*; reading "copilot_code_review is configured" and concluding "Copilot is blocking" is a classic false attribution. Walk the decisive evidence in this order:

| Symptom in the gate output | Actual blocker |
|---|---|
| `reviewDecision: "REVIEW_REQUIRED"` | a required approving review is missing — request/await it |
| `reviewDecision: ""` **and** still BLOCKED | **not** a review-approval block — keep looking (this is the field that disproves "a reviewer is blocking it") |
| any `statusCheckRollup[].conclusion != "SUCCESS"` (incl. pending) | a required check — name *that* check, not a rule |
| `reviewThreads[].isResolved == false` exists | unresolved conversations + the repo's `required_conversation_resolution` toggle — resolve the threads |
| all the above clean, still BLOCKED | branch behind base (needs update), or merge-queue / required-deployment gate |

When unsure which protection toggle couples to the symptom, read it directly: `gh api repos/{repo}/branches/{branch}/protection --jq '{conversation: .required_conversation_resolution, reviews: .required_pull_request_reviews, checks: .required_status_checks.contexts, strict: .required_status_checks.strict}'`. State the cause only once you can point at the field that proves it.

The PR-level gate above covers review decision, merge state, required checks, and thread resolution in one response. A second check is needed for CI annotations (warnings — reviewdog / actionlint / CodeQL deprecations — that don't fail their check but still need addressing). These are a commit-level property, not a PR-level one:

```bash
gh api "repos/{owner}/{repo}/commits/SHA/check-runs" \
  --jq '.check_runs[] | select(.output.annotations_count > 0) | {name: .name, annotations: .output.annotations_count}'
```

> **Important:** CI annotations are invisible in the PR summary view but visible in the job detail "Annotations" section on the Files Changed tab. Always check for annotations before declaring a PR clean.

For automated enforcement at tool-invocation time, see the `merge-gate.sh` hook recipe in `references/claude-code-hooks.md`. The hook enforces the **runtime-checkable subset** — `reviewDecision`, `mergeStateStatus`, and unresolved thread count — which covers the most common block reasons. Signed-commits and CI-annotations checks are not enforced by the hook (annotations in particular require the commit-level API call above); rely on the repo's branch-protection rules and local pre-commit hook for those.

> **Important:** CI checks can PASS while emitting warning annotations (e.g., actionlint/shellcheck via reviewdog, CodeQL deprecation notices). These are invisible in the PR summary view but visible in the job detail "Annotations" section. Always check for annotations before declaring a PR clean.

### Spec-Cleanup Guard

Intermediate planning artifacts (superpowers specs/plans, ad-hoc `PLAN.md`,
planning-tool output) must not ride into the base branch. The guard is
deterministic and **read-only** — it detects and reports, never deletes.

```bash
# Exit 0 = clean; exit 1 = artifacts found (resolve before merge); exit 2 = config error.
bash skills/git-workflow/scripts/spec-cleanup-guard.sh
```

If it exits 1, resolve via the `/pr-finish` spec-cleanup step (convert to an ADR /
remove / acknowledge) so the branch is clean, then re-run. Full capability —
config, three-state detection, Capture flow — is in `references/spec-cleanup.md`.

### Rulesets: the gate `gh pr view` doesn't show

`mergeStateStatus: BLOCKED` with `reviewDecision: ""`, every check green, and
every thread resolved almost always means a **repository ruleset** — rulesets
are evaluated for merge but are invisible to both the merge-gate `gh pr view`
and the classic `branches/{branch}/protection` API. Don't discover this by
trial-and-error; fetch the *effective* rules as part of the gate:

```bash
# gh resolves {owner}/{repo} from git context but NOT the branch — fill in BASE,
# the branch you merge INTO (e.g. main / develop), not the feature branch.
# The endpoint returns an array of rule objects, so group_by(.type) works:
gh api repos/{owner}/{repo}/rules/branches/BASE \
  --jq 'group_by(.type)[] | {type: .[0].type, n: length}'
```

The common culprit is a `copilot_code_review` rule: it requires a Copilot
review on the **latest commit**. A push *may* trigger a fresh review, but not
always, and Copilot is not reliably re-requested automatically — so never
assume the review state tracks your latest commit. If the gate is blocked and
the bot's latest review is on a commit that predates the head, re-request
explicitly, then re-poll the gate:

```bash
gh api repos/{owner}/{repo}/pulls/NUMBER/requested_reviewers \
  -X POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]'
```

(`gh pr edit --add-reviewer` rejects the bot login with "Could not resolve
user"; the REST `requested_reviewers` endpoint is the working path.)

**Always check for an ongoing review before merging — don't merge on a
transient `CLEAN`.** A bot review can be *in progress* (after a re-request, and
sometimes after a push): `mergeStateStatus` can read `CLEAN` for a few seconds
before the bot posts its comments, and merging then strands fresh review
threads on a closed PR. A **pending review request is the in-progress signal** —
treat the PR as not ready while it persists. Poll until the request clears
*and* the bot's latest review matches the head commit `oid`:

```bash
gh api graphql -f query='{repository(owner:"OWNER",name:"REPO"){pullRequest(number:NUMBER){
  headRefOid
  reviewRequests(first:10){nodes{requestedReviewer{... on Bot{login} ... on User{login}}}}
  reviews(last:20){nodes{author{login} state commit{oid}}}}}}'  # last:N must exceed the review count
# Ready only when: no pending reviewRequests AND the bot's latest review.commit.oid == headRefOid.
```

Other ruleset rules to expect: `required_approving_review_count`, `required_review_thread_resolution`, `non_fast_forward`.

> **Front-load the whole picture.** Gather merge state, checks, rulesets,
> requested reviewers, and thread IDs in one mechanical block before reasoning
> about merge-readiness — see the Merge-Gate Command above plus this ruleset
> call. Discovering gates one round-trip at a time is the anti-pattern.

## Signed Commits with Rebase Merge

### The Problem

When a repository requires:
1. Signed commits AND
2. Only rebase merge (no merge commits, no squash)

GitHub **cannot** sign rebased commits automatically:

```bash
gh pr merge 123 --rebase
# Error: Base branch requires signed commits.
# Rebase merges cannot be automatically signed by GitHub.
```

### The Solution: Local Fast-Forward Merge

Since commits are already signed locally, merge locally and push:

```bash
# 1. Ensure local main is up to date
git checkout main
git pull origin main

# 2. Verify feature branch is rebased (should be fast-forward)
git log --oneline main..feature-branch

# 3. Fast-forward merge (preserves original signatures)
git merge feature-branch --ff-only

# 4. Push to main
git push origin main

# 5. Close the PR (it will auto-close if commits match)
# Or manually: gh pr close NUMBER
```

### Why This Works

- Original commits retain their GPG/SSH signatures
- Fast-forward merge doesn't create new commits
- GitHub recognizes the commits and auto-closes the PR

### When to Use

| Scenario | Solution |
|----------|----------|
| Signed commits required + squash allowed | `gh pr merge --squash` (GitHub signs) |
| Signed commits required + merge commit allowed | `gh pr merge --merge` (GitHub signs merge commit) |
| Signed commits required + rebase only | Local fast-forward merge (this solution) |

### Automation Option

```bash
#!/bin/bash
# merge-signed-pr.sh - Merge PR with signed commits via fast-forward

PR_NUMBER=$1
BRANCH=$(gh pr view $PR_NUMBER --json headRefName -q '.headRefName')

git fetch origin
git checkout main
git pull origin main

# Verify it's a fast-forward
if ! git merge-base --is-ancestor main origin/$BRANCH; then
    echo "Error: Branch needs rebase first"
    exit 1
fi

git merge origin/$BRANCH --ff-only
git push origin main

echo "PR #$PR_NUMBER merged via fast-forward"
```

## Full PR Lifecycle Checklist

Complete end-to-end workflow for merging a PR, from CI verification through post-merge cleanup.

### 1. Verify CI Status

```bash
# Check all checks
gh pr checks <NUMBER>

# If failing, get detailed error logs
gh run view <RUN_ID> --log-failed 2>&1 | grep "There were"

# Check annotations (warnings that don't block but should be fixed)
gh api "repos/OWNER/REPO/commits/SHA/check-runs" \
  --jq '.check_runs[] | select(.output.annotations_count > 0) | {name, annotations: .output.annotations_count}'
```

### 2. Resolve Review Comments

**Work threads the moment they land — decoupled from CI.** Review comments
are workable input 2–5 minutes after a push; there is no reason to wait for
the full check matrix before starting on them. Poll `reviewThreads`
independently of `gh pr checks` (a watcher that gates thread reporting on
"all checks settled" hides actionable feedback for the length of the longest
job). Bot reviews also race your pushes: a thread may flag code a commit you
just pushed already fixed — answer it with the fixing SHA and resolve; no
churn needed.

```bash
# List unresolved threads
gh api graphql -f query='query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: NUMBER) {
      reviewThreads(first: 30) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes { body author { login } }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {id, author: .comments.nodes[0].author.login, comment: .comments.nodes[0].body[:100]}'

# Reply to a thread
gh api graphql -f query='mutation($body: String!, $id: ID!) {
  addPullRequestReviewThreadReply(input: {body: $body, pullRequestReviewThreadId: $id}) {
    comment { id }
  }
}' -f body="Fixed in latest commit." -f id="PRRT_xxx"

# Resolve a thread
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "PRRT_xxx"}) { thread { isResolved } } }'
```

### 3. Merge

```bash
# Auto-detect merge strategy and queue.
# Prefer atomic-history methods; NEVER auto-pick squash (see "Never squash
# unless the user asks" above). Squash is selected only if it is the sole
# method the repo allows — and then warn, because it rewrites history.
STRATEGY=$(gh api "repos/OWNER/REPO" --jq '
  if .allow_merge_commit then "--merge"
  elif .allow_rebase_merge then "--rebase"
  elif .allow_squash_merge then "--squash"
  else "" end') || { echo "ERROR: could not query repo merge methods" >&2; exit 1; }
# Fail fast rather than fall through to gh's default method (which may be squash).
[ -z "$STRATEGY" ] && { echo "ERROR: no merge method enabled on this repo" >&2; exit 1; }
[ "$STRATEGY" = "--squash" ] && echo "WARNING: only squash is enabled — this rewrites history and drops signatures" >&2
gh pr merge <NUMBER> --auto "$STRATEGY"

# For repos with merge queue, queue it — but ONLY after passing the
# "Auto-Merge / Merge-Queue Arming Gate" above (the queue ignores
# unresolved review threads and in-flight bot reviews).
gh pr merge <NUMBER> --auto
```

### 4. Post-Merge Cleanup

```bash
# Switch to main and pull
git checkout main && git pull

# Delete local feature branch
git branch -d <branch-name>

# Remote branch is auto-deleted if repo setting enabled, otherwise:
git push origin --delete <branch-name>
```

### Common Blockers

| Blocker | Diagnosis | Fix |
|---------|-----------|-----|
| `REVIEW_REQUIRED` but no pending reviewers | Auto-approve raced with Copilot review | Re-run PR Quality Gates workflow |
| `BLOCKED` with all checks green | Unresolved review threads (even from old commits) | Resolve all threads via GraphQL |
| Auto-merge dropped after push | New commits nullify `autoMergeRequest` | Re-queue with `gh pr merge --auto` |
| CI annotations but status green | Reviewdog warnings don't block by default | Fix annotations or set `fail_level: error` |
| `startup_failure` / "no jobs ran" / config invalid | Workflow validator rejected the run before any job started | Read annotations first (see [Diagnosing CI Failures (Annotations First)](#diagnosing-ci-failures-annotations-first) above) — the literal validator error is in one line |
