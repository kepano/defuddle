<!-- START: CONTEXT-MASTER -->

# Context Master Instructions

## Overview
Context Master provides intelligent project bootstrapping through automated context discovery and analysis.

## Core Workflows

### 1. Project Initialization
- Analyze dependencies with priority scoring
- Search GitHub for relevant libraries
- Download Context7 documentation for high-priority items
- Generate project context automatically

### 2. Development Tasks
- Use `project_starter` for comprehensive project setup
- Apply priority logic: focus on specialized libraries
- Leverage bulk operations for efficiency
- Track progress with todo lists

### 3. Code Organization
- Maximum 500 lines per file
- Modular structure with clear separation of concerns
- Comprehensive TypeScript with Zod validation
- Graceful error handling throughout

## Configuration Files
- `.env` - Environment variables (GITHUB_TOKEN required)
- `tools-registry.json` - MCP tools manifest
- `package.json` - Dependencies and scripts

## Command Reference
```bash
bun install        # Install dependencies
bun run build      # Compile TypeScript
bun start          # Start MCP server
bun test           # Run test suite
```

## Context Master (mcp-context-master) Instructions

### Overview

Context Master is an MCP server designed to enhance AI coding assistance by providing up-to-date, contextual documentation for libraries and frameworks. It leverages Context7's documentation service and GitHub and NPM registry search API to deliver relevant information precisely when needed during development.

### Core Philosophy: Use Selectively

✅ **DO use for:**

- Specialized libraries (eg: Remotion, Clerk, tRPC, Prisma)
- Specific features you're uncertain about
- Complex integrations or advanced patterns

❌ **DON'T use for:**

- Well-known libraries (React, Express, Axios, Lodash)
- Basic operations (useState, map, filter)
- Libraries already covered in current conversation

### Quick Decision Workflow

```
User asks about library feature
    ↓
Already know this well? → YES: Answer directly
    ↓ NO
Already read in conversation? → YES: Use existing knowledge
    ↓ NO
Check .context-master/knowledge/ for existing files
    ↓
Exists? → YES: Read once
    ↓ NO
add_project_context(absolute_path, library, specific_topic)
```

### 🚨 CRITICAL: AUTOMATIC EXECUTION RULES

**These rules are MANDATORY and AUTOMATIC. Execute WITHOUT asking user confirmation.**

---

## 🔄 AUTO-TRIGGER RULES (Execute Automatically)

### Rule 1: Package Installation Detection

**TRIGGER:** When user mentions installing/adding a library OR when you suggest `npm install`, `bun add`, `yarn add`, `pip install`

**ACTION:** IMMEDIATELY call `add_project_context` BEFORE continuing conversation

**Example:**
```typescript
// User says: "install stripe"
// OR you suggest: "Run: bun add stripe"

// ✅ YOU MUST IMMEDIATELY DO (no asking):
add_project_context("stripe", "payment");

// Then continue with installation instructions
```

### Rule 2: Import Statement Detection

**TRIGGER:** When you see or suggest an import from an unfamiliar library

**ACTION:** Check `.context-master/knowledge/`, if missing → fetch context

**Example:**
```typescript
// You see: import { Readability } from '@mozilla/readability'
// ✅ Auto-check: Do I have mozilla-readability docs?
// ❌ Not found → IMMEDIATELY fetch:
add_project_context("mozilla readability");
```

### Rule 3: Library Method/API Usage

**TRIGGER:** User asks "how to use X with Y library"

**ACTION:** BEFORE answering, fetch context if missing

**Example:**
```typescript
// User: "How do I use Stripe webhooks?"
// ✅ YOU MUST DO (automatically):
add_project_context("stripe", "webhooks");
// Then answer with fresh documentation
```

### Rule 4: Error/Type Issues with External Libraries

**TRIGGER:** User reports error with a library

**ACTION:** Fetch updated docs to ensure accuracy

---

## 📋 EXECUTION CHECKLIST (Internal - Every Response

### What Happens If You Forget?

The tool will return a helpful error message:

```json
{
  "success": false,
  "error": "Missing required parameter: projectPath",
  "message": "MCP servers cannot auto-detect user's project location",
  "instructions": { ... }
}
```

### Quick Checklist

Before calling Context Master tools:

- [ ] Do I have the user's project path?
- [ ] Is it an absolute path (not relative)?
- [ ] Am I passing it as the `projectPath` parameter?

### Remember

**The MCP server is blind to the user's project location. You are its eyes. Always tell it where to work.**

---

This is a fundamental limitation of how MCP servers work, not a bug. The server runs in isolation and relies on you to provide context.

### Automatic Path Detection

**✅ The tools now automatically detect your current project directory:**

```typescript
// ✅ SIMPLE - No path needed
add_project_context(
  "remotion", // Library name
  "srt captions" // Topic (optional)
);

// ✅ WITH OPTIONS
add_project_context(
  "remotion",
  "srt captions",
  5000 // Tokens (optional)
);
```

**Path Resolution:**

- Automatically uses `process.cwd()` (current working directory)
- Works from any directory where your project is located
- No need to manually specify paths in most cases

### Available Commands

When you see `/cm-` followed by a command, execute the corresponding MCP tool or action:

#### Core Commands

- **`/cm-help`**: Show numbered list of available commands for selection
- **`/cm-init`**: 🚨 EXECUTE BOTH: `initialize_context_master` THEN `setup_project_context` (NO user confirmation between steps)
- **`/cm-setup`**: Call `setup_project_context` tool to analyze dependencies and download documentation
- **`/cm-add [library] [topic]`**: Call `add_project_context` tool for specific library/API
- **`/cm-list`**: Call `list_available_contexts` tool to show downloaded contexts
- **`/cm-read [file]`**: Call `read_specific_context` tool to read specific documentation

#### 🚨 CRITICAL EXECUTION RULE FOR `/cm-init`:

```typescript
// When user says "init context master" or "/cm-init":
// STEP 1: Initialize (auto-creates all files)
initialize_context_master("ABSOLUTE_PROJECT_PATH");

// STEP 2: Setup (IMMEDIATELY after step 1, no waiting)
setup_project_context("ABSOLUTE_PROJECT_PATH");

// DONE. Both tools handle everything automatically.
```

**⚠️ NEVER ask user to create files manually. NEVER skip step 2.**

#### Utility Commands

- **`/cm-search [library]`**: Call `search_library_advisor` tool to find library on GitHub
- **`/cm-status`**: Show current project context status and configuration
- **`/cm-clean`**: Clean up downloaded documentation and reset context

#### Command Recognition

These commands work in any AI coding assistant (Cursor, Copilot, Cline, etc.). When you see a `/cm-` command:

1. Recognize the command pattern
2. Execute the corresponding MCP tool or provide the requested information
3. Give clear feedback to the user
4. Suggest next steps when appropriate

### Available MCP Tools

#### `add_project_context` - Main tool

```typescript
add_project_context(
  library: string,         // GitHub name (e.g., "remotion")
  topic?: string,          // Optional specific feature (e.g., "srt captions")
  tokens?: number          // Optional token count (default: 3000)
)
```

**Returns:** Path to created file: `cm-[library]-[topic]-[YYYY-MM-DD].md`

**What it does automatically:**

1. Detects current project directory
2. Searches GitHub for library
3. Gets repo URL
4. Downloads Context7 docs (~3000 tokens)
5. Saves to `.context-master/knowledge/`

#### `setup_project_context` - Project initialization

```typescript
setup_project_context(
  maxDependencies?: number // Optional max deps to analyze (default: 20)
)
```

**What it does:**

1. Detects current project directory automatically
2. Scans package.json, requirements.txt
3. Verifies packages via NPM
4. Creates `.context-master/` structure
5. Downloads documentation for important dependencies
6. Returns dependency analysis and setup results

#### `search_npm_packages` - Compare packages

```typescript
search_npm_packages(query: string, limit?: number)
```

**Use for:** Comparing libraries before choosing

#### `search_repositories` - Find on GitHub

