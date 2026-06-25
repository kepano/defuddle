# Commit Conventions

## Conventional Commits

### Specification

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | - |
| `style` | Code style (formatting) | - |
| `refactor` | Code refactoring | - |
| `perf` | Performance improvement | PATCH |
| `test` | Adding/updating tests | - |
| `build` | Build system changes | - |
| `ci` | CI configuration | - |
| `chore` | Maintenance tasks | - |
| `revert` | Reverting changes | - |

### Examples

```bash
# Simple feature
feat: add user authentication

# Feature with scope
feat(auth): add OAuth2 login support

# Bug fix
fix: resolve null pointer in user service

# Bug fix with issue reference
fix(api): handle empty response from external service

Fixes #123

# Breaking change
feat!: remove deprecated v1 API endpoints

BREAKING CHANGE: The /api/v1/* endpoints have been removed.
Migrate to /api/v2/* before upgrading.

# Multiple footers
fix(security): patch XSS vulnerability in comment parser

Reviewed-by: John Doe
Refs: #456
```

### Scope Guidelines

Scopes should be consistent across the project:

```bash
# By feature area
feat(auth): ...
feat(payment): ...
feat(notification): ...

# By layer
fix(api): ...
fix(db): ...
fix(ui): ...

# By component
style(button): ...
refactor(modal): ...
```

## Commit Message Best Practices

### Subject Line

```bash
# ✅ Good: Imperative mood, present tense
feat: add password reset functionality
fix: prevent duplicate form submissions

# ❌ Bad: Past tense, not imperative
feat: added password reset functionality
fix: fixed duplicate form submissions

# ✅ Good: Specific and concise
feat: implement rate limiting for API endpoints

# ❌ Bad: Vague
feat: improve API

# ✅ Good: Under 72 characters
fix: resolve race condition in cache invalidation

# ❌ Bad: Too long
fix: resolve the race condition that was occurring in the cache invalidation process when multiple users were accessing the same resource simultaneously
```

### Body

```bash
# When to include a body:
# - Complex changes needing explanation
# - Non-obvious implementation choices
# - Context for future readers

fix: prevent race condition in order processing

The previous implementation allowed concurrent modifications to the
same order, leading to inconsistent state.

This change introduces optimistic locking using version numbers.
When a conflict is detected, the operation is retried with fresh data.

The retry limit is set to 3 attempts to prevent infinite loops.
```

**Write multi-line or special-char bodies to a file, not inline `-m`.** The shell parses a double-quoted `-m "..."` before git sees it: an *unescaped* `"` in the body closes the string early, after which a bare `&` backgrounds the fragment and the message silently truncates (a tell-tale `... command not found` may scroll past). Even with the quotes balanced, the shell still expands `$var`, `` `cmd` ``/`$(...)`, and backslashes inside double quotes, so a body containing those is altered. A file or a *single-quoted* heredoc (`<<'EOF'`) sidesteps all of it — the text is passed verbatim:

```bash
git commit -S --signoff -F - <<'EOF'
fix: prevent race condition in order processing

Body may contain "quotes", & ampersands, `backticks` — all literal.
EOF
```

### Footer

```bash
# Issue references
fix: resolve login timeout

Fixes #123
Closes #456

# Breaking changes
feat!: update authentication API

BREAKING CHANGE: The `authenticate()` method now returns a Promise
instead of using callbacks. Update all call sites to use async/await.

# Co-authors
feat: implement new dashboard

Co-authored-by: Jane Doe <jane@example.com>
Co-authored-by: John Smith <john@example.com>

# Review references
fix: patch security vulnerability

Reviewed-by: Security Team
Approved-by: @security-lead
```

## Atomic Commits

### Principles

1. **One logical change per commit**
2. **Each commit should compile/pass tests**
3. **Related changes grouped together**
4. **Unrelated changes in separate commits**

### Examples

