# Decision-Gate Adoption — Workflow Scan & Plan

A catalog of where the [`decision-gate`](./decision-gate.ts) (`runWithDecisionGate`)
and [`escalating-poller`](./escalating-poller.ts) (`escalatingPoll`) helpers fit
across the Temporal workflows, with the recommended helper, current handling,
and risk notes per site.

Scope: scanned all **80** `*.workflow.ts` files under
`apps/backend/src/temporal/workflows/`. Line numbers are current as of this scan
and will drift — treat them as anchors, not exact addresses.

> ⚠️ **Read [`decision-gate-adoption-deep-dive.md`](./decision-gate-adoption-deep-dive.md) for the correctness analysis.**
> Mitigations applied since: `processOrderItem` now offers **CANCEL/RESPOND only**
> (no unsafe RETRY on the non-idempotent acquire) with a **1-day** hold; the admin
> endpoint is **audited + `describe()`/armed-gate guarded** behind
> `WORKFLOWS;;READ`/`WRITE`; and `admin.workflowDecision.listActiveDecisionGates`
> backs an operator page. Still open: the held item keeps the **paid order** in
> `PROCESSING` until resolved/timed-out (blocks sibling refunds) — a structural
> property of the order barrier, tune the timeout accordingly.

## How to read this

**Three tools, picked per site:**
- `runWithDecisionGate` — a failure should **alert + wait for an operator decision**
  (PROCEED / RETRY / CANCEL / RESPOND) instead of dead-ending. Needs a *resolver*.
- `escalatingPoll` — a long poll that **retries forever or could hang** wants a
  short→long cadence with a hard deadline (and an optional interrupt).
- `raceWith` — a wait that should also end when an **external condition** becomes
  true (poll detects the state), no operator needed. Composes with the gate.

**The resolver dependency (read first).** A `runWithDecisionGate` only helps if the
decision can be sent. Either a `raceWith` auto-resolver, or the generic admin
endpoint **`admin.workflowDecision.sendDecision` / `getArmedGates`** (gated by
`Permission.HIGH_RISK`). Without one, a gate just adds a timeout-wait before
failing — *worse* than failing fast. The admin endpoint now exists, so any gate
is resolvable.

**Replay safety.** Every adoption must be `workflow.patched('<id>')`-gated: live
runs (some multi-day) keep the original path; only new runs take the gate. See
the changeNameservers / processOrderItem diffs for the pattern.

**Status legend:** ✅ done · ⭐ recommended next · ◻️ candidate · 🧪 reference-only (already handled).

---

## A. Failure → operator decision (`runWithDecisionGate`)

| Status | Workflow | Site | Today | Notes |
|---|---|---|---|---|
| ✅ | `change-nameservers.workflow.ts` | set+verify, ~L200 | throws on FAILED/timeout | gated `change-nameservers-decision-gate`; ADMIN PROCEED/RETRY/CANCEL, 3-day |
| ✅ | `processOrderItem.workflow.ts` | per item-type child, ~L130/185 | marks item FAILED + throws | gated `process-order-item-decision-gate`; **CANCEL/RESPOND only**, 1-day |
| ✅ | `domain-ownership/prepare-domain-for-export.workflow.ts` | EPP unlock, ~L135 | threw on unlock failure → stuck state | gated `prepare-export-decision-gate`; PROCEED/RETRY/CANCEL/RESPOND — RETRY re-checks the lock (idempotent), self-resolves on out-of-band unlock |
| ◻️ | `domain-ownership/sld-register-or-import.workflow.ts` | `defineSignal('nextAction')` L39, `condition` L184 (no timeout) | hand-rolled signal loop, **no timeout** | consolidation: replace with the gate; near-duplicate of epp |
| ◻️ | `domain-ownership/epp-register-or-import.workflow.ts` | `createNextActionManager` L782, `defineSignal('nextAction')` L51 | the pattern this helper generalized | consolidation + `raceWith` for the unlock poll (L391); keep `legacySignals` bridge for senders. Works today → lower urgency |
| ◻️ | `bulk-burn-expired-domains.workflow.ts` | approval `condition` L199 | times out → implicit proceed | already has approve/cancel signals; gate would make PROCEED/CANCEL explicit + audited |
| ◻️ | `backfill-nft-wallet-users.workflow.ts` | confirm `condition` L138 (**no timeout**) | blocks forever on signal | low priority; gate adds a timeout + clean cancel |
| ◻️⚠️ | `charge-user-and-create-payment.workflow.ts` / `multi-charge.workflow.ts` | nonRetryable failures (4 each) | throws → upstream refund | money flow — **retry is not idempotent**; only a CANCEL/RESPOND gate is safe, not RETRY. Evaluate carefully |
| ◻️ | `x402/process-x402-purchase.workflow.ts` | `settlementSignal` L57; settle wait + nonRetryable L233/L338 | signal-or-poll for settlement | already signal-driven; a gate could front the terminal failures |

