# Postmortem: duplicate on-chain sends (double mint / double charge)

Blameless RCA of why the legacy mint/charge send path occasionally broadcast the
**same logical operation twice on-chain**, and how the pinned-nonce staggered-send
race structurally prevents it.

## Symptom (evidence)

From `docs/postmortem/`:

- **`Duplicated NFSC Workflow Charge.csv`** — 9
  payments where a single `charge-user.workflow` produced **2–3 distinct, all-mined
  tx hashes** (max `duplicate_count = 3`). One logical charge, several confirmed
  transactions.
- **`Failed Due to attempted double mint.csv`** — a charge whose **second** send
  failed with "user only had 1 NFSC by the time we attempt second send… balance is
  not enough." The second attempt failing *on balance* proves a **first** send had
  already succeeded and spent it — i.e. two sends were attempted for one charge.

The common shape: **multiple confirmed transactions at different nonces for one
operation.** That can only happen if the same op was broadcast more than once and
the broadcasts did **not** replace each other.

## Root cause

The legacy path was an activity that **both broadcast and waited for
confirmations**, wrapped by a **flow-level retry loop that re-sent on timeout**,
with the nonce **re-derived from chain on every attempt instead of pinned**. Three
properties combined into a double-send:

1. **Send and confirm were one activity.** `signAndSendTransaction` called
   `walletClient.sendTransaction(...)` (tx now live in the mempool) and then
   `waitForTransactionReceipt({ confirmations: 3, timeout })` in the *same*
   activity. The activity was proxied with `startToCloseTimeout` and
   `maximumAttempts: 1`.

2. **A timeout meant "slow-but-live", but was treated as "retry the send".** When
   3 confirmations didn't arrive in time, Temporal surfaced a `TimeoutFailure`.
   The broadcast tx was **still alive** in the mempool. The retry loop caught the
   timeout, bumped the gas multiplier, and `continue`d — **without** knowing the
   in-flight tx hash and **without** cancelling/replacing it. (It also retried on
   any generic error after a 15s sleep, and on `NONCE_EXPIRED`.)

3. **The nonce was read fresh each attempt at `blockTag: 'latest'`, not pinned.**
   The activity did `getTransactionCount(address)` (viem/ethers default `latest` =
   *confirmed* count) and set `tx.nonce` from it, recomputed on every retry.

The double-send sequence:

```
Attempt 0: read nonce N (latest) → broadcast TX_A @ N (low gas) → wait for 3 confs
           TX_A is slow; activity exceeds startToClose → TimeoutFailure
           loop: bump gas, continue   (TX_A still live, hash not retained)
   …TX_A MINES in the gap…            (confirmed count advances to N+1)
Attempt 1: read nonce N+1 (latest)  → broadcast TX_B @ N+1 (higher gas)
           TX_A @ N  AND  TX_B @ N+1  both confirm  →  DOUBLE SEND
```

The escalating-gas bump was *intended* as a replacement, and it **is** a
replacement in the sibling case where the retry reads the nonce **before** TX_A
mines (count still `N` → same-nonce → `REPLACEMENT_UNDERPRICED`). But once the
first tx mines, "read latest + re-send" naturally advances to the **next** nonce,
producing an **independent** transaction rather than a replacement. The
orchestration layer never held TX_A's hash (the activity returned the hash **only
on the success path**), so it had nothing to reconfirm or dedup against — it could
only blindly re-send. Concurrency made it worse: two charge workflows for the same
signer had no cross-process serialization on the read→send window.

### Provenance (history)

The send/confirm-in-one-activity shape and the retry wrapper were designed in the **`namefi-api`** repo by xinbenlv, and ported over to `namefi-astra`:

