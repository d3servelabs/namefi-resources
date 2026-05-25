# x402 Paywall Module Architecture

This document describes the x402 paywall module structure, components, and usage patterns.

## Overview

The x402 protocol implements HTTP 402 Payment Required for monetizing web resources with USDC stablecoin payments. The paywall module provides customizable payment UI components that integrate with the `@x402/paywall` library.

**Module Location:** `apps/backend/src/lib/x402/`

## Module Structure

```
apps/backend/src/lib/x402/
├── index.ts                    # Main exports
├── jwt-access.ts               # JWT access token utilities
├── domain/
│   ├── namefi-paywall.ts       # Domain registration handler
│   └── paywall-template.ts     # Domain-specific HTML template
├── generic/
│   ├── generic-paywall.ts      # Brand-agnostic handler
│   └── paywall-template.ts     # Generic HTML template
└── shared/
    ├── types.ts                # TypeScript interfaces
    ├── constants.ts            # Theme, branding, chain configs
    ├── html-builder.ts         # HTML page assembly
    ├── styles.ts               # Tailwind/CSS utilities
    ├── scripts.ts              # Wallet connection JavaScript
    └── viem-loader.ts          # Viem library loader
```

## Two Paywall Variants

The module provides two paywall handlers that implement the `PaywallNetworkHandler` interface:

| Feature | `namefiEvmPaywall` | `genericEvmPaywall` |
|---------|-------------------|---------------------|
| Use Case | Domain registration | Any resource (analytics, APIs, etc.) |
| Template | Domain-focused with duration display | Resource description based |
| Pricing | Standard USD amounts | Handles sub-cent amounts (e.g., 0.0025 USDC) |
| Success State | Redirects to purchase status page | Shows JSON response viewer with copy/download |
| Access Tokens | Not included | Displays JWT access token for re-access |

### namefiEvmPaywall

Domain-specific paywall for Namefi domain registration. Parses domain name and duration from the resource description.

```typescript
import { createPaywall } from '@x402/paywall';
import { namefiEvmPaywall } from '../lib/x402';

const paywall = createPaywall()
  .withNetwork(namefiEvmPaywall)
  .withConfig({
    appName: 'Namefi',
    testnet: config.X402_NETWORK === 'eip155:84532',
    appLogo: 'https://namefi.io/logotype.svg',
  })
  .build();
```

**Used by:** `apps/backend/src/routers/x402.ts` (domain purchases)

### genericEvmPaywall

Brand-agnostic paywall for any x402 resource type. Defaults to Namefi branding but supports full customization.

```typescript
import { createPaywall } from '@x402/paywall';
import { genericEvmPaywall } from '../lib/x402';

const paywall = createPaywall()
  .withNetwork(genericEvmPaywall)
  .withConfig({
    appName: 'Namefi',
    testnet: config.X402_NETWORK === 'eip155:84532',
    appLogo: 'https://namefi.io/logotype.svg',
  })
  .build();
```

**Used by:** `apps/backend/src/routers/x402-analytics.ts` (DNS analytics reports)

## Shared Components

### Types (`shared/types.ts`)

#### ThemeConfig

UI color and styling configuration:

```typescript
interface ThemeConfig {
  background: string;      // Page background
  card: string;            // Card background
  foreground: string;      // Primary text color
  muted: string;           // Secondary text color
  brandPrimary: string;    // Primary button color
  brandPrimaryHover: string;
  destructive: string;     // Error state color
  border: string;          // Border color
  borderRadius?: string;   // Border radius (default: 0.65rem)
}
```

#### BrandingConfig

Application branding:

```typescript
interface BrandingConfig {
  appName: string;   // Displayed in title and UI
  appLogo: string;   // Logo URL (displayed at top of paywall)
}
```

#### ChainConfig

EVM network configuration:

```typescript
interface ChainConfig {
  chainId: number;       // e.g., 84532 for Base Sepolia
  name: string;          // e.g., "Base Sepolia"
  usdcAddress: string;   // USDC contract address
  rpcUrl: string;        // JSON-RPC endpoint
  blockExplorer: string; // Block explorer URL
}
```

#### PaywallNetworkHandler

Interface that paywall handlers must implement:

```typescript
interface PaywallNetworkHandler {
  supports(requirement: PaymentRequirement): boolean;
  generateHtml(
    requirement: PaymentRequirement,
    paymentRequired: PaymentRequiredResponse,
    config: PaywallHandlerConfig,
  ): string;
}
```

