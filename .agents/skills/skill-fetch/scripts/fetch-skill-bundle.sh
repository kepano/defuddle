#!/bin/bash
# fetch-skill-bundle.sh — download an entire skill bundle from GitHub.
#
# A "skill bundle" is the full skill root directory, including SKILL.md plus
# any siblings (references/, scripts/, assets/, templates/, prompts/,
# data/, examples/, etc.). Downloading only SKILL.md leaves the skill
# broken for any skill that references external files.
#
# Usage:
#   bash fetch-skill-bundle.sh <github-url> <target-dir>
#
# Supported URL forms:
#   https://github.com/{owner}/{repo}
#   https://github.com/{owner}/{repo}/blob/{ref}/{path}
#   https://github.com/{owner}/{repo}/tree/{ref}/{path}
#   https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}
#
# The path is interpreted as follows:
#   - empty                -> skill root is the repo root
#   - .../SKILL.md         -> skill root is the parent directory
#   - anything else        -> skill root is the path itself
#
# Output:
#   All files under the skill root are written to <target-dir>/ preserving
#   the subtree layout. Prints a one-line JSON summary on success.

set -euo pipefail

URL="${1:-}"
TARGET="${2:-}"

if [ -z "$URL" ] || [ -z "$TARGET" ]; then
  echo "Usage: bash fetch-skill-bundle.sh <github-url> <target-dir>" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo '{"error":"gh CLI not found","hint":"Install GitHub CLI: https://cli.github.com"}' >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq not found","hint":"Install jq (brew install jq / apt install jq)"}' >&2
  exit 2
fi

OWNER=""
REPO=""
REF=""
RAWPATH=""

if [[ "$URL" =~ ^https://github\.com/([^/]+)/([^/]+)(/(blob|tree)/([^/]+)(/(.*))?)?/?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
  REF="${BASH_REMATCH[5]:-}"
  RAWPATH="${BASH_REMATCH[7]:-}"
elif [[ "$URL" =~ ^https://raw\.githubusercontent\.com/([^/]+)/([^/]+)/([^/]+)(/(.*))?/?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
  REF="${BASH_REMATCH[3]}"
  RAWPATH="${BASH_REMATCH[5]:-}"
else
  echo "{\"error\":\"unrecognized GitHub URL\",\"url\":\"$URL\"}" >&2
  exit 2
fi

REPO="${REPO%.git}"

if [ -z "$REF" ]; then
  REF=$(gh api "repos/$OWNER/$REPO" --jq '.default_branch')
fi

RAWPATH="${RAWPATH%/}"
lc_path=$(printf '%s' "$RAWPATH" | tr '[:upper:]' '[:lower:]')
if [ -z "$RAWPATH" ]; then
  SKILL_ROOT=""
elif [[ "$lc_path" =~ (^|/)skill\.md$ ]]; then
  if [[ "$RAWPATH" == */* ]]; then
    SKILL_ROOT="${RAWPATH%/*}"
  else
    SKILL_ROOT=""
  fi
else
  SKILL_ROOT="$RAWPATH"
fi

TREE_JSON=$(gh api "repos/$OWNER/$REPO/git/trees/$REF?recursive=1")

TRUNCATED=$(printf '%s' "$TREE_JSON" | jq -r '.truncated // false')
if [ "$TRUNCATED" = "true" ]; then
  echo '{"warning":"git tree is truncated; some files under a deeply nested skill root may be missing"}' >&2
fi

if [ -z "$SKILL_ROOT" ]; then
  PATHS=$(printf '%s' "$TREE_JSON" | jq -r '.tree[] | select(.type=="blob") | .path')
else
  PATHS=$(printf '%s' "$TREE_JSON" | jq -r --arg root "$SKILL_ROOT" '
    .tree[]
    | select(.type=="blob")
    | select(.path == $root or (.path | startswith($root + "/")))
    | .path
  ')
fi

if [ -z "$PATHS" ]; then
  echo "{\"error\":\"no files found\",\"skill_root\":\"$SKILL_ROOT\",\"repo\":\"$OWNER/$REPO\",\"ref\":\"$REF\"}" >&2
  exit 1
fi

mkdir -p "$TARGET"

count=0
skipped=0
while IFS= read -r filepath; do
  [ -z "$filepath" ] && continue

  base="${filepath##*/}"
  case "$base" in
    .DS_Store|Thumbs.db) skipped=$((skipped + 1)); continue ;;
  esac

  if [ -z "$SKILL_ROOT" ]; then
    rel="$filepath"
  elif [ "$filepath" = "$SKILL_ROOT" ]; then
    rel="$base"
  else
    rel="${filepath#"$SKILL_ROOT"/}"
  fi

  dst="$TARGET/$rel"
  mkdir -p "$(dirname "$dst")"

  if ! gh api "repos/$OWNER/$REPO/contents/$filepath?ref=$REF" \
        -H "Accept: application/vnd.github.raw" > "$dst"; then
    echo "{\"error\":\"failed to download\",\"path\":\"$filepath\"}" >&2
    exit 1
  fi
  count=$((count + 1))
done <<< "$PATHS"

printf '{"status":"ok","owner":"%s","repo":"%s","ref":"%s","skill_root":"%s","files":%d,"skipped":%d,"target":"%s"}\n' \
  "$OWNER" "$REPO" "$REF" "$SKILL_ROOT" "$count" "$skipped" "$TARGET"