---

## B. Long polls that retry forever / could hang (`escalatingPoll` / `raceWith`)

| Status | Workflow | Activity | Config | Notes |
|---|---|---|---|---|
| ⭐ | `domain-ownership/epp-register-or-import.workflow.ts` | `pollRegisterOrImportDomainOperationStatus` (IMPORT) | `maximumAttempts: undefined`, 1h→4h | unbounded; `escalatingPoll` with a hard deadline + interrupt on the existing signal |
| ◻️ | `enable-dnssec.workflow.ts` | `pollDsRecordAssociationStatus` | `maximumAttempts: undefined` (L82), wrapped in `pollWithTimeoutAlert` (L229) | already alert+fail; `escalatingPoll` adds cadence + interrupt |
| ◻️ | `disable-dnssec.workflow.ts` | `pollDsRecordRemovalStatus` (L211), `pollDsRecordRemovalPropagation` (L242) | `maximumAttempts: undefined` (L81), wrapped | same as enable-dnssec |
| ◻️ | `domain-ownership/extend-registration.workflow.ts` | `pollEppExtendRegistrationStatus` (L384), `pollAndExpectExpirationChange` (L404) | bounded (20 / 30 attempts) | add an alert at the midpoint if the first poll is slow |
| ◻️ | `domain-ownership/prepare-domain-for-export.workflow.ts` | `pollRegistrarOperationStatus` (L119), `pollAndExpectEppLockStateChange` (L132) | bounded (20) | add alert thresholds; pairs with the gate above |
| ◻️ | `monitor-stripe-refund-status.workflow.ts` | `Promise.race([signal, sleep])` L71 | escalating 1m→1d, **no hard deadline** | `escalatingPoll` with a 7-day deadline |
| ◻️ | `mint.workflow.ts` | gas-escalation `for` loop L46 | flow-level retry, `maximumAttempts: 1` per activity | add a timeout alert if a tx hangs beyond a threshold |

---

## B+. Long-poll fail/timeout → decision gate (idempotency verdicts)

