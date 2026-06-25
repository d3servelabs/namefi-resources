# Repository Agent Guide

## Code Style & Standards

### General Principles

- **Quality over Speed**: Prioritize robust, well-tested code over quick implementations
- **Follow Existing Patterns**: Always examine existing code patterns and maintain consistency
- **Comprehensive Testing**: Write thorough test cases including edge cases and error conditions
- **Documentation**: Code should be self-documenting; avoid unnecessary comments unless explaining complex logic

### TypeScript/JavaScript

- Use TypeScript strict mode and fix all type warnings
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names over comments
- Handle errors explicitly rather than ignoring them
- Prefer functional programming patterns where appropriate

### Testing Strategy

- **Test-Driven Approach**: Write tests for new functionality
- **Edge Case Coverage**: Include boundary conditions, invalid inputs, and error scenarios
- **Descriptive Test Names**: Test descriptions should clearly explain what is being validated
- **Test Data Organization**: Use separate `.testing.ts` files for test data when tests become complex
- **Validation Testing**: For validation libraries, test both valid and invalid cases extensively

### Error Handling

- Provide helpful, specific error messages
- Include examples in error messages when possible
- Use proper HTTP status codes and error structures
- Log errors appropriately for debugging

### Logging with Pino

- **Argument Pattern**: All objects before the first string are logged as structured data; strings use format placeholders
- **Structured Logging**: `logger.info({ data }, 'Message with %s', formatValue)`
- **Simple Messages**: `logger.info('Simple message')` or `logger.info({ data }, 'Message')`
- **Format Strings**: Use `%s`, `%d`, `%j` for string, number, JSON formatting respectively
- **Error Logging**: `logger.error({ error, context }, 'Operation failed for %s', itemName)`
- **Child Loggers**: Create context-specific loggers with `createLogger({ name: 'activity-name' })`
- **Workflow Logging**: Use `workflow.log.info()` in Temporal workflows, not pino logger
- **Examples**:
  - `logger.info({ userId, count }, 'Processing %d items for user %s', count, userId)`
  - `logger.error({ error }, 'Failed to process domain %s', domainName)`

## Development Setup & Commands

### Prerequisites

This project requires:
- **Node.js**: >=22.13.1 (use nvm to manage versions)
- **Bun**: Package manager (bun@1.2.7)
- **Temporal CLI**: For workflow orchestration
- **Infisical CLI**: For secrets management
- **Docker**: For containerized services

### Key Development Commands

#### Environment Setup
```bash
# Set up Infisical token for secrets
export INFISICAL_SERVICE_TOKEN=<your-token>

# Start all services (includes backend API, frontend, temporal server & worker, email server)
# Ports are dynamically allocated and displayed on startup (default: 3000-3005)
infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun run dev

# Start only backend API and frontend (minimal setup)
infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun run dev:base

# Individual services (use :internal variants for manual port control)
bun run dev:backend:api      # Backend API server (default: 3000)
bun run dev:frontend         # Frontend (default: 3001)
bun run dev:backend:temporal # Temporal worker (default: 3003)
bun run dev:backend:email    # Email development server (default: 3002)
bun run dev:temporal-server  # Temporal server (default: 3004)
```

#### Code Quality & Testing
```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch

# TypeScript type checking across all packages
bun run typecheck

# Code formatting and linting (Biome)
bun run check        # Check for issues
bun run check:fix    # Auto-fix issues
bun run check:unsafe # Auto-fix with unsafe changes

# Comprehensive validation (typecheck, biome, sherif, sgr)
bun run validate

# Validate environment secrets
bun run validate:secrets
```

#### Database Operations
```bash
# Located in apps/backend
bun run db:generate  # Generate database migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Development Workflow

### Planning & Organization

- **Use TodoWrite/TodoRead**: Track tasks and progress using the todo system for complex work
- **Break Down Complex Tasks**: Split large features into smaller, manageable pieces
- **Update Progress**: Mark todos as completed immediately after finishing tasks

### Code Changes

- **Read Before Writing**: Always examine existing code before making changes
- **Preserve Functionality**: Ensure changes don't break existing features
- **Update Related Files**: When changing core functionality, update tests, documentation, and related code
- **Validate Changes**: Run tests after making changes to ensure nothing breaks

### Vercel Preview Builds

- **Preview builds are on-demand**: Automated Vercel preview build triggers are turned off. Do not assume a push or PR update will create a preview deployment.
- **Trigger only when needed**: If a preview deployment is needed for review or validation, explicitly trigger it on Vercel/GitHub. Use your judgment about whether it is absolutely necessary; most changes do not need one.
- **Time the preview build**: When you finish composing a PR and trigger a Vercel preview deployment, record the elapsed time from when you trigger it until it is ready for eyeball inspection, and report that duration to the user.

### Git & Version Control

- Write clear, descriptive commit messages
- Include context about why changes were made
- Follow the existing commit message style in the repository
- Only commit when explicitly asked by the user

## Project Architecture Overview

### High-Level Structure

This is a **domain registration and management platform** built as a monorepo with:

- **Frontend**: Next.js application with tRPC client
- **Backend**: Hono server with tRPC API
- **Database**: PostgreSQL with Drizzle ORM
- **Workflows**: Temporal for orchestrating complex operations
- **Blockchain**: NFT-based domain ownership

### Monorepo Organization

```
apps/
├── backend/          # Hono server with tRPC API
└── frontend/         # Next.js application