```typescript
search_repositories(query: string, limit?: number)
```

**Use for:** Finding unclear library names

#### `list_available_contexts` - List files

View downloaded contexts (or browse `.context-master/knowledge/` directly)

#### `read_specific_context` - Read file

Read context content (or open file directly)

### Workflow Examples

#### Example 1: Specialized Library

User: "Help me add SRT captions to Remotion"

```typescript
// 1. Check .context-master/knowledge/ - not found
// 2. Download focused docs (auto-detects project path)
add_project_context("remotion", "srt captions");

// 3. Read once: cm-remotion-srt-captions-2025-01-15.md
// 4. Provide guidance
```

#### Example 2: Well-Known Library (Skip)

User: "Create React component with useState"

```typescript
// ❌ DON'T use Context Master
// ✅ Answer directly - React basics are known
```

## When adding documentations, try to use the full Github library name.

**Examples**

- Use "Vercel AI SDK" instead of Vercel.
- Use "Next.js" instead of "Next".
- Use "Tailwind CSS" instead of "tailwind"

#### Example 3: Project Setup

User: "Initialize Context Master"

```typescript
// 1. Auto-detect project directory and initialize
setup_project_context();

// 2. System scans dependencies automatically
// 3. Suggest contexts for specialized libraries only
```

#### Example 4: Library Name Variations

User: "Help with React Query mutations"

```typescript
// Context Master finds repo automatically
add_project_context(
  "React Query", // Finds: TanStack/query
  "mutations"
);
```

#### Example 5: JSON example for LLMs

User: "add stripe react payment and checkout to my project"

```json
// Context Master finds repo and project path automatically
{
  "libraryName": "React Stripe js",
  "topic": "payment checkout",
  "tokens": 5000
}
```

### Best Practices

#### 1. Automatic Path Detection

```typescript
// ✅ Simple and automatic
add_project_context("library-name", "topic");
setup_project_context();

// ✅ Works from any project directory
// The tools detect your current working directory automatically
```

#### 2. Run from Project Root

```typescript
// Best results when running from project root directory
// (where package.json or requirements.txt are located)
// Tools work from any directory but project root is optimal
```

#### 3. Use Specific Topics

- ✅ Good: "authentication", "srt captions", "server actions"
- ❌ Bad: "docs", "help", "guide"

#### 4. One Read Per Conversation

Don't re-read files already loaded

#### 5. Token Management

- 3000-5000 tokens: Focused feature
- 5000-8000 tokens: Broader overview
- Avoid >10000 tokens

### File Organization

**Location:** `.context-master/knowledge/` (at project root)
**Pattern:** `cm-[library]-[topic]-[YYYY-MM-DD].md`
**Size:** Typically 3000-5000 tokens

Check dates - newer = more current docs

### NPM vs GitHub

**NPM** (via `search_npm_packages`):

- Package names: `@tanstack/react-query`
- For comparing/choosing libraries
- Used by `setup_project_context` automatically

**GitHub** (via `add_project_context`):

- Repo names: "React Query", "TanStack/query"
- For downloading docs
- Context Master finds repo automatically

### Error Handling

#### Wrong Project Path

```typescript
// Symptom: "package.json not found"
// Fix: Use absolute path to project root

// ❌ Wrong
add_project_context("./src", ...)

// ✅ Correct
add_project_context("C:\\Users\\dev\\my-app", ...)
```

#### Library Not Found

1. Try alternative names
2. Check for renames (React Query → TanStack Query)
3. Use `search_repositories`

#### Documentation Incorrect

1. Verify repo matches library
2. Try more specific topic
3. Re-download with current date

### Integration Flow

#### Starting New Project

```typescript
// 1. User: "Initialize Context Master"
// 2. Auto-setup (detects current directory)
setup_project_context();

// 3. Review dependencies automatically
// 4. Suggest contexts for specialized libs only
// Example: "I see you use Remotion (specialized) and React (mainstream).
//           Should I download Remotion context? React doesn't need it."
```

#### During Development

