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
6. Execute an EIP-712 write end-to-end after the wallet is connected:
   `bun .opencode/skill/namefi-api/scripts/execute-eip712-request.ts --env dev --operationId parkDomain --payload '{"normalizedDomainName":"march1104.gl","overrideExistingRecords":true}'`

Important behavior:

- `openapi.docs.json` is the source of truth for `openapiUrl` and `requestBaseUrl` per env.
- Do not trust the published OpenAPI `servers` array; the cached index ignores it.
- `dev` is the freshest schema source.
- `prod` uses its own `requestBaseUrl`, but the built index safely backfills stale or missing
  metadata from `dev` and `packages/namefi-client/contract.json`.
- Route-sensitive fallback is only applied when the published route still matches. If prod
  publishes a different route, helpers keep prod routing and surface a warning instead of
  guessing.

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
- `scripts/execute-eip712-request.ts` signs with the connected `wc` wallet helper and sends the
  HTTP request in one step. Use `--dry-run` to inspect the generated session/request payload
  before waiting for wallet approval.

When you need to sign a write:

1. Use this skill to find the operation and generate the typed-data JSON.
2. Use `namefi-eip712-auth` or `wc` to sign it.
3. Send the request with the generated envelope body and the signature headers.

Or use `scripts/execute-eip712-request.ts` to do steps 1-3 in one command once the wallet is
already connected.

For authenticated reads that use API keys, use `x-api-key: $NAMEFI_CLIENT_API_KEY`.
