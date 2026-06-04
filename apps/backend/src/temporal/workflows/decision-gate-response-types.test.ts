import {
  decisionGateResponseSchemas,
  expirationIsoSchema,
  operationStatusSchema,
  processOrderItemGateResponseSchema,
} from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import type {
  ExpirationIsoResponse,
  OperationStatusResponse,
  ProcessOrderItemGateResponse,
} from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import type { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import { describe, expect, it } from 'vitest';
import type {
  pollAndExpectExpirationChange,
  pollEppExtendRegistrationStatus,
  pollRegisterOrImportDomainOperationStatus,
} from '../activities/domain/registrar.activities';
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

type IsAssignable<A, B> = [A] extends [B] ? true : false;

/** One-directional: every value of `A` is a valid `B` (A ⊆ B). */
function assertAssignable<A, B>(_ok: IsAssignable<A, B>): void {
  // Type-level assertion only — no runtime behavior.
}

// `process-order-item` gate ⇔ AcquireDomainWorkflowOutput
assertMutuallyAssignable<
  ProcessOrderItemGateResponse,
  AcquireDomainWorkflowOutput
>(true);

// poll-wrapping gates' RESPOND payload ⇔ registrar OperationStatus (the type
// returned by pollRegistrarOperationStatus / pollDsRecord* / pollEppExtend...)
assertMutuallyAssignable<OperationStatusResponse, OperationStatus>(true);

// register/import poll gate: the synthesized result the admin RESPONDs feeds the
// `.status` of pollRegisterOrImportDomainOperationStatus's result.
assertMutuallyAssignable<
  OperationStatusResponse,
  Awaited<
    ReturnType<typeof pollRegisterOrImportDomainOperationStatus>
  >['status']
>(true);

// extend-epp-status-poll gate: the gate maps the activity's `{ status }` result
// to a bare OperationStatus. The activity narrows status to its terminal cases,
// so it is a subset of the RESPOND value space (one-directional).
assertAssignable<
  Awaited<ReturnType<typeof pollEppExtendRegistrationStatus>>['status'],
  OperationStatusResponse
>(true);

// extend-expiration-poll gate ⇔ pollAndExpectExpirationChange's ISO-string result
assertMutuallyAssignable<
  ExpirationIsoResponse,
  Awaited<ReturnType<typeof pollAndExpectExpirationChange>>
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

  it('validates OperationStatus RESPOND payloads for the registrar poll gates', () => {
    expect(operationStatusSchema.parse('SUCCESSFUL')).toBe('SUCCESSFUL');
    expect(operationStatusSchema.parse('FAILED')).toBe('FAILED');
    expect(() => operationStatusSchema.parse('NOPE')).toThrow();
    // The registrar register/import + EPP-extend gates all use this schema.
    expect(decisionGateResponseSchemas['register-or-import-poll']).toBe(
      operationStatusSchema,
    );
    expect(decisionGateResponseSchemas['extend-epp-status-poll']).toBe(
      operationStatusSchema,
    );
  });

  it('validates the ISO-8601 expiration RESPOND payload', () => {
    const iso = '2027-06-03T00:00:00.000Z';
    expect(expirationIsoSchema.parse(iso)).toBe(iso);
    expect(() => expirationIsoSchema.parse('2027-06-03')).toThrow();
    expect(() => expirationIsoSchema.parse('not-a-date')).toThrow();
    expect(decisionGateResponseSchemas['extend-expiration-poll']).toBe(
      expirationIsoSchema,
    );
  });
});
