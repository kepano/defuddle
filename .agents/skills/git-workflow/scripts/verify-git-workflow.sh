#!/bin/bash
# Git Workflow Verification Script
# Checks repository for git workflow best practices

set -e

REPO_DIR="${1:-.}"
ERRORS=0
WARNINGS=0

echo "=== Git Workflow Verification ==="
echo "Repository: $REPO_DIR"
echo ""

# Change to repo directory
cd "$REPO_DIR"

# Check if it's a git repository
if [[ ! -d ".git" ]]; then
    echo "❌ Not a git repository"
    exit 1
fi

# Check branch naming
echo "=== Branch Naming Convention ==="
BRANCHES=$(git branch -a 2>/dev/null | sed 's/^[* ]*//' | grep -v "HEAD" | sed 's/remotes\/origin\///' | sort -u)

VALID_PATTERN="^(main|master|develop|feature\/|fix\/|bugfix\/|hotfix\/|release\/|chore\/|docs\/|test\/|refactor\/)"
INVALID_BRANCHES=""

for branch in $BRANCHES; do
    if ! echo "$branch" | grep -qE "$VALID_PATTERN"; then
        INVALID_BRANCHES="$INVALID_BRANCHES $branch"
    fi
done

if [[ -n "$INVALID_BRANCHES" ]]; then
    echo "⚠️  Non-standard branch names found:"
    echo "  $INVALID_BRANCHES"
    echo "   Expected: main, develop, feature/*, fix/*, release/*, hotfix/*"
    ((WARNINGS++))
else
    echo "✅ All branch names follow conventions"
fi

# Check commit message format
echo ""
echo "=== Commit Message Format ==="
RECENT_COMMITS=$(git log --oneline -20 2>/dev/null | head -20)

CONV_PATTERN="^[a-f0-9]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?(!)?: .+"
INVALID_COMMITS=0
VALID_COMMITS=0

while IFS= read -r commit; do
    if echo "$commit" | grep -qE "$CONV_PATTERN"; then
        ((VALID_COMMITS++))
    else
        # Allow merge commits
        if ! echo "$commit" | grep -qE "^[a-f0-9]+ Merge"; then
            ((INVALID_COMMITS++))
        fi
    fi
done <<< "$RECENT_COMMITS"

TOTAL_COMMITS=$((VALID_COMMITS + INVALID_COMMITS))
if [[ $TOTAL_COMMITS -gt 0 ]]; then
    PERCENT=$((VALID_COMMITS * 100 / TOTAL_COMMITS))
    if [[ $PERCENT -ge 80 ]]; then
        echo "✅ $PERCENT% of commits follow Conventional Commits format"
    elif [[ $PERCENT -ge 50 ]]; then
        echo "⚠️  $PERCENT% of commits follow Conventional Commits format"
        ((WARNINGS++))
    else
        echo "⚠️  Only $PERCENT% of commits follow Conventional Commits format"
        ((WARNINGS++))
    fi
fi

# Check for .gitignore
echo ""
echo "=== .gitignore Check ==="
if [[ -f ".gitignore" ]]; then
    echo "✅ .gitignore exists"

    # Check for common patterns
    COMMON_IGNORES=("node_modules" ".env" "*.log" "dist" "build" ".DS_Store")
    MISSING_IGNORES=""

    for pattern in "${COMMON_IGNORES[@]}"; do
        if ! grep -q "$pattern" .gitignore 2>/dev/null; then
            MISSING_IGNORES="$MISSING_IGNORES $pattern"
        fi
    done

    if [[ -n "$MISSING_IGNORES" ]]; then
        echo "   ℹ️  Consider adding:$MISSING_IGNORES"
    fi
else
    echo "⚠️  No .gitignore file found"
    ((WARNINGS++))
fi

# Check for hooks
echo ""
echo "=== Git Hooks ==="
if [[ -d ".git/hooks" ]]; then
    ACTIVE_HOOKS=$(find .git/hooks -type f ! -name "*.sample" 2>/dev/null | wc -l)
    if [[ $ACTIVE_HOOKS -gt 0 ]]; then
        echo "✅ Found $ACTIVE_HOOKS active hook(s)"
        find .git/hooks -type f ! -name "*.sample" -exec basename {} \; 2>/dev/null | sed 's/^/   /'
    else
        echo "ℹ️  No active git hooks"
    fi
fi

# Check for husky
if [[ -d ".husky" ]]; then
    echo "✅ Husky hooks directory found"
fi

