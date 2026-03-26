---
name: namefi-api
description: >-
  Use the cached Namefi OpenAPI/contract index to discover operations, inspect request
  shapes, classify auth requirements, and prepare signer-neutral EIP-712 or ERC-191
  payloads for Namefi API requests. Use when working with Namefi API operations, stale
  prod docs, operation lookup, auth preparation, or raw request construction.
---

Use the local helpers in `scripts/` first.

- The cached OpenAPI/index files in `references/generated/` are for operation discovery only.
- The canonical source for EIP-712 signing metadata is the live backend helper endpoints under
  `/eip712/*`.
- This skill does not sign anything and does not execute authenticated requests for you.
- Hand the prepared payloads to any signer or MCP the user already has configured.

Core workflow:

1. Refresh discovery data when needed:
   `bun scripts/refresh.ts --env dev`
2. Search locally:
   `bun scripts/search-operations.ts "park domain"`
3. Inspect one operation:
   `bun scripts/get-operation.ts --env dev --operationId toggleDomainParking`
4. Prepare the auth flow:
   - EIP-712 or no-auth auto-detection:
     `bun scripts/prepare-auth-request.ts --env dev --operationId toggleDomainParking --payload '{"normalizedDomainName":"march1104.gl","enableParking":true,"overrideExistingRecords":false}'`
   - SIWE flow for protected reads:
     `bun scripts/prepare-auth-request.ts --env dev --operationId getUserDomains --signer-address 0xYourAddress`
   - Optional-auth reads with SIWE:
     `bun scripts/prepare-auth-request.ts --env dev --operationId checkAvailability --payload '{"domain":"hello.0x.city"}' --prefer-auth --signer-address 0xYourAddress`
5. Pass the prepared payload to the user's signer/MCP:
   - EIP-712 writes -> sign `typedData`
   - SIWE -> sign `messageString` with `personal_sign`
6. Send the final request using the prepared `request` object and filled headers.

Smaller helper scripts:

- `scripts/get-eip712-domain.ts` reads the live EIP-712 domain from `/eip712/domain`.
- `scripts/get-eip712-types-for-method.ts` reads the live accepted primary types and type map for one method.
- `scripts/get-all-eip712-types.ts` reads the full live EIP-712 type registry.
- `scripts/get-eip712-types.ts` is a convenience wrapper for one operation.
- `scripts/get-primary-type.ts` selects the primary type for one operation, optionally using a payload shape.
- `scripts/prepare-siwe-message.ts` prepares a signer-neutral SIWE message flow.
- `scripts/generate-signature-json.ts` is a convenience wrapper for EIP-712-only preparation.

Important behavior:

- `openapi.docs.json` is the source of truth for `openapiUrl` and `requestBaseUrl` per env.
- Do not trust the published OpenAPI `servers` array; use `requestBaseUrl` from the manifest.
- `dev` is the freshest schema source for operation discovery.
- `prod` keeps its own `requestBaseUrl`, but the built index can safely backfill stale discovery metadata from `dev` and `packages/namefi-client/contract.json`.
- Contract-only routes are still indexed when the published OpenAPI is stale.
- Route-sensitive fallback is only applied when the published route still matches.
- The local index classifies each operation as `public`, `authedOrPublic`, or `protected` from backend router source.

Authentication behavior:

- `eip712` -> prepare EIP-712 domain, types, envelope, typed data, and signature headers.
- `siwe-required` -> prepare nonce, SIWE message, verify request, and final token header usage.
- `siwe-optional` -> anonymous by default; add `--prefer-auth` to prepare the SIWE-authenticated variant.
- `none` -> no signature prep needed; the script returns the final request template only.

Generated files:

- `references/generated/dev.openapi.json`
- `references/generated/prod.openapi.json`
- `references/generated/dev.index.json`
- `references/generated/prod.index.json`

Helper script summary:

- `scripts/sync-openapi.ts` fetches and caches the latest OpenAPI docs.
- `scripts/build-operation-index.ts` builds normalized raw and resolved indexes.
- `scripts/refresh.ts` runs both steps.
- `scripts/search-operations.ts` searches cached operations by text.
- `scripts/get-operation.ts` prints one normalized operation.
- `scripts/prepare-auth-request.ts` is the canonical signer-neutral entrypoint.
- `scripts/list-trial-domains.ts` fetches the current trial domain offers.
- `scripts/check-trial-domain.ts` checks whether a candidate domain matches any current trial offer.

Use API keys directly when the user already has one:

- Header: `x-api-key: $NAMEFI_CLIENT_API_KEY`
