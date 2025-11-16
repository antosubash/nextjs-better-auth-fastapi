# Frontend Coding Standards

This document defines the coding standards for the Next.js frontend application. All code should adhere to these standards to ensure consistency, maintainability, and quality.

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [File Organization](#file-organization)
3. [TypeScript Standards](#typescript-standards)
4. [React Patterns](#react-patterns)
5. [Constants Usage](#constants-usage)
6. [Import Organization](#import-organization)
7. [Code Style](#code-style)
8. [Better Auth Patterns](#better-auth-patterns)
9. [Accessibility](#accessibility)
10. [Performance](#performance)
11. [Error Handling](#error-handling)
12. [Testing](#testing)

## Naming Conventions

### Files and Directories

- **Component files**: Use kebab-case (e.g., `user-profile.tsx`, `login-form.tsx`)
- **Utility files**: Use kebab-case (e.g., `api-client.ts`, `format-utils.ts`)
- **Type definition files**: Use kebab-case (e.g., `user-types.ts`, `api-types.ts`)
- **Directories**: Use kebab-case (e.g., `components/`, `lib/utils/`)

### Components

- **Component names**: Use PascalCase (e.g., `UserProfile`, `LoginForm`)
- **Component props interfaces**: Use PascalCase with `Props` suffix (e.g., `UserProfileProps`, `LoginFormProps`)

```typescript
// ✅ Good
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}

// ❌ Bad
interface userProfileProps {
  userId: string;
}

export function userProfile({ userId }: userProfileProps) {
  // ...
}
```

### Constants

- **Constant objects**: Use UPPER_SNAKE_CASE (e.g., `AUTH_LABELS`, `ERROR_MESSAGES`)
- **Individual constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)

```typescript
// ✅ Good
export const AUTH_LABELS = {
  LOGIN: "Log in",
  SIGNUP: "Sign up",
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ❌ Bad
export const authLabels = {
  login: "Log in",
};

export const maxFileSize = 5 * 1024 * 1024;
```

### Types and Interfaces

- **Type names**: Use PascalCase (e.g., `User`, `ApiResponse`, `TaskStatus`)
- **Interface names**: Use PascalCase (e.g., `UserProfile`, `ApiError`)
- **Generic type parameters**: Use single uppercase letters (e.g., `T`, `K`, `V`)

```typescript
// ✅ Good
export interface User {
  id: string;
  name: string;
  email: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export function fetchData<T>(url: string): Promise<T> {
  // ...
}

// ❌ Bad
export interface user {
  id: string;
}

export type taskStatus = "pending" | "completed";
```

### Functions and Variables

- **Function names**: Use camelCase (e.g., `getUserData`, `handleSubmit`)
- **Variable names**: Use camelCase (e.g., `userData`, `isLoading`)
- **Boolean variables**: Prefix with `is`, `has`, `should`, or `can` (e.g., `isLoading`, `hasError`, `shouldValidate`)

```typescript
// ✅ Good
const isLoading = true;
const hasPermission = false;
const userData = await fetchUser();

function handleSubmit() {
  // ...
}

// ❌ Bad
const loading = true;
const permission = false;
const user_data = await fetchUser();

function HandleSubmit() {
  // ...
}
```

## File Organization

### File Size Limit

- **Maximum file size**: 500 lines
- If a file exceeds 500 lines, split it into smaller, focused modules

### Component Structure

Organize component files in this order:

1. "use client" directive (if needed)
2. Imports (external → internal → relative)
3. Type/interface definitions
4. Constants (if component-specific)
5. Component implementation
6. Exports

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AUTH_LABELS } from "@/lib/constants";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // Component implementation
}
```

### Directory Structure

```
nextjs/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── (routes)/          # Route groups
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── (feature)/        # Feature-specific components
├── lib/                   # Utilities and configuration
│   ├── utils/            # Utility functions
│   └── types/            # Type definitions
├── hooks/                 # Custom React hooks
└── scripts/              # Build and utility scripts
```

## TypeScript Standards

### Strict Typing

- Always use TypeScript's strict mode
- Avoid `any` type - use `unknown` if type is truly unknown
- Use type inference where appropriate, but be explicit for exported functions

```typescript
// ✅ Good
export function getUser(id: string): Promise<User> {
  // ...
}

const user = await getUser("123"); // Type inferred as User

// ❌ Bad
export function getUser(id: any): any {
  // ...
}
```

### Interface vs Type

- Use `interface` for object shapes that might be extended
- Use `type` for unions, intersections, and computed types

```typescript
// ✅ Good - Interface for extensible object shapes
export interface User {
  id: string;
  name: string;
}

export interface AdminUser extends User {
  permissions: string[];
}

// ✅ Good - Type for unions
export type TaskStatus = "pending" | "in_progress" | "completed";

// ✅ Good - Type for computed types
export type UserKeys = keyof User;
```

### Type Exports

- Export types and interfaces from dedicated type files when shared across multiple files
- Use `export type` for type-only exports to enable tree-shaking

```typescript
// ✅ Good
export type { User, UserProfile } from "./user-types";
export type { Task, TaskStatus } from "./task-types";

// ❌ Bad
export { User, UserProfile } from "./user-types"; // Not type-only
```

### Return Types

- Explicitly type return types for exported functions
- Use type inference for internal/private functions

```typescript
// ✅ Good
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good - Internal function can use inference
function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}
```

## React Patterns

### Component Structure

- Use function components with TypeScript
- Define prop interfaces above the component
- Use descriptive component and prop names

```typescript
// ✅ Good
interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={className}>
      {/* Component content */}
    </div>
  );
}

// ❌ Bad
export function UserCard(props: any) {
  // ...
}
```

### Hooks Usage

- Follow React hooks rules (only call at top level, only in React functions)
- Use custom hooks to extract reusable logic
- Name custom hooks with `use` prefix

```typescript
// ✅ Good
export function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setIsLoading(false));
  }, [userId]);

  return { user, isLoading };
}

// ❌ Bad
export function getUserData(userId: string) {
  // Not a hook - can't use hooks here
}
```

### "use client" Directive

- Add `"use client"` directive at the top of files that use:
  - React hooks (useState, useEffect, etc.)
  - Browser APIs (window, document, etc.)
  - Event handlers
  - Context providers/consumers

```typescript
// ✅ Good
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // ...
}

