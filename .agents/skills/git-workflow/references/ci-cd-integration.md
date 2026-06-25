# CI/CD Integration

## GitHub Actions

### Basic Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:  # Manual trigger

env:
  NODE_VERSION: '20'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### Complete CI Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        if: matrix.node == 20

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level=high
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/
      - name: Deploy to staging
        run: |
          # Deploy commands here

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/
      - name: Deploy to production
        run: |
          # Deploy commands here
```

### Reusable Workflows

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    secrets:
      npm-token:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: npm test
```

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  call-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '20'
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}
```

### Matrix Builds

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          - os: windows-latest
            node: 18
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

## GitLab CI

### Basic Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "20"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

deploy_staging:
  stage: deploy
  script:
    - ./deploy.sh staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - ./deploy.sh production
  environment:
    name: production
    url: https://example.com
  only:
    - main
  when: manual
```

### Multi-Stage Pipeline

```yaml
stages:
  - prepare
  - build
  - test
  - security
  - deploy

.node-base:
  image: node:20
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/

install:
  extends: .node-base
  stage: prepare
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

lint:
  extends: .node-base
  stage: build
  needs: [install]
  script:
    - npm run lint

build:
  extends: .node-base
  stage: build
  needs: [install]
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day

unit-test:
  extends: .node-base
  stage: test
  needs: [install]
  script:
    - npm run test:unit
  coverage: '/Statements\s*:\s*(\d+\.?\d*)%/'

integration-test:
  extends: .node-base
  stage: test
  needs: [build]
  services:
    - postgres:15
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script:
    - npm run test:integration

security-audit:
  stage: security
  needs: [install]
  script:
    - npm audit --audit-level=high
  allow_failure: true

sast:
  stage: security
  include:
    - template: Security/SAST.gitlab-ci.yml
```

## Semantic Release

### Configuration

```json
// .releaserc.json
{
  "branches": [
    "main",
    {"name": "beta", "prerelease": true},
    {"name": "alpha", "prerelease": true}
  ],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        {"type": "feat", "release": "minor"},
        {"type": "fix", "release": "patch"},
        {"type": "perf", "release": "patch"},
        {"breaking": true, "release": "major"}
      ]
    }],
    ["@semantic-release/release-notes-generator", {
      "preset": "conventionalcommits",
      "presetConfig": {
        "types": [
          {"type": "feat", "section": "Features"},
          {"type": "fix", "section": "Bug Fixes"},
          {"type": "perf", "section": "Performance"},
          {"type": "revert", "section": "Reverts"}
        ]
      }
    }],
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    ["@semantic-release/npm", {
      "npmPublish": true
    }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]"
    }],
    "@semantic-release/github"
  ]
}
```

### GitHub Actions Integration

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## Branch Protection

### GitHub Settings

```yaml
# Via GitHub API or settings UI
branch_protection:
  main:
    required_status_checks:
      strict: true
      contexts:
        - lint
        - test
        - build
        - security
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    restrictions:
      users: []
      teams: [core-team]
    enforce_admins: true
    require_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
```

### GitLab Settings

```yaml
# Via GitLab API or settings UI
protected_branches:
  main:
    push_access_level: maintainer
    merge_access_level: developer
    unprotect_access_level: admin
    code_owner_approval_required: true

merge_request_approvals:
  approvals_before_merge: 2
  reset_approvals_on_push: true
```

## Automated Testing

### Pre-merge Checks

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        run: |
          LINES=$(git diff --numstat origin/main...HEAD | awk '{sum += $1 + $2} END {print sum}')
          if [ "$LINES" -gt 1000 ]; then
            echo "::warning::Large PR ($LINES lines). Consider splitting."
          fi

      - name: Check commit messages
        run: |
          git log origin/main..HEAD --pretty=format:"%s" | while read msg; do
            if ! echo "$msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"; then
              echo "::error::Invalid commit message: $msg"
              exit 1
            fi
          done

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage --changedSince=origin/main

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint -- --max-warnings 0
```

### E2E Testing

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Start application
        run: npm start &
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test

      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-screenshots
          path: cypress/screenshots/
```

### Watching CI from the CLI

When waiting on PR CI from the command line (or an agent), use the native
watchers — do not hand-roll a poll loop:

```bash
# Wait for all PR checks; exits non-zero if any required check fails.
gh pr checks <pr> --repo <owner/repo> --watch --fail-fast

# Watch a single workflow run by ID (when you have the run, not the PR).
gh run watch <run-id> --repo <owner/repo> --exit-status
```

Gate on the **exit code**, not on parsed output. `gh pr checks` and
`gh run watch` already handle pending-state representation, the appearance of
newly-triggered runs, and refresh.

