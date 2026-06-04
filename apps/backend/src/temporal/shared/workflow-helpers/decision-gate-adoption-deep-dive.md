# Decision-Gate Adoption — Deep Dive: Correctness & Risk

Companion to [`decision-gate-adoption.md`](./decision-gate-adoption.md). A rigorous
risk analysis of the two shipped integrations (`changeNameservers`,
`processOrderItem`) and the admin resolver endpoint, plus the idempotency
constraints that gate *any* RETRY-bearing adoption.

All references verified against current code (file:line). TL;DR severity:

| # | Finding | Severity | Where |
|---|---|---|---|
| 1 | processOrderItem gate holds the **whole order** (charged user, blocks sibling refunds) for up to 3 days | 🔴 High | `processOrder.workflow.ts`, `processOrderItem.workflow.ts` |
| 2 | RETRY re-runs `acquireDomainWorkflow` which is **not idempotent** (no mint/register guard); IMPORT re-transfers | 🔴 High | `acquire-domain.workflow.ts`, `mint.*`, `registrar.activities.ts` |
| 3 | changeNameservers RETRY is convergent but **not operation-idempotent**; verify checks the op handle, not live NS | 🟡 Med | `change-nameservers.workflow.ts`, registrars |
| 4 | Admin `sendDecision` is **unaudited**, over-broad permission, no `describe()` → false-positive success | 🟡 Med | `workflowDecisionRouter.ts` |

---

## 1. 🔴 processOrderItem gate — held-order blast radius

**Item processing is parallel, but the order barriers on all items.**
`processOrderWorkflow` maps items to child workflows and awaits them together:
`orderDetails.items.map(...)` (`processOrder.workflow.ts:1191`) → `executeChild(processOrderItemWorkflow)` (`:1208`) → `await Promise.all(orderItemPromises)` (`:1259`). So a held item does **not** block sibling *registrations*, but it **does** block the order from advancing past line 1259.

**Everything downstream is sequenced after the barrier**, so a 3-day hold on one item delays, *for the entire order*:
- the **refund** of any already-failed sibling — refunds are batched per-order via `multiRefundWorkflow` (`:1492`), gated on `amountToRefundInUsdCents > 0`, and only run after `Promise.all`;
- the **final order-status write** (`:1450-1479`) — the order stays non-terminal `PROCESSING` (no `finishedAt`) the whole time;
- **post-processing / DNS setup** for succeeded siblings (`postProcessOrderItemWorkflow`, `:1405`);
- the **completion email** (`:1539`) and Slack alert (`:1573`).

**The user is already charged** before items run (`multiChargeWorkflow`, `:994`). So a held item = *"charged, order shows PROCESSING, no completion email, no refund for the failed siblings"* for up to 3 days.

**No timeout kills the hold early.** There is no `workflowRunTimeout`/`workflowExecutionTimeout` at any start site, on the `executeChild`, or in the worker config — so the 3-day gate timeout is the only bound. (Status model: `CREATED/PROCESSING/SUCCEEDED/FAILED/CANCELLED/PARTIALLY_COMPLETED`; `PROCESSING` is non-terminal — `packages/db/src/types.ts:530-544`.)

**Verdict:** holding a *paid* order in `PROCESSING` for up to 3 days — and blocking unrelated sibling refunds — is a significant behavior change that likely needs product sign-off. Options, least to most invasive:
- **Shorten** `PROCESS_ORDER_ITEM_DECISION_TIMEOUT_MS` drastically (hours, not days) so the worst-case hold is bounded.
- **Drop RETRY/PROCEED**, expose only **CANCEL** (operator can fail-fast a stuck item to release the order + refunds), letting timeout fail it otherwise.
- **Gate only RENEW** (lower blast radius; no mint/transfer) and leave REGISTER/IMPORT to the EPP child's own gates (finding 2).
- **Reconsider** gating per-item at all — the order-level barrier means the gate's "pause" is really a whole-order pause.

---

## 2. 🔴 RETRY re-runs a non-idempotent `acquireDomainWorkflow`

On RETRY/PROCEED the gate re-invokes its `action` (`decision-gate.ts` loop), which re-runs `executeChild(acquireDomainWorkflow, { workflowId: generateId(...), workflowIdReusePolicy: 'ALLOW_DUPLICATE' })` (`processOrderItem.workflow.ts:219-227`) — a fresh child run that re-executes the **entire** acquire (EPP register/import **and** NFT mint).