// ❌ Bad - Missing "use client" for hook usage
import { useState } from "react";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

### Props Destructuring

- Destructure props in the function signature
- Provide default values using default parameters

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function Button({
  label,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  // ...
}

// ❌ Bad
export function Button(props: ButtonProps) {
  const label = props.label;
  const variant = props.variant || "primary";
  // ...
}
```

## Constants Usage

### Mandatory Constants

**CRITICAL**: Never hardcode strings in components or code. Always use constants from `lib/constants.ts`.

```typescript
// ✅ Good
import { AUTH_LABELS, AUTH_ERRORS } from "@/lib/constants";

<button>{AUTH_LABELS.LOGIN}</button>
{error && <p>{AUTH_ERRORS.INVALID_CREDENTIALS}</p>}

// ❌ Bad
<button>Log in</button>
{error && <p>Invalid credentials</p>}
```

### Adding New Constants

When adding new UI strings or constants:

1. Add them to the appropriate constant object in `lib/constants.ts`
2. Use descriptive, hierarchical naming
3. Group related constants together

```typescript
// ✅ Good - In lib/constants.ts
export const PROFILE = {
  TITLE: "Profile",
  EDIT: "Edit Profile",
  SAVE: "Save Changes",
  CANCEL: "Cancel",
} as const;

// ✅ Good - Usage
import { PROFILE } from "@/lib/constants";
<button>{PROFILE.SAVE}</button>
```

### Exceptions

Constants are not required for:
- Test IDs and data attributes (e.g., `data-testid="submit-button"`)
- Technical identifiers (e.g., API endpoint paths, database field names)
- Internal variable names

## Import Organization

### Import Order

Organize imports in this order:

1. External dependencies (React, Next.js, third-party libraries)
2. Internal absolute imports (from `@/`)
3. Relative imports (from `./` or `../`)
4. Type-only imports (use `import type`)

```typescript
// ✅ Good
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { AUTH_LABELS } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";

import { formatDate } from "./utils";
import type { User } from "./types";

// ❌ Bad - Mixed order
import { formatDate } from "./utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
```

### Import Grouping

- Group related imports together
- Leave one blank line between import groups
- Use `import type` for type-only imports

```typescript
// ✅ Good
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AUTH_LABELS } from "@/lib/constants";

import type { User } from "@/lib/types/user";
```

### Named vs Default Imports

- Prefer named exports and imports
- Use default imports only when necessary (e.g., Next.js Image component)

```typescript
// ✅ Good
import { Button, Input } from "@/components/ui/button";
import Image from "next/image";

// ❌ Bad - Unnecessary default import
import Button from "@/components/ui/button";
```

## Code Style

### Formatting

- All formatting is handled by Biome
- Run `pnpm format` before committing
- Line width: 100 characters
- Indentation: 2 spaces
- Use double quotes for strings
- Always use semicolons

### JSX Conventions

- Use self-closing tags when appropriate
- Use meaningful prop names
- Format props with one per line for readability when there are many props

```typescript
// ✅ Good
<Button
  variant="primary"
  size="lg"
  disabled={isLoading}
  onClick={handleSubmit}
>
  {AUTH_LABELS.SUBMIT}
</Button>

// ✅ Good - Self-closing
<img src={imageUrl} alt={altText} />

// ❌ Bad
<Button variant="primary" size="lg" disabled={isLoading} onClick={handleSubmit}>{AUTH_LABELS.SUBMIT}</Button>
```

### Conditional Rendering

- Use ternary operators for simple conditions
- Use logical AND (`&&`) for conditional rendering when appropriate
- Extract complex conditions to variables

```typescript
// ✅ Good
{isLoading ? <Spinner /> : <Content />}
{error && <ErrorMessage message={error} />}

const shouldShowDetails = user && user.role === "admin";
{shouldShowDetails && <AdminDetails />}