- `signAndSendTransaction` (read-nonce → send → `wait(3)` confs, hash returned only
  on `SUCCESS`) was introduced 2025-01-31 in `3fb5c5530` ("(Option 2) add Mint Nfsc
  flow") —
  [mint.activities.service.ts#L81-L156](https://github.com/d3servelabs/namefi-api/blob/3fb5c5530ecaadf48c77fe2b3f11d5021be63e13/src/temporal/activities/mint.activities.service.ts#L81-L156).
- the shared `_signAndSendTransactionWithRetry` flow-level retry loop in
  `2d9ceddb1` ("wip: refactor to shared _signAndSendTransactionWithRetry") —
  [mint.flows.ts#L6-L40](https://github.com/d3servelabs/namefi-api/blob/2d9ceddb141a5e8012a0cc93bc87a27943ccba00/src/temporal/workflows/mint.flows.ts#L6-L40).
- a later "fix the timeout potential stall" patch in `5f933d2ef`.

It was subsequently ported into `namefi-astra` (`87ad49f5f` onward) by samishal1998 and
tidied/refactored, but the **structural shape was preserved**: a single activity
that waited for confirmations, surfaced the tx hash only on success, and a retry
that re-sent without a pinned nonce. The decision that mattered most was returning
the hash only on success — with no in-flight hash carried up to the workflow, the
retry layer had no way to *reconfirm* a slow send instead of re-broadcasting it.

## Why the new design prevents it

The pinned-nonce staggered-send race (`shared/workflow-helpers/staggered-send-race.ts`
+ `activities/shared/eth-tx-primitives.ts` + `workflows/send-and-confirm-tx.workflow.ts`
+ `workflows/cross-candidate-confirm.workflow.ts`) closes each gap:

1. **One pinned nonce, reused for every replacement.** The nonce is read **once**
   per round and reused for all escalating-gas attempts. Ethereum mines **≤1 tx per
   `(account, nonce)`**, so every replacement competing at the *same* nonce can
   never double-mine within a round. *(staggered-send-race.ts header + the per-round
   pin; this is the structural fix.)*

2. **Pin at `blockTag: 'pending'`.** `getPendingSignerNonce` reserves the next free
   slot including in-flight txs, so a pin can't collide with our own pending tx.
   *(eth-tx-primitives.ts:185–188)*

3. **Send is split from confirm.** `sendPreparedTransaction` broadcasts with the
   explicit pinned nonce and **returns the hash immediately — it never waits**.
   Confirmation is a separate read-only poll. A slow confirmation therefore can
   **never** look like a failed send, so it never triggers a re-broadcast.
   *(eth-tx-primitives.ts `sendPreparedTransaction` / `getTransactionConfirmation`)*

4. **"Still pending" is benign, not a failure.** A per-attempt child polls its own
   hash and returns `STILL_PENDING` when its window elapses — explicitly **not** a
   workflow failure — handing the verdict to the parent.
   *(send-and-confirm-tx.workflow.ts)*

5. **Every broadcast hash is tracked.** All child hashes accumulate in
   `allCandidateHashes`; the parent's authoritative cross-candidate poll reconfirms
   over the **whole set**, so a slow winner is never mistaken for a loss — the exact
   "we lost the hash" gap from the old design. *(staggered-send-race.ts:382, 559;
   cross-candidate-confirm.workflow.ts)*

6. **Never fail or re-pin while the nonce is still pending.** The race keeps
   batching at the same nonce, then (gas maxed) waits, then hands off to a
   stuck-pending **admin gate** — it never abandons a live tx and re-pins, which is
   what produced a second nonce before. *(staggered-send-race.ts `runRoundStage`)*

7. **Re-pin only on a *proven* foreign steal, with an already-sent precheck.** A
   fresh nonce is only pinned when a foreign tx demonstrably took the slot
   (`LOST_FOREIGN`), and before re-pinning the race asks "did our calldata already
   land?" — an idempotency guard against re-pinning into a duplicate.
   *(precheckAlreadySentStage)*

8. **Distributed signer-nonce lock.** With `lock: { enabled: true }`, the race
   acquires a cross-process Redis lock on `eip155:<chainId>:<signer>` before the
   first pin and holds it (heartbeat-refreshed) across all re-pins — serializing the
   read→send window across concurrent workflows/pods, closing the concurrent-charge
   race. *(staggered-send-race.ts:868+; nonce-lock activities/heartbeat)*

9. **Double-commit reconciler as a backstop.** If, despite all of the above, two of
   our hashes confirm across rounds (e.g. an RPC-lagged prior-round tx mining late),
   the cross-round reconfirm detects `MULTIPLE_CONFIRMED` and `onDoubleCommit`
   reconciles (autofix void / admin / critical alert + audit ticket).

### Residual paths (and how they're netted)

The remaining ways two hashes could ever both land are bounded and netted, not
silently possible: a child that crashed/non-benignly failed *after* the node
accepted a broadcast is flagged `possiblyOrphaned` (so empty candidates are never
read as "nothing sent"); a cross-round late-miner is caught by the double-commit
reconciler; and a genuinely stuck tx is escalated to a human rather than abandoned.
None of these re-broadcasts blindly at a new nonce.

## Appendix — the offending code (permalinks + snippets)

All permalinks are pinned to the introducing/affected commit (not a branch), so the
line anchors are stable.

### 1. Origin — `namefi-api`, the send-and-wait activity (hash only on success)

[`signAndSendTransaction` @ `3fb5c5530` · mint.activities.service.ts#L81-L156](https://github.com/d3servelabs/namefi-api/blob/3fb5c5530ecaadf48c77fe2b3f11d5021be63e13/src/temporal/activities/mint.activities.service.ts#L81-L156)

```ts
async signAndSendTransaction(tx: PopulatedTransaction, chainId: number): Promise<TxSendResult> {
  // nonce read fresh from chain (ethers v5 default blockTag = 'latest' = confirmed count)
  nonce = await this.providers[chainId].getTransactionCount(signerAddress);   // L88
  tx.nonce = nonce;                                                           // L96
  ...
  txResponse = await this.providers[chainId].sendTransaction(signedTx);       // L136 — broadcast, live in mempool
  ...
  await txResponse.wait(3);                                                   // L146 — SAME activity waits 3 confs
  return { status: 'SUCCESS', txHash: txResponse.hash };                      // L149-150 — hash ONLY on success
  // catch → return { status: 'FAILED_TO_WAIT_FOR_TRANSACTION', error };      // L155 — on timeout the hash is DROPPED
}
```

The dropped hash is the crux: a slow-but-live broadcast leaves the orchestration
layer with **nothing to reconfirm**, so it can only blind-retry.

### 2. Origin — `namefi-api`, the flow-level retry wrapper

[`_signAndSendTransactionWithRetry` @ `2d9ceddb1` · mint.flows.ts#L6-L40](https://github.com/d3servelabs/namefi-api/blob/2d9ceddb141a5e8012a0cc93bc87a27943ccba00/src/temporal/workflows/mint.flows.ts#L6-L40)

```ts
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const sendResult = await signAndSendTransaction(tx, chainId); // re-reads nonce + re-broadcasts each attempt
  switch (sendResult.status) {
    case 'SUCCESS': return sendResult.txHash;
    case 'GAS_PRICE_TOO_LOW':
      await workflow.sleep('15 seconds'); continue;             // retry the SEND — no pinned nonce, no in-flight hash
    ...
  }
}
```

### 3. As shipped here — `namefi-astra` (the code that ran in prod for the incidents above)

Pre-staggered baseline `9986b9c40`.

[retry-on-timeout · mint.workflow.ts#L49-L102](https://github.com/d3servelabs/namefi-astra/blob/9986b9c40474515d4b2385cf051c243e4e1ca094/apps/backend/src/temporal/workflows/mint.workflow.ts#L49-L102)

```ts
sendResult = await signAndSendTransaction(tx, chainId, TIMEOUT_IN_MS, gasPriceMultiplier);
} catch (error) {
  if (error instanceof workflow.TimeoutFailure) {            // L56 — timeout == slow-but-LIVE tx
    gasPriceMultiplier = incrementGasPriceMultiplier(gasPriceMultiplier, maxGasPriceMultiplier);
    continue;                                                // re-send WITHOUT the in-flight hash, WITHOUT pinning the nonce
  }
  await workflow.log.error(`Failed to sign and send transaction: ${error}`);
  await workflow.sleep('15 seconds');
  continue;                                                  // L68 — retry on ANY error, even post-broadcast
}
```

[nonce read at `latest` + send + wait(3) in one activity · mint.activities.ts](https://github.com/d3servelabs/namefi-astra/blob/9986b9c40474515d4b2385cf051c243e4e1ca094/apps/backend/src/temporal/activities/mint/mint.activities.ts#L160-L177)
· [send](https://github.com/d3servelabs/namefi-astra/blob/9986b9c40474515d4b2385cf051c243e4e1ca094/apps/backend/src/temporal/activities/mint/mint.activities.ts#L266-L294)
· [waitForTransactionReceipt](https://github.com/d3servelabs/namefi-astra/blob/9986b9c40474515d4b2385cf051c243e4e1ca094/apps/backend/src/temporal/activities/mint/mint.activities.ts#L296-L308)

```ts
const [nonceError, nonce] = await resolve(
  publicClient.getTransactionCount({ address: walletClient.account.address }), // L166 — no blockTag → viem default 'latest'
);
preparedTx.nonce = nonce;                                                       // L177 — fresh each attempt, NOT pinned
...
const [sendError, txHash] = await resolve(walletClient.sendTransaction({ ...preparedTx })); // L267
...
const [waitError] = await resolve(
  publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 3, timeout: timeoutInMs }), // L297 — same activity waits
);
```

### 4. The fix — `namefi-astra`

Pinned to `e2c501cc7` ("fix(mint): never fail or release the signer lock while a tx
may be pending"); the cross-candidate confirm was later extracted into its own child
workflow on the working branch.

- [`staggered-send-race.ts`](https://github.com/d3servelabs/namefi-astra/blob/e2c501cc70ff2a2d86bdae305ae25c330efcd9e7/apps/backend/src/temporal/shared/workflow-helpers/staggered-send-race.ts)
  — pinned nonce reused for every replacement, never-fail-while-pending, distributed lock, cross-candidate authority, double-commit reconciler.
- [`eth-tx-primitives.ts`](https://github.com/d3servelabs/namefi-astra/blob/e2c501cc70ff2a2d86bdae305ae25c330efcd9e7/apps/backend/src/temporal/activities/shared/eth-tx-primitives.ts)
  — `sendPreparedTransaction` broadcasts with the explicit pinned nonce and returns immediately (never waits); `getPendingSignerNonce` pins at `blockTag: 'pending'`; `getTransactionConfirmation` is a separate read-only poll.
- [`send-and-confirm-tx.workflow.ts`](https://github.com/d3servelabs/namefi-astra/blob/e2c501cc70ff2a2d86bdae305ae25c330efcd9e7/apps/backend/src/temporal/workflows/send-and-confirm-tx.workflow.ts)
  — one attempt per child: send once, poll own hash, `STILL_PENDING` is benign.

## One-line takeaway

Old: *one activity sent **and** waited, a timeout looked like a failed send, and the
retry re-read `latest` and re-sent — so once the slow first tx mined, the retry took
the next nonce and both confirmed.* New: *one pinned nonce reused for all
replacements, send split from confirm, every hash tracked and reconfirmed, never
re-pin while pending, and a distributed lock across workflows — so a duplicate
on-chain send is structurally impossible within a round and netted across rounds.*
