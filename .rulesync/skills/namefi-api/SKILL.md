---
name: namefi-api
description: >-
  Use the cached Namefi OpenAPI/contract index to discover operations, inspect request
  shapes, and generate local EIP-712 typed-data JSON for Namefi API requests. Use when
  working with Namefi API operations, stale prod docs, operation lookup, request
  preparation, or EIP-712 helper generation.
---

Use the local helpers in `scripts/` first. They cache the OpenAPI docs in
`references/generated/` so you do not need to refetch every time.

Core workflow:

1. Refresh the local cache when needed:
   `bun .opencode/skill/namefi-api/scripts/refresh.ts`
2. Search locally:
   `bun .opencode/skill/namefi-api/scripts/search-operations.ts "park domain"`
3. Inspect one operation:
   `bun .opencode/skill/namefi-api/scripts/get-operation.ts --env dev --operationId parkDomain`
4. Get EIP-712 metadata when present:
   - `bun .opencode/skill/namefi-api/scripts/get-eip712-types.ts --env dev --operationId parkDomain`
   - `bun .opencode/skill/namefi-api/scripts/get-primary-type.ts --env dev --operationId parkDomain`
5. Generate the request/signing JSON you need locally:
   `bun .opencode/skill/namefi-api/scripts/generate-signature-json.ts --env dev --operationId parkDomain --payload '{"normalizedDomainName":"march1104.gl","overrideExistingRecords":true}' --format all`
6. Execute any operation after the wallet is connected:
   `bun .opencode/skill/namefi-api/scripts/execute-request.ts --env dev --operationId parkDomain --payload '{"normalizedDomainName":"march1104.gl","overrideExistingRecords":true}'`
7. For trial registration flows:
   - `bun .opencode/skill/namefi-api/scripts/list-trial-domains.ts --env dev`
   - `bun .opencode/skill/namefi-api/scripts/check-trial-domain.ts --env dev --domain hello.0x.city`

Important behavior:

- `openapi.docs.json` is the source of truth for `openapiUrl` and `requestBaseUrl` per env.
- Do not trust the published OpenAPI `servers` array; the cached index ignores it.
- `dev` is the freshest schema source.
- `prod` uses its own `requestBaseUrl`, but the built index safely backfills stale or missing
  metadata from `dev` and `packages/namefi-client/contract.json`.
- Contract-only routes are still indexed when the published OpenAPI is stale. This is how the
  skill finds newer trial registration and SIWE routes before they appear in the published docs.
- Route-sensitive fallback is only applied when the published route still matches. If prod
  publishes a different route, helpers keep prod routing and surface a warning instead of
  guessing.
- The local index also classifies each operation as `public`, `authedOrPublic`, or `protected`
  from backend router source so the executor can decide between no auth, EIP-712, and SIWE.

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
- `scripts/get-eip712-types.ts` prints the resolved EIP-712 types for one operation.
- `scripts/get-primary-type.ts` prints the resolved primary type.
- `scripts/generate-signature-json.ts` builds the envelope, typed-data JSON, and HTTP request
  template used for signing flows.
- `scripts/execute-request.ts` executes any indexed operation. It automatically:
  - signs EIP-712 operations
  - bootstraps and caches a SIWE token for protected non-EIP712 reads
  - uses `--prefer-auth` to authenticate `authedOrPublic` reads with SIWE when desired
- `scripts/execute-eip712-request.ts` is a compatibility alias for `scripts/execute-request.ts`.
- `scripts/list-trial-domains.ts` fetches the current trial domain offers.
- `scripts/check-trial-domain.ts` checks whether a candidate domain matches any current trial offer.

When you need to sign a write:

1. Use this skill to find the operation.
2. Use `scripts/execute-request.ts` for the simplest path.
3. Add `--prefer-auth` for `authedOrPublic` reads when you want them to run under a cached SIWE session.

Authentication behavior:

- Operations with a primary EIP-712 type use EIP-712 signing.
- `protected` operations without EIP-712 use a cached SIWE token.
- `authedOrPublic` operations stay anonymous by default, but can use SIWE with `--prefer-auth`.
- SIWE tokens are cached locally in `references/generated/siwe-tokens.json` and reused until close to expiry.

For authenticated reads that use API keys, use `x-api-key: $NAMEFI_CLIENT_API_KEY`.