```bash
# ❌ Bad: Multiple unrelated changes
git add .
git commit -m "feat: add login page and fix typo in readme and update deps"

# ✅ Good: Separate commits
git add src/pages/Login.tsx src/components/LoginForm.tsx
git commit -m "feat(auth): add login page with form validation"

git add README.md
git commit -m "docs: fix typo in installation instructions"

git add package.json package-lock.json
git commit -m "build: update dependencies to latest versions"
```

### Interactive Staging

```bash
# Stage specific hunks
git add -p

# Options:
# y - stage this hunk
# n - skip this hunk
# s - split into smaller hunks
# e - manually edit hunk
# q - quit

# Stage specific files
git add src/feature/
git commit -m "feat: add feature files"

git add tests/feature/
git commit -m "test: add tests for feature"
```

## Commit Templates

### Setup

```bash
# Create template file
cat > ~/.gitmessage << 'EOF'
# <type>(<scope>): <subject>
# |<----  Using a Maximum Of 50 Characters  ---->|

# Explain why this change is being made
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|

# Provide links or keys to any relevant tickets, articles or other resources
# Example: Fixes #23

# --- COMMIT END ---
# Type can be:
#   feat     (new feature)
#   fix      (bug fix)
#   docs     (changes to documentation)
#   style    (formatting, missing semi colons, etc; no code change)
#   refactor (refactoring production code)
#   test     (adding missing tests, refactoring tests; no production code change)
#   chore    (updating grunt tasks etc; no production code change)
#   perf     (performance improvements)
#   ci       (CI configuration)
#   build    (build system changes)
# --------------------
EOF

# Configure git to use template
git config --global commit.template ~/.gitmessage
```

### Project-Specific Template

```bash
# .gitmessage in project root
# <type>(<scope>): <subject>

# Body: Explain the motivation for the change

# Footer:
# Fixes #issue
# BREAKING CHANGE: description

# ---
# Remember:
# - Use present tense ("add" not "added")
# - Use imperative mood ("move" not "moves")
# - First line max 50 chars, body wrap at 72
# - Reference issues and PRs at the bottom
```

## Commit Message Validation

### Git Hook (commit-msg)

```bash
#!/bin/bash
# .git/hooks/commit-msg

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Skip merge commits
if echo "$commit_msg" | grep -qE "^Merge"; then
    exit 0
fi

# Conventional commit pattern
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?(!)?: .{1,50}"

if ! echo "$commit_msg" | head -1 | grep -qE "$pattern"; then
    echo "ERROR: Invalid commit message format"
    echo ""
    echo "Expected: <type>(<scope>): <subject>"
    echo "  type:    feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
    echo "  scope:   optional, lowercase with hyphens"
    echo "  subject: max 50 chars, imperative mood"
    echo ""
    echo "Your message:"
    echo "  $(head -1 "$commit_msg_file")"
    exit 1
fi

# Check subject line length
subject=$(echo "$commit_msg" | head -1)
if [ ${#subject} -gt 72 ]; then
    echo "ERROR: Subject line too long (${#subject} > 72 chars)"
    exit 1
fi

# Check for trailing period
if echo "$subject" | grep -qE "\.$"; then
    echo "ERROR: Subject line should not end with a period"
    exit 1
fi

exit 0
```

### commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', [
            'feat', 'fix', 'docs', 'style', 'refactor',
            'perf', 'test', 'build', 'ci', 'chore', 'revert'
        ]],
        'scope-case': [2, 'always', 'kebab-case'],
        'subject-case': [2, 'always', 'lower-case'],
        'subject-max-length': [2, 'always', 72],
        'body-max-line-length': [2, 'always', 100],
    },
};
```

```json
// package.json
{
    "husky": {
        "hooks": {
            "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
        }
    }
}
```

## Semantic Release Integration

### Configuration

```json
// .releaserc
{
    "branches": ["main"],
    "plugins": [
        ["@semantic-release/commit-analyzer", {
            "preset": "conventionalcommits",
            "releaseRules": [
                {"type": "feat", "release": "minor"},
                {"type": "fix", "release": "patch"},
                {"type": "perf", "release": "patch"},
                {"type": "revert", "release": "patch"},
                {"breaking": true, "release": "major"}
            ]
        }],
        ["@semantic-release/release-notes-generator", {
            "preset": "conventionalcommits"
        }],
        "@semantic-release/changelog",
        "@semantic-release/npm",
        "@semantic-release/github"
    ]
}
```

### Version Bumping

```bash
# These commits determine version bumps:

# PATCH (1.0.x)
fix: correct typo in error message
perf: optimize database query

# MINOR (1.x.0)
feat: add user profile page
feat(api): implement caching layer

# MAJOR (x.0.0)
feat!: redesign authentication system
fix!: change API response format

BREAKING CHANGE: Response format changed from XML to JSON
```

## Rewriting History

### Amending Commits

```bash
# Fix last commit message
git commit --amend -m "feat: correct commit message"

# Add files to last commit
git add forgotten-file.js
git commit --amend --no-edit

# Change author
git commit --amend --author="Name <email@example.com>"
```

### Interactive Rebase

```bash
# Rewrite last 5 commits
git rebase -i HEAD~5

# Commands in editor:
# pick   - use commit
# reword - edit message
# edit   - stop and amend
# squash - combine with previous
# fixup  - combine, discard message
# drop   - remove commit

# Example: Squash fixup commits
pick abc1234 feat: add user API
fixup def5678 fixup! feat: add user API
pick ghi9012 feat: add admin API
```

### Fixup Commits

```bash
# Create fixup commit
git add .
git commit --fixup=abc1234

# Auto-squash during rebase
git rebase -i --autosquash main
```

## Best Practices Summary

1. **Write meaningful messages**: Future you will thank present you
2. **Use conventional commits**: Enable automated versioning
3. **Keep commits atomic**: One logical change per commit
4. **Reference issues**: Link commits to project management
5. **Use scopes consistently**: Help with changelog generation
6. **Don't include generated files**: Keep commits focused on source changes
7. **Always sign + signoff**: `git commit -S --signoff` — see next section

## Signed Commits + DCO Sign-Off (Required)

Run every commit with both flags explicit:

```bash
git commit -S --signoff -m "feat: add login endpoint"
```

**Why explicit `-S`.** Git honors `commit.gpgsign=true` only when the configuration is actually loaded. Subprocess environments (CI runners, some IDEs, tools that set their own `$HOME` or scrub env) can miss the global config — and without the config, git doesn't even *try* to sign. Git records the commit as unsigned with no error, because from its perspective signing was never requested. Explicit `-S` pins the requirement to the invocation: now git *always* attempts to sign, and if the signing agent (gpg-agent, or ssh-agent when using `gpg.format=ssh`) or its pinentry prompt is unreachable, the commit aborts noisily. You find out now, not when branch protection rejects the push later.

**Why `--signoff`.** Adds the `Signed-off-by:` trailer. Required for DCO compliance on any repo that has the DCO check enabled (most netresearch repos do).

**Sign-off identity must match `git config user.{name,email}`.** Mismatched identities fail the DCO check with an unhelpful "signoff required" error. Validate before the first commit in a new worktree — and specifically check that the values are not swapped (an email address in `user.name` is a silent misconfiguration that produces a malformed `Signed-off-by:` trailer):

```bash
git config user.name   # must look like "Firstname Lastname", NOT an email address
git config user.email  # must contain "@", NOT a plain name

# Fix if swapped:
git config --global user.name "Firstname Lastname"
git config --global user.email "you@example.com"
```

**Commit locally to satisfy verified-signature branch protection — not via the host's Contents API.** Commits created through the GitHub Contents API (`PUT /repos/.../contents/...`), or any host-side write that supplies its own `committer`/`author`, come out **unsigned** (`verification.verified=false`, `reason: unsigned`) — the host does not web-flow-sign them. A repo that enforces verified signatures rejects the merge, and when admin enforcement is on you cannot bypass it. So when scripting commits across many repos, check the signature requirement up front alongside required checks and reviews:

```bash
gh api repos/"$R"/branches/main/protection \
  --jq '.required_signatures?.enabled? // false'   # $R="owner/repo"; also inspect rulesets