### Constants (`shared/constants.ts`)

#### NAMEFI_THEME

Default dark theme:

```typescript
const NAMEFI_THEME: ThemeConfig = {
  background: '#1a1a1a',
  card: '#2a2a2a',
  foreground: '#fafafa',
  muted: '#a3a3a3',
  brandPrimary: '#22c55e',
  brandPrimaryHover: '#16a34a',
  destructive: '#ef4444',
  border: 'rgba(255,255,255,0.1)',
  borderRadius: '0.65rem',
};
```

#### NAMEFI_BRANDING

Default branding:

```typescript
const NAMEFI_BRANDING: BrandingConfig = {
  appName: 'Namefi',
  appLogo: 'https://namefi.io/logotype.svg',
};
```

#### CHAIN_CONFIG

Supported EVM networks:

```typescript
const CHAIN_CONFIG: Record<string, ChainConfig> = {
  'eip155:8453': {
    chainId: 8453,
    name: 'Base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  'eip155:84532': {
    chainId: 84532,
    name: 'Base Sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
  },
};
```

### HTML Builder (`shared/html-builder.ts`)

The `buildPaywallHtml()` function assembles complete paywall pages from modular components.

#### HtmlBuilderOptions

```typescript
interface HtmlBuilderOptions {
  title: string;                    // Page title
  theme?: ThemeConfig;              // UI theme
  branding?: BrandingConfig;        // App branding
  walletConnectProjectId?: string;  // Optional WalletConnect
  configJson: string;               // JSON config for frontend
  headerHtml: string;               // Header section HTML
  priceDisplayHtml: string;         // Price display HTML
  successContentHtml: string;       // Success state HTML
  onSuccessScript: string;          // JS to run on success
  amount: number;                   // Amount in USDC
  formattedAmount?: string;         // Formatted for display
  additionalScripts?: string;       // Extra JS functions
}
```

## HTML Generation Flow

```
PaywallHandler.generateHtml()
        │
        ▼
paywall-template.ts (domain or generic)
        │
        ▼
buildPaywallHtml() ─────────────────┐
        │                           │
        ▼                           ▼
┌─────────────┐              ┌─────────────┐
│ styles.ts   │              │ scripts.ts  │
│ - Tailwind  │              │ - Wallet    │
│ - Base CSS  │              │ - Payment   │
└─────────────┘              │ - State     │
                             └─────────────┘
```

### Wallet UI States

The paywall HTML contains five state containers that are shown/hidden based on payment progress:

| State | Element ID | Description |
|-------|------------|-------------|
| Connect | `state-connect` | Initial state with wallet connection buttons |
| Connected | `state-connected` | Wallet connected, shows Pay button |
| Processing | `state-processing` | Spinner, waiting for wallet confirmation |
| Success | `state-success` | Checkmark, optional JSON viewer or redirect |
| Error | `state-error` | Error message with retry button |

### Scripts (`shared/scripts.ts`)

The scripts module provides wallet connection and payment signing functionality:

- `getDebugLoggingScript()` - Console logging helpers
- `getViemHelpersScript()` - Viem library initialization
- `getWalletStateScript()` - State management and UI transitions
- `getConnectMetaMaskScript()` - MetaMask/injected wallet connection
- `getConnectWalletConnectScript()` - WalletConnect modal integration
- `getSignPaymentScript()` - EIP-3009 payment signing
- `getDOMContentLoadedScript()` - Initialization on page load

## WalletConnect Integration

WalletConnect support is optional and enabled via the `X402_WALLETCONNECT_PROJECT_ID` environment variable.

When enabled:
- A "WalletConnect" button appears below the MetaMask button
- Uses `@walletconnect/modal` UMD bundle loaded from CDN
- Supports mobile wallet scanning via QR code

Configuration:

```bash
# In .env
X402_WALLETCONNECT_PROJECT_ID=your-project-id
```