Hand-rolled `gh pr checks | jq` poll loops re-derive those semantics from
undocumented field shapes (a running check's `conclusion` may be `""`, `null`,
or absent) and are a recurring source of bugs. The sharpest one: a poll run
**immediately after a push, reopen, or re-trigger** reads "0 pending" *before*
the freshly-queued run has registered, so the loop reports a false "all green"
and you act prematurely. A bare `[ "$pending" -eq 0 ] && break` snapshot is true
both before runs start and after they finish — it cannot tell the two apart.

If you must hand-roll (e.g. watching something with no native watcher), gate on
a **named required check reaching a terminal `pass`/`fail` state**, never on a
zero-pending count, and confirm the run belongs to the current head SHA first.

## Deployment Strategies

### Blue-Green Deployment

```yaml
name: Blue-Green Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to green
        run: |
          kubectl apply -f k8s/green-deployment.yaml
          kubectl rollout status deployment/app-green

      - name: Run smoke tests
        run: ./scripts/smoke-test.sh green

      - name: Switch traffic
        run: |
          kubectl patch service app -p '{"spec":{"selector":{"version":"green"}}}'

      - name: Cleanup blue
        run: |
          kubectl delete deployment app-blue || true
```

### Canary Deployment

```yaml
name: Canary Deploy

on:
  push:
    branches: [main]

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy canary (10%)
        run: |
          kubectl apply -f k8s/canary-deployment.yaml
          kubectl set image deployment/app-canary app=${{ env.IMAGE }}

      - name: Monitor canary
        run: |
          sleep 300  # 5 minutes
          ERROR_RATE=$(./scripts/get-error-rate.sh canary)
          if [ "$ERROR_RATE" -gt 5 ]; then
            echo "High error rate, rolling back"
            kubectl rollout undo deployment/app-canary
            exit 1
          fi

      - name: Full rollout
        run: |
          kubectl set image deployment/app app=${{ env.IMAGE }}
          kubectl rollout status deployment/app
```

## Notifications

### Slack Integration

```yaml
name: CI with Notifications

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Build failed on ${{ github.ref }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Build Failed* :x:\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Git Mirror Repositories

Use `git clone --mirror` + `git push --mirror` to keep a target repository in sync with an
upstream source — for example, mirroring a public TYPO3 repository into a private GitLab
instance or creating read-only forks for controlled distribution.

```bash
git clone --mirror "$SOURCE_URL" repo.git
cd repo.git
git push --mirror "$TARGET_URL"
```

### Default Branch Requirement

`git push --mirror` pushes **all** refs from the source and **deletes** any ref at the target
that no longer exists in the source. GitLab and GitHub will refuse to delete their repository's
default branch, causing the push to fail with an error like:

```
remote: GitLab: You can only delete protected branches using the web interface.
error: failed to push some refs to 'git@gitlab.example.com:org/repo.git'
```

**Root cause**: the target was initialised with a default branch (e.g. `main`) that does not
exist in the upstream (e.g. source uses `12.4`). Every mirror run tries to delete `main` and
GitLab refuses.

**Fix — preferred**: create the target as an **empty project** (no README, no initial commit).
The default branch is then set automatically when the first `git push --mirror` runs.

**Fix — existing repo**: change the default branch in Settings before mirroring. On GitLab:
*Settings → Repository → Default branch*. On GitHub: *Settings → Branches → Default branch*.

### Notes-Ref Gotcha

`git push --mirror` deletes any ref at the target that does not exist in the upstream. If you
store cache data (e.g. split commit maps) in `refs/notes/*` on the mirror target, those refs
will be wiped on every sync run because they are absent from the upstream.

Do not rely on `refs/notes/*` for persistent caching in mirror repositories. Store such state
in a separate repository, a file in object storage, or a CI/CD cache artifact.

### Example CI Job (GitLab)

```yaml
mirror-sync:
  image: alpine/git:2.43.0
  script:
    - git clone --mirror "$SOURCE_URL" repo.git
    - cd repo.git
    - git push --mirror "$TARGET_URL"
  only:
    - schedules
```

## Best Practices

1. **Fast Feedback**: Keep CI under 10 minutes
2. **Parallel Jobs**: Run independent jobs concurrently
3. **Caching**: Cache dependencies and build artifacts
4. **Fail Fast**: Stop on first failure in PR checks
5. **Environment Parity**: Match CI environment to production
6. **Secrets Management**: Use encrypted secrets, rotate regularly
7. **Artifact Retention**: Clean up old artifacts
8. **Status Checks**: Require all checks to pass before merge