**No workflow-level idempotency guards exist on either path:**
- **Mint:** `mintNamefiNFT` (`mint.workflow.ts:106-145`) → `safeMintByNameNoCharge(...)` encoded unconditionally (`mint.activities.ts:102-138`). **No "NFT already exists" pre-check** — contrast `ensureNftIsLockedAndBurnByNftName` (`mint.workflow.ts:362-366`) which *does* gate on `getNamefiNftLock`. Re-mint safety relies entirely on the on-chain contract reverting a duplicate tokenId.
- **Register/Import:** `sendRegisterOrImportRequestToNamefiRegistrar` (`registrar.activities.ts:80-138`) calls `registerDomain`/`transferDomain` **unconditionally** — no "already registered / already owned" short-circuit.

**Consequences of an operator RETRY after a partial success:**
- **Traditional REGISTER:** a re-mint that reverts on-chain is **swallowed** (`acquire-domain.workflow.ts:201-212`) → acquire "succeeds" with `mintTxHash: undefined`. Usually no double-token, but that's an emergent on-chain property, not a code guard.
- **IMPORT:** re-runs `requireUnlockBeforeImportOrFail` and **re-sends a transfer** — re-notifies the user for EPP unlock and may initiate a second transfer. Genuinely risky.
- **Subdomain:** `failOnMintingError = true` (`acquire-domain.workflow.ts:87`) → a re-mint revert fails the retried acquire → gate re-arms → **permanent retry-failure loop**.

**Compound waits.** `eppRegisterOrImportWorkflow` already has its own 7-day required-action gates (`epp-register-or-import.workflow.ts:124-128`). They don't overlap with the outer gate (EPP burns up to 7 days *internally*; only on its failure does the outer 3-day gate open), but a RETRY restarts the inner 7-day gate from zero. Worst case per item ≈ (7d EPP + 3d outer) × up to 5 retries.

**Operator-layer ambiguity.** The outer gate listens on the generic `decisionGate` signal of the `processOrderItem` workflow; the EPP child still uses its own `nextAction` signal on a *separate* execution. The pre-existing user path (`cancelRequiredActionOrderItem`, `ordersRouter.ts`) targets the EPP child directly. The new generic endpoint makes it easy to signal the **wrong layer** (re-running a heavy acquire when the user really just needed to resolve an EPP unlock).

**Verdict:** **RETRY on the REGISTER/IMPORT path is unsafe** without idempotency guards. Recommended: for the acquire path, expose only `CANCEL` (not RETRY/PROCEED) until `acquireDomainWorkflow` is made re-entrant (add an NFT-exists guard in mint + an "already owned" short-circuit in register/import). RENEW (`extendDomainRegistrationWorkflow`) is lower-risk but should get the same idempotency check before RETRY is trusted.

---

## 3. 🟡 changeNameservers RETRY — convergent but not operation-idempotent

The gate wraps Steps 2+3 (`setNameserversAndVerify`), so RETRY re-runs `setNameserversForDomain` + the verify poll.

- **`setNameserversForDomain`** (`lib/domains/nameservers.ts:276-288`) does **no read-before-write**; it just calls `sldRegistrar.setNameServers`. Per registrar (`main-registrar.ts:624-632`):
  - **R53** (`r53-registrar.ts:742-761`) — declarative set; re-submit converges but spawns a **fresh AWS operation each time**.
  - **Dynadot** (`dynadot-registrar.ts:1101-1135`) — synchronous immediate-apply, synthetic operationId; harmless re-apply.
  - **CentralNic/EPP** (`centralnic-registrar.ts:839-862`) — reads current NS then sends a **diff**; if already set, the diff is **empty → no-op/empty `<update>`**, which some registries reject → could loop the gate.