# Check for commitlint
if [[ -f "commitlint.config.js" ]] || [[ -f ".commitlintrc" ]] || [[ -f ".commitlintrc.json" ]]; then
    echo "✅ Commitlint configuration found"
fi

# Check for branch protection (via CODEOWNERS)
echo ""
echo "=== Code Ownership ==="
if [[ -f "CODEOWNERS" ]] || [[ -f ".github/CODEOWNERS" ]] || [[ -f "docs/CODEOWNERS" ]]; then
    echo "✅ CODEOWNERS file found"
else
    echo "ℹ️  No CODEOWNERS file (optional)"
fi

# Check for PR template
echo ""
echo "=== PR Templates ==="
if [[ -f ".github/PULL_REQUEST_TEMPLATE.md" ]] || [[ -d ".github/PULL_REQUEST_TEMPLATE" ]]; then
    echo "✅ PR template(s) found"
else
    echo "ℹ️  No PR template (recommended)"
fi

# Check for CI/CD configuration
echo ""
echo "=== CI/CD Configuration ==="
CI_FOUND=false

if [[ -d ".github/workflows" ]]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)
    if [[ $WORKFLOW_COUNT -gt 0 ]]; then
        echo "✅ GitHub Actions: $WORKFLOW_COUNT workflow(s)"
        CI_FOUND=true
    fi
fi

if [[ -f ".gitlab-ci.yml" ]]; then
    echo "✅ GitLab CI configuration found"
    CI_FOUND=true
fi

if [[ -f "Jenkinsfile" ]]; then
    echo "✅ Jenkinsfile found"
    CI_FOUND=true
fi

if [[ -f ".circleci/config.yml" ]]; then
    echo "✅ CircleCI configuration found"
    CI_FOUND=true
fi

if [[ -f "azure-pipelines.yml" ]]; then
    echo "✅ Azure Pipelines configuration found"
    CI_FOUND=true
fi

if [[ "$CI_FOUND" == "false" ]]; then
    echo "⚠️  No CI/CD configuration found"
    ((WARNINGS++))
fi

# Check for semantic release
echo ""
echo "=== Release Configuration ==="
if [[ -f ".releaserc" ]] || [[ -f ".releaserc.json" ]] || [[ -f ".releaserc.yml" ]] || [[ -f "release.config.js" ]]; then
    echo "✅ Semantic release configuration found"
fi

# Check for CHANGELOG
if [[ -f "CHANGELOG.md" ]] || [[ -f "CHANGELOG" ]]; then
    echo "✅ CHANGELOG found"
else
    echo "ℹ️  No CHANGELOG (recommended for releases)"
fi

# Check for versioning
if [[ -f "package.json" ]]; then
    VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    if [[ -n "$VERSION" ]]; then
        echo "✅ Package version: $VERSION"
    fi
fi

# Check current branch
echo ""
echo "=== Current State ==="
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
echo "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    echo "✅ Working directory clean"
else
    CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    echo "⚠️  $CHANGES uncommitted change(s)"
fi

# Check if up to date with remote
if git remote | grep -q "origin" 2>/dev/null; then
    git fetch origin --quiet 2>/dev/null || true
    LOCAL=$(git rev-parse "$CURRENT_BRANCH" 2>/dev/null)
    REMOTE=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null) || true

    if [[ -n "$REMOTE" ]]; then
        if [[ "$LOCAL" == "$REMOTE" ]]; then
            echo "✅ Up to date with origin/$CURRENT_BRANCH"
        else
            BEHIND=$(git rev-list --count "$LOCAL..$REMOTE" 2>/dev/null)
            AHEAD=$(git rev-list --count "$REMOTE..$LOCAL" 2>/dev/null)
            echo "ℹ️  Branch is $AHEAD ahead, $BEHIND behind origin/$CURRENT_BRANCH"
        fi
    fi
fi

# Check for merge conflicts markers
echo ""
echo "=== Conflict Markers ==="
CONFLICT_FILES=$(grep -rln "<<<<<<< \|======= \|>>>>>>> " --include="*.js" --include="*.ts" --include="*.php" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v vendor | head -5)
if [[ -n "$CONFLICT_FILES" ]]; then
    echo "❌ Conflict markers found in files:"
    echo "$CONFLICT_FILES" | sed 's/^/   /'
    ((ERRORS++))
else
    echo "✅ No conflict markers found"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
    echo "❌ Verification FAILED"
    exit 1
elif [[ $WARNINGS -gt 3 ]]; then
    echo "⚠️  Verification completed with warnings"
    exit 0
else
    echo "✅ Verification PASSED"
    exit 0
fi
