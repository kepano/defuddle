#!/usr/bin/env bun
/**
 * Quick validation script for skills - TypeScript version
 *
 * Usage:
 *   bun run quick-validate.ts <skill_directory>
 */

import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

// Allowed frontmatter properties
const ALLOWED_PROPERTIES = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "metadata",
  "compatibility",
]);

interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateSkill(skillPath: string): ValidationResult {
  const dir = resolve(skillPath);
  const skillMd = join(dir, "SKILL.md");

  if (!existsSync(skillMd)) {
    return { valid: false, message: "SKILL.md not found" };
  }

  const content = readFileSync(skillMd, "utf-8");

  if (!content.startsWith("---")) {
    return { valid: false, message: "No YAML frontmatter found" };
  }

  // Extract frontmatter between --- markers
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { valid: false, message: "Invalid frontmatter format" };
  }

  const frontmatterText = match[1];

  // Simple YAML key-value parser (handles basic cases without a yaml lib)
  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }

  // Check for unexpected properties
  const unexpected = Object.keys(frontmatter).filter(
    (k) => !ALLOWED_PROPERTIES.has(k)
  );
  if (unexpected.length > 0) {
    return {
      valid: false,
      message: `Unexpected key(s) in SKILL.md frontmatter: ${unexpected.join(", ")}. Allowed: ${[...ALLOWED_PROPERTIES].sort().join(", ")}`,
    };
  }

  // Required fields
  if (!frontmatter.name) {
    return { valid: false, message: "Missing 'name' in frontmatter" };
  }
  if (!frontmatter.description) {
    return { valid: false, message: "Missing 'description' in frontmatter" };
  }

  // Validate name
  const name = frontmatter.name.trim();
  if (name) {
    if (!/^[a-z0-9-]+$/.test(name)) {
      return {
        valid: false,
        message: `Name '${name}' should be kebab-case (lowercase letters, digits, and hyphens only)`,
      };
    }
    if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) {
      return {
        valid: false,
        message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens`,
      };
    }
    if (name.length > 64) {
      return {
        valid: false,
        message: `Name is too long (${name.length} characters). Maximum is 64 characters.`,
      };
    }
  }

  // Validate description
  const description = frontmatter.description.trim();
  if (description) {
    if (description.includes("<") || description.includes(">")) {
      return {
        valid: false,
        message: "Description cannot contain angle brackets (< or >)",
      };
    }
    if (description.length > 1024) {
      return {
        valid: false,
        message: `Description is too long (${description.length} characters). Maximum is 1024 characters.`,
      };
    }
  }

  // Validate compatibility (optional)
  const compatibility = frontmatter.compatibility?.trim();
  if (compatibility) {
    if (compatibility.length > 500) {
      return {
        valid: false,
        message: `Compatibility is too long (${compatibility.length} characters). Maximum is 500 characters.`,
      };
    }
  }

  return { valid: true, message: "Skill is valid!" };
}

// --- CLI ---
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log("Usage: bun run quick-validate.ts <skill_directory>");
    process.exit(1);
  }

  const { valid, message } = validateSkill(args[0]);
  console.log(message);
  process.exit(valid ? 0 : 1);
}
