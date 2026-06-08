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

### Debugging Temporal Workflow Bundling

The Temporal worker bundles every `*.workflow.ts` together. A single bad import
(Node built-in, non-webpack-safe package, dynamic `require`, circular dep) fails
the whole bundle without naming the culprit. `test:workflows` bundles each
workflow **in isolation** (one `bun` subprocess each) and reports which fail,
surfacing the `Module not found` lines that point at the offending import.

```bash
# Bundle every workflow individually (exits non-zero if any fail — CI-friendly)
bun run test:workflows

# Narrow to suspects (comma-separated, matches the filename)
bun run test:workflows --filter mint,charge

# Tune parallelism / per-workflow timeout, or emit machine-readable JSON
bun run test:workflows --concurrency 4 --timeout 90000 --json
```

Full per-failure logs are written to `apps/backend/workflow-bundle-logs/`
(git-ignored). To run it against a specific PR or branch in CI, trigger the
**Debug Temporal Workflows** workflow:

```bash
gh workflow run debug-temporal-workflows.yml -f pr_number=1234
gh workflow run debug-temporal-workflows.yml -f branch=my-feature-branch -f filter=mint
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

## USING SIGNERS Locally

We are using `viem` for blockchain interactions. There are two ways to configure signers:

### 1. Using Local Private Key (Development)

For local development, you can use a private key signer:

```bash
# In your .env file
LOCAL_SIGNER_PRIVATE_KEY=your_private_key_here
```

The private key should be a hex string starting with `0x`.

### 2. Using Google Cloud HSM (Production)

For production environments, we use Google Cloud HSM for secure key management:

```bash
# In your .env file
GCP_HSM_KEYRING_RESOURCE_NAME=your_hsm_key_version_resource_name
# it should match this format 
# `projects/([^/]{1,100})/locations/([a-zA-Z0-9_-]{1,63})/keyRings/([a-zA-Z0-9_-]{1,63})/cryptoKeys/([a-zA-Z0-9_-]{1,63})/cryptoKeyVersions/([a-zA-Z0-9_-]{1,63})`
```

#### Google Cloud Authentication

To use GCP HSM, you need to authenticate with Google Cloud. There are three ways:
1. **Automatically injected in GCP containers**
2. **Using Google Cloud CLI**:
   ```bash
   # Login to Google Cloud
   gcloud auth application-default login
   ```

3. **Using Service Account Key**:
   - Place your service account key JSON file in `apps/backend/.cred/*.json`
   - Set the environment variable:
     ```bash
     GOOGLE_APPS_CREDENTIALS=apps/backend/.cred/your-service-account.json
     ```

### Signer Configuration

The system will automatically choose the appropriate signer based on your environment variables:

1. If `GCP_HSM_KEYRING_RESOURCE_NAME` is set, it will use Google Cloud HSM
2. If `LOCAL_SIGNER_PRIVATE_KEY` is set, it will use the local private key
3. If neither is set, the application will throw an error

### Usage in Code

The signer is automatically configured and available for use in your code. For example:

```typescript
// The signer is automatically configured and available
const signerAccount = secrets.GCP_HSM_KEYRING_RESOURCE_NAME
  ? await gcpHsmToAccount({
      hsmKeyVersion: secrets.GCP_HSM_KEYRING_RESOURCE_NAME,
    })
  : secrets.LOCAL_SIGNER_PRIVATE_KEY
    ? privateKeyToAccount(process.env.LOCAL_SIGNER as `0x${string}`, {
        nonceManager,
      })
    : null;
```

### Security Best Practices

1. Never commit private keys or service account credentials to version control
2. Use environment variables or secure secret management systems
3. In production, always use HSM for key management
4. Keep your service account keys secure and rotate them regularly
5. Use the minimum required permissions for your service accounts