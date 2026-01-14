# AuthRegistry Guide

## Overview

The `AuthRegistry` provides a pluggable authentication system for API keys. It allows multiple authentication methods (PLAIN, PUBLIC_PRIVATE, HMAC) to coexist and be tried in a predictable order.

## Architecture

### Key Concepts

**AuthRequestContext**: Contains all information needed to authenticate a request
```typescript
interface AuthRequestContext {
  headers: Record<string, string | undefined>;  // Normalized headers (lowercase keys)
  rawBody: string;                              // Request body
  path: string;                                 // Request path
  method: string;                                // HTTP method (GET, POST, etc.)
  clientIp: string | null;                       // Client IP address
  origin: string | null;                         // Origin header value
}
```

**AuthMethod**: Defines an authentication strategy
```typescript
interface AuthMethod {
  id: string;                                    // Unique identifier (e.g., 'hmac', 'plain')
  keyType: ApiKeyType;                           // Database key type for logging
  shouldHandle: (ctx: AuthRequestContext) => boolean;  // Predicate to check if this method applies
  authenticate: (ctx: AuthRequestContext) => Promise<AuthMethodResult>;  // Authentication logic
}
```

**AuthMethodResult**: Result of authentication attempt
```typescript
interface AuthMethodResult {
  success: boolean;       // Whether authentication succeeded
  user?: UserSelect;     // Authenticated user (if successful)
  apiKeyId?: string;      // The API key ID used
  error?: string;         // Error message (if failed)
}
```

## How Authentication Works

1. Request arrives with headers
2. `AuthRequestContext` is built from request data
3. Registry loops through registered auth methods in order
4. First method where `shouldHandle()` returns true is used
5. That method's `authenticate()` function is called
6. Result is returned (success/failure)

**Registration order matters**: More specific methods should be registered first.

## Using the AuthRegistry

### Basic Usage

```typescript
import { authenticateRequest, createAuthContext } from '#lib/auth/api-key-auth';

// Create context from request
const ctx = createAuthContext(
  request.headers,
  request.rawBody,
  request.path,
  request.method,
  request.clientIp,
);

// Authenticate - tries all registered methods
const result = await authenticateRequest(ctx);

if (result.success) {
  // result.user contains authenticated user
  // result.apiKeyId contains the API key ID used
} else {
  // result.error contains failure reason
}
```

### Initializing the Registry

The registry must be initialized with all auth methods at application startup:

```typescript
import { initializeAuthRegistry } from '#lib/auth/api-key-auth';

// Call once during app initialization
initializeAuthRegistry();
```

This registers three built-in methods in order:
1. **HMAC** (`hmacAuthMethod`) - Most specific, checks for `X-Namefi-Key-Id` header
2. **PUBLIC_PRIVATE** (`asymmetricAuthMethod`) - Checks for `X-Namefi-Access-Key` header
3. **PLAIN** (`plainAuthMethod`) - Most general, checks for `X-API-Key` header

## Adding a New Auth Method

### Step 1: Create Auth Implementation

Create a new file for your auth method:

```typescript
// api-key-custom.ts
import { db, apiKeysTable, usersTable } from '@namefi-astra/db';
import { eq, and, isNull, or, gt } from 'drizzle-orm';
import type { AuthMethod, AuthRequestContext, AuthMethodResult } from './auth-registry';
import { logger } from '#lib/logger';

// Define your headers
const CUSTOM_HEADERS = {
  KEY: 'x-custom-key',
  SIGNATURE: 'x-custom-signature',
} as const;

// Predicate to check if this method should handle request
export function isCustomAuthRequest(ctx: AuthRequestContext): boolean {
  const key = ctx.headers[CUSTOM_HEADERS.KEY];
  return !!key && key.startsWith('custom_');
}

// Authentication function
async function authenticateWithCustomKey(
  ctx: AuthRequestContext,
): Promise<AuthMethodResult> {
  try {
    const key = ctx.headers[CUSTOM_HEADERS.KEY];
    const signature = ctx.headers[CUSTOM_HEADERS.SIGNATURE];

    if (!key || !signature) {
      return { success: false, error: 'Missing required headers' };
    }

    // Lookup key in database
    const [apiKeyRecord] = await db
      .select()
      .from(apiKeysTable)
      .innerJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
      .where(
        and(
          eq(apiKeysTable.keyPrefix, key),
          eq(apiKeysTable.type, 'CUSTOM'),  // Your key type
          isNull(apiKeysTable.revokedAt),
        ),
      )
      .limit(1);

    if (!apiKeyRecord) {
      return { success: false, error: 'API key not found' };
    }

    // Verify signature
    const isValid = verifyCustomSignature(key, signature, ctx.rawBody);
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    // Update last used timestamp (fire and forget)
    updateApiKeyLastUsed(apiKeyRecord.id).catch((err) => {
      logger.error({ err, apiKeyId: apiKeyRecord.id }, 'Failed to update last used');
    });

    return {
      success: true,
      user: apiKeyRecord.user,
      apiKeyId: apiKeyRecord.id,
    };
  } catch (error) {
    logger.error({ error }, 'Error in custom auth');
    return { success: false, error: 'Authentication failed' };
  }
}

// Export the AuthMethod
export const customAuthMethod: AuthMethod = {
  id: 'custom',
  keyType: 'CUSTOM',
  shouldHandle: isCustomAuthRequest,
  authenticate: authenticateWithCustomKey,
};
```

