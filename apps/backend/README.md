# Backend

## Setup & Development

```bash
# Start the development server
bun run dev

# Start the tRPC server
bun run trpc
```

## Testing

This project uses Vitest for unit testing. Here are some best practices for handling tests:

### Running Tests Locally

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Generate coverage report
bun test:coverage
```

### Running GitHub Actions Tests

You can run GitHub Actions tests locally using [Act](https://github.com/nektos/act) or trigger them remotely:

```bash
# From the root directory:
# Run GitHub Actions workflow locally
bun test:ci

# Dry run (preview without executing)
bun test:ci:dry

# From the backend directory:
# Run GitHub Actions workflow for backend only
bun test:ci
```

##### Requirements:
- Docker must be running
- Apple Silicon Mac users: The commands include architecture flags automatically
- Run `act --help` for more options

##### Trigger remote workflow:
```bash
# Install GitHub CLI if needed
brew install gh

# Trigger workflow remotely
gh workflow run test.yml -R namefi/namefi-astra

# Or with package filter
gh workflow run test.yml -R namefi/namefi-astra -f package_filter="@namefi-astra/backend"
```

### Handling Environment Variables in Tests

We have two approaches for tests that need environment variables:

1. **Temporarily Setting Environment Variables in Tests**:
   ```ts
   import { beforeAll, afterAll } from 'vitest';
   
   // Store original environment
   const originalEnv = process.env;
   
   describe('My Test Suite', () => {
     beforeAll(() => {
       // Set environment variables for tests
       process.env = {
         ...process.env,
         DATABASE_URL: 'mock-url',
         // other variables...
       };
     });
     
     afterAll(() => {
       // Restore original environment
       process.env = originalEnv;
     });
     
     // Your tests...
   });
   ```

2. **Tests Using .env.test File**: Use `bun test` which loads variables from `.env.test`
   - For integration tests that need consistent environment configuration
   - When multiple test files need the same environment setup

### Best Practices for Testing

1. **Test Organization**:
   - Place test files next to the files they test with the `.test.ts` naming convention
   - Use descriptive test names that indicate what functionality is being tested

2. **Testing tRPC Routers**:
   - Call the actual router's procedures using `router.createCaller(context)`
   - Use type-safe inputs with `inferProcedureInput` when helpful
   - Mock the context and dependencies the router needs
   
3. **Mocking Dependencies**:
   - Use the `beforeAll`/`afterAll` hooks for setting up and tearing down test state
   - For modules that need env vars, set them in the test or use `.env.test`
   - Remember that `vi.mock()` doesn't work like a regular function - it's a special directive that needs to be at the top level

4. **Example: Testing a tRPC Router with Environment Variables**:

```ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { router } from './myRouter';
import type { TrpcContext } from '../base';

// Store original env
const originalEnv = process.env;

describe('My Router', () => {
  beforeAll(() => {
    // Set up test environment
    process.env = {
      ...process.env,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    };
  });
  
  afterAll(() => {
    // Restore environment
    process.env = originalEnv;
  });
  
  it('should handle the query correctly', async () => {
    // Create a caller with a mock context
    const mockContext = {} as TrpcContext; // Use type assertion for simple tests
    const caller = router.createCaller(mockContext);
    
    // Call the procedure and check the result
    const result = await caller.myProcedure({ input: 'test' });
    expect(result).toEqual({ success: true });
  });
});
```

#### Using npm/bun scripts

The easiest way to run GitHub Actions tests is through the provided npm/bun scripts:

```bash
# From the repository root:

# Run GitHub Actions tests locally
bun test:actions

# Run GitHub Actions tests locally for backend only
bun test:actions:backend

# Dry run to see what would happen without executing
bun test:actions:dry

# Trigger remote GitHub Actions workflow
bun test:actions:remote

# Trigger remote GitHub Actions workflow for backend only
bun test:actions:remote:backend

# From the apps/backend directory:

# Run GitHub Actions tests locally for backend
bun test:actions

# Dry run to see what would happen without executing
bun test:actions:dry

# Trigger remote GitHub Actions workflow for backend
bun test:actions:remote
```

##### Act Troubleshooting