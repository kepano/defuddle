#!/usr/bin/env bun
/**
 * Skill Initializer - Creates a new skill from template
 *
 * Usage:
 *   bun run init-skill.ts <skill-name> --path <path>
 *
 * Examples:
 *   bun run init-skill.ts my-new-skill --path skills/public
 *   bun run init-skill.ts my-api-helper --path skills/private
 */

import { mkdirSync, writeFileSync, chmodSync, existsSync } from "fs";
import { resolve, join } from "path";

const SKILL_TEMPLATE = (skillName: string, skillTitle: string) => `---
name: ${skillName}
description: [TODO: Complete and informative explanation of what the skill does and when to use it. Include WHEN to use this skill - specific scenarios, file types, or tasks that trigger it.]
---

# ${skillTitle}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Structuring This Skill

[TODO: Choose the structure that best fits this skill's purpose. Common patterns:

**1. Workflow-Based** (best for sequential processes)
- Works well when there are clear step-by-step procedures
- Example: DOCX skill with "Workflow Decision Tree" → "Reading" → "Creating" → "Editing"
- Structure: ## Overview → ## Workflow Decision Tree → ## Step 1 → ## Step 2...

**2. Task-Based** (best for tool collections)
- Works well when the skill offers different operations/capabilities
- Example: PDF skill with "Quick Start" → "Merge PDFs" → "Split PDFs" → "Extract Text"
- Structure: ## Overview → ## Quick Start → ## Task Category 1 → ## Task Category 2...

**3. Reference/Guidelines** (best for standards or specifications)
- Works well for brand guidelines, coding standards, or requirements
- Example: Brand styling with "Brand Guidelines" → "Colors" → "Typography" → "Features"
- Structure: ## Overview → ## Guidelines → ## Specifications → ## Usage...

**4. Capabilities-Based** (best for integrated systems)
- Works well when the skill provides multiple interrelated features
- Example: Product Management with "Core Capabilities" → numbered capability list
- Structure: ## Overview → ## Core Capabilities → ### 1. Feature → ### 2. Feature...

Patterns can be mixed and matched as needed. Most skills combine patterns (e.g., start with task-based, add workflow for complex operations).

Delete this entire "Structuring This Skill" section when done - it's just guidance.]

## [TODO: Replace with the first main section based on chosen structure]

[TODO: Add content here. See examples in existing skills:
- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (TypeScript/Bash/etc.) that can be run directly to perform specific operations.

### references/
Documentation and reference material intended to be loaded into context to inform the agent's process and thinking.

### assets/
Files not intended to be loaded into context, but rather used within the output the agent produces.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
`;

const EXAMPLE_SCRIPT = (skillName: string) => `#!/usr/bin/env bun
/**
 * Example helper script for ${skillName}
 *
 * This is a placeholder script that can be executed directly.
 * Replace with actual implementation or delete if not needed.
 */

function main() {
  console.log("This is an example script for ${skillName}");
  // TODO: Add actual script logic here
}

main();
`;

const EXAMPLE_REFERENCE = (skillTitle: string) => `# Reference Documentation for ${skillTitle}

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

## When Reference Docs Are Useful

Reference docs are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content that's only needed for specific use cases
`;

const EXAMPLE_ASSET = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual asset files (templates, images, fonts, etc.) or delete if not needed.

Asset files are NOT intended to be loaded into context, but rather used within
the output the agent produces.
`;

function titleCase(skillName: string): string {
  return skillName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function initSkill(skillName: string, basePath: string): string | null {
  const skillDir = resolve(basePath, skillName);

  if (existsSync(skillDir)) {
    console.error(`❌ Error: Skill directory already exists: ${skillDir}`);
    return null;
  }

  try {
    mkdirSync(skillDir, { recursive: true });
    console.log(`✅ Created skill directory: ${skillDir}`);
  } catch (e) {
    console.error(`❌ Error creating directory: ${e}`);
    return null;
  }

  const skillTitle = titleCase(skillName);

  try {
    // SKILL.md
    writeFileSync(join(skillDir, "SKILL.md"), SKILL_TEMPLATE(skillName, skillTitle));
    console.log("✅ Created SKILL.md");

    // scripts/
    const scriptsDir = join(skillDir, "scripts");
    mkdirSync(scriptsDir, { recursive: true });
    const examplePath = join(scriptsDir, "example.ts");
    writeFileSync(examplePath, EXAMPLE_SCRIPT(skillName));
    try { chmodSync(examplePath, 0o755); } catch { /* Windows may not support chmod */ }
    console.log("✅ Created scripts/example.ts");

    // references/
    const refsDir = join(skillDir, "references");
    mkdirSync(refsDir, { recursive: true });
    writeFileSync(join(refsDir, "api_reference.md"), EXAMPLE_REFERENCE(skillTitle));
    console.log("✅ Created references/api_reference.md");

    // assets/
    const assetsDir = join(skillDir, "assets");
    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(join(assetsDir, "example_asset.txt"), EXAMPLE_ASSET);
    console.log("✅ Created assets/example_asset.txt");
  } catch (e) {
    console.error(`❌ Error creating resource directories: ${e}`);
    return null;
  }

  console.log(`\n✅ Skill '${skillName}' initialized successfully at ${skillDir}`);
  console.log("\nNext steps:");
  console.log("1. Edit SKILL.md to complete the TODO items and update the description");
  console.log("2. Customize or delete the example files in scripts/, references/, and assets/");
  console.log("3. Run the validator when ready to check the skill structure");

  return skillDir;
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length < 3 || args[1] !== "--path") {
  console.log("Usage: bun run init-skill.ts <skill-name> --path <path>");
  console.log("\nSkill name requirements:");
  console.log("  - Kebab-case identifier (e.g., 'my-data-analyzer')");
  console.log("  - Lowercase letters, digits, and hyphens only");
  console.log("  - Max 64 characters");
  console.log("\nExamples:");
  console.log("  bun run init-skill.ts my-new-skill --path skills/public");
  console.log("  bun run init-skill.ts my-api-helper --path skills/private");
  process.exit(1);
}

const skillName = args[0];
const path = args[2];

console.log(`🚀 Initializing skill: ${skillName}`);
console.log(`   Location: ${path}\n`);

const result = initSkill(skillName, path);
process.exit(result ? 0 : 1);