```

For any repo that enforces signatures, create the commit **locally** with signing configured (`git commit -S --signoff`) rather than through the API — a locally SSH/GPG-signed commit verifies on the host, an API-authored one does not.

**SSH signing keys on GitHub: auth keys ≠ signing keys.** An SSH key registered under *Settings → SSH and GPG keys → Authentication Key* cannot verify commits. It must also be added as a *Signing Key* (same page, different Key type dropdown). GitHub reports unsigned-with-known-key commits as `reason: unknown_key` in the commits API — identical to an unregistered key. Check before the first push to a repo with verified-signature branch protection:

```bash
# Verify the key is registered as a signing key (requires admin:ssh_signing_key token scope):
gh auth refresh -h github.com -s admin:ssh_signing_key
gh api /user/ssh_signing_keys --jq '.[].key'

# Or check commit verification after pushing one commit:
gh api /repos/{owner}/{repo}/commits/HEAD --jq '.commit.verification | {verified, reason}'
# "reason":"valid"        → OK
# "reason":"unknown_key"  → key not registered as signing key
# "reason":"unsigned"     → -S flag not used or signing config missing
```

**Trust the inherited ssh-agent; don't hunt for sockets.** When commits are SSH-signed through a running ssh-agent, the `SSH_AUTH_SOCK` already present in the inherited shell environment normally holds the signing key and works transparently. Do **not** reflexively export a hardcoded `SSH_AUTH_SOCK` or probe the filesystem for agent sockets — a stale or wrong socket path overrides the working inherited one and breaks signing that would otherwise have succeeded. If signing actually fails (`failed to write commit object`, `error: gpg failed to sign the data`, or a `publickey` error), stop and surface the error to the operator rather than autonomously searching for the "right" socket.

**Never amend a commit with pre-commit-hook failures.** If the pre-commit hook fails, the commit **did not happen**. Running `git commit --amend` then modifies the PREVIOUS commit, which can destroy work. Fix the hook issue, re-stage, and create a new commit.

**Never skip hooks** unless explicitly told to. `--no-verify` bypasses hook enforcement that exists for good reasons. If a hook fails, diagnose the root cause.

**Never bypass signing** unless explicitly told to. `--no-gpg-sign` and `-c commit.gpgsign=false` disable commit signing; the result will fail branch-protection or policy checks that require signed commits later.

**Verify signing capability without committing on `main`.** To check that signing
actually works (right key, agent reachable), do **not** create a probe commit on the
default branch — even an immediately-reset `git commit --allow-empty -S` on `main` is a
transient commit on a protected branch and violates "no direct commits to main". Inspect
configuration instead, no commit required:

```bash
git config commit.gpgsign     # expect: true
git config gpg.format         # ssh (SSH signing) or empty (GPG)
git config user.signingkey    # the key/path that will be used
```

If you must actually exercise the signing path, do it on a throwaway branch and discard it:

```bash
git switch -c tmp/sign-probe
git commit --allow-empty -S -m "chore: signing probe" && git log -1 --format='%G?'   # conventional msg so a commit-msg hook won't reject it; expect: G
git switch - && git branch -D tmp/sign-probe
```

## Atomic Commits

Each commit should be a **single, self-contained logical change** that builds and passes tests independently.

**Good:**

- `feat: add user authentication endpoint` (one feature, complete)
- `fix: correct SAML attribute name mapping` (one bug, fixed)
- `chore(deps): bump go-ldap/ldap/v3 from 3.4.8 to 3.4.11` (one bump)

**Bad:**

- `feat: add auth + fix typo + update deps` (three unrelated concerns)
- `wip` / `fixup` (leftover scratch commits)

Rewrite messy history before opening the PR:

```bash
git rebase -i main        # interactive, squash / reword / reorder
git rebase -i --autosquash main   # auto-pick fixup!/squash! commits
```

## Push Upstream on First Push

When pushing a new branch for the first time, set upstream tracking with `-u`:

```bash
git push -u origin feature-branch
```

This makes subsequent `git pull` / `git push` work without specifying remote+branch. Without `-u`, everyone who clones the branch later has to set it up themselves.