packages/
├── db/               # Database schema and Drizzle ORM setup
├── registrars/       # Domain registrar integrations (R53, Dynadot)
├── zod-dns/          # DNS record validation schemas
├── dns-tools/        # DNS utilities (DNSSEC, domain parsing)
├── ai/               # AI-powered domain suggestions and branding
├── utils/            # Shared utilities and types
├── storage/          # File storage abstractions
└── env/              # Environment configuration
```

### Core Backend Architecture

#### tRPC API Structure
The backend exposes a type-safe tRPC API with these main routers:

- **searchRouter**: Domain availability search and suggestions
- **cartsRouter**: Shopping cart management
- **ordersRouter**: Order processing and history
- **paymentsRouter**: Payment processing (Stripe, NFSC tokens)
- **dnsRecordsRouter**: DNS record CRUD operations
- **usersRouter**: User profile and domain ownership
- **registryRouter**: Domain registration operations
- **domainConfigRouter**: Domain configuration (DNSSEC, nameservers)
- **huntRouter**: Domain hunting/wishlist features
- **aiRouter**: AI-powered domain suggestions

#### Temporal Workflows
Complex operations are orchestrated through Temporal workflows:

- **Domain Registration**: Search → Cart → Payment → Registration → NFT Minting
- **DNS Management**: Record validation → Update → Propagation
- **Payment Processing**: Multiple payment methods (Stripe, blockchain)
- **Auto-Renewal**: Automated domain renewals with payment handling
- **Migration**: Domain transfers and bulk operations

## Frontend Performance Guardrails

This repo has heavy Next.js dev compile costs. When making changes, follow these rules to avoid regressions.

- Keep `"use client"` at the leaf. Do not add it to `apps/frontend/src/app/layout.tsx`, route files, or large shared components unless unavoidable.
- Avoid adding new providers to the root layout. Prefer route groups (e.g. `(marketing)` vs `(app)`) to keep `/` minimal.
- Avoid barrel exports across server/client boundaries. Prefer direct leaf imports, especially in `apps/frontend/src/app/**` and shared client components.
- Do not expand Tailwind class scanning scope beyond `apps/frontend/src` unless required. If you must add new content sources, keep them explicit and minimal.
- Avoid importing heavy dependencies into the app shell (`layout.tsx`, `Main`, sidebars, global providers). Use `next/dynamic` or move logic to server components where possible.
- Avoid adding global CSS/plugins that increase processing in `apps/frontend/src/app/globals.css`.
- Do not add large folders (or backups of `.next`) inside the repo; they can be picked up by tooling.

### When Changing / Adding Frontend Features

- Prefer server components by default; only move logic to client components when needed.
- Keep data loading on the server; pass minimal serialized props to client components.
- Avoid `export *` in frequently imported modules for the frontend.
- If you touch `/` or app shell code, run the benchmark script to ensure no regression.

### SEO Pages: Speed, Non-Blocking, and Indexing

These apply to any publicly indexable, SEO-relevant route (e.g. `apps/resources` blog/marketing pages, public `apps/frontend` landing pages). For these pages, treat render speed, efficiency, and quality as first-class — they drive Core Web Vitals (a ranking signal) and how fast social crawlers (Twitterbot/X, facebookexternalhit, Slackbot) show OpenGraph cards.

- **Keep the critical path non-blocking.** Nothing that isn't needed for first paint should sit in the render-blocking `<head>`. Do not `@import` large prebuilt stylesheets into a global `globals.css` that loads on every route (this inlines them into the render-blocking CSS chunk and delays LCP). Scope CSS to where it is used.
- **Lazy-load below-the-fold / post-load UI.** Overlays, banners, dialogs, consent boxes, widgets, and anything not visible at first paint should be loaded with `next/dynamic` (typically `{ ssr: false }`), with their CSS imported *inside* the lazily-loaded component so it ships as a separate, non-blocking chunk. Example: the cookie-consent banner (`apps/resources/src/components/providers/consent-ui.tsx`) — its ~64KB c15t stylesheet is kept off the first-paint path this way; do not move it back into `globals.css`.
- **Defer third-party scripts.** Analytics/tag scripts should use `next/script` with `afterInteractive` (or `lazyOnload`) unless a deliberate consent/bootstrap reason requires earlier; avoid `beforeInteractive` for non-critical scripts.
- **Keep OG/Twitter metadata server-rendered in the initial HTML** (via the Metadata API), with absolute HTTPS image URLs. Crawlers do not run JS — metadata must be in the prerendered `<head>`. Prefer linking the no-trailing-slash canonical to avoid a redirect hop on crawl. Keep OG images modestly sized (a ~1200x630 JPEG well under a few hundred KB) so crawlers fetch them with ample time/space buffer.
- **Verify before/after.** Check what lands in the render-blocking `<head>` and the LCP element (it is often *text*, not an image — confirm before optimizing). Use Lighthouse / PageSpeed; the `render-blocking-resources` and `largest-contentful-paint` audits are the ones to watch.

### Non-Indexable / Internal Pages: Mark `noindex`

For any page we do **not** want search engines to surface (internal tools, dashboards, admin, preview/staging-only, auth-gated app shells, utility routes), add an explicit no-index marker so it is never crawled and served in search results:

- Use the Next.js Metadata API: `export const metadata = { robots: { index: false, follow: false } }` (or `robots: 'noindex, nofollow'`), or set it in `generateMetadata`.
- For whole subtrees, set it on the route-group/layout so every nested page inherits it.
- Do not rely on `robots.txt` alone to keep a page out of the index — `robots.txt` blocks crawling, not indexing of already-known URLs; the `noindex` meta/header is the reliable marker.
- When in doubt about whether a route should be public, default internal/app routes to `noindex` and only opt specific marketing/content routes into indexing.

### Frontend Benchmarking

Use the benchmark script for cold/hot timing:

```bash
INFISICAL_TOKEN=... bun scripts/bench-frontend-dev.ts --runs 3
```

Reports are written to `apps/frontend/.benchmarks/` (ignored by git).

## Storybook

### Golden Rules

1. **Never import `@/app/**` route modules into stories.** Route modules may be async Server Components, which crash Storybook.
2. **Only export stories from `*.stories.tsx`.** Do not export helpers, functions, data, or components.
3. **Include required providers.** Most components need `WagmiProvider`, `TRPCProvider`, `QueryClientProvider`, `MockPrivyProvider`, etc.
4. **Mock Next.js navigation when needed.** Use `parameters.nextjs.appDirectory: true` for components using `next/navigation` hooks.

### Running Storybook

```bash
bun --cwd=apps/frontend storybook
```

### Full Documentation

See [docs/dev-guides/storybook/README.md](docs/dev-guides/storybook/README.md) for complete patterns, provider setup examples, and troubleshooting.

## Project-Specific Guidelines

### Package Structure

- This is a monorepo with packages in `/packages/` and apps in `/apps/`
- Each package should have its own test files and documentation
- Maintain clean separation between packages

### Testing Commands

- Use `bun test` for running tests
- Use `bun tsx` for running TypeScript files directly
- Use `bun run typecheck` for TypeScript type checking across all packages
- Check for existing build/test scripts in package.json before running commands

### Code Quality

- Fix TypeScript warnings and errors before committing
- Address linting issues when present
- Ensure proper imports and exports
- Use absolute paths for file operations
- Run `bun run typecheck` to ensure no type errors before completing tasks

### Security Considerations

- Only assist with defensive security tasks
- Never create or improve code that could be used maliciously
- Validate inputs thoroughly, especially for user-facing APIs
- Follow security best practices for authentication and data handling

## Communication Style

- **Be Concise**: Provide clear, direct responses without unnecessary elaboration
- **Show Progress**: Use todo lists for complex tasks to demonstrate progress
- **Ask for Clarification**: When requirements are unclear, ask specific questions
- **Explain Decisions**: When making technical choices, briefly explain the reasoning

## Common Patterns

### When Adding New Features

1. Examine existing similar functionality
2. Plan the implementation using todos for complex features
3. Write comprehensive tests (valid and invalid cases)
4. Implement the feature following existing patterns
5. Update related documentation and tests
6. Verify everything works with test runs

### When Debugging

1. Reproduce the issue with minimal test cases
2. Use debugging scripts with `bun tsx` when needed
3. Fix the root cause, not just symptoms
4. Add tests to prevent regression
5. Clean up debugging files after resolution

### When Refactoring

1. Understand the current implementation thoroughly
2. Maintain backwards compatibility
3. Update tests to reflect changes
4. Ensure all existing functionality still works
5. Update documentation if interfaces change

## Tools & Commands

- **Package Manager**: Use `bun` for this project
- **TypeScript Execution**: Use `bun tsx` for running .ts files
- **Testing**: Use `bun test` with specific file paths when needed
- **Debugging**: Create temporary .ts files and run with `bun tsx`, clean up afterwards

## Project-Specific Patterns

### Database Schema (Drizzle ORM)

- **Schema Location**: All database schemas are in `/packages/db/src/schema.ts`
- **Common Patterns**: Use shared column definitions (`timestamps`, `normalizedDomain`, `randomUuid`)
- **Indexing Strategy**: Create appropriate indexes for query patterns, including composite indexes
- **Constraints**: Use unique constraints and foreign keys appropriately
- **Enums**: Define PostgreSQL enums for status fields and other controlled vocabularies

### Temporal Workflows

- **Workflow Location**: `/apps/backend/src/temporal/workflows/`
- **Activity Location**: `/apps/backend/src/temporal/activities/`
- **Schedule Location**: `/apps/backend/src/temporal/schedules/`
- **Test Workflows**: Place test workflows in `/apps/backend/src/temporal/workflows/test-workflows/`
- **Pattern**: Each workflow should have associated activities, typed interfaces, and optional schedules
- **Timeouts**: Use appropriate timeouts - longer for full operations, shorter for targeted updates
- **Error Handling**: Include comprehensive logging and graceful error handling in activities
- **Proxy Configuration**: Use `typedProxyActivities` with appropriate temporal enums and timeouts
- **Non-Critical Operations**: Use `catchAndAlertLocally` for operations that shouldn't fail the main workflow
- **Helper Functions**: Extract complex logic into private functions within workflows for better organization
- **Child Workflows**: Use unique workflow IDs with timestamps to prevent conflicts
- **Task Queue Routing**: Route workflows to appropriate queues (DEFAULT for Stripe, MINT for NFSC operations)
- **Workflow Composition**: Prefer composition over large monolithic workflows for better maintainability

### Domain Indexing Infrastructure

- **IndexedDomains Table**: Caches domain information from all registrars for fast queries
- **Main Workflow**: `updateDomainIndexWorkflow` - Full refresh of domain index (hourly)
- **Targeted Updates**: `updateDomainIndexRows` activity - Updates specific domains after operations
- **Pagination**: Use `listAllDomainsPaginated` for paginated domain queries
- **Cleanup**: Automated cleanup of stale entries with configurable retention
- **Post-Operation Updates**: Always update domain index after domain operations (extensions, renewals)
- **Error Handling**: Use `catchAndAlertLocally` for non-critical index updates to prevent workflow failures

### Registrar Service Patterns

- **Main Service**: `/packages/registrars/src/registrars/main-registrar.ts`
- **Abstraction**: Each registrar implements `AbstractRegistrarService`
- **Aggregation**: Main service aggregates data from multiple registrar providers
- **Caching**: Individual registrars handle their own internal pagination and caching
- **Error Handling**: Registrar-specific errors are handled and logged appropriately

### DNS Validation Patterns

- **Zod Schemas**: DNS record validation using zod in `/packages/zod-dns/`
- **Sanitization**: Use `sanitizeDnsRecord` for cleaning DNS data
- **Testing Strategy**: Separate `.testing.ts` files for complex test data
- **Regex Patterns**: DNS name validation supports service names with underscores

### Error Handling & Workflow Patterns

- **`catchAndAlertLocally`**: Use for non-critical operations that shouldn't fail main workflows
  - Location: `/apps/backend/src/temporal/shared/workflow-helpers/catch-and-alert-locally.ts`
  - Pattern: `await catchAndAlertLocally(async () => { /* operation */ }, { message, details })`
  - Use cases: Index updates, notifications, cleanup operations

### Domain Operation Patterns

- **Post-Operation Index Updates**: Always update domain index after successful domain operations
- **Two-Phase Updates**: First targeted update (`updateDomainIndexRows`), then full refresh trigger
- **Failure Resilience**: Update index even if secondary operations (like NFT updates) fail
- **Helper Function Pattern**: Extract index update logic into private workflow functions
- **Activity Selection**: Use `TEMPORAL_ENUMS.INDEXERS` for index-related activities

### Payment & Order Management Patterns

- **Payment Workflows**: Use modular workflows for charging (`chargeUserAndCreatePaymentWorkflow`) and refunding (`refundUserWorkflow`)
- **Payment Method Determination**: Use `determineAvailablePaymentMethods` activity to find available payment options for users
- **Order Creation**: Use `createAutoRenewOrder` activity to create order records after successful operations
- **Payment Provider Support**: Handle both Stripe (credit card) and NFSC (blockchain) payment methods
- **Order Item Types**: Use specific item types like `AUTO_RENEW` for order items created by automatic processes
- **Order Metadata**: Include operation type (e.g., `autoRenew: true`) in order metadata for tracking
- **Error Resilience**: Payment and order creation failures should not break main business workflows
- **Payment Record Validation**: Ensure payment records exist before creating order references

### Auto-Renewal Workflow Patterns

- **Domain Filtering**: Filter domains based on auto-renewal preferences and expiration dates
- **Batch Processing**: Process multiple domains for a single user in one transaction
- **Partial Success Handling**: Handle scenarios where some domains renew successfully and others fail
- **Refund Processing**: Use `refundUserWorkflow` for automatic refund processing on failed renewals
- **Order Record Creation**: Create comprehensive order records with individual line items for each domain
- **Email Notifications**: Notify users about upcoming renewals, failures, and completion status
- **Registrar Key Tracking**: Use `registrarKey` from domain data for accurate registrar identification
- **Workflow Composition**: Use child workflows for charging and refunding to maintain separation of concerns
- **Helper Function Pattern**: Extract order creation logic into private workflow functions for better organization

### Workflow Development Best Practices

- **Modular Design**: Create focused, single-purpose workflows that can be composed together
- **Type Safety**: Use comprehensive TypeScript types for all workflow inputs and outputs
- **Error Boundaries**: Design workflows so failures in non-critical operations don't break core business logic
- **Configuration-Driven**: Use declarative configuration arrays for payment methods, retry policies, etc.
- **Testing Strategy**: Create dedicated test workflows to verify end-to-end functionality
- **Payment Method Abstraction**: Use consistent patterns for handling different payment providers
- **Status Management**: Track operation status throughout workflows and update records appropriately
- **Child Workflow Usage**: Use child workflows for complex operations that have their own lifecycle
- **Return Type Consistency**: Ensure workflow return types include all necessary data for downstream operations
- **Helper Function Organization**: Group related logic into private functions to keep workflows readable

### Integration Patterns

- **Database Operations**: Use activities for all database operations, never direct DB calls in workflows
- **External Services**: Wrap external service calls (Stripe, blockchain, etc.) in dedicated activities
- **File Organization**: Group related activities in subdirectories (e.g., `order/`, `payment/`, `domain/`)
- **Cross-Workflow Communication**: Use child workflows for complex operations that need their own lifecycle
- **State Tracking**: Maintain clear state progression through workflow execution
- **Alerting Integration**: Use structured alerting for operational issues and business rule violations
- **Schema Evolution**: Add new enum values (like `AUTO_RENEW`) to support new business processes
- **Activity Composition**: Compose complex business operations from simpler, focused activities
- **Workflow Return Data**: Design workflows to return all data needed by parent workflows

## Notes

- This project uses Temporal workflows, DNS validation, domain indexing, payment processing, and other specialized technologies
- Always check existing implementations before adding new dependencies
- Maintain consistency with existing error handling and validation patterns
- Follow the established patterns for async operations and error propagation
- Use parallel sub-agents for complex multi-file updates when appropriate
- Payment workflows should be designed for reliability and audit compliance
- Order creation should happen after successful operations to maintain data consistency
- When making changes to existing files, minimize reordering to keep git diffs clean and reviewable
- Prefer creating new files over extensively modifying existing ones for better change tracking
- Use helper functions within workflows to organize complex logic while maintaining readability

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

# ClickUp Bug Report Guidelines

When filing a ClickUp task for a bug, always include the following sections:

## Required Sections

### 1. Issue
Brief description of the bug/error.

### 2. Environment
- **Environment type**: Local dev / Staging / Production
- **Frontend URL**: e.g., `http://localhost:<port>` (ports are dynamically allocated)
- **Backend URL**: e.g., `http://localhost:<port>` (ports are dynamically allocated)
- **Branch**: Current git branch name
- **Relevant versions/configs** if applicable

### 3. How to Replicate
Step-by-step instructions to reproduce the bug:
1. Start with the initial state/setup
2. List each action the user takes
3. Be specific about what to click/enter
4. Include any test data needed (e.g., domain names, user accounts)

### 4. Expected Behavior
What should happen when following the replication steps.

### 5. Actual Behavior
What actually happens (the bug). Include:
- Error messages
- HTTP status codes
- Console errors/logs

### 6. Request Details (for API bugs)
- Full request URL
- Request method (GET/POST/etc.)
- Request body if applicable
- Response status and body

### 7. Likely Cause (if known)
- File paths and line numbers where the error originates
- Possible root causes

### 8. To Debug
Suggestions for how to investigate the issue.

### 9. Log Attachments
**Always gather and attach relevant logs from the appropriate source(s):**

Identify where the error manifests and collect logs from the relevant source:
- **Browser Console**: For frontend errors, network failures, client-side exceptions
- **Network Tab**: For HTTP request/response details, status codes, payloads
- **Backend Server Logs**: For server-side errors, stack traces, database issues
- **Terminal Output**: For build errors, CLI tool failures, script issues
- **Application Logs**: For runtime errors, workflow failures, background job issues

**How to attach:**
1. Identify the relevant log source based on where the error occurs
2. Copy/extract the relevant log entries (not everything, just what is pertinent)
3. Create a text file with the logs
4. **Redact any secrets** (API keys, tokens, credentials, passwords) before attaching
5. Use the clickup_attach_task_file tool to attach the log file to the task

**Log file naming convention:**
- browser-console-logs-{brief-description}.txt
- backend-logs-{brief-description}.txt
- network-requests-{brief-description}.txt
- terminal-output-{brief-description}.txt

