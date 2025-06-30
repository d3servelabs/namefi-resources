# Claude Development Preferences

This file contains development preferences and guidelines for Claude when working on this project.

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

### Git & Version Control

- Write clear, descriptive commit messages
- Include context about why changes were made
- Follow the existing commit message style in the repository
- Only commit when explicitly asked by the user

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
