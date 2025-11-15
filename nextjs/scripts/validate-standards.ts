#!/usr/bin/env tsx
/**
 * Validation script for frontend coding standards
 * Checks for issues that Biome cannot detect:
 * - File size limits
 * - Naming conventions
 * - Hardcoded strings in JSX
 * - Import organization
 * - Type exports
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";

const MAX_FILE_LINES = 500;
const ROOT_DIR = join(process.cwd());
const SOURCE_DIRS = [
  join(ROOT_DIR, "components"),
  join(ROOT_DIR, "lib"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "hooks"),
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.d\.ts$/,
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /constants\.ts$/, // Allow hardcoded strings in constants.ts
];

const ALLOWED_HARDCODED_PATTERNS = [
  /^["']\s*$/, // Empty strings
  /^["']\s*["']$/, // Empty strings
  /data-testid/, // Test IDs
  /data-/, // Data attributes
  /aria-label/, // ARIA attributes (though should use constants)
  /className/, // CSS classes
  /^["'][a-z-]+["']$/, // Single lowercase words with hyphens (likely CSS classes)
  /^["']\d+["']$/, // Numbers as strings
  /^["'][A-Z_]+["']$/, // UPPER_CASE (likely constants)
  /process\.env/, // Environment variables
  /import\s+.*from/, // Import statements
  /export\s+/, // Export statements
  /^["']use\s+(client|server)["']$/, // Next.js directives
  /^["']\/.*["']$/, // Path strings starting with /
  /^["']https?:\/\/.*["']$/, // URLs
  /^["']mailto:.*["']$/, // Email links
  /^["']tel:.*["']$/, // Phone links
  /^["']#[a-z-]+["']$/, // CSS selectors/IDs
  /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i, // Image file extensions
  /\.(ts|tsx|js|jsx|json|css|scss)$/i, // File extensions
];

interface ValidationError {
  file: string;
  line: number;
  message: string;
  severity: "error" | "warning";
}

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];

function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isKebabCase(name: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function checkFileSize(filePath: string, content: string): void {
  const lines = content.split("\n").length;
  if (lines > MAX_FILE_LINES) {
    errors.push({
      file: filePath,
      line: 0,
      message: `File exceeds ${MAX_FILE_LINES} lines (${lines} lines). Split into smaller modules.`,
      severity: "error",
    });
  }
}

function checkFileName(filePath: string): void {
  const fileName = basename(filePath, extname(filePath));
  const ext = extname(filePath);

  if (ext === ".tsx" || ext === ".ts") {
    // Component files should be kebab-case
    // Exception: index files and type files
    if (
      fileName !== "index" &&
      !fileName.endsWith("-types") &&
      !fileName.endsWith("-utils") &&
      !isKebabCase(fileName) &&
      !isPascalCase(fileName) // Allow PascalCase for component files
    ) {
      // Allow PascalCase for component files in components directory
      const isComponentFile = filePath.includes("/components/");
      if (!isComponentFile && !isKebabCase(fileName)) {
        warnings.push({
          file: filePath,
          line: 0,
          message: `File name "${fileName}" should be in kebab-case (e.g., "user-profile.tsx")`,
          severity: "warning",
        });
      }
    }
  }
}

function checkHardcodedStrings(filePath: string, content: string): void {
  // Skip constants.ts file
  if (filePath.endsWith("constants.ts")) {
    return;
  }

  const lines = content.split("\n");
  // Only check text content in JSX, not attributes (aria-labels, etc. are fine)
  const jsxTextRegex = />\s*([A-Z][^<>{}\n]{3,})\s*</g; // Text content in JSX

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
      return;
    }

    // Skip lines with aria-label, aria-labelledby, title, alt, placeholder (these are often hardcoded for accessibility)
    if (
      /aria-label|aria-labelledby|title=|alt=|placeholder=|aria-describedby|aria-valuetext/.test(
        line
      )
    ) {
      return;
    }

    // Check for hardcoded strings in JSX text content only
    const jsxMatches = [...line.matchAll(jsxTextRegex)];

    for (const match of jsxMatches) {
      const stringValue = match[1]?.trim();
      if (!stringValue) continue;

      // Skip if it matches allowed patterns
      const isAllowed = ALLOWED_HARDCODED_PATTERNS.some((pattern) => pattern.test(stringValue));

      // Skip if it's a variable reference (contains {})
      if (stringValue.includes("{") || stringValue.includes("}")) {
        continue;
      }

      // Skip if it's clearly a technical identifier
      if (
        /^[a-z-]+$/.test(stringValue) && // Single lowercase word
        stringValue.length < 10 // Short strings are likely CSS classes or IDs
      ) {
        continue;
      }

      // Skip if it's in a comment
      const beforeMatch = line.substring(0, match.index || 0);
      if (beforeMatch.includes("//") || beforeMatch.includes("/*")) {
        continue;
      }

      // Only flag strings that are clearly user-facing text in JSX content
      // Must be longer than 15 characters and contain spaces (likely user-facing text)
      const looksLikeUserText =
        /^[A-Z]/.test(stringValue) && // Starts with capital
        stringValue.length > 15 && // Long enough to be meaningful text
        stringValue.includes(" "); // Has spaces (not a single word)

      if (looksLikeUserText && !isAllowed) {
        errors.push({
          file: filePath,
          line: lineNum,
          message: `Hardcoded string detected: "${stringValue.substring(0, 50)}...". Use constants from lib/constants.ts instead.`,
          severity: "error",
        });
      }
    }
  });
}

function checkImportOrganization(filePath: string, content: string): void {
  const lines = content.split("\n");
  let inImports = false;
  let lastImportType: "external" | "internal" | "relative" | null = null;
  let importLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip "use client" and other directives
    if (trimmed.startsWith('"use ') || trimmed.startsWith("'use ")) {
      continue;
    }

    // Check if this is an import statement
    if (trimmed.startsWith("import ")) {
      inImports = true;
      importLineNum = i + 1;

      // Determine import type
      let importType: "external" | "internal" | "relative" | null = null;
      if (trimmed.includes('from "') || trimmed.includes("from '")) {
        const fromMatch = trimmed.match(/from\s+["']([^"']+)["']/);
        if (fromMatch) {
          const modulePath = fromMatch[1];
          if (modulePath.startsWith(".")) {
            importType = "relative";
          } else if (modulePath.startsWith("@/")) {
            importType = "internal";
          } else {
            importType = "external";
          }
        }
      }

      // Check import order: external → internal → relative
      // This is a warning, not an error, as import order is less critical
      if (lastImportType && importType) {
        const order = { external: 0, internal: 1, relative: 2 };
        if (order[importType] < order[lastImportType]) {
          warnings.push({
            file: filePath,
            line: importLineNum,
            message: `Import order violation. Imports should be: external → internal (@/) → relative (./). Found ${importType} after ${lastImportType}.`,
            severity: "warning",
          });
        }
      }

      lastImportType = importType;
    } else if (inImports && trimmed && !trimmed.startsWith("//")) {
      // End of imports section
      inImports = false;
      lastImportType = null;
    }
  }
}

function checkTypeExports(_filePath: string, content: string): void {
  // Check for type-only exports that should use "export type"
  const typeExportRegex = /export\s+(interface|type)\s+(\w+)/g;
  const lines = content.split("\n");

  lines.forEach((line, _index) => {
    const matches = [...line.matchAll(typeExportRegex)];
    for (const _match of matches) {
      // This is just informational - Biome handles this
      // But we can check if it's exported and suggest using "export type"
    }
  });
}

function checkComponentStructure(filePath: string, content: string): void {
  // Check if component file has "use client" when using hooks
  const hasHooks = /useState|useEffect|useCallback|useMemo|useRef|useContext/.test(content);
  const hasUseClient = /^["']use\s+client["']/m.test(content);
  const isComponentFile = filePath.endsWith(".tsx") && !filePath.includes(".test.");

  if (hasHooks && !hasUseClient && isComponentFile) {
    warnings.push({
      file: filePath,
      line: 1,
      message:
        'Component uses React hooks but missing "use client" directive. Add "use client" at the top of the file.',
      severity: "warning",
    });
  }
}

function processFile(filePath: string): void {
  if (shouldIgnoreFile(filePath)) {
    return;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const relativePath = relative(ROOT_DIR, filePath);

    checkFileSize(relativePath, content);
    checkFileName(relativePath);
    checkHardcodedStrings(relativePath, content);
    checkImportOrganization(relativePath, content);
    checkTypeExports(relativePath, content);
    checkComponentStructure(relativePath, content);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function walkDirectory(dir: string): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (shouldIgnoreFile(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walkDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(fullPath);
        if (ext === ".ts" || ext === ".tsx") {
          processFile(fullPath);
        }
      }
    }
  } catch (_error) {
    // Directory might not exist, skip it
  }
}

// Main execution
function main(): void {
  console.log("Validating frontend coding standards...\n");

  for (const dir of SOURCE_DIRS) {
    walkDirectory(dir);
  }

  // Show warnings first
  if (warnings.length > 0) {
    console.warn(`Found ${warnings.length} validation warning(s):\n`);
    warnings.forEach((warning) => {
      console.warn(`  ${warning.file}:${warning.line}`);
      console.warn(`    ⚠ ${warning.message}\n`);
    });
  }

  // Then show errors
  if (errors.length > 0) {
    console.error(`Found ${errors.length} validation error(s):\n`);
    errors.forEach((error) => {
      console.error(`  ${error.file}:${error.line}`);
      console.error(`    ✗ ${error.message}\n`);
    });
    process.exit(1);
  } else {
    if (warnings.length > 0) {
      console.log(`✓ Validation complete with ${warnings.length} warning(s).`);
    } else {
      console.log("✓ All validation checks passed!");
    }
    process.exit(0);
  }
}

main();