## Task Settings
- **Priority**: Set based on severity (urgent/high/normal/low)
- **Assignee**: Assign to the appropriate team member
- **List**: Use "Default Backlog (Namefi Dev)" for general bugs, or sprint list if urgent

## When suggesting code changes or generating code
- always check for biome, eslint or prettier config if any of them exist in the codebase.
- always resolve lint errors and typecheck errors
- if it's a drizzle involved project, please don't bother creating sql files for schema or migration because such sql files are usually generated by Drizzle
- do not edit shadcn source files under `apps/frontend/src/components/ui/shadcn/**`; prefer usage-level class overrides or wrappers

# Date Formatting Standards

## Preferred Format
Always use **ISO 8601 format** (`yyyy-MM-dd`) for displaying dates to users unless explicitly requested otherwise.

## Examples

### Good
- `2026-01-25`
- `format(date, 'yyyy-MM-dd')`

### Avoid
- `January 25, 2026` (verbose, locale-dependent)
- `01/25/2026` (ambiguous: MM/DD/YYYY vs DD/MM/YYYY)
- `25-01-2026` (non-standard)
- `Jan 25, 2026` (abbreviated month names)

## Rationale
1. **Unambiguous**: No confusion between MM/DD and DD/MM conventions
2. **Sortable**: ISO dates sort correctly as strings
3. **International**: Works across all locales without confusion
4. **Compact**: Shorter than spelled-out month names

## Implementation
When using date-fns:
```typescript
import { format } from 'date-fns';
format(date, 'yyyy-MM-dd'); // "2026-01-25"
```

## Exceptions
- If the user explicitly requests a different format
- Internal logging or debugging (timestamps with time may use ISO 8601 with time: `yyyy-MM-dd'T'HH:mm:ss`)

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

# Cursor Rules (.mdc) Formatting Standards

## Frontmatter Schema

Every `.mdc` file must have YAML frontmatter with these three fields:

```yaml
---
description: <trigger condition for when this rule applies>
globs:
alwaysApply: false
---
```

### Field Specifications

#### 1. `description:` (Required)
- **Purpose**: Tells the AI when to apply this rule
- **Format**: Single-line string describing the trigger condition
- **Example**: `"Trigger when user asks to create pull requests or mentions graphite"`

#### 2. `globs:` (Required field, usually empty value)
- **Purpose**: File pattern matching for auto-attaching rules to specific files
- **For context-based rules**: Leave blank (no value, no brackets)
- **For file-pattern rules**: Use comma-separated patterns like `"*.ts, *.tsx"`
- **IMPORTANT**: Always include the `globs:` key, even if empty
- **DO NOT use `globs: []`** - bracket syntax can cause parser issues in Cursor
- **Format examples**:
  ```yaml
  # Context-based rule (most common)
  globs:

  # File-pattern rule (less common)
  globs: "*.ts, *.tsx, src/**/*.js"
  ```

#### 3. `alwaysApply:` (Required)
- **Purpose**: Controls if rule applies globally to all contexts
- **Default**: `false` (rule triggers based on `description` matching)
- **Set to `true`**: Only for workspace-wide rules that should always be active
- **Format**: Boolean value

## Rule Types

### Context-Based Rules (Most Common)
Rules that trigger when the AI's context matches the description:
```yaml
---
description: Trigger when agent is working with dates or timestamps
globs:
alwaysApply: false
---
```
- **Use for**: Coding patterns, conventions, workflows, guidelines
- **Example use cases**: UX copywriting, date formatting, git workflows

### File-Pattern Rules (Less Common)
Rules that auto-attach when specific files are in context:
```yaml
---
description: TypeScript-specific linting rules
globs: "*.ts, *.tsx"
alwaysApply: false
---
```
- **Use for**: File-type-specific rules (e.g., all TypeScript files)
- **Pattern syntax**: Comma-separated glob patterns

### Always-Applied Rules (Rare)
Rules that are always active regardless of context:
```yaml
---
description: Core repository performance guidelines
globs:
alwaysApply: true
---
```
- **Use sparingly**: Only for fundamental project-wide constraints
- **Warning**: Can add overhead to every AI interaction

## Best Practices

1. **Keep the 3-field structure**: Even if fields are empty, include all three keys
2. **No brackets for empty globs**: Use `globs:` not `globs: []`
3. **Descriptive descriptions**: Be specific about when the rule should trigger
4. **Prefer context-based**: Most rules should be context-based (empty globs) rather than file-pattern
5. **Location**: Store rules in `.cursor/rules/` directory
6. **File naming**: Use kebab-case: `drafting-cursor-rules.mdc`

## Common Mistakes to Avoid

❌ **Wrong**: Omitting `globs:` entirely
```yaml
---
description: My rule
alwaysApply: false
---
```

❌ **Wrong**: Using array syntax
```yaml
---
description: My rule
globs: []
alwaysApply: false
---
```

❌ **Wrong**: Adding extra/custom fields
```yaml
---
description: My rule
globs:
alwaysApply: false
author: John Doe  # Cursor doesn't recognize this
---
```

✅ **Correct**: Standard 3-field format
```yaml
---
description: Trigger when working on authentication code
globs:
alwaysApply: false
---
```

## Why These Standards?

Based on official Cursor documentation and community forum research (as of Jan 2026):
- Cursor's `.mdc` parser is **not standard YAML** - it has quirks
- Array syntax `[]` causes parsing issues in some Cursor versions
- Blank `globs:` is the most compatible format across versions
- The 3-field structure is what Cursor's UI generates and expects
- Community consensus: stick to this format for reliability

## References

