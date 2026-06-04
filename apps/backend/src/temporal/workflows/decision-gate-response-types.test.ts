import { processOrderItemGateResponseSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import type { ProcessOrderItemGateResponse } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import { describe, expect, it } from 'vitest';
import type { AcquireDomainWorkflowOutput } from './domain-ownership/acquire-domain.workflow';

/**
 * Compile-time guarantee that each decision-gate RESPOND payload schema (defined
 * in the admin contract, used by the frontend AND as the workflow's
 * `validateResponse`) stays in sync with the workflow action output type the
 * gate wraps. If a wrapped output type drifts from its contract schema, this
 * file fails `bun run typecheck`.
 *
 * Pattern: `assertMutuallyAssignable<ContractType, TemporalType>(true)` — the
 * `true` argument only type-checks when the two types are mutually assignable.
 */

type IsMutuallyAssignable<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

function assertMutuallyAssignable<A, B>(_ok: IsMutuallyAssignable<A, B>): void {
  // Type-level assertion only — no runtime behavior.
}

// `process-order-item` gate ⇔ AcquireDomainWorkflowOutput
assertMutuallyAssignable<
  ProcessOrderItemGateResponse,
  AcquireDomainWorkflowOutput
>(true);

describe('decision-gate RESPOND payload contracts', () => {
  it('keep contract schemas in sync with wrapped workflow outputs', () => {
    // The real assertions above are at compile time; this keeps the file in the
    // test run and sanity-checks the schema parses representative payloads.
    expect(
      processOrderItemGateResponseSchema.parse({ mintTxHash: '0xabc' }),
    ).toEqual({ mintTxHash: '0xabc' });
    expect(processOrderItemGateResponseSchema.parse({})).toEqual({});
    expect(() =>
      processOrderItemGateResponseSchema.parse({ mintTxHash: 123 }),
    ).toThrow();
  });
});
