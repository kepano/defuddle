# Code Quality Tools

Shell linting, formatting, smart fixup commits, and structural diffs.

## shellcheck - Shell Script Linter

### Rule Categories

| Prefix | Category | Examples |
|--------|----------|----------|
| SC1xxx | Syntax errors | SC1009 (missing `$` on variable), SC1073 (couldn't parse) |
| SC2xxx | Suggestions/warnings | SC2086 (double quote to prevent globbing), SC2046 (quote to prevent splitting) |
| SC3xxx | Portability | SC3010 (`[[ ]]` not POSIX), SC3030 (arrays not POSIX) |
| SC4xxx | Deprecation | Deprecated features that should be avoided |

### .shellcheckrc Configuration

Place `.shellcheckrc` in the project root:

```ini
# Default shell dialect
shell=bash

# Globally disabled rules
disable=SC1091  # Don't follow sourced files
disable=SC2154  # Referenced but not assigned (common with env vars)

# Enable optional checks
enable=require-variable-braces
enable=check-unassigned-uppercase
```

### Common Rules and Fixes

```bash
# SC2086: Double quote to prevent globbing and word splitting
# Bad:
echo $var
# Good:
echo "$var"

# SC2046: Quote command substitution to prevent splitting
# Bad:
files=$(find . -name "*.sh")
# Good:
files="$(find . -name "*.sh")"

# SC2155: Declare and assign separately to avoid masking return values
# Bad:
local foo="$(mycmd)"
# Good:
local foo
foo="$(mycmd)"

# SC2164: Use cd ... || exit to handle cd failure
# Bad:
cd /some/dir
# Good:
cd /some/dir || exit 1
```

### Gotcha: Command Substitution with Empty Output

`set -e` fires when `var=$(failing_cmd)` — the assignment propagates the non-zero exit code and
aborts the script. **However**, `set -e` cannot detect a command that exits 0 but produces
**no output**. An empty variable is a valid result from the shell's point of view. No shellcheck
rule covers this case for regular (non-`local`) variables.

This means downstream code that uses `$var` without checking can silently misbehave. A common
consequence: an empty variable interpolated into a refspec becomes an accidental delete operation.

```bash
# Silent failure — git commit-tree succeeds but produces no output
# (e.g. tree already exists, permission issue, or wrong arguments).
# set -e does NOT fire here. commit is empty string "".
commit=$(git commit-tree "$tree" -p "$parent" -m "msg")

# Downstream: the empty commit SHA becomes a delete refspec.
# This pushes ":refs/tags/v1.0" — which DELETES the tag on the remote.
git push origin "${commit}:refs/tags/v1.0"
```

Always add an explicit empty-value guard after command substitution whose output is load-bearing:

```bash
tag="v1.0"
commit=$(git commit-tree "$tree" -p "$parent" -m "msg")
if [ -z "${commit}" ]; then
  echo "ERROR: git commit-tree produced no output for tag ${tag}" >&2
  exit 1   # or: continue, if inside a loop
fi
git push origin "${commit}:refs/tags/${tag}"
```

Note: SC2155 (`Declare and assign separately to avoid masking return values`) only applies to
`local var=$(cmd)` — where the `local` builtin masks the exit code. For plain `var=$(cmd)`, the
exit code is propagated and `set -e` works normally. The empty-output case is distinct and not
covered by any shellcheck rule.

### CI Integration

```yaml
# GitHub Actions - shellcheck
- name: Run shellcheck
  uses: ludeeus/action-shellcheck@00cae500b08a931fb5698e11e79bfbd38e612a38 # v2.0.0
  with:
    scandir: './scripts'
    severity: warning
```

---

## shfmt - Shell Script Formatter

### Flag Reference

| Flag | Description | Example |
|------|-------------|---------|
| `-w` | Write result to file (in-place) | `shfmt -w script.sh` |
| `-d` | Display diff (error if not formatted) | `shfmt -d script.sh` |
| `-i N` | Indent with N spaces (0 = tabs) | `shfmt -i 2 script.sh` |
| `-bn` | Binary ops like `&&` and `\|` may start a line | `shfmt -bn script.sh` |
| `-ci` | Indent switch cases | `shfmt -ci script.sh` |
| `-sr` | Redirect operators followed by a space | `shfmt -sr script.sh` |
| `-fn` | Function opening brace on a separate line | `shfmt -fn script.sh` |
| `-ln` | Language variant: `bash`, `posix`, `mksh`, `bats` | `shfmt -ln bash script.sh` |

### EditorConfig Integration

shfmt reads `.editorconfig` settings automatically:

```ini
# .editorconfig
[*.sh]
indent_style = space
indent_size = 2
shell_variant = bash
binary_next_line = true
switch_case_indent = true
space_redirects = true
```

When an `.editorconfig` is present, run `shfmt -w .` without explicit flags.

### CI Integration

```yaml
# GitHub Actions - shfmt
- name: Check shell formatting
  uses: mvdan/sh@8202166b7d1e3473a7c65eeac53ddbdb55d5b808 # v3.12.0
  with:
    sh-version: latest
    args: '-d -i 2 .'
```

---

## git-absorb - Smart Fixup Commits

### How It Works

1. You stage changes with `git add` (the fixes you want to absorb)
2. `git absorb` analyzes the staged hunks
3. For each hunk, it finds the most recent commit that modified those exact lines
4. It creates `fixup!` commits targeting those parent commits
5. `git rebase --autosquash` folds the fixup commits into their targets

### Typical Workflow

```bash
# 1. You have a feature branch with 5 commits
# 2. Code review requests changes to lines in commits 2 and 4
# 3. Make the fixes in your working tree
# 4. Stage them
git add -p

# 5. Let git-absorb figure out which commits they belong to
git absorb

# 6. Verify the fixup commits look correct
git log --oneline main..HEAD

# 7. Squash fixups into their parent commits
git rebase --autosquash main

# 8. Force-push the cleaned-up branch
git push --force-with-lease
```

### Comparison with Manual Fixup Workflow

| Step | Manual | git-absorb |
|------|--------|------------|
| Identify target commit | `git log --oneline`, find SHA | Automatic |
| Create fixup commit | `git commit --fixup=<SHA>` | `git absorb` |
| Apply fixups | `git rebase --autosquash main` | `git absorb --and-rebase` or same |
| Multiple fixes | Repeat per commit | Single command handles all |

### Limitations

- Only works with staged changes (use `git add -p` for partial staging)
- Cannot absorb changes to lines that were not in any prior commit (new code)
- Ambiguous hunks (lines modified in multiple commits) are skipped with a warning
- Requires a clean working tree for `--and-rebase`

### Installation

```bash
# macOS
brew install git-absorb

# Arch Linux
pacman -S git-absorb

# Cargo (any platform)
cargo install git-absorb

# Ubuntu/Debian (via cargo or from releases)
cargo install git-absorb
```

---

## difft (difftastic) - Structural Diff

### Language Support

difft supports 50+ languages including: Bash, C, C++, C#, CSS, Dart, Elixir, Elm, Go, Haskell, HTML, Java, JavaScript, JSON, Kotlin, Lua, Nix, OCaml, PHP, Python, Ruby, Rust, Scala, SQL, Swift, TOML, TypeScript, YAML, and more.

### Configuration Options

```bash
# Set as default git diff tool (persistent)
git config --global diff.external difft

# Set display width
git config --global difftool.difftastic.cmd 'difft --width 80 "$LOCAL" "$REMOTE"'

# Color output
export DFT_COLOR=always  # always | never | auto

# Display mode
export DFT_DISPLAY=side-by-side-show-both  # side-by-side | side-by-side-show-both | inline

# Syntax highlighting
export DFT_SYNTAX_HIGHLIGHT=on  # on | off

# Context lines around changes
export DFT_CONTEXT=3
```

### Integration with Git

```bash
# One-off usage with git diff
GIT_EXTERNAL_DIFF=difft git diff

# With git log
GIT_EXTERNAL_DIFF=difft git log -p --ext-diff

# With git show
GIT_EXTERNAL_DIFF=difft git show --ext-diff HEAD

# As a difftool (interactive)
git config --global difftool.difftastic.cmd 'difft "$LOCAL" "$REMOTE"'
git difftool --tool=difftastic
```

### Integration with delta

If you use `delta` as your git pager, you can combine them:

```bash
# Use difft for structural diff, delta for everything else
# In .gitconfig:
[diff]
    external = difft
[pager]
    diff = delta
    log = delta
    show = delta
```

Note: When `diff.external` is set, `delta` won't process diff output since difft handles it directly. Use `--no-ext-diff` to bypass difft and use delta instead when needed:

```bash
git diff --no-ext-diff  # Uses delta pager instead of difft
```

### Installation

```bash
# macOS
brew install difftastic

# Arch Linux
pacman -S difftastic

# Cargo
cargo install --locked difftastic

# Ubuntu/Debian (from GitHub releases)
curl -Lo difft.tar.gz https://github.com/Wilfred/difftastic/releases/latest/download/difft-x86_64-unknown-linux-gnu.tar.gz
tar xf difft.tar.gz && sudo mv difft /usr/local/bin/
```

---

## Pre-commit Hook Integration

Integrate all tools into a pre-commit hook:

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit or via pre-commit framework

set -euo pipefail

# Find staged shell scripts
staged_scripts=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(sh|bash)$' || true)

if [[ -n "$staged_scripts" ]]; then
  echo "Running shellcheck..."
  echo "$staged_scripts" | xargs shellcheck || {
    echo "shellcheck failed. Fix issues before committing."
    exit 1
  }

  echo "Running shfmt..."
  echo "$staged_scripts" | xargs shfmt -d -i 2 || {
    echo "shfmt: formatting issues found. Run 'shfmt -w -i 2' on the files above."
    exit 1
  }
fi
```

### Using pre-commit Framework

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/koalaman/shellcheck-precommit
    rev: v0.10.0
    hooks:
      - id: shellcheck
  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.12.0-2
    hooks:
      - id: shfmt
        args: ['-i', '2', '-w']
```

---

## GitHub Actions Workflow

Complete workflow integrating all shell quality tools:

```yaml
name: Shell Quality
on:
  pull_request:
    paths:
      - '**/*.sh'
      - '**/*.bash'
      - '.shellcheckrc'
      - '.editorconfig'

jobs:
  shell-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install tools
        run: |
          sudo apt-get update
          sudo apt-get install -y shellcheck
          go install mvdan.cc/sh/v3/cmd/shfmt@latest
          echo "$(go env GOPATH)/bin" >> "$GITHUB_PATH"

      - name: shellcheck
        run: |
          git ls-files '*.sh' '*.bash' | xargs --no-run-if-empty shellcheck

      - name: shfmt
        run: |
          shfmt -d -i 2 .
```
