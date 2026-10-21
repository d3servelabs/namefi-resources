# Evidence supports a mechanism comparison of three intent systems

Research fetched 2026-10-21 UTC. Assignment: historical Blockchain Concepts plan, order 200. The plan fixes the topic and provides no current ranking or search-volume evidence. Article compares CoW Protocol, UniswapX and the documented Across V3-style lifecycle, rather than ranking market share. No Namefi functionality claim is needed.

## Primary sources support the listed mechanisms

- https://docs.cow.fi/cow-protocol/concepts/introduction/intents — Intents; signed trading constraints, not executable user transactions; solver routing and settlement checks. Opened 2026-10-21.
- https://docs.cow.fi/cow-protocol/concepts/introduction/solvers — Solvers; independent bonded participants, batch competition, winning solution selection. Opened 2026-10-21.
- https://docs.cow.fi/cow-protocol/reference/contracts/core/settlement — Guarantees and Invariants, Interactions, GPv2Order.Data, invalidateOrder, settle, Indexing. Signature, expiration, prior fill and price checks; allow-listed settlement execution; partial-fill flag; cancellation function; events. Opened 2026-10-21.
- https://docs.cow.fi/cow-protocol/tutorials/cow-swap/limit — Cancel a limit order and placement. Both offchain and onchain cancellation can race settlement. Partial fill can leave remainder. Opened 2026-10-21.
- https://developers.uniswap.org/docs/liquidity/uniswapx/overview — Trading on UniswapX, Fillers on UniswapX. Signed Permit2 orders, competition, different auction mechanisms per chain. Opened 2026-10-21.
- https://developers.uniswap.org/docs/liquidity/uniswapx/concepts/architecture — Reactors, Fill Contracts, Direct Fill. Reactor validates and resolves order, transfers inputs, calls filler strategy and verifies outputs. Multiple reactor formats. Opened 2026-10-21.
- https://developers.uniswap.org/docs/liquidity/uniswapx/concepts/auction-types — Auction Types. Confirms mechanisms vary. Opened 2026-10-21. Article avoids deployment-specific auction assertions.
- https://docs.across.to/guides/concepts/intents-architecture — The Three Layers; relayers front capital, RFQ separate from settlement; optimistic bundle verification, HubPool and SpokePools. Opened 2026-10-21.
- https://docs.across.to/guides/concepts/intent-lifecycle — Phase 1, Phase 2, Exclusivity, Phase 3. depositV3, escrow, destination fill and event, later repayment and configurable exclusive period. Opened 2026-10-21.
- https://docs.across.to/api-reference/deposits/get — Query Parameters/status and Response Body. Exposes distinct unfilled, filled, slowFillRequested, slowFilled, expired, refunded statuses; index lag. Opened 2026-10-21. No token or authenticated request made.
- https://eips.ethereum.org/EIPS/eip-7683 — Abstract, Motivation, Previous Draft, Security Considerations. Current fetched draft is resolver-centric, unlike earlier origin/destination settler version. Standard does not guarantee underlying protocol security. Opened 2026-10-21.

## The article narrows claims where evidence does not establish a guarantee

1inch documentation and a guessed announcement URL did not load. Neither contributes evidence or public claims. Three verified systems suffice for a selective roundup. Across pages describe V3 APIs and mention V4 separately. The article labels the documented lifecycle and does not assume all versions use optimistic settlement. The current ERC-7683 draft differs materially from historical descriptions. No performance rankings, fee guarantees, deployment addresses, universal support lists, privacy assurances or refund durations appear. Advice and hypothetical examples represent analysis, not measured product outcomes. No archive snapshots were fetched or invented.

## The text review checked source boundaries and public paths

The review checked every product mechanism against the opened official pages. The prose distinguishes analysis, hypothetical examples, interface standards and deployment details. Related targets exist. The article has four body sections, one three-column table and no image references before asset creation. No live quote or funded transaction test occurred.

```json
{
  "image_scenes": [
    {
      "section": "Users authorize outcomes before solvers choose execution paths",
      "short_name": "authorization",
      "scene": "Compare signed order cards for CoW and UniswapX with an Across origin deposit transaction. Show asset, recipient, minimum output and expiry fields. Keep signature distinct from deposit."
    },
    {
      "section": "Solver competitions select different execution strategies",
      "short_name": "competitions",
      "scene": "Three lanes: CoW batch of orders to competing bonded solvers; UniswapX order to filler auction; Across origin deposit to relayers fronting destination liquidity. No speed ranking."
    },
    {
      "section": "Settlement contracts enforce different completion conditions",
      "short_name": "settlement",
      "scene": "CoW settlement checks signature expiry and price; UniswapX reactor checks recipient output; Across destination delivery occurs before a separate later relayer repayment stage. Label Across documented V3 lifecycle."
    },
    {
      "section": "Recovery checks should follow the order's actual state",
      "short_name": "recovery",
      "scene": "State checklist with order identifier, submitted, filled or partially filled, cancellation pending and confirmed. Separate Across path shows deposit, destination fill or expiry, and refund status verification. No guaranteed refund time."
    }
  ]
}
```

## The coordinator corrected the deployed-auction distinction

The coordinator opened the current UniswapX auction guide. The guide lists RFQ plus exclusive Dutch auctions across supported chains, with timestamp versus block-number timing. The coordinator replaced the broader claim about several deployed auction formats. Historical reactor implementations do not establish current deployment selection. Coordinator edits fall outside the dedicated writer interval.
