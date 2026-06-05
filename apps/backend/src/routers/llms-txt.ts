import { Hono } from 'hono';

export const llmsTxtRouter = new Hono();

const LLMS_TXT = `# Namefi API

> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.

## Docs

- [TypeScript SDK docs](https://docs.namefi.io): Guides for \`@namefi/api-client\` — installation, authentication, domain registration, DNS management.
- [npm: @namefi/api-client](https://www.npmjs.com/package/@namefi/api-client): Install with \`npm install @namefi/api-client\`.
- [OpenAPI JSON](https://api.namefi.io/v-next/openapi/doc.json): Machine-readable OpenAPI 3 spec.
- [Outbound agent guide](https://api.namefi.io/outbound/llms.txt): Focused instructions for finding domain buyer leads and preparing outreach.
- [namefi-api-skills (GitHub)](https://github.com/d3servelabs/namefi-api-skills): Signer-neutral helper scripts for preparing auth payloads.
- Buy domain (X402): https://api.namefi.io/x402/domain/{domainName}
- Buy domain (MPP): https://api.namefi.io/mpp/domain/{domainName}?nftReceivingWalletAddress={nftReceivingWalletAddress}

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production  | \`https://api.namefi.io/v-next/\` (alias: \`https://backend.astra.namefi.io/v-next/\`) |
| Development | \`https://api.namefi.dev/v-next/\` |

**Important:** The SDK default base URL is \`https://backend.astra.namefi.io\`. Both \`api.namefi.io\` and \`backend.astra.namefi.io\` point to the same backend.

## Quick Start — DNS Records via curl

The fastest way to manage DNS records with an API key (no SDK needed):

    # Read records (no auth required)
    curl https://api.namefi.io/v-next/dns/records?zoneName=example.com

    # Create a CNAME record
    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"CNAME","name":"www","rdata":"cname.vercel-dns.com.","ttl":300}'

    # Create a TXT record
    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"TXT","name":"_verify","rdata":"verification-token","ttl":300}'

## Authentication

Three auth methods are supported. See https://docs.namefi.io/docs/02-authentication for full details.

### API Key (simplest — recommended for agents)

Generate a key at https://namefi.io/profile?tab=api-keys, then pass it as:

    x-api-key: <your-key>

Works for **all operations** including DNS record creation, updates, and deletes. The API key must be generated from the wallet that owns the domain.

**Direct HTTP usage (recommended for AI agents):** Pass the header directly — no SDK required:

    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: nfk_YOUR_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"zoneName":"yourdomain.com","type":"A","name":"@","rdata":"1.2.3.4","ttl":300}'

### Crypto wallet signature (EIP-712)
- Not needed for API key users, but available as an alternative for programmatic use without a stored key.
- For Web3 Users And Agentic Wallets, [visit](https://api.namefi.io/llms.txt/web3) for details on signing requests with EIP-712, including support for smart contract wallets (ERC-1271 / EIP-7702) and SIWE authentication.

## Domain Registration

See https://docs.namefi.io/docs/03-getting-started/01-your-first-domain

Key operations:
- \`GET /v-next/search/availability?domain=example.com\` — check availability
- \`GET /v-next/search/bulk-availability?domains[]=example.com&domains[]=example2.com\` — check bulk availability
- \`POST /v-next/orders/register-domain\` — register a domain
- \`POST /v-next/orders/register-domain/records\` — register with initial DNS records
- \`GET /v-next/orders/{orderId}\` — poll order status (async processing)

Registration requires NFSC (Namefi Service Credits). Request test tokens via the faucet: https://docs.namefi.io/docs/03-getting-started/02-your-balance

## Outbound Lead Finding

Use https://api.namefi.io/outbound/llms.txt for the full agent workflow. It covers listing owned domains, starting an outbound lead-finding run, polling run status, listing ranked leads, inspecting lead detail, and preparing outreach drafts.

## DNS Record Management

See https://docs.namefi.io/docs/03-getting-started/03-manage-dns-records and https://docs.namefi.io/docs/03-getting-started/05-dns-operations

All DNS write operations require domain ownership (verified via on-chain NFT ownership). The API key must belong to the wallet that owns the domain.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | \`/v-next/dns/records?zoneName=example.com\` | None | List all records |
| POST | \`/v-next/dns/records\` | API Key or EIP-712 | Create a single record |
| PUT | \`/v-next/dns/record\` | API Key or EIP-712 | Update a record by ID |
| DELETE | \`/v-next/dns/record\` | API Key or EIP-712 | Delete a record by ID |
| POST | \`/v-next/dns/records/batch\` | API Key or EIP-712 | Batch create records |
| PUT | \`/v-next/dns/records/batch\` | API Key or EIP-712 | Batch update records |
| DELETE | \`/v-next/dns/records/batch\` | API Key or EIP-712 | Batch delete records |
| PUT | \`/v-next/dns/park\` | API Key or EIP-712 | Toggle domain parking |
| PUT | \`/v-next/dns/forwarding\` | API Key or EIP-712 | Toggle domain forwarding |
| PUT | \`/v-next/dns/auto-ens\` | API Key or EIP-712 | Toggle auto ENS records |
| PUT | \`/v-next/dns/vercel-anycast\` | API Key or EIP-712 | Toggle Vercel anycast records |
| GET | \`/v-next/dns/parked?normalizedDomainName=example.com\` | None | Check if parked |

## Domain Configuration

Manage domain-level preferences that aren't tied to a specific DNS record. All write operations require domain ownership (verified via on-chain NFT ownership).

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | \`/v-next/domain-config/auto-renew?normalizedDomainName=example.com\` | API Key or EIP-712 | Check whether auto-renewal is enabled |
| PUT | \`/v-next/domain-config/auto-renew\` | API Key or EIP-712 | Enable or disable auto-renewal |

### Toggle auto-renewal via curl

    # Enable auto-renewal
    curl -X PUT https://api.namefi.io/v-next/domain-config/auto-renew \\
      -H "x-api-key: YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"normalizedDomainName":"example.com","enableAutoRenew":true}'

    # Disable auto-renewal
    curl -X PUT https://api.namefi.io/v-next/domain-config/auto-renew \\
      -H "x-api-key: YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{"normalizedDomainName":"example.com","enableAutoRenew":false}'

When auto-renewal is enabled, the domain will be renewed automatically before expiration using the payment methods available on the owner wallet.

### Record format

Supported types: A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF.

- \`name\`: Use \`@\` for apex, or a subdomain label (e.g. \`www\`, \`mail\`).
- \`rdata\`: Type-specific value. FQDNs must be lowercase with trailing dot (e.g. \`cname.vercel-dns.com.\`).
- \`ttl\`: Integer 0-2147483647 (seconds). Recommended: 300 for records you change often, 3600 for stable records.
- \`zoneName\`: Normalized lowercase domain without trailing dot (e.g. \`example.com\`).

## x402 Payments (HTTP 402)

Buy a domain with stablecoin (USDC) using the [x402 protocol](https://x402.org). No Namefi account or EIP-712 signing required — the buyer's wallet signs an EIP-3009 \`transferWithAuthorization\`.

- \`GET /x402/domain/{domainName}\` — without an \`X-PAYMENT\` header, returns \`402 Payment Required\` with payment options (network, asset, amount in USDC). With a valid \`X-PAYMENT\` header, verifies the signature, starts the registration workflow, and settles payment.
  - Optional query params: \`years\` (1-10, default 1), \`nftReceivingWalletAddress\` (defaults to the buyer wallet).
- \`GET /x402/purchase/{purchaseId}\` — poll purchase status. Returns JSON when \`?content-type=json\` or the \`Accept\` header isn't HTML; otherwise redirects to the frontend progress page.
- namefi-api-skills have the full details about all possible payment options.

## MPP (Machine Payable Protocol)

Buy a domain or sign in using the MPP payment-challenge flow. The first request returns \`402 Payment Required\` with a signed challenge; the client signs it (e.g. via the [\`mppx\`](https://www.npmjs.com/package/mppx) CLI: \`mppx sign\`) and replays the request with the resulting \`Authorization\` header to complete the operation.

- \`GET /mpp/domain/{domainName}\` — register a domain via MPP. Required query param: \`nftReceivingWalletAddress\` (checksummed). Optional: \`years\` (1-10, default 1). Without auth → 402 with challenge + price metadata. With a valid signed credential → instant registration.
- \`GET /mpp/sign-in\` — MPP-authenticated sign-in. Without auth → 402 with challenge. With a valid signed credential → returns the sign-in result.

### Common Recipes

#### Point a subdomain to Vercel

    # 1. Create CNAME record
    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"CNAME","name":"app","rdata":"cname.vercel-dns.com.","ttl":300}'

    # 2. Add Vercel domain verification TXT record
    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"TXT","name":"_vercel","rdata":"vc-domain-verify=app.example.com,TOKEN","ttl":300}'

#### Point a subdomain to GitHub Pages

    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"CNAME","name":"blog","rdata":"username.github.io.","ttl":300}'

#### Add an email TXT record (SPF)

    curl -X POST https://api.namefi.io/v-next/dns/records \\
      -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \\
      -d '{"zoneName":"example.com","type":"TXT","name":"@","rdata":"v=spf1 include:_spf.google.com ~all","ttl":3600}'

### Troubleshooting

- **UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet. Generate a new key at https://namefi.io/profile?tab=api-keys using the wallet that owns the domain.
- **FORBIDDEN (403):** Your API key is valid but the authenticated user does not own the domain. Check domain ownership on https://namefi.io/domains.
- **Record validation errors:** Check that \`zoneName\` has no trailing dot, \`rdata\` for CNAME/MX/NS types has a trailing dot, and \`ttl\` is a positive integer.

## Optional

- [OpenAPI JSON](https://api.namefi.io/v-next/openapi/doc.json)
`;