### Step 2: Add Key Type to Schema

Update `packages/db/src/schema.ts`:

```typescript
// Add to enum
export const apiKeyTypeEnum = pgEnum('api_key_type', [
  'PLAIN',
  'PUBLIC_PRIVATE',
  'HMAC',
  'CUSTOM',  // Your new type
]);

// Update constraint in apiKeysTable definition
check(
  'api_keys_type_fields_check',
  sql`(${table.type} = 'CUSTOM' AND ${table.customField} IS NOT NULL ...)
      OR (...)`,
),
```

### Step 3: Generate Migration

```bash
cd packages/db
bun run db:generate
```

### Step 4: Register Your Auth Method

In `apps/backend/src/lib/auth/api-key-auth.ts`, import and register:

```typescript
import { customAuthMethod } from './api-key-custom';

export function initializeAuthRegistry(): void {
  // Register most specific methods first
  registerAuthMethod(hmacAuthMethod);
  registerAuthMethod(asymmetricAuthMethod);
  registerAuthMethod(plainAuthMethod);
  registerAuthMethod(customAuthMethod);  // Add yours here

  logger.info('API key authentication registry initialized');
}
```

## Migration Guide

### From Direct API Calls to Registry

**Old Pattern:**
```typescript
// Direct method calls
const apiKey = req.headers.get('x-api-key');
const result = await authenticateWithPlainApiKey(
  apiKey,
  clientIp,
  origin,
);
```

**New Pattern:**
```typescript
// Registry-based
const ctx = createAuthContext(
  req.headers,
  rawBody,
  req.path,
  req.method,
  clientIp,
);
const result = await authenticateRequest(ctx);
```

### Updating Existing Code

When migrating code that uses direct auth calls:

1. Identify where `authenticateWithPlainApiKey()` or similar functions are called
2. Build `AuthRequestContext` from available data
3. Replace with `authenticateRequest(ctx)`
4. Update result handling (same interface, just different access path)

Example migration:
```typescript
// Before
const apiKey = req.headers.get('x-api-key');
const result = await authenticateWithPlainApiKey(
  apiKey,
  clientIp,
  origin,
);
if (result.success) {
  ctx.user = result.user;
}

// After
const ctx = createAuthContext(req.headers, rawBody, req.path, req.method, clientIp);
const result = await authenticateRequest(ctx);
if (result.success) {
  ctx.user = result.user;
}
```

## Best Practices

### 1. Header Selection

Use specific, unique headers for your auth method to avoid conflicts:

- **HMAC**: `X-Namefi-Key-Id`, `X-Namefi-Timestamp`, `X-Namefi-Signature`
- **PUBLIC_PRIVATE**: `X-Namefi-Access-Key`, `X-Namefi-Timestamp`, `X-Namefi-Signature`
- **PLAIN**: `X-API-Key`

Your method should use headers that are:
- Namespaced (e.g., `X-YourApp-Header`)
- Unlikely to conflict with others
- Well-documented

### 2. Predicate Specificity

Make `shouldHandle()` as specific as possible:

```typescript
// Good - Specific
export function isHmacAuthRequest(ctx: AuthRequestContext): boolean {
  const keyId = ctx.headers['x-namefi-key-id'];
  return !!keyId && keyId.startsWith('nfhk_');
}

// Avoid - Too general
export function isHmacAuthRequest(ctx: AuthRequestContext): boolean {
  return !!ctx.headers['x-namefi-key-id'];
}
```

