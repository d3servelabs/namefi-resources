# The comparison separates verification from asset and delivery rules

Research date: 2026-10-21 UTC. Writer: Codex agent `/root/write_bridges`.

## The manuscript uses personally opened primary documentation

- https://docs.cosmos.network/ibc/latest/intro — IBC-Go v10+ contains Classic and v2; v2 client-based packets, timestamp timeouts, flexible client types, and relayers. Do not imply all IBC paths use light clients. The older ibc.cosmos.network URL redirected here.
- https://docs.cosmos.network/ibc/latest/apps/transfer/overview — ICS-20, success/error acknowledgements, denomination traces, and v2 client identifiers.
- https://github.com/cosmos/ibc/tree/main/spec/app/ics-020-fungible-token-transfer — transfer application escrow/voucher/return logic. Opened through official Cosmos documentation.
- https://docs.chain.link/ccip/concepts/ccvs/overview — default Committee Verifier, additive CCVs, effective requirements, resolver/versioned implementation design. Avoid stale universal descriptions of older CCIP architecture.
- https://docs.chain.link/ccip/concepts/ccvs/trust-responsibility-model — official responsibility boundary, supplementary source.
- https://docs.chain.link/ccip/concepts/cross-chain-token/overview — pool handling modes, mint/burn permissions, liquidity provision and rate limits. Pools and CCIP messaging must remain distinct.
- https://docs.chain.link/ccip/concepts/manual-execution — OffRamp execution, verifier-result retrieval, indexer readiness caveats, callback gas versus token-pool/outer transaction gas.
- https://docs.layerzero.network/v2/concepts/layerzero-protocol-architecture — OApp, Endpoint, libraries, verification and execution separation.
- https://docs.layerzero.network/v2/concepts/verification-execution-services — required/optional DVNs and separate Executors.
- https://docs.layerzero.network/v2/concepts/modular-security/production-dvn-configuration — provider correlation and configuration review. The page contains confusing numerical shorthand examples; manuscript deliberately uses semantic required-plus-optional-threshold language instead.
- https://wormhole.com/docs/protocol/infrastructure/guardians/ — 19 Guardians, 13-of-19 final VAA, chain-specific direct/delegated observation distinction.
- https://wormhole.com/docs/protocol/infrastructure/vaas/ — emitter identity, payload, consistency/finality, and source reorganization caveat.
- https://wormhole.com/docs/products/token-transfers/wrapped-token-transfers/overview/ — custody and wrapped-token creation. Does not justify describing arbitrary assets or all Wormhole products identically.

## The review removes unsupported deployment promises

No universal chain coverage, guaranteed speed, cheapest-provider ranking, trustless label, invented TVL, or safety ranking appears. Selection recommendations and failure tests are editorial analysis. The domain example is expressly hypothetical and grants no registrar ownership effect. No native/canonical bridge superiority claim appears. Exact route verification remains a deployment-specific exercise.

The main CCIP architecture URL returned no readable body through web fetch. A guessed alternate CCV URL failed. Public shell curl failed DNS resolution. No claim relies on those failures. The working CCV overview, CCT overview and manual execution documents support the CCIP section instead. No archive snapshot was fetched or invented.

The text review checked protocol versions, verifier roles, finality versus delivery, duplicate effects, internal routes, sentence length, source scope, and public prose. Parent coordinator owns images, full repository validation, independent review and publication. No image reference was added before asset generation except the required planned frontmatter cover path.
