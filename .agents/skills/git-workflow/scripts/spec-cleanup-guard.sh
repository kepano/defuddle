#!/usr/bin/env bash
#
# spec-cleanup-guard.sh — deterministic, READ-ONLY gate for intermediate
# planning artifacts (superpowers specs/plans, scratch plans, planning-tool
# output) that must not land in the base branch.
#
# Invariant: this script NEVER deletes, stages, or modifies any file. It detects
# and reports. Only the interactive Capture step (/pr-finish) removes files.
#
# Detection is branch-local and state-based: it flags the PRESENCE of configured
# intermediate paths in three states — committed/tracked, staged, untracked —
# independent of any base branch (intermediate paths must never be tracked, so
# presence => fail). This sidesteps base-branch resolution entirely.
#
# Exit codes: 0 clean · 1 intermediate artifacts found · 2 usage/config error.
#
# Usage:
#   spec-cleanup-guard.sh            enforce: list matches, exit 1 if any
#   spec-cleanup-guard.sh --dry-run  list matches, always exit 0 (manifest only)
#   spec-cleanup-guard.sh --selftest run internal fixtures, exit 0/1
#   spec-cleanup-guard.sh --help
#
# Config: .spec-cleanup.yml at repo root (optional). Reads intermediate_paths[]
# and exclude[]. If the file is present but `yq` is unavailable the guard FAILS
# CLOSED (exit 2) rather than silently under-enforcing. Without a config file the
# baked-in defaults below apply.
set -euo pipefail

DEFAULT_PATHS=(
  "docs/superpowers/**"
  "claudedocs/**"
  "docs/working/**"
  "docs/superpowers/**/*.plan.md"
)
DEFAULT_EXCLUDES=()

CONFIG_FILE=".spec-cleanup.yml"

die() { printf 'spec-cleanup-guard: %s\n' "$*" >&2; exit 2; }