- **Verify checks the operation handle, not live NS.** `pollRegistrarOperationStatus` (`registrar.activities.ts:40-58`) inspects `getOperationStatus(...)`; for Dynadot/CentralNic it just decodes a status baked into the synthetic operationId. So the gate **cannot tell "already applied" from "needs re-apply."**
- **DNSSEC re-disable skip is fine** — DS removal is terminal/idempotent and an NS change never re-enables it; only out-of-band re-enabling during a long hold would warrant a re-check.
- **Blast radius:** all tRPC callers are **fire-and-forget** (`domainConfigRouter.ts:379/415`, `nsAndDnssecRouter.ts:442/464` via `submitNameserversChangeWorkflow`) — a hold never blocks an HTTP request. **But** in the register/import path, `changeNameserversWorkflow` runs inside `domainSetupWorkflow`, started by `acquireDomainWorkflow` via `startChild` with **default `parentClosePolicy = TERMINATE`** and no run timeout (`acquire-domain.workflow.ts:129`). A REGISTER parent closes in ~4h, so a 3-day gate there would be **terminated before it resolves** — the hold is silently abandoned.

**Verdict:** lower severity (convergent, fire-and-forget). Two cheap hardening wins: (a) a **pre-RETRY live-NS check** (`getNameserversForDomain` + the existing `compareNameservers`/`checkIfNameserversAreNamefiNameservers`) to short-circuit no-op re-submits and make RETRY idempotent; (b) be aware the gate is **ineffective inside domain-setup during REGISTER** (terminated at ~4h) — it only meaningfully protects the standalone change/reset paths.

---

## 4. 🟡 Admin `sendDecision` hardening

`workflowDecisionRouter.ts:45-90`.

- **Not audited.** Uses `adminProcedureWithPermissions(HIGH_RISK)` + `logger.info` — a log is not an audit record. The norm for state-changing admin signals is `auditedAdminProcedureWithPermissions` (`base.ts:1208-1222`); e.g. `cancelBulkBurn` (`bulkBurnRouter.ts:298-340`) and `cancelRequiredActionOrderItem` (`ordersRouter.ts:413-426`) both audit their `handle.signal`. There is a purpose-built `ResourceType.WORKFLOW` (`auditor.ts:39`). **Recommend:** audit it with `action: 'send_workflow_decision'`, `resourceType: ResourceType.WORKFLOW`, `resourceId: workflowId`.
- **Permission too coarse.** `HIGH_RISK` is a catch-all elevated grant; this endpoint can PROCEED/RETRY/CANCEL **any** workflow by id (incl. re-running mint/register — finding 2). Peer `cancelBulkBurn` uses the scoped `WRITE_NFT`. **Recommend:** a dedicated `WORKFLOW;;DECISION` permission (matches the `RESOURCE;;ACTION` convention), or `SUPER_ADMIN` if a dedicated permission isn't added before ship.
- **No validation → false-positive success.** It never `describe()`s the workflow. A signal to a **closed or un-armed** workflow is silently dropped by the gate dispatcher (`decision-gate.ts` returns early on `!gate || gate.received`), yet the endpoint still returns `{ success: true }` — the operator gets a false confirmation. Contrast `cancelRequiredActionOrderItem` (`ordersRouter.ts:459-497`) which `describe()`s and branches on `description.type` before signaling. **Recommend:** `describe()` → reject non-`RUNNING` with `BAD_REQUEST`; ideally consult `getArmedGates` and surface "no matching armed gate" instead of a blind success.

---

## Recommended actions (priority order)

1. ✅ **processOrderItem scope** (finding 1+2): now **CANCEL/RESPOND only** (no RETRY/PROCEED on the non-idempotent acquire), 1-day timeout. Still open: the held item keeps the paid order in `PROCESSING` (blocks sibling refunds) until resolved/timed-out — a structural property of the order's `Promise.all` barrier.
2. ✅ **Harden the admin endpoint** (finding 4): `sendDecision` is now audited (`ResourceType.WORKFLOW`), `describe()`-guarded (rejects non-RUNNING) and armed-gate-guarded (no false-success on a dropped signal), gated by `WORKFLOWS;;WRITE`; reads by `WORKFLOWS;;READ`.
3. ◻️ **changeNameservers** (finding 3): still TODO — add a pre-RETRY live-NS short-circuit; the gate is also bypassed (terminated) inside REGISTER domain-setup (~4h parent close).
4. ◻️ **Make acquire re-entrant** (finding 2): still TODO — NFT-exists guard in mint, "already owned" short-circuit in register/import. Until then, RETRY stays disabled on the acquire path.

These are the cross-cutting lessons for every future adoption in
[`decision-gate-adoption.md`](./decision-gate-adoption.md): **RETRY is only safe
where re-running the action is idempotent**, and **a gate that holds a barrier'd
parent (orders, paid flows) pauses far more than the one failed unit.**