const LLMS_TXT_WALLETS = `
### Crypto wallet signature (EIP-712)
  **SDK usage:** The SDK handles EIP-712 envelope signing automatically when configured with \`type: 'API_KEY'\`.

  ### EIP-712 Typed Data Signature (EOA wallets)

  For programmatic use without a stored key, sign each request with your Ethereum wallet.
  See https://docs.namefi.io/docs/02a-eip712-signing for the manual signing flow.

  Required headers:
  - \`x-namefi-signer\`: Your wallet address (checksummed)
  - \`x-namefi-signature\`: Hex-encoded EIP-712 signature (\`0x\`-prefixed)
  - \`x-namefi-eip712-type\`: The EIP-712 primary type for the operation

  Fetch live EIP-712 metadata from these endpoints (do NOT hardcode types):
  - \`GET /v-next/eip712/domain\` — signing domain (\`{ name: 'Namefi', version: '1' }\`, chain-agnostic)
  - \`GET /v-next/eip712/types-for-method?method=<operationId>\` — accepted primary types and type map for a specific operation
  - \`GET /v-next/eip712/types\` — full EIP-712 type registry

  Every signed request wraps the payload in an envelope:

      {
        "payloadType": "<PrimaryTypeWithoutEnvelopeSuffix>",
        "payload": { ... },
        "timestamp": <unix-seconds>,
        "nonce": "<unique-random-string>"
      }

  Signatures expire after 300 seconds. Nonces are single-use.

  ### EIP-712 with Smart Contract Wallets (ERC-1271 / EIP-7702)

  If the domain-owning address is a smart contract (e.g. a multisig or smart account), the contract cannot sign directly. Instead:

  1. An approved EOA signer signs the EIP-712 typed data on behalf of the contract.
  2. The contract must implement \`approvedSigners(address signer) view returns (bool)\` — the API calls this on-chain to verify delegation.
  3. Include one of these headers to indicate the delegating contract address:
     - \`x-namefi-eip7702-account\`: Preferred header for EIP-7702 delegated accounts
     - \`x-namefi-erc1271-account\`: Preferred header for ERC-1271 smart contract wallets
     - \`x-namefi-eip1271-account\`: Legacy alias (same behavior as erc1271)

  When multiple delegation headers are present, precedence is: eip7702 > erc1271 > eip1271.

  The API verifies that \`x-namefi-signer\` is an approved signer for the contract address across supported chains, then authenticates the request as the contract (domain owner).

  ### SIWE (Sign-In with Ethereum)

  For protected reads that do not require EIP-712. See https://docs.namefi.io/docs/02b-siwe-authentication
`;