### 3. Error Handling

Return meaningful error messages:

```typescript
return {
  success: false,
  error: 'Specific error message for debugging',
};
```

Log errors appropriately:

```typescript
logger.error({ error, context }, 'Specific error location');
```

### 4. Side Effects

Update `lastUsedAt` timestamp (fire and forget):

```typescript
updateApiKeyLastUsed(apiKeyId).catch((err) => {
  logger.error({ err, apiKeyId }, 'Failed to update last used');
});
```

Don't let side effects block authentication.

### 5. Registration Order

Register methods from most specific to most general:

```typescript
// Order matters!
registerAuthMethod(hmacAuthMethod);         // Checks specific header + prefix
registerAuthMethod(asymmetricAuthMethod);   // Checks specific header + format
registerAuthMethod(plainAuthMethod);        // Most general, checks generic header
```

## Testing

### Unit Testing Auth Methods

```typescript
import { describe, it, expect } from 'bun:test';
import { isHmacAuthRequest, authenticateWithHmacKey } from '#lib/auth/api-key-auth-hmac';
import type { AuthRequestContext } from '#lib/auth/auth-registry';

describe('HMAC Auth', () => {
  it('should identify HMAC requests', () => {
    const ctx: AuthRequestContext = {
      headers: { 'x-namefi-key-id': 'nfhk_test123' },
      rawBody: '',
      path: '/api/test',
      method: 'GET',
      clientIp: '127.0.0.1',
      origin: 'https://example.com',
    };

    expect(isHmacAuthRequest(ctx)).toBe(true);
  });

  it('should authenticate with valid signature', async () => {
    // Setup test data
    // Call authenticateWithHmacKey
    // Verify success
  });
});
```

### Integration Testing

```typescript
// Test with registry
import { authenticateRequest } from '#lib/auth/api-key-auth';
import { clearRegisteredMethods, registerAuthMethod } from '#lib/auth/auth-registry';

// Clear and register your test method
clearRegisteredMethods();
registerAuthMethod(yourTestAuthMethod);

// Test request
const result = await authenticateRequest(ctx);
expect(result.success).toBe(true);
```

## Troubleshooting

### My auth method isn't being called

1. Check `shouldHandle()` predicate is returning true for your requests
2. Verify your method is registered (`getRegisteredMethods()`)
3. Check registration order - earlier methods may be matching first

### Registry loops through all methods

1. Methods returning `{ success: false }` but not throwing errors
2. Multiple methods have overlapping `shouldHandle()` predicates
3. Fix predicate specificity

### Database queries failing

1. Verify `apiKeyTypeEnum` includes your key type
2. Check table constraint allows your field configuration
3. Run migrations: `cd packages/db && bun run db:migrate`

## Example: Simple API Key Authentication

For a simple API key without signatures:

```typescript
export function isSimpleAuthRequest(ctx: AuthRequestContext): boolean {
  const apiKey = ctx.headers['x-simple-api-key'];
  return !!apiKey && apiKey.startsWith('simple_');
}

async function authenticateWithSimpleKey(
  ctx: AuthRequestContext,
): Promise<AuthMethodResult> {
  const apiKey = ctx.headers['x-simple-api-key'];

  // Lookup by exact match (simpler than prefix)
  const [apiKeyRecord] = await db
    .select()
    .from(apiKeysTable)
    .innerJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
    .where(
      and(
        eq(apiKeysTable.simpleApiKey, apiKey),
        eq(apiKeysTable.type, 'SIMPLE'),
        isNull(apiKeysTable.revokedAt),
      ),
    )
    .limit(1);

  if (!apiKeyRecord) {
    return { success: false, error: 'Invalid API key' };
  }

  updateApiKeyLastUsed(apiKeyRecord.id).catch(/* ... */);

  return {
    success: true,
    user: apiKeyRecord.user,
    apiKeyId: apiKeyRecord.id,
  };
}

export const simpleAuthMethod: AuthMethod = {
  id: 'simple',
  keyType: 'SIMPLE',
  shouldHandle: isSimpleAuthRequest,
  authenticate: authenticateWithSimpleKey,
};
```

## Summary

- AuthRegistry provides a pluggable, ordered authentication system
- Each auth method defines `shouldHandle()` predicate and `authenticate()` function
- Methods are tried in registration order - first match wins
- Context-based approach unifies all auth methods under one interface
- Add new methods by creating auth file, updating schema, registering in `initializeAuthRegistry()`
