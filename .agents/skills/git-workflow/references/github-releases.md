# GitHub Releases Reference

**Purpose:** Document GitHub release management, immutable releases security feature, and release sequence patterns.

---

## Immutable Releases Security Feature

### Overview

**GitHub Immutable Releases** (GA October 2024) is a permanent security feature that prevents tag name reuse after a release is deleted.

**Security Purpose:** Prevents supply chain attacks where an attacker could:
1. Delete a legitimate release
2. Create a new release with the same version containing malicious code
3. Users downloading "v1.2.3" would get the malicious version

### Behavior

| Action | Result |
|--------|--------|
| Create release v1.2.3 | ✅ Success |
| Delete release v1.2.3 | ✅ Allowed |
| Create NEW release v1.2.3 | ❌ PERMANENTLY BLOCKED |
| Create release v1.2.4 | ✅ Success (new version) |

### Key Facts

- **Cannot be disabled:** No repository setting, API call, or GitHub support request can bypass this
- **Permanent:** Once blocked, a tag name stays blocked forever
- **Per-repository:** Each repository has its own blocked tag list
- **Applies to:** Published releases only (not draft releases)

### Detection

```bash
# Attempt to create release - if blocked, you'll see:
# "tag_name was used by an immutable release"
gh release create v1.2.3 --notes "test" 2>&1 | grep -i "immutable"
```

---

## Release Sequence Patterns

### TYPO3 Extension Release

**Correct Sequence:**
```bash
# 1. Create release branch
git checkout -b release/v1.2.3

# 2. Update version in source files
# ext_emconf.php
sed -i "s/'version' => '.*'/'version' => '1.2.3'/" ext_emconf.php

# CHANGELOG.md - add new version section

# 3. Commit version bump
git add ext_emconf.php CHANGELOG.md
git commit -m "chore: bump version to 1.2.3"

# 4. Create PR and merge
git push -u origin release/v1.2.3
gh pr create --title "chore: bump version to 1.2.3"
# Wait for CI to pass
gh pr merge --squash

# 5. Switch to main and verify
git checkout main && git pull
grep "'version'" ext_emconf.php  # MUST show 1.2.3

# 6. Create release ONLY after verification
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes "Release notes here"
```

**Common Mistakes:**
| Mistake | Consequence |
|---------|-------------|
| Create release before updating version | Version mismatch, TER/npm publish fails |
| Create release before merging PR | Tag points to wrong commit |
| Delete release to "fix" something | Tag name permanently blocked |
| Rush without verification | Multiple blocked versions |

### NPM Package Release

```bash
# 1. Update package.json version
npm version patch  # or minor/major

# 2. Verify version
grep '"version"' package.json

# 3. Push changes
git push && git push --tags

# 4. Create GitHub release (if using GitHub releases)
gh release create v$(node -p "require('./package.json').version")
```

### Python Package Release

```bash
# 1. Update version in pyproject.toml or setup.py
# 2. Update CHANGELOG

# 3. Commit and push
git add pyproject.toml CHANGELOG.md
git commit -m "chore: bump version to 1.2.3"
git push

# 4. Create and push tag
git tag v1.2.3
git push --tags

# 5. Create release
gh release create v1.2.3
```

---

## Pre-Release Validation

### Automated Checks

Add to CI workflow:
```yaml
- name: Version Consistency Check
  run: |
    # Extract versions from different sources
    EMCONF_VERSION=$(grep -oP "'version' => '\K[0-9]+\.[0-9]+\.[0-9]+" ext_emconf.php)

    # For tagged builds, verify tag matches
    if [[ "${GITHUB_REF}" =~ ^refs/tags/v ]]; then
      TAG_VERSION="${GITHUB_REF#refs/tags/v}"
      if [[ "${TAG_VERSION}" != "${EMCONF_VERSION}" ]]; then
        echo "::error::Version mismatch! Tag: ${TAG_VERSION}, ext_emconf.php: ${EMCONF_VERSION}"
        exit 1
      fi
    fi
    echo "Version check passed: ${EMCONF_VERSION}"
```

### Manual Checklist