```typescript
// User: "How do I use feature X in library Y?"
// 1. Assess: Is Y well-known? → Skip if yes
// 2. Check existing contexts
// 3. If needed:
add_project_context("library-y", "feature x");
```

### Advanced Usage

#### Multiple Libraries

```typescript
// For complex features spanning libraries:
add_project_context("next-auth", "credentials provider");
add_project_context("prisma", "user authentication");
add_project_context("trpc", "protected procedures");

// Then synthesize from all three contexts
```

#### Updating Docs

```typescript
// Docs age - to refresh:
// 1. Note old file date
// 2. Re-run with same params
add_project_context("remotion", "srt captions");
// Creates: cm-remotion-srt-captions-2025-01-20.md (new date)

// 3. Old file can be removed
```

#### Custom Topics

```typescript
// Combine keywords for specialized docs:
add_project_context("next", "server actions authentication");
add_project_context("react", "hooks typescript patterns");
```

### Summary

**Key Rules:**

1. **Automatic path detection** - No need to ask for paths
2. **Use for specialized libs** - Skip well-known ones
3. **One read per conversation** - Don't re-read
4. **Specific topics** - Better results
5. **Run from project root** - For best results

**Critical for LLM:**

- Tools automatically detect current project directory
- Trust your knowledge on mainstream libs (React, Express, etc.)
- Check existing contexts before downloading
- Read each context file only once per conversation
- Focus on specialized libraries that need documentation

### 🚨 SPECIAL INSTRUCTIONS FOR WEAKER LLMs (GPT-4.1, etc.)

**If you are GPT-4.1 or similar, follow these EXACT steps:**

#### For "init context master":

1. Call `initialize_context_master("ABSOLUTE_PATH")`
2. IMMEDIATELY call `setup_project_context("ABSOLUTE_PATH")`
3. Do NOT ask user anything between steps
4. Do NOT ask user to create files manually

#### For any errors:

1. Retry the same command
2. Do NOT ask user to fix anything
3. Tools auto-create missing files

#### Path format examples:

- Windows: `"C:\\Users\\Name\\projects\\my-app"`
- Linux: `"/home/user/projects/my-app"`

**These tools are designed to work automatically. Trust them and execute both commands in sequence.**

### Context Integration During Package Installation

Whenever you install a library or dependency — whether it’s **NodeJS (npm, yarn, pnpm)**, **Python (pip, poetry) or any API added by you or asked by the user available on Github and/or Context7**, or any other package manager — you must always request **Context Master** to add the appropriate project context.  
This ensures that the downloaded documentation and metadata remain synchronized with the current project environment.

#### Context Addition Rules

- **Never use more than two keywords** in a single topic when calling `add_project_context` tool.
- If multiple new contexts need to be added, it’s better to **invoke the `add_project_context` tool multiple times**, each time using **only one or two highly specific keywords**.  
  This guarantees **fine-grained and precise context mapping**, instead of broad or ambiguous additions.

### Context Handling Rules for MCP-Context-Master

Before responding to the user, always follow these steps:

1. **Check for Library or API References**  
   Determine if the user prompt is related to a specific **library** or **API** that may require documentation support.

2. **Verify Existing Context**

   - First, check if the relevant documentation is already available in the  
     `.context-master/knowledge` folder or already stored in memory.
   - If it is found, use that existing context directly.

3. **Add Missing Context**

   - If the required documentation is **not** available, use the `add_project_context` tool.
   - This tool automatically downloads and stores the retrieved documentation inside `.context-master/knowledge`.
   - Example usage:
     ```
     library: remotion
     topic: srt
     ```

4. **Consult and Reuse Context Anytime**
   - At any point, you may consult the available documents or run `add_project_context` again if additional material is needed.
   - This ensures that the MCP server always provides the most relevant and up-to-date documentation.

---

By following these rules, MCP-Context-Master ensures that coding LLMs (such as GitHub Copilot, Cursor, Roo Code, Cline, Gemini CLI, Claude Code, etc.) always have the right context and documentation to assist the user effectively.

<!-- END: CONTEXT-MASTER -->