# Normalize a config glob to a git pathspec.
#   dir glob  "docs/superpowers/**"          -> "docs/superpowers/"   (recurses)
#   suffix    "docs/superpowers/**/*.plan.md" -> ":(glob)docs/.../*.plan.md"
#   plain     "docs/x.md"                     -> "docs/x.md"
normalize_pathspec() {
  local g="$1" base
  if [[ "$g" == */\*\* ]]; then
    base="${g%/\*\*}"
    if [[ "$base" != *[\*\?\[]* ]]; then printf '%s/' "$base"; return; fi
  fi
  if [[ "$g" != *[\*\?\[]* ]]; then printf '%s' "$g"; return; fi
  printf ':(glob)%s' "$g"
}

# Normalize an exclude glob to an exclude pathspec.
normalize_exclude() {
  local g="$1"
  if [[ "$g" == *[\*\?\[]* ]]; then printf ':(exclude,glob)%s' "$g"
  else printf ':(exclude)%s' "$g"; fi
}

load_config() {
  PATHS=() EXCLUDES=()
  if [[ -f "$CONFIG_FILE" ]]; then
    if [[ "${SPEC_CLEANUP_FAKE_NO_YQ:-0}" == "1" ]] || ! command -v yq >/dev/null 2>&1; then
      die "$CONFIG_FILE present but 'yq' is not installed; refusing to under-enforce (install yq)."
    fi
    local p
    while IFS= read -r p; do [[ -n "$p" ]] && PATHS+=("$p"); done \
      < <(yq '.intermediate_paths[]' "$CONFIG_FILE" 2>/dev/null || true)
    while IFS= read -r p; do [[ -n "$p" && "$p" != "null" ]] && EXCLUDES+=("$p"); done \
      < <(yq '.exclude[]' "$CONFIG_FILE" 2>/dev/null || true)
    [[ ${#PATHS[@]} -gt 0 ]] || die "$CONFIG_FILE has no intermediate_paths."
  else
    PATHS=("${DEFAULT_PATHS[@]}")
    EXCLUDES=("${DEFAULT_EXCLUDES[@]+"${DEFAULT_EXCLUDES[@]}"}")
  fi
  # Reject unanchored leading-glob patterns (e.g. **/*.plan.md, *.md): they match
  # arbitrary project files. Anchor under a directory (docs/superpowers/**/*.plan.md).
  local g
  for g in "${PATHS[@]}"; do
    if [[ "$g" == '*'* ]]; then
      die "unanchored glob '$g' in intermediate_paths — anchor it under a directory (e.g. docs/superpowers/**/*.plan.md) so it cannot match unrelated files."
    fi
  done
}

build_pathspecs() {
  PATHSPECS=()
  local g
  for g in "${PATHS[@]}"; do PATHSPECS+=("$(normalize_pathspec "$g")"); done
  for g in "${EXCLUDES[@]+"${EXCLUDES[@]}"}"; do PATHSPECS+=("$(normalize_exclude "$g")"); done
}

# Populate TRACKED / STAGED / UNTRACKED arrays (each file in exactly one bucket).
detect() {
  mapfile -t STAGED    < <(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR -- "${PATHSPECS[@]}" 2>/dev/null | sort -u)
  mapfile -t UNTRACKED < <(git -c core.quotePath=false ls-files --others --exclude-standard -- "${PATHSPECS[@]}" 2>/dev/null | sort -u)
  # Committed-tracked = index entries matching, minus anything already reported as a
  # staged change, so a newly-staged file is not double-listed as "committed".
  # ls-files (not ls-tree) is required here: ls-tree rejects the :(glob)/:(exclude)
  # pathspec magic the guard relies on.
  if ((${#STAGED[@]})); then
    mapfile -t TRACKED < <(git -c core.quotePath=false ls-files -- "${PATHSPECS[@]}" 2>/dev/null | sort -u | grep -vxF "$(printf '%s\n' "${STAGED[@]}")" || true)
  else
    mapfile -t TRACKED < <(git -c core.quotePath=false ls-files -- "${PATHSPECS[@]}" 2>/dev/null | sort -u)
  fi
}

print_group() {
  local title="$1"; shift
  (( $# == 0 )) && return
  printf '  %s:\n' "$title"
  printf '    %s\n' "$@"
}

run() {
  local dry="$1"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git work tree."
  # Anchor config lookup + pathspecs at the repo root so the gate cannot silently
  # pass when invoked from a subdirectory (e.g. a hook or CI step with a different CWD).
  cd "$(git rev-parse --show-toplevel)" || die "cannot cd to repo root."
  load_config
  build_pathspecs
  detect
  local n=$(( ${#TRACKED[@]} + ${#STAGED[@]} + ${#UNTRACKED[@]} ))
  if (( n == 0 )); then
    echo "spec-cleanup-guard: clean — no intermediate planning artifacts."
    return 0
  fi
  echo "spec-cleanup-guard: found $n intermediate planning artifact(s) that must not reach the base branch:"
  print_group "tracked (committed)" "${TRACKED[@]+"${TRACKED[@]}"}"
  print_group "staged"              "${STAGED[@]+"${STAGED[@]}"}"
  print_group "untracked"           "${UNTRACKED[@]+"${UNTRACKED[@]}"}"
  echo "Resolve via /pr-finish: convert (propose ADR) · remove · acknowledge."
  echo "Untracked files are listed so you can confirm before any removal."
  [[ "$dry" == "1" ]] && return 0
  return 1
}

# --------------------------- selftest ---------------------------
git_q() { git -c commit.gpgsign=false -c user.email=t@example.com -c user.name=test "$@"; }
st_pass=0 st_fail=0
st_assert() { # desc expected_rc actual_rc
  if [[ "$2" == "$3" ]]; then st_pass=$((st_pass+1)); printf '  ok   %s (rc=%s)\n' "$1" "$3"
  else st_fail=$((st_fail+1)); printf '  FAIL %s (want rc=%s, got %s)\n' "$1" "$2" "$3"; fi
}
st_rc() { local rc=0; "$@" >/dev/null 2>&1 || rc=$?; printf '%s' "$rc"; }

selftest() {
  local self; self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  local t; t="$(mktemp -d "${TMPDIR:-/tmp}/scg-selftest.XXXXXX")"
  trap 'rm -rf "$t"' RETURN
  ( cd "$t"
    git_q init -q
    mkdir -p docs/superpowers/specs/a/b src docs/working
    echo readme > README.md
    echo real   > src/real.plan.md            # real file, NON-intermediate path
    git_q add README.md src/real.plan.md; git_q commit -qm init

    echo "T4 no config — default guard:"
    st_assert "T6 clean branch -> 0" 0 "$(st_rc bash "$self")"

    echo c > docs/superpowers/specs/a/b/c.md   # nested, untracked
    st_assert "T2/T3 nested untracked -> 1" 1 "$(st_rc bash "$self")"
    st_assert "T3 nested caught also in --dry-run (rc 0)" 0 "$(st_rc bash "$self" --dry-run)"
    mkdir -p sub/deeper
    st_assert "GC-1 caught when run from subdirectory -> 1" 1 "$(cd sub/deeper && st_rc bash "$self")"

    git_q add docs/superpowers/specs/a/b/c.md             # now staged
    st_assert "T_staged staged intermediate -> 1" 1 "$(st_rc bash "$self")"
    # A newly-staged file must appear ONLY under "staged", never "tracked (committed)".
    staged_out="$(bash "$self" 2>/dev/null || true)"
    if printf '%s' "$staged_out" | grep -q 'staged:' && ! printf '%s' "$staged_out" | grep -q 'tracked (committed):'; then
      st_assert "staged file not double-listed as tracked" 0 0
    else
      st_assert "staged file not double-listed as tracked" 0 1
    fi
    git_q commit -qm spec                                  # now tracked
    st_assert "T1 tracked intermediate -> 1" 1 "$(st_rc bash "$self")"

    git_q rm -q docs/superpowers/specs/a/b/c.md; git_q commit -qm rm
    st_assert "T6b removed -> clean 0" 0 "$(st_rc bash "$self")"

    echo "T_overmatch real src/*.plan.md must NOT be flagged by default:"
    st_assert "default ignores src/real.plan.md -> 0" 0 "$(st_rc bash "$self")"

    echo "T5 exclude + T7 yq-fail-closed (config present):"
    if command -v yq >/dev/null 2>&1; then
      printf 'intermediate_paths:\n  - docs/superpowers/**\nexclude:\n  - docs/superpowers/keep/**\n' > .spec-cleanup.yml
      mkdir -p docs/superpowers/keep
      echo k > docs/superpowers/keep/wanted.md     # untracked but excluded
      st_assert "T5 excluded path -> clean 0" 0 "$(st_rc bash "$self")"
      echo f > docs/superpowers/flagme.md
      st_assert "T5b non-excluded under config -> 1" 1 "$(st_rc bash "$self")"
      st_assert "T7 config present + no yq -> 2 (fail closed)" 2 \
        "$(SPEC_CLEANUP_FAKE_NO_YQ=1 st_rc bash "$self")"
      printf 'intermediate_paths:\n  - "**/*.plan.md"\n' > .spec-cleanup.yml
      st_assert "GC-2 unanchored glob in config -> 2 (rejected)" 2 "$(st_rc bash "$self")"
      rm -f .spec-cleanup.yml docs/superpowers/flagme.md
      rm -rf docs/superpowers/keep
    else
      echo "  skip T5/T7 (yq not installed)"
    fi
    echo "selftest: $st_pass passed, $st_fail failed"
    [[ "$st_fail" == "0" ]]   # subshell exit status reflects failures
  )
}

# ------------------------------ main ----------------------------
case "${1:-}" in
  --help|-h) awk 'NR==1{next} /^#/{sub(/^# ?/,"");print;next} {exit}' "$0"; exit 0 ;;
  --selftest) selftest ;;
  --dry-run) run 1 ;;
  "") run 0 ;;
  *) die "unknown argument: $1 (try --help)";;
esac
