#!/usr/bin/env bun
/**
 * Skill Packager - Creates a distributable .skill file (zip) of a skill folder
 *
 * Usage:
 *   bun run package-skill.ts <path/to/skill-folder> [output-directory]
 *
 * Examples:
 *   bun run package-skill.ts skills/public/my-skill
 *   bun run package-skill.ts skills/public/my-skill ./dist
 */

import { existsSync, statSync, mkdirSync } from "fs";
import { resolve, join, relative, basename } from "path";
import { Glob } from "bun";
import { validateSkill } from "./quick-validate";

async function packageSkill(
  skillPath: string,
  outputDir?: string
): Promise<string | null> {
  const dir = resolve(skillPath);

  if (!existsSync(dir)) {
    console.error(`❌ Error: Skill folder not found: ${dir}`);
    return null;
  }

  if (!statSync(dir).isDirectory()) {
    console.error(`❌ Error: Path is not a directory: ${dir}`);
    return null;
  }

  if (!existsSync(join(dir, "SKILL.md"))) {
    console.error(`❌ Error: SKILL.md not found in ${dir}`);
    return null;
  }

  // Validate first
  console.log("🔍 Validating skill...");
  const { valid, message } = validateSkill(dir);
  if (!valid) {
    console.error(`❌ Validation failed: ${message}`);
    console.error("   Please fix the validation errors before packaging.");
    return null;
  }
  console.log(`✅ ${message}\n`);

  // Determine output location
  const skillName = basename(dir);
  const outPath = outputDir ? resolve(outputDir) : process.cwd();
  if (outputDir) {
    mkdirSync(outPath, { recursive: true });
  }

  const skillFilename = join(outPath, `${skillName}.skill`);

  // Use Bun's built-in zip writer
  try {
    const { BunFile } = globalThis.Bun ? globalThis : await import("bun");

    // Collect all files recursively
    const glob = new Glob("**/*");
    const files: string[] = [];
    for await (const file of glob.scan({ cwd: dir, dot: false })) {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isFile()) {
        files.push(file);
      }
    }

    // Use JSZip-style approach with Bun shell for zip creation
    // Bun doesn't have a built-in zip writer, so we use the system zip command
    const parentDir = resolve(dir, "..");
    const folderName = basename(dir);

    const tempZip = skillFilename.replace(/\.skill$/, '.zip');
    const proc = Bun.spawn(
      ["powershell", "-Command",
        `Compress-Archive -Path '${dir}\\*' -DestinationPath '${tempZip}' -Force; if (Test-Path '${tempZip}') { Copy-Item '${tempZip}' '${skillFilename}' -Force; Remove-Item '${tempZip}' -Force }`
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`zip failed: ${stderr}`);
    }

    // List what was packaged
    for (const file of files) {
      console.log(`  Added: ${folderName}/${file}`);
    }

    console.log(`\n✅ Successfully packaged skill to: ${skillFilename}`);
    return skillFilename;
  } catch (e) {
    console.error(`❌ Error creating .skill file: ${e}`);
    return null;
  }
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(
    "Usage: bun run package-skill.ts <path/to/skill-folder> [output-directory]"
  );
  console.log("\nExamples:");
  console.log("  bun run package-skill.ts skills/public/my-skill");
  console.log("  bun run package-skill.ts skills/public/my-skill ./dist");
  process.exit(1);
}

const skillPath = args[0];
const outputDir = args[1];

console.log(`📦 Packaging skill: ${skillPath}`);
if (outputDir) console.log(`   Output directory: ${outputDir}`);
console.log();

const result = await packageSkill(skillPath, outputDir);
process.exit(result ? 0 : 1);