- [Official Cursor Docs - Rules](https://cursor.com/docs/context/rules)
- [Cursor Forum - Rule Frontmatter Format Discussion](https://forum.cursor.com/t/rule-frontmatter-format/146274)
- [Cursor Forum - Deep Dive into Cursor Rules](https://forum.cursor.com/t/a-deep-dive-into-cursor-rules-0-45/60721)

# git related

## Never bypass git hooks

- **Do NOT use `--no-verify`** on `git commit` or `git push`, and **do NOT set
  `LEFTHOOK=0`** (or otherwise skip lefthook). The pre-commit/pre-push hooks run
  fast (pre-commit ~0.3s auto-formats staged files; pre-push runs
  typecheck-affected + biome + sherif + i18n + cuj, all offline). Letting them
  run is what keeps biome/format/lint failures from bouncing back from CI.
- **The hooks run headless** (lefthook ≥ 2.x — it no longer needs a TTY), so a
  non-interactive / agent / CI shell is **not** a reason to skip them. If you see
  lefthook fail with `device not configured` (a TTY error), your lefthook is too
  old — run `bun install` to pick up the pinned 2.x, don't bypass.
- **If a hook fails, fix the underlying issue — never bypass it.** A red hook is
  signal, not an obstacle.
- **If a hook is slow, hangs, or fails for a reason unrelated to your change**
  (e.g. a pre-existing typecheck error in a package you did not touch, or a
  missing/stale `node_modules`): run `bun install` to sync deps first; if it
  still misbehaves, stop and report it so the hook gets fixed — do not reach for
  `--no-verify` as a workaround.
- A fresh worktree has no `node_modules` until you run `bun install`; without it
  the hook cannot find lefthook and silently does nothing. Always `bun install`
  in a new worktree before committing.

## Cloud Agent PR behavior (when committing)

- If running **as a Cursor Cloud Agent** and you are committing work, you must ensure there is an open PR for the current branch:
  - If there is **no PR yet** for the current branch, create one (via `gh pr create`) after pushing.
  - If there is **already a PR** for the current branch, push commits to update it (and do not create a new PR).

### If `gh` PR creation is rejected (GraphQL / integration permissions)

- If `gh pr create` fails with a permission error (e.g. `Resource not accessible by integration`), fall back to **GitHub REST API** instead of GraphQL.

- Preferred REST approach (uses existing `gh` auth, but REST endpoints):
  - Discover repo: `gh repo view --json nameWithOwner --jq .nameWithOwner`
  - Create PR: `gh api -X POST repos/{owner}/{repo}/pulls -f title="..." -f head="{branch}" -f base="{base}" -f body="..."`
  - Find existing PR for branch: `gh api repos/{owner}/{repo}/pulls -f state=open -f head="{owner}:{branch}"`

- If `gh api` is also blocked, use raw REST with a token (`GITHUB_TOKEN` / `GH_TOKEN`) via `curl`:
  - Create PR: `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/{owner}/{repo}/pulls -d '{"title":"...","head":"{branch}","base":"{base}","body":"..."}'`

## Summarize code change

- Run `git --no-pager diff --staged` and go through the *current* code change and summarize the updates into <git_commit_message> and suggest a short <new_branch_name>

- You need to make a judgement: if this is a small file change, the <git_commit_message> should only be one single line; If it's more than 100 lines of code change (excluding documentation and comments), or non-trivial code change, <git_commit_messsage> should be one line conventional commit style plus a multi line bullet points

- Run `git --no-pager log -n 100 --pretty=format:"%h %s"` to the recent commit history to understand the conventional commit message style and scopes being used for <git_commit_message>

## ClickUp & GitHub Integration Rules

**Precondition:** Apply these rules ONLY if a ClickUp Task ID (e.g., `1abc2de`) or a custom ID matching the pattern `NFI-<number>` is provided in the context.

- **Task ID Format:** Use the hashtag prefix: `#{ID}` (e.g., #NFI-1234).
- **Commit Messages:** Adhere strictly to Conventional Commits. Place the Task ID in the **footer** (after a blank line) to maintain a valid header.
  - *Example:*
    ```
    feat(ui): add localstorage

    #NFI-1234
    ```
- **PR Titles:** Append the Task ID to the end of the PR title.
  - *Example:* `feat(ui): add localstorage #NFI-1234`
- **PR Descriptions:** Ensure the Task ID is included in the description to guarantee the sync between GitHub and ClickUp.
- **Status Updates:** To trigger an automatic status change in ClickUp via GitHub, use the format `#{ID}[Status Name]` (no spaces) in the commit footer or PR description.
  - *Example:* `#NFI-1234[In Review]`

## Respond

Based on the current staged git changes, please summarize them as a branch name and a `git commit` message. Please format message as plaintext with proper handle of newline to be copy and used in terminal. Output in markdown for easy copy-and-paste.

## PR Labels
- If the PR needs a fully functional preview deployment for testing, add the label `preview`.
  - `preview` will allow the preview deployment to be created automatically. But it will still validate if it's needed in the first place.
  - If you want to force a preview deployment, add the label `force-preview`.
    - `force-preview` will force the preview deployment to be created, regardless of whether it's needed or not.

# i18n & RTL: write layouts that flip, not break

This app ships **right-to-left locales** (currently `ar-EG`). Direction is set
once on `<html dir>` from a typed locale registry — `getDirection(locale)` in
`apps/frontend/src/i18n/config.ts` (`localeDirections: Record<Locale, Direction>`),
`localeDirections` + `isRtlLocale` in `apps/resources/src/i18n-config.ts`. Once
`dir="rtl"` is on the document, **the browser, CSS logical properties, and
Tailwind's `rtl:` variants do the mirroring for you — but only if you wrote
direction-relative styles.** Physical `left`/`right` do **not** flip; they stay
pinned and the layout breaks in Arabic.

## The core rule: logical, not physical

When a component uses left/right for position, spacing, or alignment, use the
**start/end** (logical) equivalent so it mirrors automatically. This is the
single most common RTL bug — a control, icon, or animation that visually points
or grows toward the wrong side in Arabic.

| Don't (physical, pinned) | Do (logical, flips) |
|---|---|
| `text-left` / `text-right` | `text-start` / `text-end` |
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `items-start` is fine; physical `justify-` with hard sides | `justify-start` / `justify-end` (these are already logical in Tailwind) |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |
| CSS `padding-left` / `margin-right` / `left:` | `padding-inline-start` / `margin-inline-end` / `inset-inline-start` |
| CSS `border-left` | `border-inline-start` |

**Alignment too, not just spacing.** "Start-align" and "end-align" mean
`text-start`/`text-end` and `items`/`justify` toward the logical start/end —
never hard-code `text-left` for "default" text or `text-right` for "trailing"
content. In RTL the start *is* the right.

### `space-x-*` is a trap — use `gap`

`space-x-*` does **not** set the `gap` property; it injects a *physical*
`margin-left` on every child but the first (via `:not([hidden]) ~ :not([hidden])`),
and that margin does **not** flip in RTL — so inter-item spacing lands on the
wrong side. Migrate to `gap-x-*` (PR #4659 converted 60 tokens). The discipline:

- Only convert `space-x-N` → `gap-x-N` when the **same element also has**
  `flex` / `inline-flex` / `grid` / `inline-grid` (incl. responsive `md:flex`) —
  that element is the container, and `gap` only applies to flex/grid. Preserve
  the value and any variant prefix (`sm:space-x-2` → `sm:gap-x-2`).
- **Leave `space-y-*`** (vertical, RTL-irrelevant) untouched.
- Two legit *physical* `space-x` uses that must NOT be converted: negative
  overlap stacks (`-space-x-2` avatar/icon stacks — there is no negative `gap`),
  and arbitrary `space-x-[6ch]` on a non-flex element like `<pre>`.
- `divide-x` has the same physical-border issue; if used on an RTL surface,
  reach for a `gap` + bordered children or `border-s` instead.

### Animations and transforms are the sharp edge

Transforms and any motion baked into an asset are physical by definition, so
direction-dependent reveal/expand must be mirrored explicitly — and a *fixed
width* hides the bug entirely. The real case in this app (PR #4631, the
expanding Lottie brand mark — `apps/frontend/src/components/brand-logo.tsx`,
`expanding-lottie-mark.tsx`): a sidebar logo that morphs the compact "Nfi" mark
into the full "Namefi" wordmark. Two RTL bugs and their fixes:

- **It expanded toward the wrong side.** The reveal was a *fixed-width canvas*
  with the L→R direction baked into the Lottie asset, so in Arabic it still
  opened left→right instead of from the inline-start (right) edge.
  - Fix 1 — make it a **real width animation** (`transition-[width]` between
    collapsed and expanded), not a static canvas, so there's a direction to
    mirror.
  - Fix 2 — the **double-mirror trick**: `-scale-x-100` on the clip container so
    the reveal grows toward the inline-start, and `-scale-x-100` on the Lottie
    *inside* so the wordmark un-flips and still reads correctly. Net: a leftward
    expand with non-reversed text.
- **The collapsed rail rendered blank in RTL** — the LTR-designed mark got
  clipped out once RTL right-anchored the box. Fix: pin just the mark box to
  `dir="ltr"` and anchor the logo block at the sidebar's **inline-start** edge.
- **Hydration discipline:** the morph fired on mount before `useIsMobile()`
  settled, so the logo animated right after hydration. Gate animation behind an
  effect-set `animationsReady` flag plus a `prevExpanded` ref so **hydration
  snaps to the correct frame and only user toggles animate**; for Lottie, snap
  to the right frame in `onDOMLoaded`.

General rules this case teaches:
- Prefer a logical `transform-origin: inline-start`; if you must use a physical
  origin/translate, gate it behind `rtl:` (e.g. `rtl:-translate-x-full`) or
  compute the sign from `getDirection(locale)` — never assume positive-x =
  forward.
- Pin genuinely LTR-designed sub-art (a logo, a code glyph) to `dir="ltr"` so it
  isn't clipped/reordered, while the *container* stays direction-aware.
- Position movers logically. The sidebar collapse trigger moved from physical
  `left` to **`inset-inline-start`** (`transition-[inset-inline-start]`) so it
  tracks the sidebar edge. Note an **inline `style={{ left }}` ignores `dir`
  entirely** (even more invisible than a physical class) — use
  `style={{ insetInlineStart }}`.

### Directional icons: mirror with `rtl:-scale-x-100` (the one place `rtl:` is required)

A logical class can't fix a glyph, so add `rtl:-scale-x-100` (purely additive,
no-op in LTR; in Tailwind v4 it uses the CSS `scale` property, so it composes
with existing `rotate-*`). A back arrow still pointing left in Arabic points
*forward*.

- **Mirror** horizontal directional glyphs: `ChevronLeft/Right`, `ChevronsLeft`,
  `ArrowLeft/Right`, `PanelLeftIcon` — back buttons, breadcrumbs, pagination,
  step "next", disclosure chevrons.
- **Do NOT mirror:** symmetric glyphs (`ArrowRightLeft` swap icon), vertical-axis
  ones (`ChevronUp/Down`, `ChevronsUpDown`, `ArrowUp/Down`), logos/brand marks,
  checkmarks, and spinners. (A `ChevronDown` mirror is a visual no-op, so an
  unconditional flip on a dynamic `ChevronDown|ChevronRight` alias is safe.)
- **Gotchas:** icon-name greps also match keyboard `event.key === 'ArrowLeft'`
  strings — read context. Grep `*Icon` aliases and local `const Chevron = …`
  too. The `rtl:-scale-x-100` token is easy to silently drop in a merge
  conflict — verify it survives. (PR #4658 mirrored ~36 instances / 27 files.)

If a value genuinely cannot be expressed logically, use Tailwind's `rtl:` /
`ltr:` variants to supply both — never leave only the LTR value.

## Components & tools with physical defaults — override them

- **shadcn `Sheet`/drawer is physical.** Its variants key on `data-[side=left|right]`
  → `left-0`/`right-0`, `border-r/l`, and physical slide animations
  (`slide-in-from-left/right`), and the default `side` is `right`. A mobile
  drawer/sidebar that omits `side` opens from the wrong edge in RTL. Drive it
  from direction: `side={isRtl ? 'right' : 'left'}` so it opens from the
  **inline-start** edge (PR #4656).
- **Client components that branch layout on direction** (e.g. which edge a
  drawer opens) can read it with a small `useDirection()` hook that reads
  `document.documentElement.dir` in an effect — but it returns `null` on the
  server / first render, so tolerate `null` to avoid a hydration mismatch.
  Server components already have the locale: use `getDirection(locale)`.
- **Don't reuse desktop `collapsed` state to gate UI inside the mobile drawer** —
  they're different surfaces. `state === 'collapsed'` also hid the version
  footer inside the open mobile drawer; the fix was `state === 'collapsed' &&
  !isMobile`.

## Migrating an existing codebase (codemod discipline)

Most of an RTL migration is a mechanical physical→logical sweep — do it as a
**safe-mode codemod** that only makes swaps which render **byte-identical in
LTR** (LTR users see zero change; only RTL gains correct behavior). PR #4629
did ~673 such edits across 187 files. Defer anything needing judgment.

- **Guard substring false positives:** `rounded-l` vs `rounded-lg`, `border-l`
  vs `border-l`-in-`lg`; disambiguate before rewriting. Negative margins migrate
  too (`-ml-*` → `-ms-*`).
- **Only rewrite class lists** — never tokens inside strings, identifiers,
  comments, SVG paths, or `event.key` values. Don't touch vertical
  borders/radius (`border-t/b`, `rounded-t/b`).
- For `space-x`→`gap`, gate the substitution on a flex/grid keyword on the line
  (see the `space-x` trap above).
- **Gate the diff:** assert zero physical inline-axis utilities remain and that
  the only non-component file touched is the config/registry.

## Bidi: protect LTR islands inside RTL text

Domain names, addresses, hashes, code, numbers, and brand terms (`Namefi`,
`NFSC`, `0x…`, `example.com`) are LTR runs that sit inside RTL sentences. Without
isolation, adjacent punctuation and digits get reordered and render garbled.

- Wrap LTR data embedded in translated text in `<bdi>` (or `dir="ltr"`), and use
  `dir="auto"` on fields that echo arbitrary user input.
- Keep brand/technical terms in Latin script (don't transliterate `Namefi`,
  `NFT`, `USDC`, `ENS`, tx hashes, chain IDs).

## Direction & locale setup (don't re-invent it)

- **Never set direction with client JS or a media query.** Read it server-side
  from the locale so SSR and hydration agree and there's no direction flash —
  `<html dir={getDirection(locale)}>`.
- **Keep all locale facts in the one registry** (`i18n/config.ts`): `locales`,
  `localeDirections`, `localeLabels`, `localeDateLocales`, `NAMESPACES`. The
  `Record<Locale, …>` types make adding a locale fail to compile until every
  map is filled in — that's intentional; fill them, don't loosen the type.
- **Tailwind v4 ships logical utilities (`ms/me/ps/pe/start/end/border-s/e/...`)
  and `rtl:`/`ltr:` variants natively** — no RTL PostCSS plugin and no
  `tailwind.config` (v4 is CSS-first). The variants are keyed to `[dir=rtl]`, so
  they do nothing until `<html dir>` is set — that one attribute is the switch.
- **Format dates/numbers with `Intl.*` keyed off the per-locale BCP-47 tag**
  (`localeDateLocales`), with an `en` fallback. Never hardcode a formatted date
  or a locale-specific number/currency string; keep frontmatter dates ISO 8601.

## Strings & translation hygiene

- **English is the single source of truth.** Add new keys to `messages/en/*`
  first; translate from English, never chain language→language.
- **Place keys by the hierarchy rule** (`.rulesync/rules/i18n-translation-keys.md`
  when present): generic atom → `common`; cross-feature reusable → `shared`;
  otherwise the feature namespace. Promote a key only on its **second** consumer
  — speculative promotion leaves dead keys.
- **A new UI string means adding the key to every locale.** Rely on the
  compile-time key types (`messages.d.ts`) plus the English-deep-merge runtime
  fallback; don't ship a key that exists only in `en` as a "real" translation.
- **Match tense/person to the screen state.** Don't use present-tense /
  first-person copy ("we're processing…") on a completed or failed screen, and
  don't quote an English button label inside help text when that button is
  translated elsewhere — these are the recurring review findings on translation
  PRs.
- **JSON safety for translators:** never put a raw `"` inside a JSON value; use
  the language's guillemets/quotes (German and French agents break parsing
  otherwise).
- **`ar-EG` targets the Egyptian app register**, not Modern Standard Arabic —
  professional Egyptian as used by local fintech apps, not slang and not Gulf
  MSA.

## Verify before claiming done

- Toggle the locale to `ar-EG` and **look**: nothing pinned to the wrong side,
  no LTR islands garbled, icons/animations mirrored, scrollbars/affordances on
  the start edge. Watch for spacing landing on the wrong side (the `space-x`
  tell) and a mobile drawer opening from the wrong edge.
- **Storybook's locale toolbar does NOT set the `dir` attribute** — wrap RTL
  stories in `<div dir="rtl">` and ship static `…RTL` stories for each
  direction×state combo (static states are what caught the logo hydration bug),
  not just one interactive story.
- Beware **"mobile/responsive" PRs that aren't framed as RTL** — they still
  introduce physical `text-left`/`left-0`/`translateX` debt. Apply the
  logical-class discipline in review regardless of the PR's title.
- Trust **flattened-key parity** (dotted-path set vs `en`) over an agent's
  self-counted key totals — agents miscount their own output.
- Validate ICU with `@formatjs/icu-messageformat-parser` (next-intl's parser),
  not regex — regex produces false positives on text inside plural/select
  branches.

# i18n Translation Key Standards (apps/frontend)

## Core rule

**No user-facing UI label is ever hardcoded.** Every string a real user can read
in an in-scope surface goes through `t('...')` (next-intl), with a key in
`apps/frontend/messages/en/<namespace>.json` and a translation in **every**
locale. English is the source of truth.

In-scope = end-user surfaces. **Out of scope** (may stay hardcoded): admin,
dev-tools, studio, Storybook stories, tests, the resources app, and
**marketing / partner / white-label landing pages** — `components/feature-landing`,
`components/leadgen`, `powered-by-namefi`, and the partner `pbns/*` variants
(`0x-city`, `aave`, `uniswap`, `token-com`, `cv`, `bespoke`); only `pbns/astra`
(Namefi's own landing) is in scope. The checkers skip all of these.

## Where a key goes — decide by first match

| Tier | When | Namespace | Key shape |
|---|---|---|---|
| **`common`** | A context-free atom whose meaning never depends on the feature — generic actions (Save, Cancel, Edit, Delete), status words, Loading, account/balance, Sign In | `common` | `common.actions.save`, `common.status.pending` |
| **`shared`** | A self-contained component reused across ≥2 unrelated features (auth gate, country input, instant-buy modal) | `shared` | `shared.countryInput.label` — follows the **component**, not the call site |
| **feature** | Everything else (the default) | the feature area derived from the component's **codepath** | `domains.dnsRecords.addDialog.title` — key mirrors the component subtree |

1. Generic atom reused across features → **`common`**
2. Belongs to a reusable cross-feature component → **`shared`**
3. Otherwise → the **feature namespace from the codepath**, keyed to mirror the
   component subtree.

### The promotion guard (prevents dead keys)

**Promote a label into `common`/`shared` only on its *second* consumer, never
speculatively.** A `common.*`/`shared.*` key used by only one feature belongs in
that feature's namespace. (Pre-seeding `common.actions.*` ahead of any real reuse
is exactly what produced a batch of dead keys that every locale had to translate.)

## Codepath → namespace map

The namespace for tier-3 keys is the feature area the component lives in. The
mapping is explicit (some dirs don't match their namespace name 1:1):

| Codepath (under `apps/frontend/src`) | Namespace |
|---|---|
| `app/cart/**`, `components/**cart**` | `cart` |
| `app/orders/**`, `components/orders/**` | `orders` |
| `app/profile/**`, `components/profile/**` | `profile` |
| `app/wishlist/**` | `wishlist` |
| `app/free-mints/**`, `components/**free-mint**` | `freeMints` |
| `app/gallery/**` | `gallery` |
| `app/claim/**`, `components/domain-claim*` | `claim` |
| `components/search/**` | `search` |
| `components/my-domains/**`, `components/domain-and-dns-managment/**` | `domains` |
| `components/mls/**` | `feed` |
| `components/payment-method/**` | `payment` / `paymentMethods` |
| `pbns/astra/**` | `landing` / `landingMarketing` |

**Cross-cutting namespaces** — usable from any codepath, no locality constraint:
`common`, `shared`, `nav`, `footer`, `consent`.

## How it is enforced

Two scripts in `apps/frontend` (run from there):

- **`bun run check:i18n`** — blocking. Fails (non-zero, `error:` lines) on:
  missing translations (a key in `en` absent from another locale), unused keys,
  keys used in code but undefined in `en`, orphan keys in a locale, and
  **locality** — a feature namespace bound outside its own codepath (only the
  allowlisted cross-cutting namespaces above are usable from anywhere). This gates
  pre-push and CI; keep it green.
- **`bun run check:i18n:convention`** — advisory (never fails the build). Flags
  hardcoded user-facing strings and `common`/`shared` keys with a single feature
  consumer (demotion candidates). Treat its output as the i18n backlog.

Scope + the codepath→namespace map are single-sourced in
`apps/frontend/scripts/i18n-scope.ts` (shared by both checkers).

### Adding a new feature namespace (checklist)

1. `src/i18n/config.ts` — add it to `NAMESPACES`.
2. `src/i18n/messages.d.ts` — add the `import` + the `Messages` entry.
3. `apps/frontend/scripts/i18n-scope.ts` — add a `FEATURE_RULES` row mapping the
   component's codepath to the namespace (else the **locality** check fails:
   "binds 'x' but its codepath maps to {no feature}").
4. Add `messages/en/<ns>.json` + `messages/_meta/<ns>.json` (description +
   `maxLength`), wire the components to `t()`, run `bun run check:i18n` — the
   `[missing]` list for the 8 non-`en` locales is the translation work order.
5. Translate (one Sonnet-low subagent per locale, writing `messages/<locale>/<ns>.json`),
   then **`bun run check:fix` (biome) on `messages/`** — translator agents emit
   valid JSON but not biome's formatting; the format pass is required before CI.

When you add a locale, update `locales` in `config.ts` (+ the label/date/direction
maps); the checker reads the config as its source of truth.

# Local Testing with Skip Auth

When validating or previewing local frontend changes using browser automation tools (MCP browser, etc.), **always use the `skip_auth` feature** to bypass authentication—unless testing authentication functionality itself.

## How to Enable Skip Auth

Add `?skip_auth=1` to the URL when navigating to the local frontend:

```
http://localhost:3001/?skip_auth=1
```

Or append to any route:

```
http://localhost:3001/my-domains?skip_auth=1
```

## Behavior

- **`?skip_auth=1`**: Enables auth bypass, persists to localStorage, simulates login as test user (`tester+alice@d3serve.xyz`)
- **`?skip_auth=0`**: Disables the bypass and clears localStorage flag
- An amber warning banner appears at bottom-right when skip auth is active
- The banner is dismissible but reappears on navigation

## When to Use

**Use skip_auth when:**
- Validating UI changes in local/development environment
- Previewing components that require authentication
- Testing authenticated API calls locally
- Quick iteration on features without manual login

**Do NOT use skip_auth when:**
- Testing authentication flow itself (login, logout, session handling)
- Testing unauthorized access behavior
- Validating auth guards or permission checks
- Testing the skip_auth feature itself

## Environment Restrictions

- **Backend**: Only works in `local` or `development` environments (blocked in preview/production)
- **Frontend**: Shows banner in local/development/preview (but backend will reject in preview)

## Example Browser Navigation

When using MCP browser tools to validate changes:

```typescript
// Good: Start with skip_auth enabled
browser_navigate({ url: "http://localhost:3001/?skip_auth=1" });

// Then navigate to any authenticated page
browser_navigate({ url: "http://localhost:3001/my-domains" });
// skip_auth persists via localStorage

// To disable when done
browser_navigate({ url: "http://localhost:3001/?skip_auth=0" });
```

## Reference

Feature implemented in: https://github.com/d3servelabs/namefi-astra/pull/3065

# Logging Levels (Backend)

Use these levels with `apps/backend/src/lib/logger.ts` (pino) to keep alerts and dashboards meaningful.

## Level meanings
- fatal: Emergency, paging/alerting, cannot continue (service down, data corruption, security breach).
- error: Unexpected failure that should be fixed or investigated; request/workflow failed; rare exception.
- warn: Minor or expected error condition; degraded or recoverable behavior; noisy but not a bug.
- info: Useful state or business events that are not bugs.
- debug: Developer-only details (start/finish, decision branches, caught errors).
- trace: Measurements/metrics and detailed third-party response payloads.

## Guidance
- Only use `fatal` when an on-call should be alerted.
- Do not use `error` for expected user actions (e.g., invalid input, 401/403/404).
- Prefer `warn` for expected failures or soft-degraded states.
- Use `debug` for flow details and for errors that are caught and handled.
- Use `trace` for timing, metrics, and verbose external responses; not for exceptions.

## Quick examples
- 401/403/404 from user input: `trace`
- ratelimits are hit, retryable action has failed: `warn`
- External API returned 500 and request failed: `error`
- Service cannot start, corrupted state: `fatal`
- Function start/end, retries, caught exception details: `debug`
- API response payloads, timings, counters: `trace`

# Merge races → suggest Graphite merge queue (don't auto-enable)

When an operation loses a **merge/push race** on a shared protected branch (e.g.
`main`), stop and surface it to the human instead of silently grinding through
retries.

## What counts as a merge race

Any of these, especially while other PRs are auto-merging:

- A push is rejected as **`non-fast-forward`** / "tip of your current branch is
  behind its remote counterpart" because someone else's merge landed first.
- A **release workflow** (e.g. `Create Release`, `Create Astra Resources
  Release`) fails at its version-bump push step for the same reason.
- Two release/automation jobs that both push a commit to `main` collide.
- You find yourself re-running the same job repeatedly just to win a quiet window.

## What to do

1. **Note that no code was lost.** A `non-fast-forward` rejection is the *safe*
   failure — git refused to overwrite the commits that landed first. The only
   thing discarded is the throwaway commit the next run regenerates. (Never
   "fix" a race with `git push --force` to a shared branch.)
2. **Pause and tell the human.** Briefly explain that the failure is a merge
   race against concurrent merges, not a real error.
3. **Recommend they consider the [Graphite](https://graphite.dev) merge queue**
   for the affected repo/branch — a merge queue serializes merges so releases and
   PRs stop racing each other. Phrase it as a suggestion for *them* to decide.
4. **Do NOT enable, configure, or migrate to a merge queue on their behalf.** This
   is a deliberate, opt-in infra change. Only set it up if the user explicitly
   asks.

## Why suggest rather than act

We're collecting signal: each time a race happens we surface the Graphite
suggestion, but leave the call to the human. If it keeps coming up, that's the
cue to actually adopt the merge queue — a decision the team makes, not the agent.

## Interim coping (only if the user wants to proceed without a queue)

If the user chooses to push through without a merge queue, the proper way is to
run colliding release/push jobs **sequentially** (not in parallel) and during a
**quiet window** (no auto-merges in flight) — and to prefer a fetch–rebase–retry
loop over a naive single push.

# Mobile-Responsive UX for Desktop-First Components

A desktop layout that "works" on a phone by horizontally scrolling, overflowing,
or shrinking text below readability is **not** mobile-friendly. When a component
is dense or wide (a data table, a multi-column dialog, a packed toolbar), adapt
its **layout** for small viewports — but keep one source of truth for behavior.

## Core principle: switch layout, reuse logic

Never fork a component into a separate "mobile version" that re-implements the
data, state, or actions. The mobile view should be a different **arrangement** of
the *same* cells, handlers, and state. One bug fix, one behavior — two layouts.

- Detect viewport with the shared hook, not a one-off media query:
  `import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile'`.
- Drive both layouts off the same row model / state. In My Domains the mobile
  cards render from the *same* `table.getRowModel()` rows as the desktop table,
  so sort, search, filter, and pagination keep working unchanged.
- Compose the same cell components in both layouts. `DomainCard`
  (`apps/frontend/src/components/my-domains/domain-card.tsx`) reuses the exact
  column cells the desktop table uses (domain name, actions `⋯` menu, selection
  checkbox, auto-renew/expiry/price, DNS status, owner/chain, Auto-ENS) — only
  the arrangement changes from horizontal columns to a labeled card.

## Tables → cards (the canonical case)

`ExtensibleDataTable`
(`apps/frontend/src/components/table/extensible-data-table.tsx`) has an **opt-in**
mobile path. Prefer it over inventing a new one:

- Pass `renderMobileCard?: (row: Row<TData>) => ReactNode` (and optional
  `cardListHeader`). When provided **and** `useIsMobile()` is true, rows render
  as a vertical stack of cards instead of the horizontally-scrolling `<table>`.
- **Opt-in is mandatory for safety:** tables that don't pass the prop are
  unchanged at every breakpoint. Don't make table mobile-behavior global.
- In card mode the toolbar stacks (full-width search) and the "Columns"
  visibility control is hidden (it's meaningless without columns).
- See `apps/frontend/src/components/my-domains/table.tsx` for the wiring: a
  memoized `renderMobileCard` that maps each row to a `<DomainCard>`.
- Document any deliberate drop. My Domains omits the table's "select-all this
  page" header checkbox on mobile (each card keeps its own checkbox) — that's a
  conscious tradeoff, called out in the PR, not an oversight.

## Centered dialogs → bottom sheets

A centered modal (`top-1/2 left-1/2 -translate-1/2`) floats awkwardly and can
overflow a phone. Dock it to the bottom as a slide-up sheet (the iOS
action-sheet pattern) on `max-sm`, desktop untouched.

- Apply the shared class on `<DialogContent>`:
  `import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet'`
  then `className={cn(MOBILE_BOTTOM_SHEET_DIALOG, …)}`.
- It only adds `max-sm:` overrides, so it composes with the dialog's own
  `sm:max-w-*` etc. The base `DialogContent` pins itself dead-center with high
  specificity, so the overrides use `!` (important) to win the cascade — that's
  intentional, don't strip it.

## Other desktop-dense offenders

- **Fixed pixel widths wider than a phone.** A `w-[400px]` panel overflows a
  375px screen. Make it full width on mobile (`max-sm:w-full` / responsive
  width). See the fix in
  `apps/frontend/src/components/table/table-filter-panel.tsx`.
- **Packed toolbars.** Stack controls vertically on mobile and give search full
  width instead of cramming a desktop row.
- **Tab bars / segmented controls.** Let them wrap rather than overflow.
- **Truncated identifiers.** Long values (addresses, hashes) need a compact
  form on cards — e.g. `AddressWithChain` can always show a short address.

## Always do

- **Respect the safe area.** Bottom-pinned UI (sheets, action bars) needs
  `pb-[max(<base>,env(safe-area-inset-bottom))]` so it clears the home indicator.
- **Keep chrome minimal.** A layout wrapper that only positions a control should
  carry layout utilities (`shrink-0`, padding, safe-area) and nothing
  decorative — no divider/background/shadow unless it masks something. (See the
  `ux-minimal-chrome` rule.)
- **Localize new copy.** New labels added for the mobile layout (e.g. card field
  labels) must land in every locale under `apps/frontend/messages/<locale>/`,
  not just `en`.
- **Verify on a real phone width.** Don't trust desktop devtools alone — check
  at ~390px (iPhone) using `?skip_auth=1` for auth-gated pages (see the
  `local-testing-skip-auth` rule). Confirm: no horizontal scroll, tap targets
  ≥ ~44px, text readable without zoom, sticky/bottom UI clears the safe area.

## Reference

Pattern established in PR
[#4632](https://github.com/d3servelabs/namefi-astra/pull/4632) — "mobile card
layout for My Domains".

# Next.js Dev Compile Guardrails

- Keep `"use client"` as low as possible; avoid adding it to `app/layout.tsx`, route files, or large shared components.
- Do not add new providers or heavy dependencies to the app shell (`layout.tsx`, `Main`, sidebars).
- Prefer direct leaf imports over barrel exports, especially across server/client boundaries.
- Avoid `export *` from modules that are imported by the app shell or shared client components.
- Do not expand Tailwind scanning beyond `apps/frontend/src` unless required; keep any new sources explicit and minimal.
- Avoid adding global CSS/plugins in `apps/frontend/src/app/globals.css` unless absolutely needed.
- If you touch `/` or app shell code, run `scripts/bench-frontend-dev.ts` to verify no regression.

# Permissions UX and Data Model

This project uses an ABAC-style permission system with TypeScript enums and a Postgres table. See [packages/utils/src/permissions.ts](mdc:packages/utils/src/permissions.ts).

Key conventions:

- Permission keys use the format `RESOURCE;;ACTION` except `SUPER_ADMIN`.
- A hidden baseline permission `ADMIN_DASHBOARD;;READ` (enum key: `VIEW_ADMIN_DASHBOARD`) must exist for any user who has any permissions. It is not shown in the UI.

Backend expectations (tRPC):

- Prefer composing permission checks with `withRequiredPermissions`, or use builders `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions` from [base.ts](mdc:apps/backend/src/trpc/base.ts).
- `listAvailablePermissions` must only return visible permissions (hide `ADMIN_DASHBOARD;;READ`).
- `grantPermissions` must auto-insert the hidden baseline permission and forbid granting `SUPER_ADMIN` unless the caller already has it.
- `revokePermissions` must ensure the hidden baseline permission remains after revokes.
- `deleteUserPermissions` must delete all rows for a user including the hidden baseline.
- `getUserPermissions` must return all permissions for a user (including hidden baseline) and is admin-only; callers must have at least `VIEW_ADMIN_DASHBOARD`.
- `listUsersWithPermissions` is intended to be admin-only; in this PR it is temporarily `protectedProcedure` (no admin gate). Document this as a temporary deviation and harden in a follow-up PR.
- All mutating endpoints (grant/revoke/delete) must be audited: include actorId, targetUserId, delta (added/removed), full before/after sets, timestamp, and requestId/traceId.

Frontend gating & UX:

- Use `PermissionGate` with `permissions: Permission[]` and optional `gateMode: 'normal' | 'inverted'` for gating. Prefer arrays even for one permission.
- In the admin landing grid, wrap each tile with the corresponding READ permission.
- In the user dropdown, show “Admin Dashboard” only if `VIEW_ADMIN_DASHBOARD` is present.
- Group permissions by `RESOURCE` (prefix before `;;`).
- Within each group, render a first cell labeled “Manage” that toggles all visible actions in that group.
- The `SUPER_ADMIN` group must never show “Manage”; it presents a single item only (disabled if the caller isn’t a super-admin).
- Provide global “Select All” / “Deselect All” controls. These must not toggle `SUPER_ADMIN` for non-super-admin callers.
- Show labels in Title Case (convert underscores to spaces, then Title Case).
- Do not display the hidden baseline permission.
- Show a loading skeleton for the grid while `listAvailablePermissions` or `getUserPermissions` are loading.
Implementation rules:

- Avoid hooks inline in JSX; extract any complex rendering into components.
- Split the grouped permissions grid into:
  - `PermissionGroupSection` (one resource section with Manage)
  - `PermissionItem` (a single checkbox row)
- Use `AsyncButton` with `mutateAsync` and `sonner` toasts for async actions.

# Pull Request Description Standards

Every PR description must contain the following sections, in this order.

## 1. Summary / Solution (required)

- State **what the PR does** and, for a bug fix, **how it is fixed** — not just
  the issue and root cause. A reviewer should understand the chosen solution
  without reading the diff.
- For fixes, include: **Issue → Root cause → Solution (how)** → key changes.
- Reference the issue it closes (e.g. `Fixes #1234`).

## 2. Test plan (required)

- List how the change was validated (unit tests, type-check, lint, manual
  steps). Call out anything automation can't cover (e.g. live wallet flows) so
  the reviewer knows what to verify manually.

## 3. Claude session summary (required when the PR was authored with Claude)

When a PR is created (in whole or part) by a Claude Code session, append a
section summarizing that session:

- **Main prompts (high level):** a bulleted, paraphrased summary of the user's
  driving prompts — **not verbatim**, just the intent of each main step.
- **Redaction:** never include keys, secrets, tokens, credentials, customer PII,
  raw email contents, or other sensitive data. Summarize around them (e.g.
  "traced a customer-reported swap bug" rather than quoting the email).
- **Timestamps:** include the time the session started and the time it last
  updated the PR, in ISO 8601 UTC (`yyyy-MM-dd'T'HH:mm:ss'Z'`). Use a verifiable
  anchor for the start (e.g. the first artifact the session created) and the
  latest commit's timestamp for the last update.

The purpose is provenance and reviewability — a reader should be able to see, at
a glance, how the change came to be and what human intent drove it.

# Quality Risk Patterns

When writing or reviewing non-trivial code, apply the
`namefi-astra-quality-guardrails` skill. If generated skills are unavailable,
read `.rulesync/skills/namefi-astra-quality-guardrails/SKILL.md` and, for
non-trivial or high-risk changes,
`.rulesync/skills/namefi-astra-quality-guardrails/references/issue-buckets.md`.

Minimum checklist before handing off code:

- Do not enable actions, show success, or persist values before required state
  is loaded and current.
- Include every identity dimension in cache keys, storage keys, locks, database
  lookups, dedupe keys, and query invalidations.
- After `await`, re-check current request/component/account/signer/workflow
  state before committing side effects.
- Invalidate or refresh every reader that can show stale data after a mutation;
  stop polling on terminal states.
- Keep Temporal workflows deterministic and side effects in activities; preserve
  useful error cause/context across layers.
- Make user-facing copy and status labels match what is actually confirmed.
- For payments, user assets, domain ownership, auth, webhooks, secrets,
  migrations, CI/release automation, and dependencies, require stronger tests or
  runtime evidence.
- Prefer local fixes and existing patterns. Add abstraction only for proven
  duplication, consistency risk, or an established local API.

# Resolve Code Reviews

When asked to "resolve reviews" or "resolve code reviews", follow this workflow:

## 1. Get Current Branch's PR Number

First, identify the PR number for the current branch. You can use:
- `gh pr view --json number` to get the PR number for the current branch
- Or check the branch name and find the associated PR

## 2. Fetch Unresolved Review Threads

Run the following GitHub GraphQL query to get all unresolved review threads:

```bash
gh api graphql -F owner=':owner' -F name=':repo' -F number=<PR_number> -f query='
  query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(last: 100) {
          nodes {
            isResolved
            path
            comments(first: 1) {
              nodes {
                author { login }
                body
                createdAt
              }
            }
          }
        }
      }
    }
  }
' --jq '.data.repository.pullRequest.reviewThreads.nodes | map(select(.isResolved == false))'
```

**Note**: Replace `:owner` and `:repo` with the actual repository owner and name. You may need to extract these from the git remote URL or ask the user if not clear.

## 3. Process Each Review

For each unresolved review thread:

1. **Assess if it's reasonable**:
   - Read the review comment carefully
   - Understand the context by examining the file and line mentioned
   - Determine if the feedback is valid and should be addressed

2. **If reasonable, fix it**:
   - Make the necessary code changes
   - Ensure the fix addresses the reviewer's concern
   - Update the relevant files

3. **Document the plan**:
   - Create a clear plan showing:
     - Which reviews are being addressed
     - What changes will be made for each
     - Which reviews (if any) are being deferred or require discussion

## 4. Wait for User Review

After creating the plan and making fixes:
- Present the plan to the user
- Show what changes were made
- Wait for the user's approval before proceeding with any commits or further actions
- If any reviews require discussion or clarification, present them separately for the user's input

## 5. Commit, Push, and Resolve Reviews

After receiving user approval:

1. **Commit the changes**:
   - Create a new commit with `git commit` following the project's conventional commit style
   - Or amend the current commit with `git commit --amend` when appropriate

2. **Push the updates**:
   - Run `git push` to update the PR

3. **Resolve all review threads**:

   **For reviews that were fixed:**
   ```bash
   gh api graphql -f query='
     mutation {
       resolveReviewThread(input: {threadId: "<THREAD_ID>"}) {
         thread { isResolved }
       }
     }
   '
   ```

   **For reviews that were declined/deferred:**
   - First, add a response comment explaining the rationale:
   ```bash
   gh api graphql -f query='
     mutation {
       addPullRequestReviewThreadReply(input: {
         pullRequestReviewThreadId: "<THREAD_ID>",
         body: "<RATIONALE_MESSAGE>"
       }) {
         comment { id }
       }
     }
   '
   ```
   - Then resolve the thread using the same `resolveReviewThread` mutation above
   - Example rationale: "Deferring this enhancement - would require significant refactoring for the current use case. Backend validation still catches invalid inputs."

4. **Verify all threads are resolved**:
   - Re-run the fetch query from Step 2 to confirm no unresolved threads remain

## Important Notes

- Always verify the repository owner and name before running the GraphQL query
- If the PR number cannot be determined automatically, ask the user
- Be thorough in understanding each review comment before making changes
- If a review seems unclear or requires clarification, flag it for the user rather than guessing

# Storybook Golden Rules

These rules are strictly enforced for all `*.stories.tsx` files.

## 1. Never Import Route Modules

Do **not** import Next.js App Router route modules from `@/app/**` inside `*.stories.*`.

- Avoid: `@/app/**/page`, `@/app/**/layout`, `@/app/**/loading`, `@/app/**/error`, `@/app/**/route`
- Instead: Extract UI into sync leaf components under `src/components/` or `src/app/**/_components/`

## 2. Only Export Stories

- Named exports must be `const` typed as `Story`
- Do not export helpers, functions, data, or components
- `export default meta` is required

## 3. Include Required Providers

Most components need providers. Common ones:
- `WagmiProvider` for wallet hooks
- `TRPCProvider` + `QueryClientProvider` for data fetching
- `MockPrivyProvider` for auth
- `ConsentManagerProvider` for consent hooks

## 4. Mock Next.js Navigation

Add `parameters.nextjs.appDirectory: true` for components using `next/navigation` hooks.

---

**Full guidance**: See [docs/dev-guides/storybook/README.md](../../docs/dev-guides/storybook/README.md) for complete patterns, provider setup examples, and troubleshooting.

# Test IDs: stable, hierarchical handles for every rendered element

Locating an element by its **visible text** (`getByText('Sign In')`,
`getByRole('button', { name: /checkout/ })`) breaks the moment that text is
translated — and this app now ships nine locales. A `data-testid` is a
**language-independent, refactor-stable handle**: it survives copy edits,
translation, and re-styling, and it makes a failing test or a console-inspected
node point straight back to the component that owns it.

Treat `data-testid` the way we treat a translation key: **the elements a test
or debugger actually targets get one, and its value is a dotted hierarchical
path that says where the element lives.** Scope it to what earns the cost — see
"What must have a test id" below; a `data-testid` on a decorative element that
nothing ever targets is dead weight (the same logic as the `ux-minimal-chrome`
rule), so don't blanket-tag every node.

## The core rule: mirror the translation-key hierarchy

A test id is **`<namespace>.<section>.<element>`**, dot-separated, kebab-case
leaves — the same shape as an i18n key. Whenever an element already pulls copy
from `useTranslations('<ns>')`, its test id starts with that **same namespace**,
so the id and the key line up one-to-one and you can map either direction.

| Translation key (`messages/<locale>/`) | `data-testid` |
|---|---|
| `cart.summary.checkoutButton` | `cart.summary.checkout-button` |
| `domains.list.empty` | `domains.list.empty` |
| `nav.userMenu.signOut` | `nav.user-menu.sign-out` |

### Namespace selection — same tiers as the i18n hierarchy

Pick the first tier that fits, exactly as for translation keys
(see the i18n hierarchy in `i18n-rtl.md`):

- **Generic, reused atom** (a primitive's own structural parts) → keep it on the
  component, e.g. `table.head`, `dialog.close`. These come from the component,
  not a feature.
- **Cross-feature shared widget** → `shared.<widget>.<element>`
  (e.g. `shared.address.copy-button`).
- **Otherwise the feature namespace** the component already uses for copy →
  `cart.*`, `domains.*`, `search.*`, `nav.*`, `profile.*`, …

### Surfaces that are NOT translated — test ids still cover them

**Test ids cover the whole app; i18n does not.** Admin tools, marketing landings,
dev/test utilities, and B2B surfaces are intentionally English-only with no
`useTranslations` and no `messages/<locale>/` namespace. They still get test ids —
using a **feature-area namespace** that does *not* need a translation counterpart.
The allowed non-i18n roots (see `NON_I18N_ROOTS` in `scripts/check-testid.ts`):

| Root | Surface |
|---|---|
| `admin.<area>.*` | `src/app/admin/**`, `components/admin/**` (e.g. `admin.users.*`, `admin.financials.*`) |
| `pbns.<site>.*` | `src/pbns/**` marketing landings (e.g. `pbns.aave.*`) |
| `x402.*` | `src/app/x402/**` payment pages |
| `nfsc.*` / `mls.*` / `leadgen.*` / `newsletter.*` / `poweredBy.*` | those feature areas |
| `dev.*` | dev/test utilities (test-signed-payload, impersonation banner, …) |

For these, derive the area from the path/feature, not from a translation key. The
guardrail's `unknown-ns` detector only allows i18n namespaces **plus** this
allowlist — extend the allowlist (and this table) before introducing a new root.

Keep the **section** segment meaningful (`summary`, `list`, `row`, `toolbar`,
`empty-state`), not a DOM tag. The leaf is the concrete thing a test clicks,
reads, or asserts on (`checkout-button`, `total`, `error`).

## What must have a test id

Prioritise by test value — tag the things a test or a human debugger needs to
**find, click, read, or assert on**:

1. **Interactive controls** — buttons, links, inputs, selects, checkboxes,
   toggles, tabs, menu items.
2. **Identity / output values** — amounts, totals, balances, network/chain,
   gas/fees, statuses, addresses, the domain name on a card.
3. **Containers a test scopes into** — dialogs, cards, list/table rows, panels,
   toolbars, banners, the empty / loading / error states of a region.

A purely decorative wrapper that nothing ever targets does not need one. When in
doubt about an *interactive* element, add it; a missing id there costs a brittle
text selector later. But don't tag decorative structure just to raise a number.

**Roll out by value, not by file count.** User-facing critical paths
(checkout/cart, search, my-domains, auth) come first; internal/admin pages
(`src/app/admin/**`) are low priority and may stay uncovered indefinitely — the
`check:testid` coverage-gap detector is advisory, not a mandate to tag them all.

## Generated ids — for repeated and primitive elements

Two situations call for **computed** ids rather than hand-written string
literals:

### 1. Repeated instances — suffix with the item's own data, not its DOM order

A list of rows/cards must not give every instance the same id (you could never
target one), and must not key off array index (it shifts when the list
re-sorts). Append a **stable value from the item's data**:

```tsx
// domain cards / table rows
<DomainCard data-testid={`domains.list.row.${domain.name}`} … />
// cart line items
<li data-testid={`cart.item.${tokenId}`} … />
```

Now a test targets exactly one row by the data it already knows.

### 2. Primitive components — generate children from a root namespace

Shared primitives (the `table/` components, dialogs) must **not** hard-code a
generic leaf like `data-testid="tr"` / `"td"` — every table on the page then
renders colliding ids. Instead the primitive takes a **root namespace from its
call site** and *generates* its parts' ids from it, falling back to the generic
default only when no root was supplied:

```tsx
// call site supplies the root once:
<Table data-testid="domains.list">…</Table>
// the primitive derives the subtree:
//   table  → domains.list
//   thead  → domains.list.head
//   tbody  → domains.list.body
//   tr     → domains.list.row     (override per-row with the row's data)
//   td     → domains.list.cell
```

This is the canonical "some are generated" case: **one prop at the call site →
a whole consistent, collision-free subtree.** See
`apps/frontend/src/components/table/` for the reference implementation (the
root flows through the table `Context`, and any element can still be overridden
by passing `data-testid` explicitly, because the primitives spread `{...rest}`
after their generated default).

## Conventions & hygiene

- **Lowercase, dotted namespaces, kebab-case leaves.** `cart.summary.checkout-button`,
  never `cartSummaryCheckoutButton` or `Cart_Summary_CheckoutButton`.
- **Mirror, don't invent, the namespace.** If the component reads
  `useTranslations('search')`, its ids start with `search.`. Don't coin a new
  top-level namespace that has no translation counterpart.
- **Promote a shared leaf only on its second consumer** — same discipline as
  i18n key promotion. Don't pre-emptively park ids under `shared.*`.
- **Never localize or interpolate a test id.** It is an English, stable
  identifier; only the *data suffix* (a domain name, token id) is dynamic.
- **Prefer test ids over text/role selectors** in new Playwright/Vitest specs
  for app-specific elements: `page.getByTestId('cart.summary.checkout-button')`,
  not `getByRole('button', { name: /checkout/ })`. Role/text selectors are
  fine for genuinely generic accessibility assertions, but they regress under
  i18n — which is exactly why this rule exists.

## Verify before claiming done

- Run `bun run --cwd apps/frontend check:testid` — it flags **collisions**
  (the same literal id rendered from more than one place), **non-hierarchical**
  ids (no dot, or a namespace with no translation counterpart), and reports
  **coverage** of interactive elements. It is advisory, not yet CI-gating.
- Spot-check in the browser devtools: an element's `data-testid` should read as
  a path you can trace to its file and its translation key without guessing.

# UI Component Development Playbook

This playbook provides a comprehensive workflow for developing UI components in the namefi-astra frontend application.

## Technology Stack

- **Framework**: React 19 with Next.js 16 App Router
- **UI Components**: @base-ui/react components (e.g., accordion, button, checkbox, dialog)
- **Styling**: Tailwind CSS 4.1.11
- **State Management**: @tanstack/react-query
- **Testing**: Vitest with @vitest/coverage-v8
- **Animation**: motion@12.10.4

## Design System

### Theme

- **Dark theme by default**: Use dark backgrounds (`#0a0a0a`, `#141414`) matching the app's aesthetic
- **Font**: Inter font family

### Color Palette

```css
:root {
  --bg-dark: #0a0a0a;
  --bg-card: #141414;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --green: #22c55e;    /* success/safe */
  --red: #ef4444;      /* warning/danger */
  --yellow: #eab308;   /* caution */
}
```

### Spacing

- Use consistent spacing in multiples of 4px or 8px
- Common values: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`

### Border Radius

- Use rounded corners: `8px`, `12px`, `16px`

### Transitions

- Add smooth transitions: `0.2s-0.3s ease`

### Responsive Design

- Must work on all screen sizes: Mobile, Tablet, Desktop
- Use flexible grids (e.g., `minmax`) and wrapping layouts
- Test at common breakpoints: 375px, 768px, 1024px, 1440px

## Development Workflow

### Phase 1: Prototype Design

1. Understand the component requirements and use cases
2. Review existing components in `apps/frontend/src/components/` for patterns
3. Check if similar components exist that can be extended or composed
4. Create a design exploration if needed (see `ui-prototype.mdc` for standalone prototypes)

### Phase 2: Component Implementation

1. Create the component file in the appropriate directory under `apps/frontend/src/components/`
2. Follow existing naming conventions and file structure
3. Use @base-ui/react primitives where applicable for accessibility (accordion, button, checkbox, dialog, etc.)
4. Implement with Tailwind CSS classes following the design system
5. Add proper TypeScript types for all props
6. Use motion/react for animations when needed

### Phase 3: Testing

1. Write unit tests using Vitest
2. Test component props and variants
3. Test user interactions
4. Test accessibility (keyboard navigation, screen reader support)
5. Ensure tests pass: `bun run test`

### Phase 4: Visual Verification and Recording

This phase is critical for ensuring UI quality and providing visual evidence for PR reviews.

1. **Start the development server**:
   ```bash
   bun run dev
   ```
   Ports are dynamically allocated and displayed on startup.

2. **Open the page in browser** and navigate to the component

3. **Test all interaction states**:
   - Click all buttons and interactive elements
   - Fill and submit all forms
   - Test error states (invalid inputs, API failures)
   - Test loading states (skeleton, spinners)
   - Test empty states
   - Test responsive behavior:
     - Mobile (375px width)
     - Tablet (768px width)
     - Desktop (1024px+ width)

4. **Record a screen video or create a GIF** demonstrating:
   - Complete user flow from start to finish
   - All component states and interactions
   - Edge cases and error handling
   - Responsive behavior across breakpoints

5. **Capture screenshots** for static states if video is not practical

### Phase 5: Create Pull Request

1. Run all quality checks before committing:
   ```bash
   bun run typecheck    # Ensure no type errors
   bun run check        # Run Biome linting
   bun run test         # Run all tests
   bun run test:coverage # Verify test coverage
   ```

2. Commit changes with a descriptive message

3. Create the PR with:
   - Clear description of the component and its purpose
   - List of changes made
   - **Include video/GIF in the "Test Plan" or "Screenshots" section**
   - This satisfies the `.coderabbit.yaml` requirement for visual evidence on .tsx changes

4. Wait for CI checks to pass

## Quality Checklist

Before submitting a PR, verify:

- [ ] Component follows the design system (colors, spacing, typography)
- [ ] Component is accessible (keyboard navigation, ARIA attributes)
- [ ] Component is responsive across all breakpoints
- [ ] All TypeScript types are properly defined
- [ ] Unit tests are written and passing
- [ ] No type errors: `bun run typecheck`
- [ ] Linting passes: `bun run check`
- [ ] All tests pass: `bun run test`
- [ ] Visual recording/screenshots included for PR

## File Structure Convention

```
apps/frontend/src/components/
├── [feature]/
│   ├── index.tsx           # Main component export
│   ├── [component].tsx     # Component implementation
│   ├── [component].test.tsx # Unit tests
│   └── types.ts            # TypeScript types (if complex)
```

## Best Practices

1. **Composition over inheritance**: Build complex components by composing smaller ones
2. **Single responsibility**: Each component should do one thing well
3. **Prop drilling avoidance**: Use context or state management for deeply nested data
4. **Memoization**: Use `useMemo` and `useCallback` for expensive computations
5. **Error boundaries**: Wrap components that may fail with error boundaries
6. **Loading states**: Always handle loading states gracefully
7. **Empty states**: Provide meaningful empty state UI
8. **Accessibility**: Follow WCAG guidelines, use semantic HTML

# UI Prototype Guidelines

When asked to create UI prototypes, visual demos, or component explorations:

## Location

- Create standalone static HTML files in `prototype/ui/` folder
- Use descriptive filenames like `toggle-variants.html`, `button-states.html`, `modal-designs.html`

## Technical Requirements

- **Standalone**: No dependencies on repo code - must work by opening the HTML file directly in a browser
- **Self-contained**: All CSS should be inline in `<style>` tags
- **CDN-only**: External dependencies (fonts, icons, libraries) should use CDN links only
- **No build step**: Files should work without any compilation or bundling
- **Responsive**: Must work on all screen sizes (Mobile, Tablet, Desktop). Use flexible grids (e.g., `minmax`) and wrapping layouts.

## Design System

- **Dark theme by default**: Use dark backgrounds (`#0a0a0a`, `#141414`) matching the app's aesthetic
- **Font**: Use Inter font from Google Fonts CDN
- **Colors**: Follow the app's color palette:
  - Green (success/safe): `#22c55e`
  - Red (warning/danger): `#ef4444`
  - Yellow (caution): `#eab308`
  - Text primary: `#ffffff`
  - Text secondary: `#a1a1aa`
  - Text muted: `#71717a`
- **Spacing**: Use consistent spacing (multiples of 4px or 8px)
- **Border radius**: Use rounded corners (`8px`, `12px`, `16px`)
- **Transitions**: Add smooth transitions (`0.2s-0.3s ease`)

## Content Language

- **Use English** for all labels, descriptions, and content unless explicitly requested otherwise
- Keep text concise and descriptive

## Page Structure (Like a Figma Presentation)

Organize the prototype like a senior UI/UX designer presenting to a client. The page should flow logically from context → exploration → recommendation:

### 1. Header Section
- **Title**: Clear component/feature name
- **Subtitle**: One-line description of what this prototype explores

### 2. Design Requirements (First Content Section)
A highlighted box explaining the design challenge:
- **Problem**: What user problem or business need are we solving?
- **Goals**: What should this design accomplish?
- **Constraints**: Any technical or UX constraints to consider
- **Success Criteria**: How do we know if the design works?

### 3. Interactive Demo (Hero Section)
- Show the **recommended solution** first as an interactive demo
- **Include a Configurator**: Add a panel to tweak key variables (colors, states, text labels, density)
- **Live Preview**: The demo should update instantly when configuration changes
- **Generated Code**: Optionally show the CSS/JS variables or code snippet for the selected configuration
- This is the "pitch" - what we're proposing, with the ability to "try before you buy"

### 4. Design Exploration (Variants Grid)
- Organize variants by category (e.g., "Prominent", "Subtle", "Minimal")
- Each variant card should include:
  - Visual example (interactive if applicable)
  - Variant name and type label
  - Brief description of when to use
- Use consistent card layout for easy comparison

### 5. Spectrum/Comparison Section
- Visual comparison of all variants side-by-side
- Show the full range from one extreme to another (e.g., "Most Prominent → Most Subtle")
- Helps stakeholders understand the design space

### 6. Use Case Examples
- Real-world scenarios showing the design in context
- "When X happens, use Y variant because Z"
- Include both recommended and not-recommended examples

### 7. Recommendations (Final Section)
- Clear guidance on which variants to use and when
- Organized by use case or priority
- Rationale for each recommendation

## Example HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Component] Design Exploration</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Base styles */
    :root {
      --bg-dark: #0a0a0a;
      --bg-card: #141414;
      --text-primary: #ffffff;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #eab308;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      padding: 40px 20px;
    }

    .container { max-width: 1100px; margin: 0 auto; }

    /* Design Requirements Box */
    .design-requirements {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 48px;
    }
    .design-requirements h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--green);
      margin-bottom: 16px;
    }
    .design-requirements dl {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 12px 16px;
    }
    .design-requirements dt {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .design-requirements dd {
      color: var(--text-primary);
      margin: 0;
    }

    /* Section styles */
    .section { margin-bottom: 48px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .section-desc { color: var(--text-muted); margin-bottom: 20px; }

    /* Card grid */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    /* Comparison section */
    .comparison {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 28px;
    }

    /* Recommendations */
    .recommendations {
      border-left: 3px solid var(--green);
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 1. Header -->
    <h1>[Component] Design Exploration</h1>
    <p class="subtitle">Exploring [specific aspect] for [use case]</p>

    <!-- 2. Design Requirements -->
    <div class="design-requirements">
      <h2>📋 Design Requirements</h2>
      <dl>
        <dt>Problem</dt>
        <dd>What problem are we solving?</dd>
        <dt>Goals</dt>
        <dd>What should this design accomplish?</dd>
        <dt>Constraints</dt>
        <dd>Technical or UX constraints</dd>
        <dt>Success</dt>
        <dd>How do we measure success?</dd>
      </dl>
    </div>

    <!-- 3. Interactive Demo (Recommended Solution) -->
    <div class="section">
      <h2 class="section-title">✨ Recommended Approach</h2>
      <p class="section-desc">Our proposed solution - try it out</p>
      <!-- Interactive demo here -->
    </div>

    <!-- 4. Design Exploration -->
    <div class="section">
      <h2 class="section-title">🎨 Design Variants</h2>
      <p class="section-desc">All explored options organized by category</p>
      <div class="card-grid">
        <!-- Variant cards -->
      </div>
    </div>

    <!-- 5. Spectrum Comparison -->
    <div class="comparison">
      <h3>Full Spectrum: [Dimension A] → [Dimension B]</h3>
      <!-- Side-by-side comparison -->
    </div>

    <!-- 6. Use Case Examples -->
    <div class="section">
      <h2 class="section-title">📱 Real-World Use Cases</h2>
      <!-- Contextual examples -->
    </div>

    <!-- 7. Recommendations -->
    <div class="recommendations">
      <h2 class="section-title">💡 Recommendations</h2>
      <ul>
        <li><strong>For [use case A]:</strong> Use [variant] because [reason]</li>
        <li><strong>For [use case B]:</strong> Use [variant] because [reason]</li>
      </ul>
    </div>
  </div>
</body>
</html>
```

## Workflow

1. **Create** the prototype file in `prototype/ui/`
2. **Open** in browser to demonstrate the design
3. **Present** - walk through the sections from requirements to recommendations
4. **Iterate** based on feedback
5. **Approve** - once finalized, reference when implementing in the codebase

# Role: Senior UX/UI Copywriter & Content Strategist

## Core Philosophy
You are an expert UX writer who drafts interface copy based on **Cognitive Load Theory** and **User-Centric Action**. Your goal is not just to "label" things, but to guide users through flows with minimal friction. You prioritize clarity and utility over cleverness.

## Crucial Constraints
1. **NO Decorative Emojis**: Do not use emojis like 🚀, ✨, ❌, ⚠️ in the copy unless explicitly requested for a specific brand tone. Emojis make the text look spammy or "AI-generated."
2. **No "Robot Speak"**: Avoid passive voice ("The file was rejected") or system-internal jargon ("Database error 504") unless the user is a developer who needs the code.
3. **Black Box Thinking**: Translate *why* the system is doing something (backend logic) into *what* it means for the user (frontend consequence).

## The "Universal Formula" for UI Components

### 1. The Headline (Title)
* **Purpose**: Immediate orientation. "What is the status?"
* **Rule**: Front-load the most important keywords.
* **Length**: 3-5 words ideal.
* **Bad**: "Notice regarding the export status of your domain."
* **Good**: "Transfer Lock Active" or "Export Unavailable".

### 2. The Body (Description)
* **Purpose**: Context and Resolution. "Why is this happening? + When/How is it fixed?"
* **Rule**: Cause -> Consequence -> Timeline/Action.
* **Detail**: Don't blame the user. Don't say "You failed to..." say "We couldn't..." or "Please check..."
* **Formatting**: Use sentence case.

### 3. The Action (Buttons/Links)
* **Purpose**: Closing the loop.
* **Rule**: Verb + Noun. Never use "Click Here" or "OK" (unless it's a purely dismissive acknowledgment).
* **Examples**: "Try Again," "View Policy," "Contact Support," "Dismiss."

## Interaction Guidelines for Drafting
When asked to write or improve UI copy, follow this process:

1.  **Analyze the State**:
    * Is this a Success, Error, Warning, or Empty State?
    * Is the user blocked, or can they proceed?
2.  **Draft Options (Provide 3 Variations)**:
    * **Option A - Direct & Functional**: The standard, clearest approach.
    * **Option B - Softer/Empathetic**: For frustrating errors or waiting periods.
    * **Option C - Technical/Detailed**: If the user audience is technical (e.g., developers).
3.  **Critique**: Briefly explain *why* one might be better than the others based on information hierarchy.

## Tone Calibration
* **Professional**: Reliable, calm, invisible.
* **Direct**: Short sentences. No fluff.
* **Human**: Use "You" (the user) and "We" (the system/team).

## Example Scenario: "Feature Locked"
* *Bad*: "Error. You cannot export this yet because of the 60-day rule."
* *Refined (Title)*: "Export Available in 12 Days" (Focus on the future positive state)
* *Refined (Body)*: "For security, domains are locked for 60 days after transfer. You can export this domain starting [Date]."

# UX Principle: Minimal Chrome

**Don't add anything that blocks the user's view or takes space unless it earns
its place.** Every divider, background, shadow, border, padding block, banner,
or container is a cost — in attention, in vertical space (especially on mobile),
and in visual noise. Default to *less*; add chrome only when it solves a real,
nameable problem.

## Before adding a visual element, name the problem it solves

If you can't state what would break without it, remove it. Common offenders:

- **Dividers / borders** to "separate" regions that are already visually
  distinct (different background, spacing, or position). The gap is the
  separator — you usually don't need a line too.
- **Opaque backgrounds** on an element that sits on a same-colored surface, or
  that nothing ever overlaps/scrolls behind. If there's nothing to mask, the
  background is dead weight.
- **Shadows / scrims** added "for depth" where there is no layering. A shadow
  implies one thing floats over another; don't imply it if it doesn't.
- **Wrapper bars / headers / footers** that exist only to hold one control.
  Give the control its layout (spacing, safe-area, sizing) directly instead of
  wrapping it in a styled "bar."
- **Fixed banners / toolbars** that eat viewport height the user needs for the
  actual content — particularly painful on short mobile viewports.

## Guidance

- **Prefer space over lines.** Use spacing and grouping to separate content
  before reaching for a border or background.
- **Maximize the content area.** On small screens, vertical space is scarce —
  don't spend it on decoration. Keep trust-critical content (amounts, network,
  fees) visible; cut chrome, not information.
- **Layout wrappers should be invisible.** A container that only positions a
  control (e.g. a pinned action area) should carry layout utilities
  (`shrink-0`, padding, safe-area insets) and nothing decorative.
- **A natural cut-off is its own affordance.** Content clipped at a scroll edge
  already hints "there's more" — you rarely need an extra fade/shadow/line to
  say so.
- **When in doubt, remove it and look.** If the UI reads fine without the
  element, it was unnecessary.

## Example (this repo)

The NFSC swap dialog pins its primary action in a region below the scrollable
body. That region is a *pure layout wrapper* — `shrink-0` + horizontal padding +
`pb-[max(1.5rem,env(safe-area-inset-bottom))]` — with **no** divider, background,
or shadow: nothing scrolls behind it, so there's nothing to separate or mask.
See `apps/frontend/src/components/dialogs/nfsc-swap-dialog-utils.ts`
(`SWAP_DIALOG_ACTION_BAR_CLASSNAME`).