The project ID is obtained from [WalletConnect Cloud](https://cloud.walletconnect.com/).

## JWT Access Token System

The JWT access token system allows users to re-access paid resources without repaying.

### Token Payload

```typescript
interface X402AccessTokenPayload {
  resourceType: string;           // e.g., 'analytics'
  resourceId: string;             // e.g., domain name
  query: Record<string, string>;  // Query params that were paid for
  paidAt: string;                 // ISO timestamp of payment
  buyerWallet: string;            // Wallet address that paid
  txHash?: string;                // Settlement transaction hash
  chainId?: number;               // Chain where payment occurred
}
```

### Standard JWT Claims

Tokens include standard JWT claims:
- `iss` (Issuer): `"namefi-x402"`
- `iat` (Issued At): Unix timestamp when token was created
- `exp` (Expiration): Unix timestamp when token expires (default: 30 days)

### Functions

#### generateAccessToken

Create a new access token after successful payment:

```typescript
import { generateAccessToken } from '../lib/x402';

const token = await generateAccessToken({
  resourceType: 'analytics',
  resourceId: 'example.com',
  query: { startDate: '7daysAgo', endDate: 'today' },
  paidAt: new Date().toISOString(),
  buyerWallet: '0x1234...',
  txHash: settleResult.transaction,
  chainId: 84532,
}, 30); // 30 days expiration (default)
```

#### verifyAccessToken

Validate and decode a token:

```typescript
import { verifyAccessToken } from '../lib/x402';

const result = await verifyAccessToken(token);

if (result.valid) {
  console.log('Payload:', result.payload);
  console.log('Expires:', result.expiresAt);
} else {
  console.log('Error:', result.error);
  // Possible errors: 'Token expired', 'Invalid token format', 
  // 'Invalid token signature', 'Invalid token type'
}
```

#### tokenMatchesResource

Check if a token matches the requested resource:

```typescript
import { tokenMatchesResource } from '../lib/x402';

const matches = tokenMatchesResource(
  result.payload,
  'analytics',           // expected resourceType
  'example.com',         // expected resourceId
  { startDate: '7daysAgo', endDate: 'today' }  // optional query match
);

if (matches) {
  // Token is valid for this exact resource request
}
```

### Configuration

The JWT secret is configured via environment variables:

```bash
# Primary (recommended)
X402_JWT_SECRET=your-secret-key

# Fallback
API_AUTH_KEY=your-api-key
```

## Redirect Options

The generic paywall supports flexible redirect behavior after successful payment.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `successRedirectUrl` | `string` | `undefined` | URL to redirect to after payment |
| `successRedirectDelaySeconds` | `number` | `3` | Countdown delay before auto-redirect |
| `autoSuccessRedirect` | `boolean` | `true` | If true, auto-redirect after delay. If false, show button |
| `successRedirectBtnLabel` | `string` | `"Redirect Now"` | Button label when auto-redirect is disabled |

### RedirectOptions Interface

```typescript
interface RedirectOptions {
  successRedirectUrl?: string;
  successRedirectDelaySeconds?: number;
  autoSuccessRedirect?: boolean;
  successRedirectBtnLabel?: string;
}
```

### Static Configuration

#### Auto-Redirect (Default Behavior)

```typescript
// Auto-redirect after 5 seconds
const config = {
  successRedirectUrl: '/dashboard',
  successRedirectDelaySeconds: 5,
  // autoSuccessRedirect defaults to true
};
```

#### Button Mode

```typescript
// Show button instead of auto-redirect
const config = {
  successRedirectUrl: '/dashboard',
  autoSuccessRedirect: false,
  successRedirectBtnLabel: 'Go to Dashboard',
};
```

### Dynamic Redirect via Response Header

For redirects that depend on request/response data (e.g., order ID, transaction hash), set the `X-PAYWALL-REDIRECT-OPTIONS` header in your payment success response.

**Header Format:** Base64-encoded JSON

```
X-PAYWALL-REDIRECT-OPTIONS: base64(JSON.stringify(options))
```

**Precedence:** Header options completely override static config when present.

**Error Handling:** If the header contains invalid JSON/base64, the paywall logs an error to console and falls back to static config.

#### Backend Example

```typescript
import { PAYWALL_REDIRECT_OPTIONS_HEADER } from '../lib/x402';

// In route handler after successful payment
async function handlePaidRequest(c, ...) {
  // ... payment verification and settlement ...
  
  const orderId = createOrder(...);
  
  // Set dynamic redirect options based on response data
  const redirectOptions = {
    successRedirectUrl: `/orders/${orderId}`,
    autoSuccessRedirect: true,
    successRedirectDelaySeconds: 3,
  };

  c.header(
    PAYWALL_REDIRECT_OPTIONS_HEADER,
    Buffer.from(JSON.stringify(redirectOptions)).toString('base64')
  );

  return c.json({ success: true, orderId });
}
```

#### Dynamic Button Mode Example

```typescript
// Show button with dynamic URL
const redirectOptions = {
  successRedirectUrl: `/tx/${txHash}`,
  autoSuccessRedirect: false,
  successRedirectBtnLabel: 'View Transaction',
};

c.header(
  'X-PAYWALL-REDIRECT-OPTIONS',
  Buffer.from(JSON.stringify(redirectOptions)).toString('base64')
);
```

### Redirect Flow Diagram

```
Payment Success
      │
      ▼
Parse X-PAYWALL-REDIRECT-OPTIONS header (if present)
      │
      ├─ Valid header ──► Override static config
      │
      └─ Invalid/missing ──► Use static config (log error if invalid)
      │
      ▼
Check successRedirectUrl
      │
      ├─ Not set ──► Show JSON viewer only (no redirect)
      │
      └─ Set ──► Check autoSuccessRedirect
                      │
                      ├─ true ──► Show countdown, auto-redirect
                      │
                      └─ false ──► Show redirect button
```

## Usage Examples

### Example 1: Custom Theme

```typescript
import { createPaywall } from '@x402/paywall';
import { genericEvmPaywall } from '../lib/x402';
import type { ThemeConfig } from '../lib/x402';

const customTheme: ThemeConfig = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  foreground: '#ffffff',
  muted: '#888888',
  brandPrimary: '#3b82f6',    // Blue instead of green
  brandPrimaryHover: '#2563eb',
  destructive: '#ef4444',
  border: 'rgba(255,255,255,0.1)',
  borderRadius: '1rem',
};

// Note: Custom theme must be passed via PaywallHandlerConfig
// which is set in the route config
```

### Example 2: Complete JWT Token Flow

```typescript
// In your route handler after successful payment settlement

// 1. Generate token with payment proof
const accessToken = await generateAccessToken({
  resourceType: 'analytics',
  resourceId: domainName,
  query: { startDate, endDate },
  paidAt: new Date().toISOString(),
  buyerWallet,
  txHash: settleResult.transaction,
  chainId: parseChainIdFromNetwork(settleResult.network),
});

// 2. Return token in response
return c.json({
  report: analyticsData,
  accessToken,  // Client saves this
});

// --- On subsequent request ---

// 3. Check for token in middleware
const token = c.req.query('accessToken') || 
  c.req.header('Authorization')?.replace('Bearer ', '');

if (token) {
  const result = await verifyAccessToken(token);
  
  if (result.valid && tokenMatchesResource(result.payload, 'analytics', domainName)) {
    c.set('bypassPayment', true);
    c.set('accessTokenPayload', result.payload);
  }
}
```

### Example 3: Setting Up a New Paywalled Endpoint

```typescript
import { Hono } from 'hono';
import { createPaywall } from '@x402/paywall';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { genericEvmPaywall } from '../lib/x402';
import { config } from '#lib/env';

// 1. Create paywall
const paywall = createPaywall()
  .withNetwork(genericEvmPaywall)
  .withConfig({
    appName: 'MyApp',
    testnet: config.X402_NETWORK === 'eip155:84532',
    appLogo: 'https://example.com/logo.svg',
  })
  .build();

// 2. Set up resource server
const facilitatorClient = new HTTPFacilitatorClient({
  url: config.X402_FACILITATOR_URL,
});

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme());

// 3. Define route config
const routeConfig = {
  accepts: [{
    scheme: 'exact',
    network: config.X402_NETWORK,
    price: '1000000', // 1 USDC (6 decimals)
    payTo: config.X402_SIGNER_ADDRESS,
    maxTimeoutSeconds: 300,
  }],
  description: 'Access premium feature',
  mimeType: 'application/json',
  resource: '/api/premium',
};

// 4. Apply middleware
const router = new Hono();

router.get('/premium', 
  paymentMiddleware(
    { '/api/premium': routeConfig },
    resourceServer,
    { appName: 'MyApp', testnet: true },
    paywall
  ),
  async (c) => {
    // This runs after payment is verified
    return c.json({ data: 'premium content' });
  }
);
```

## Related Documentation

- [x402 Middleware Options ADR](./architecture/decisions/x402-middleware-options.md) - When to use middleware vs manual payment handling
- [x402 Protocol](https://x402.org) - Official protocol documentation