const LLMS_TXT_OUTBOUND = `# Namefi Outbound Agent API

> Use this API to find likely buyer leads for domains owned by the authenticated Namefi user, inspect lead details, and prepare outreach drafts.

## Base URLs

- Production: \`https://api.namefi.io/v-next/\`
- Development: \`https://api.namefi.dev/v-next/\`

## Machine-Readable Spec

- OpenAPI JSON: https://api.namefi.io/v-next/openapi/doc.json

## Authentication

Use the same auth methods as the rest of \`/v-next\`.

Recommended for agents:

    x-api-key: <your-api-key>

Bearer JWT also works:

    Authorization: Bearer <jwt>

Do not invent outbound-specific auth. If an operation returns \`401\`, get a valid API key or JWT. If it returns \`403\`, the authenticated user is valid but cannot access the requested resource.

## Recommended Agent Flow

1. List domains the user owns:

       GET /v-next/user/domains

2. Choose one domain to sell or research. If needed, check whether another domain is available before buying it:

       GET /v-next/search/availability?domain=example.com
       GET /v-next/search/bulk-availability?domains[]=example.com&domains[]=example.net

3. Start an outbound lead-finding run. The request body intentionally matches the Astra outbound UI and has no asking price field:

       POST /v-next/outbound/runs
       Content-Type: application/json

       {
         "domain": "example.com",
         "reasoningEffort": "medium"
       }

   \`reasoningEffort\` is optional and can be \`low\`, \`medium\`, or \`high\`. If an active run already exists for the same domain, the API returns that run instead of creating duplicate work.

4. Poll the run while \`pollAfterSeconds\` is present:

       GET /v-next/outbound/runs/{runId}

   Active statuses are \`QUEUED\` and \`RUNNING\`. Terminal statuses are \`SUCCEEDED\`, \`FAILED\`, and \`CANCELED\`.

5. List leads in ranked order:

       GET /v-next/outbound/runs/{runId}/leads?limit=20

   Response order is the ranking. Each lead includes the public rationale, content, contacts, and any existing drafts. Internal rank, score, status, readiness, and model details are intentionally not exposed.

6. Prepare outreach for a lead:

       POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach

   Existing drafts are returned without spending more generation credits. If no draft exists, the API performs contact research and draft generation, then returns the updated lead detail.

## Response Shapes

Run responses include:

- \`id\`
- \`domain\`
- \`status\`
- \`reasoningEffort\`
- \`leadCount\`
- \`contactCount\`
- \`draftCount\`
- \`summary\`
- \`latestMessage\`
- \`errorMessage\`
- \`pollAfterSeconds\`
- timestamps

Lead list items include:

- \`id\`
- \`businessDomain\`
- \`buyerSummary\`
- \`contactCount\`
- \`draftCount\`
- \`rationale\`
- \`content\`
- \`contacts[]\` with \`email\`, \`name\`, \`title\`, \`sourceUrl\`, \`context\`
- \`drafts[]\` with \`contactEmail\`, \`subject\`, \`fullEmail\`

## Presentation Guidance

When summarizing results for a user:

- Preserve the API response order and number rows starting at 1.
- Show a concise table with these columns: rank, domain, why it may fit, contact found, draft available.
- Use \`buyerSummary\` or \`rationale\` for the "why it may fit" column.
- For contact found, show yes/no and include the best email when one exists.
- For draft available, show yes/no.
- Do not mention raw internal statuses, suppressed/priority labels, rank scores, model details, command logs, JSON fixes, or file aggregation mechanics.

## Pagination

List endpoints return:

    {
      "items": [],
      "nextCursor": null
    }

When \`nextCursor\` is non-null, pass it back as \`cursor\`. Treat cursors as opaque strings.

## Errors

Validation errors use \`422 INPUT_VALIDATION_FAILED\`. Outbound-specific errors include a public error payload with:

- \`code\`: stable outbound error code
- \`message\`: human-readable fix or next step
- \`retryable\`: whether retrying later may help
- \`details\`: optional structured context

Common cases:

- \`401 UNAUTHORIZED\`: missing or invalid API key/JWT.
- \`402 PAYMENT_REQUIRED\`: not enough generation credits or payment is required.
- \`403 FORBIDDEN\`: authenticated user cannot access the run, lead, or domain.
- \`404 OUTBOUND_NOT_FOUND\`: run or lead does not exist for the authenticated user.
- \`400 OUTBOUND_BAD_REQUEST\`: invalid cursor or malformed input.
- \`500 OUTBOUND_TEMPORARILY_UNAVAILABLE\`: backend service could not start or finish the requested work; retry later.

## Consequential Operations

These operations start paid or externally meaningful work and should be treated as consequential:

- \`POST /v-next/outbound/runs\`
- \`POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach\`
- \`POST /v-next/orders/register-domain\`
- \`POST /v-next/orders/register-domain/records\`
`;

function serveLlmsTxt(c: {
  text: (
    body: string,
    status: number,
    headers: Record<string, string>,
  ) => Response;
}) {
  return c.text(LLMS_TXT, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
}

llmsTxtRouter.get('/', (c) => serveLlmsTxt(c));

llmsTxtRouter.get('/web3', (c) => {
  return c.text(LLMS_TXT_WALLETS, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});
// Also handle trailing-slash requests (/llms.txt/)
llmsTxtRouter.get('/*', (c) => {
  if (c.req.path.endsWith('/')) return serveLlmsTxt(c);
  return c.notFound();
});

export function serveOutboundLlmsTxt(c: {
  text: (
    body: string,
    status: number,
    headers: Record<string, string>,
  ) => Response;
}) {
  return c.text(LLMS_TXT_OUTBOUND, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
}