Before creating ANY release:
```
[ ] All code changes merged to main/master
[ ] CI pipeline passes on main branch
[ ] Version updated in ALL source files:
    [ ] ext_emconf.php (TYPO3)
    [ ] package.json (Node)
    [ ] pyproject.toml / setup.py (Python)
    [ ] composer.json (if version is tracked there)
[ ] CHANGELOG.md updated with new version
[ ] Local main is up to date: git pull origin main
[ ] Version verification: grep -r "version" | grep "1.2.3"
[ ] READY - No second chances after release creation!
```

---

## Recovery Procedures

### Scenario: TER/npm/PyPI Publish Failed After Release

**DO NOT DELETE THE RELEASE!**

Instead:
1. Identify the root cause of publish failure
2. Fix the issue in a new commit
3. Update version to NEXT number (skipping the broken version)
4. Create new release with new version

Example:
```bash
# v1.2.3 release created but TER publish failed
# DO NOT: gh release delete v1.2.3

# Fix the issue
vim ext_emconf.php  # remove strict_types or fix other issues

# Bump to NEXT version
sed -i "s/'version' => '1.2.3'/'version' => '1.2.4'/" ext_emconf.php

# Update CHANGELOG
cat >> CHANGELOG.md << 'EOF'
## [1.2.4] - 2025-01-15

### Fixed
- Fixed TER publishing issue (strict_types in ext_emconf.php)

Note: v1.2.3 was skipped due to publish failure.
EOF

# Commit, merge, then create new release
git add -A && git commit -m "fix: resolve TER publish issue, bump to 1.2.4"
git push && gh pr create && gh pr merge
gh release create v1.2.4 --notes "..."
```

### Scenario: Multiple Versions Blocked

If you've blocked v1.2.3, v1.2.4, v1.2.5 through repeated failures:

1. **Stop and think** - don't create more releases
2. List what went wrong each time
3. Fix ALL issues before next attempt
4. Use next available version (v1.2.6)
5. Document skipped versions in CHANGELOG

```markdown
## [1.2.6] - 2025-01-15

Note: Versions 1.2.3-1.2.5 are unavailable due to GitHub's immutable
releases feature. These versions were blocked after release deletion
attempts during troubleshooting.

### Fixed
- Resolved TER compatibility issue with ext_emconf.php
```

---

## Multi-Branch Releases ("Latest" Badge)

### Problem

GitHub assigns the **"Latest"** badge by **creation timestamp**, NOT by semantic version. Creating a `v11.0.17` release *after* `v13.5.0` will steal the "Latest" badge from v13.5.0.

### Rule

**ALWAYS use `--latest=false`** when releasing from non-default branches (maintenance, LTS, hotfix):

```bash
# Releasing from a maintenance branch (e.g., TYPO3_12, TYPO3_11)
gh release create v12.0.5 --latest=false --title "v12.0.5" --notes "..."

# Releasing from the default branch (e.g., main) — omit the flag
gh release create v13.6.0 --title "v13.6.0" --notes "..."
```

### When to use `--latest=false`

| Scenario | Flag |
|----------|------|
| Release from `main` / default branch | Omit (default: `--latest=true`) |
| Release from LTS/maintenance branch | `--latest=false` |
| Hotfix for older version | `--latest=false` |
| Pre-release (alpha, beta, rc) | `--prerelease` (auto-excludes from Latest) |

### Recovery

If a maintenance release accidentally became "Latest":
```bash
# Manually reassign the "Latest" badge to the correct release
gh release edit v13.5.0 --latest
```

---

## Best Practices

### Do
- ✅ Update version files BEFORE creating release
- ✅ Verify version with grep before release
- ✅ Use CI checks for version consistency
- ✅ Keep releases - never delete published releases
- ✅ Test publish process in staging first (if possible)
- ✅ Use `--latest=false` for non-default branch releases

### Don't
- ❌ Create release before version is updated in source
- ❌ Delete releases to "fix" issues
- ❌ Rush releases without verification
- ❌ Assume you can recreate a deleted release
- ❌ Create multiple releases hoping one will work
- ❌ Omit `--latest=false` when releasing from maintenance branches

---

## Resources

- **GitHub Blog:** Immutable Releases announcement
- **GitHub Docs:** Managing releases in a repository
- **TYPO3 TER:** Extension publishing requirements
