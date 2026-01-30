---
targets:
  - '*'
root: false
description: ''
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: ''
  globs:
    - '**/*'
---
## Identifiers and Values

- When handling identifier creation (database IDs, primary keys), add clear docstrings and comments explaining:
  - Creation method
  - Normalization process
  - If normalization isn't defined, add a "TODO" reminder

- For monetary values, always specify:
  - Currency
  - Unit of measurement

## React Import Preferences

- Always use specific named imports from React instead of namespace imports
- Avoid using `* as React` imports
- Prefer: `import { useState, useEffect, type ReactNode } from 'react'`
- Avoid: `import React from 'react'` or `import * as React from 'react'`
- Use `type` prefix for type-only imports: `import type { ReactNode } from 'react'`
- Keep `type` prefix outside the curly braces for type-only imports: `import type { FC, PropsWithChildren } from 'react'`

# Namefi Astra Project Cursor Rules

## Type System and Interfaces

### Avoid Type Duplication
- When creating interfaces, extend existing types instead of duplicating them
- Use composition over duplication: `interface MyInterface extends BaseInterface { ... }`
- Consolidate related types in dedicated type files (e.g., `types/hunt.ts`)
- Before creating new interfaces, check if existing ones can be reused or extended

Example:
```typescript
// ❌ Bad - duplicates properties
interface EnhancedHuntVoteReturn {
  vote: (domain: string) => Promise<void>;
  unvote: (domain: string) => Promise<void>;
  isDomainBusy: (domain: string) => boolean;
  // ... additional properties
}

// ✅ Good - extends existing interface
interface EnhancedHuntVoteReturn extends HuntVoteFunctions {
  // Additional properties specific to enhanced hook
  toggleVote: (domain: string, voted: boolean) => Promise<void>;
  dialogs: HuntDialogs;
}
```

### Interface Naming and Organization
- Use clear, descriptive names that indicate purpose
- Group related interfaces in dedicated type files
- Prefer composition over inheritance for complex types
- Export shared interfaces from centralized locations

### Type Duplication Prevention
- **BEFORE creating new interfaces, always check existing type files for similar types**
- If similar interface exists, extend or reuse it instead of creating duplicate
- Consolidate duplicate interfaces immediately when discovered

## Hook Architecture

### Single Responsibility Hooks
- Each hook should have one clear responsibility
- Avoid creating "god hooks" that handle multiple unrelated concerns
- Use composition to combine smaller, focused hooks

### Naming Conventions
- Use descriptive names that clearly indicate what the hook does
- Avoid misleading names like `onSuccess` when the callback isn't necessarily about success
- Be specific: `onVoteSuccess` → `onPostVoteAction` → `showShareDialog`

### Callback Props
- Minimize prop drilling of callback functions through component hierarchies
- Prefer internal composition over external callback coordination
- Use centralized state management for complex inter-component communication

## Component Architecture

### Props Interface Design
- Use specific, descriptive prop names
- Avoid generic callback names that don't indicate their purpose
- Prefer function composition over complex callback chains
- Extend shared interfaces when possible to reduce duplication

### State Management
- Encapsulate related state within appropriate hooks
- Avoid exposing internal state management details through props
- Use composition to combine multiple state concerns

## Code Organization

### Import Management
- Group imports logically: React hooks, internal hooks, types, utilities
- Remove unused imports immediately
- Use type-only imports when appropriate: `import type { ... }`

### Error Handling
- Handle edge cases explicitly
- Provide meaningful error messages
- Avoid silent failures in async operations

## React Best Practices

### Hook Dependencies
- Include all dependencies in hook dependency arrays
- Use `useCallback` and `useMemo` appropriately for performance
- Avoid stale closures by properly managing dependencies

### Component Patterns
- Prefer function components with hooks
- Use proper TypeScript types for all props and state
- Handle loading and error states explicitly

## Documentation

- Before making significant changes (large code pieces or multiple files):
  - Check for existing README.md in the folder
  - Use README.md to understand purpose, context, and scope
  - If README.md is missing or lacks purpose/context/scope details, update it with this information
