---
name: fallow-analysis
description: Codebase intelligence for TypeScript/JavaScript. Finds dead code, duplication, architectural hotspots, and complexity. Use when asked to audit code quality, find dead code, check duplication, code health check, codebase complexity or run fallow.
---

# Fallow Codebase Intelligence

Fallow is a deterministic static analysis tool for JS/TS repositories. It helps you analyze code health, find unused files/exports/dependencies, and detect duplicate code.

**⚠️ IMPORTANT NOTE:** All code, code comments, and prompts generated or written when working with this skill MUST always be in English.

## 🚀 Example User Prompts

When the user asks questions like these, you should use this skill to run Fallow:

-   "Audit the codebase quality"
-   "Are there any unused dependencies?"
-   "Find dead code and unused exports in this project."
-   "Check if there is any duplicated code."
-   "Clean up unused exports"
-   "Set up a CI quality gate"
-   "Do a health check on the repo."
-   "Check the complexity of this codebase"
-   "Why is this export flagged as unused?"
-   "Check if this PR introduces quality risk"
-   "Find unused files in the payments package"
-   "What's the duplication percentage?"

## 🛠️ Commands for Agents

As an agent, you can execute these commands via your terminal tools (`bash` or `run_shell_command`). Fallow is very fast; use these commands to gather concrete evidence before modifying code or to verify your own changes.

### 1. Audit changes (PR)
```bash
npx -y fallow audit
npx -y fallow audit --format json
```
*Use this to audit modified files and see if you introduced complexity or new issues.*

### 2. Find Dead Code
```bash
npx -y fallow dead-code
npx -y fallow dead-code --unused-exports
npx -y fallow dead-code --circular-deps
```
*To identify unused files, unused dependencies, and exports that can be safely removed.*

### 3. Detect Duplication
```bash
npx -y fallow dupes
npx -y fallow dupes --mode semantic
```
*Finds copy-pasted code blocks. The `semantic` mode even finds code where variables have been renamed.*

### 4. Health and Complexity
```bash
npx -y fallow health
npx -y fallow health --top 20
npx -y fallow health --targets
```
*Highlights the most complex functions and identifies where to focus refactoring efforts.*

### 5. Auto-fix (Preview)
```bash
npx -y fallow fix --dry-run
```
*Shows a preview of cleanups that can be applied automatically.*

## 💡 How to use Fallow results

When you use `npx -y fallow --format json`, the output includes an `actions` array with an `auto_fixable` flag. Use this structured data to apply precise fixes.

**Golden Rule:** Instead of guessing what code is unused or searching with `grep`, always run Fallow first to get deterministic evidence based on the import graph!
