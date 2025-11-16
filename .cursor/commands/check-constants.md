Validate that all hardcoded strings are replaced with constants.

This command will:
1. Run the frontend constants validation script
2. Check for hardcoded strings that should use constants from lib/constants.ts

Execute: `cd nextjs && pnpm lint` (includes constants validation)

Or run validation only: `cd nextjs && tsx scripts/validate-standards.ts`

This ensures compliance with the project rule: "dont hard code strings always use constants"
