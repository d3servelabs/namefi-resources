# ADR: x402 Payment Middleware Integration Options

- **Status:** Accepted
- **Date:** 2024-12-24
- **Decision Makers:** Backend Team

## Context

We are integrating the x402 protocol for paid resources in the Namefi platform. The `@x402/hono` library provides a `paymentMiddleware` that handles payment verification and settlement automatically.

However, some endpoints require access to transaction details (`txHash`, `chainId`) within the route handler to:
- Generate JWT access tokens with payment proof
- Trigger Temporal workflows with settlement data
- Include transaction details in the response body

This ADR documents the two approaches for handling x402 payments and when to use each.

## Decision Drivers

1. Analytics endpoint needs `txHash`/`chainId` for JWT token generation
2. Domain purchase endpoint needs settlement data for Temporal workflow signals
3. Response body must include payment proof for client verification
4. Want to minimize code duplication where possible
5. Need to maintain compatibility with x402 protocol conventions

## Options Considered

### Option A: Full `paymentMiddleware` Integration

The `@x402/hono` middleware handles the complete payment flow automatically.

#### How It Works

```
Request with PAYMENT-SIGNATURE header
        │
        ▼
paymentMiddleware
        │
        ├─ no payment header ──► Return 402 with paywall HTML
        │
        ├─ payment-error ──► Return error response
        │
        └─ payment-verified:
                │
                ▼
           await next()
                │
                ▼
           Route Handler executes
                │
                ▼
           Response created
                │
                ▼
           processSettlement()
                │
                ▼
           Set PAYMENT-RESPONSE header on response
                │
                ▼
           Return Response
```

**Key Insight:** Settlement happens AFTER `await next()` returns. The route handler has already executed and returned a response before `processSettlement()` is called. The `txHash` is only available in the `PAYMENT-RESPONSE` response header.

#### Middleware Source (simplified)

```typescript
// From @x402/hono
case "payment-verified":
  const { paymentPayload, paymentRequirements } = result;
  await next();  // <-- Route handler runs here
  let res = c.res;
  // ... error checking ...
  const settleResult = await httpServer.processSettlement(
    paymentPayload,
    paymentRequirements
  );
  // Settlement data only available here, AFTER handler returned
  Object.entries(settleResult.headers).forEach(([key, value]) => {
    res.headers.set(key, value);  // Sets PAYMENT-RESPONSE header
  });
```

#### Pros

- Clean integration with x402 ecosystem
- Automatic 402 paywall generation with custom HTML
- Less manual verification/settlement code
- Follows x402 protocol conventions
- Single point of payment logic

#### Cons

- Cannot access `txHash`/`chainId` in route handler
- Cannot include settlement data in response body
- Cannot generate JWT tokens with payment proof
- Limited control over settlement timing
- Cannot conditionally settle (e.g., after workflow success)

#### When to Use

- Simple paywalled resources where response header is sufficient
- Resources that don't need transaction proof in response body
- Endpoints where the client only needs the resource data

---

### Option B: Manual Verification/Settlement

Handle payment verification and settlement explicitly in the route handler.

#### How It Works

```
Request
        │
        ▼
Access Token Middleware (optional)
        │
        ├─ valid token ──► Set bypassPayment=true, continue
        │
        ▼
Route Handler
        │
        ├─ bypassPayment=true ──► Serve resource directly
        │
        ├─ has PAYMENT-SIGNATURE header:
        │       │
        │       ▼
        │   decodePaymentSignatureHeader()
        │       │
        │       ▼
        │   x402ResourceServer.verifyPayment()
        │       │
        │       ▼
        │   x402ResourceServer.settlePayment()
        │       │
        │       ▼
        │   Extract txHash, chainId from settleResult
        │       │
        │       ▼
        │   Generate JWT with payment proof
        │       │
        │       ▼
        │   Return response with txHash, accessToken
        │
        └─ no payment header ──► Return 402 (use paymentMiddleware for paywall only)
```

#### Pros

- Full control over settlement timing
- Access to `txHash`/`chainId` before returning response
- Can include payment proof in response body
- Can generate JWT tokens with transaction details
- Can trigger workflows with settlement data
- Can conditionally settle based on business logic

#### Cons

- More manual code in each endpoint
- Must handle 402 response generation separately
- Duplicates some middleware verification logic
- Must maintain verification/settlement code
- More error handling responsibility

#### When to Use

- Endpoints needing `txHash`/`chainId` in response body
- JWT access token generation with payment proof
- Workflow integration requiring settlement data
- Conditional settlement after business logic validation

---

## Decision

Use a **hybrid approach**:

1. **Use Option B (Manual)** for endpoints requiring transaction details:
   - `x402-analytics.ts` - Needs `txHash`/`chainId` for JWT tokens
   - `x402.ts` (domain purchases) - Needs settlement data for Temporal workflow signals