// ❌ Bad
{isLoading === true ? <Spinner /> : isLoading === false ? <Content /> : null}
```

### Variable Declarations

- Use `const` by default
- Use `let` only when reassignment is needed
- Never use `var`

```typescript
// ✅ Good
const user = await fetchUser();
let count = 0;
count += 1;

// ❌ Bad
var user = await fetchUser();
let count = 0; // If never reassigned, use const
```

## Better Auth Patterns

### API Usage

**CRITICAL**: Always use Better Auth APIs for authentication, organization, team, and permission operations. Never query the database directly.

```typescript
// ✅ Good - Use Better Auth APIs
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({ headers });
const organizations = await auth.api.listOrganizations({ headers });
const teams = await auth.api.listTeams({ headers, query: { organizationId } });

// ❌ Bad - Direct database queries
import { db } from "@/lib/database";
const user = await db.select().from(users).where(eq(users.id, userId));
```

### Client vs Server Components

- Use server components by default
- Use client components only when needed (hooks, interactivity, browser APIs)
- Pass data from server to client components via props

```typescript
// ✅ Good - Server component
export async function UserList() {
  const users = await auth.api.listUsers({ headers });
  return <UserListClient users={users} />;
}

// ✅ Good - Client component for interactivity
"use client";

export function UserListClient({ users }: { users: User[] }) {
  const [filter, setFilter] = useState("");
  // ...
}
```

## Accessibility

### Semantic HTML

- Use semantic HTML elements (nav, main, article, section, etc.)
- Use proper heading hierarchy (h1 → h2 → h3)
- Use button for interactive elements, not div

```typescript
// ✅ Good
<nav>
  <button onClick={handleClick} aria-label="Close menu">
    <CloseIcon />
  </button>
</nav>

// ❌ Bad
<div onClick={handleClick}>
  <CloseIcon />
</div>
```

### ARIA Attributes

- Add ARIA labels for icon-only buttons
- Use ARIA attributes when semantic HTML is insufficient
- Ensure form inputs have associated labels

```typescript
// ✅ Good
<button aria-label="Delete user">
  <TrashIcon />
</button>

<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Bad
<button>
  <TrashIcon />
</button>

<input type="email" />
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use proper focus management
- Provide visible focus indicators

## Performance

### Code Splitting

- Use dynamic imports for large components or libraries
- Lazy load routes when appropriate

```typescript
// ✅ Good
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Spinner />,
});

// ❌ Bad
import HeavyComponent from "./HeavyComponent"; // Loads immediately
```

### Image Optimization

- Always use Next.js Image component for images
- Provide width, height, and alt attributes
- Use appropriate image formats

```typescript
// ✅ Good
import Image from "next/image";

<Image
  src="/profile.jpg"
  alt="User profile"
  width={200}
  height={200}
  priority={isAboveFold}
/>

// ❌ Bad
<img src="/profile.jpg" alt="User profile" />
```

### Bundle Size

- Avoid importing entire libraries when only a few functions are needed
- Use tree-shaking friendly imports
- Monitor bundle size regularly

```typescript
// ✅ Good
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";

// ❌ Bad
import * as dateFns from "date-fns";
```

## Error Handling

### Error Boundaries

- Use error boundaries for component-level error handling
- Provide meaningful error messages
- Log errors appropriately

### Async Error Handling

- Always handle errors in async operations
- Use try-catch for async/await
- Provide user-friendly error messages

```typescript
// ✅ Good
try {
  const result = await authClient.signIn.email({ email, password });
  if (result.error) {
    setError(AUTH_ERRORS.INVALID_CREDENTIALS);
  }
} catch (error) {
  setError(AUTH_ERRORS.LOGIN_FAILED);
  logger.error("Login failed", { error });
}

// ❌ Bad
const result = await authClient.signIn.email({ email, password });
// No error handling
```

### Error Messages

- Use constants from `lib/constants.ts` for error messages
- Provide actionable error messages
- Avoid exposing sensitive information

```typescript
// ✅ Good
import { AUTH_ERRORS } from "@/lib/constants";
setError(AUTH_ERRORS.INVALID_CREDENTIALS);

// ❌ Bad
setError("Invalid credentials"); // Hardcoded string
setError(error.message); // May expose sensitive info
```

## Testing

### Test File Naming

- Test files should be named `*.test.ts` or `*.test.tsx`
- Place test files next to the code they test or in a `__tests__` directory

### Test Structure

- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test user behavior, not implementation details

```typescript
// ✅ Good
describe("UserProfile", () => {
  it("should display user name when user is loaded", () => {
    // Arrange
    const user = { id: "1", name: "John Doe" };
    
    // Act
    render(<UserProfile user={user} />);
    
    // Assert
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

## Enforcement

These standards are enforced through:

1. **Biome**: Automatic linting and formatting
2. **TypeScript**: Type checking
3. **Validation Script**: Custom checks for standards not covered by Biome
4. **Code Review**: Manual review for adherence to standards

Run the following commands to check your code:

```bash
# Format code
pnpm format

# Lint code (includes validation script)
pnpm lint

# Check formatting and linting
pnpm check

# Type check
pnpm type-check
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Biome Documentation](https://biomejs.dev)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

