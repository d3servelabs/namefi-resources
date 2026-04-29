import { Hono } from 'hono';

export const llmsTxtRouter = new Hono();

const LLMS_TXT = `# Namefi API

> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.

## Docs

- [Interactive OpenAPI (Scalar)](https://api.namefi.io/v-next/openapi/doc): Live, auto-generated reference for every endpoint, schema, and auth requirement.
- [TypeScript SDK docs](https://docs.namefi.io): Guides for \`@namefi/api-client\` — installation, authentication, domain registration, DNS management.
- [npm: @namefi/api-client](https://www.npmjs.com/package/@namefi/api-client): Install with \`npm install @namefi/api-client\`.
- [OpenAPI JSON](https://api.namefi.io/v-next/openapi/doc.json): Machine-readable OpenAPI 3 spec.
- [namefi-api-skills (GitHub)](https://github.com/d3servelabs/namefi-api-skills): Signer-neutral helper scripts for preparing auth payloads.
- Buy domain (X402): https://api.namefi.io/x402/domain/{domainName}
- Buy domain (MPP): https://api.namefi.io/x402/domain/{domainName}?nftReceivingWalletAddress={nftReceivingWalletAddress}

## Base URLs

- Production: https://api.namefi.io/v-next/
- Development: https://api.namefi.dev/v-next/

## Authentication

Three auth methods are supported. See https://docs.namefi.io/docs/02-authentication for full details.

### API Key (simplest)

Generate a key at https://namefi.io/profile?tab=api-keys, then pass it as:

    x-api-key: <your-key>

Works for all operations. The SDK handles EIP-712 envelope signing automatically when configured with \`type: 'API_KEY'\`.

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

## Domain Registration

See https://docs.namefi.io/docs/03-getting-started/01-your-first-domain

Key operations:
- \`GET /v-next/search/availability?domain=example.com\` — check availability
- \`POST /v-next/orders/register\` — register a domain (EIP-712 signed)
- \`POST /v-next/orders/register-with-records\` — register with initial DNS records
- \`GET /v-next/orders/{orderId}\` — poll order status (async processing)

Registration requires NFSC (Namefi Service Credits). Request test tokens via the faucet: https://docs.namefi.io/docs/03-getting-started/02-your-balance

## DNS Record Management

See https://docs.namefi.io/docs/03-getting-started/03-manage-dns-records and https://docs.namefi.io/docs/03-getting-started/05-dns-operations

All DNS write operations require domain ownership (verified via on-chain NFT ownership).

### Endpoints

- \`GET /v-next/dns/records?zoneName=example.com\` — list records (public, no auth)
- \`POST /v-next/dns/records\` — create a single record (EIP-712)
- \`PUT /v-next/dns/record\` — update a record by ID (EIP-712)
- \`DELETE /v-next/dns/record\` — delete a record by ID (EIP-712)
- \`POST /v-next/dns/records/batch\` — batch create records (EIP-712)
- \`PUT /v-next/dns/records/batch\` — batch update records (EIP-712)
- \`DELETE /v-next/dns/records/batch\` — batch delete records (EIP-712)
- \`PUT /v-next/dns/park\` — toggle domain parking (EIP-712)
- \`PUT /v-next/dns/forwarding\` — toggle domain forwarding (EIP-712)
- \`PUT /v-next/dns/auto-ens\` — toggle auto ENS records (EIP-712)
- \`PUT /v-next/dns/vercel-anycast\` — toggle Vercel anycast records (EIP-712)
- \`GET /v-next/dns/parked?normalizedDomainName=example.com\` — check if parked (public)

### Record format

Supported types: A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF.

- \`name\`: Use \`@\` for apex, or a subdomain label (e.g. \`www\`, \`mail\`).
- \`rdata\`: Type-specific value. FQDNs must be lowercase with trailing dot.
- \`ttl\`: Integer 0-2147483647 (seconds).
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

## Optional

- [OpenAPI JSON](https://api.namefi.io/v-next/openapi/doc.json)
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
// Also handle trailing-slash requests (/llms.txt/)
llmsTxtRouter.get('/*', (c) => {
  if (c.req.path.endsWith('/')) return serveLlmsTxt(c);
  return c.notFound();
});