The remaining "long polling actions that might fail or timeout" (#3). Each poll
throws on `FAILED`/`ERROR` or (via `pollWithTimeoutAlert`) on timeout. Whether a
gate may offer **RETRY** depends entirely on whether re-running the wrapped
operation is idempotent — the same constraint that drove `processOrderItem` to
CANCEL/RESPOND-only. RESPOND payload is `void` for all of these (the wrapped
actions return nothing; RESPOND just resolves "done").

| Workflow / poll | Operation idempotent on RETRY? | Recommended gate actions |
|---|---|---|
| `enable-dnssec` — `pollDsRecordAssociationStatus` | ✅ Yes — associating the same DS record is convergent | `PROCEED/RETRY/CANCEL` (wrap associate+verify; CANCEL keeps the existing zone-signing rollback) |
| `disable-dnssec` — `pollDsRecordRemovalStatus`, `pollDsRecordRemovalPropagation` | ✅ Yes — DS removal is terminal/idempotent | `PROCEED/RETRY/CANCEL` |
| `deferred-associate-delegation-signer` — `pollAuthoritativeDs…`, `pollPublicDns…` | ✅ Yes (DS association) — but already has 2h/48h `pollWithTimeoutAlert` | low priority; gate only adds the human-retry branch |
| `extend-registration` — `pollEppExtendRegistrationStatus`, `pollAndExpectExpirationChange` | ❌ **No** — re-running a renewal **double-extends** (adds years again) | **CANCEL/RESPOND only** — never RETRY |
| `epp-register-or-import` — `pollRegisterOrImportDomainOperationStatus` | ❌ **No** — re-register/re-transfer (same hazard as acquire) | **CANCEL/RESPOND only**; also `escalatingPoll` to bound the unbounded IMPORT poll |
| `pollRegistrarOperationStatus` in `changeNameservers` / `prepare-export` | (convergent) | ✅ already gated |

**Takeaway:** the DNSSEC polls (enable/disable, deferred) are the clean RETRY-safe
gate adoptions. The renewal and register/import polls must stay **CANCEL/RESPOND-only**
(re-running mutates billing/ownership), and the unbounded IMPORT poll also wants an
`escalatingPoll` hard deadline. None of these RESPOND payloads carry data (all `void`).

## C. `raceWith` composition (auto-resolve + gate)

- **`epp-register-or-import` unlock** is the canonical case: race the unlock poll
  (`pollAndExpectEppLockStateChange`, L391) against the signal — proceed the moment
  the domain is detected unlocked, no operator input. Already implemented by hand;
  fold into `waitForDecision({ raceWith })` when epp adopts the gate.
- Any future gate whose blocker can clear on its own (propagation, on-chain
  confirmation) should pass a `raceWith` so it self-heals without an operator.

---

## D. Already well-handled (reference, low priority) 🧪

- `deferred-associate-delegation-signer.workflow.ts` — 2-phase `pollWithTimeoutAlert`
  (authoritative 2h alert, public-DNS 48h; L169/L188, `maximumAttempts: undefined`
  L102). The best existing alert+timeout reference; `escalatingPoll` would only add
  cadence.
- `change-nameservers`, `enable-dnssec`, `disable-dnssec` — on `pollWithTimeoutAlert`
  already; the human branch is the only thing a gate adds (changeNameservers now has it).

---

## Existing signal/decision points (context)

These already implement bespoke decision/escalation loops — relevant as
consolidation targets or references:

| Workflow | Signal | Shape |
|---|---|---|
| `epp-register-or-import` | `nextAction` (L51) | signal + poll race + 7-day timeouts |
| `sld-register-or-import` | `nextAction` (L39) | signal loop, no timeout |
| `bulk-burn-expired-domains` | `bulkBurnApproval` / `bulkBurnCancel` (L24/27) | approval gate |
| `monitor-stripe-refund-status` | `stripeRefundStatusUpdate` (L38) | status signal + escalating poll |
| `monitor-incident-ticket` | `incidentResolved` (L7) | escalating alert + signal (`Promise.race` L69) |
| `mint-dev-signup-nfsc` | `devSignupWalletLinked` (L7) | signal-or-poll, 3-day (`condition` L120) |
| `backfill-nft-wallet-users` | `backfillNftWalletUsersConfirm` (L11) | confirm gate, no timeout |
| `x402/process-x402-purchase` | `settlementSignal` (L57) | settle signal-or-poll |

---

## Recommended sequence

1. ✅ `changeNameservers` (reference) and ✅ `processOrderItem` — done.
2. ⭐ `prepare-domain-for-export` EPP-unlock dead-end — highest-value gate gap
   (currently leaves a domain in a stuck state).
3. ⭐ `epp-register-or-import` import poll → `escalatingPoll` with a hard deadline;
   then fold its hand-rolled `nextAction` loop into the gate + `raceWith`, and
   consolidate `sld-register-or-import` onto the same path.
4. ◻️ DNSSEC polls (`enable`/`disable`) → `escalatingPoll` for cadence + interrupt.
5. ◻️ `monitor-stripe-refund` deadline; `extend-registration` / `prepare-export`
   poll alert thresholds.
6. ⚠️ Payment flows (`charge-user`, `multi-charge`) — only with CANCEL/RESPOND
   semantics (never blind RETRY); needs product sign-off on holding an order.

## Cross-cutting reminders

- **Patch-gate every adoption** (`workflow.patched('<workflow>-decision-gate')`).
- **Wire the resolver**: rely on the generic `admin.workflowDecision.*` endpoint,
  or a `raceWith` auto-resolver. A gate with neither is a regression.
- **Behavior change**: a gate holds the workflow (and anything awaiting it) until
  resolved or timed out. For orders/payments that means a held order — tune the
  timeout and confirm the product expectation before adopting.
- **Idempotency for RETRY**: only expose RETRY where re-running the action is safe
  (child workflows with deterministic ids + `ALLOW_DUPLICATE` are; raw charges are not).