2. **Use `paymentMiddleware` only for 402 paywall generation** in both cases:
   - When no payment header is present, delegate to middleware for HTML paywall
   - This reuses the paywall template system without duplicating HTML generation

### Implementation Pattern

```typescript
// Route handler structure for Option B with hybrid 402 handling

x402Router.get('/resource/:id', async (c) => {
  // 1. Check for access token (optional)
  const accessToken = c.get('accessTokenPayload');
  if (accessToken) {
    return handleAccessTokenRequest(c, ...);
  }

  // 2. Check for payment signature
  const paymentSignature = getPaymentSignatureHeader(c);
  if (paymentSignature) {
    return handlePaidRequest(c, ...);  // Manual verify + settle
  }

  // 3. No payment - use middleware ONLY for 402 paywall
  return handlePaymentRequired(c, ...);  // Delegates to paymentMiddleware
});

async function handlePaymentRequired(c, ...) {
  // Use paymentMiddleware just for generating 402 response
  return paymentMiddleware(routeConfig, server, config, paywall)(c, async () => {
    // Fallback if middleware calls next()
    return c.json({ status: 402, message: 'Payment Required' });
  });
}
```

## Comparison Table

| Aspect | Option A (Full Middleware) | Option B (Manual) |
|--------|---------------------------|-------------------|
| Settlement timing | After handler returns | Within handler |
| `txHash` availability | Response header only | Available in handler |
| Response body | Cannot include tx details | Full control |
| JWT generation | Cannot include tx proof | Can include tx proof |
| Workflow integration | Post-handler only | Full control |
| Code complexity | Lower | Higher |
| 402 paywall | Automatic | Use middleware for this only |
| Error handling | Automatic | Manual |

## Implementation References

### Option B - Analytics Router

**File:** `apps/backend/src/routers/x402-analytics.ts`

Key sections:
- **Lines 216-275:** Access token middleware (sets `bypassPayment` context)
- **Lines 292-342:** Route handler dispatches to appropriate handler
- **Lines 389-529:** `handlePaidRequest()` with manual verify/settle
- **Lines 534-574:** `handlePaymentRequired()` uses middleware for 402 only

```typescript
// Manual settlement in handlePaidRequest (lines 436-466)
const settleRes = await x402ResourceServer.settlePayment(
  paymentPayload,
  paymentRequirement,
);

const txHash = settleRes.transaction;
const chainId = parseChainIdFromNetwork(settleRes.network);

// Generate JWT with payment proof
const accessToken = await generateAccessToken({
  resourceType: 'analytics',
  resourceId: domainName,
  txHash,      // <-- Available because we settled manually
  chainId,     // <-- Available because we settled manually
  ...
});

return c.json({
  txHash,       // <-- Included in response body
  accessToken,  // <-- JWT contains tx proof
  report,
});
```

### Option B - Domain Purchase Router

**File:** `apps/backend/src/routers/x402.ts`

Key sections:
- **Lines 125-165:** Route handler checks for payment header
- **Lines 274-454:** `handlePaidRequest()` with workflow integration
- **Lines 170-269:** `handlePaymentRequired()` uses middleware for 402

```typescript
// Settlement + workflow signal (lines 410-428)
const settledPayment = await x402ResourceServer.settlePayment(
  paymentPayload,
  paymentRequirement,
);

// Signal workflow with settlement data
await workflow.signal(settlementSignal, {
  settledAt: new Date().toISOString(),
  settlementTxHash: settledPayment.transaction,  // <-- tx data for workflow
});
```

## Consequences

### Positive

- Analytics endpoint can include `txHash`/`chainId` in JWT tokens for payment proof
- Domain purchase can signal Temporal workflow with settlement transaction hash
- Clear, documented pattern for future endpoints needing transaction proof
- Paywall HTML generation is still handled by the shared paywall module

### Negative

- Manual verification/settlement code in each router that needs tx details
- Must keep up with `@x402/hono` library changes manually for verify/settle logic
- Slightly more complex error handling in manual flow

### Neutral

- Both routers still use paywall templates for 402 HTML generation
- Pattern is documented for future developers
- Consistent approach across all x402 endpoints

## Future Considerations

1. **Middleware Enhancement:** If `@x402/hono` adds a callback/hook for accessing settlement data before response, we could migrate to Option A.

2. **Shared Helper:** Consider extracting common verify/settle logic into a shared utility function to reduce duplication.

3. **Response Header Parsing:** For simple cases, clients could parse `PAYMENT-RESPONSE` header client-side, but this adds complexity and isn't suitable for JWT generation.

## Related Documentation

- [x402 Paywall Architecture](../../x402-paywall-architecture.md) - Module structure and usage
- [x402 Protocol](https://x402.org) - Official protocol documentation
- [@x402/hono](https://github.com/x402/x402) - Hono middleware package
