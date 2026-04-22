import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { recordSchema, recordTypeEnum } from '@namefi-astra/zod-dns';
import { z } from 'zod';

import { createContract } from './create-contract';
import {
  dnsRecordSchema as baseDnsRecordSchema,
  type DnsRecordSelect,
} from './entity-schemas';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the DNS records router.
 *
 * Every procedure has a `type` of `'query'` or `'mutation'` and explicit
 * input/output zod schemas. The router implementation (in
 * `apps/backend/src/trpc/routers/dnsRecordsRouter.ts`) is type-checked
 * against this contract via `createContractTRPCRouter<typeof dnsRecordsContract>`.
 *
 * The contract deliberately knows nothing about authentication or
 * middleware — those are decided at the procedure-definition site in the
 * router file. This file lives in `@namefi-astra/common` so the same
 * contract types can be consumed by the frontend (e.g. via
 * `ContractRouter<typeof dnsRecordsContract>` to get an `AppRouter`-style
 * type for `inferRouterInputs`).
 */

// ---------------------------------------------------------------------------
// Shared input schemas (also used directly by the backend service layer)
// ---------------------------------------------------------------------------

export const updateRecordInputSchema = z.object({
  id: z.string(),
  zoneName: namefiNormalizedDomainSchema,
  type: recordTypeEnum.optional(),
  name: z.string().optional(),
  rdata: z.string().optional(),
  ttl: z.number().optional(),
});

export const createRecordInputSchema = z.object({
  type: recordTypeEnum,
  name: z.string(),
  rdata: z.string(),
  ttl: z.number().int().min(0).max(2147483647),
  zoneName: namefiNormalizedDomainSchema,
});

// ---------------------------------------------------------------------------
// Per-procedure input schemas
// ---------------------------------------------------------------------------

const zoneNameInputSchema = z.object({
  zoneName: namefiNormalizedDomainSchema,
});

const deleteRecordInputSchema = z.object({
  id: z.string(),
  zoneName: namefiNormalizedDomainSchema,
});

const updateRecordsInputSchema = z.object({
  records: z.array(updateRecordInputSchema.omit({ zoneName: true })),
  zoneName: namefiNormalizedDomainSchema,
});

const createRecordsInputSchema = z.object({
  records: z.array(recordSchema),
  zoneName: namefiNormalizedDomainSchema,
});

const deleteRecordsInputSchema = z.object({
  recordsIds: z.array(z.string()),
  zoneName: namefiNormalizedDomainSchema,
});

const parkDomainInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  overrideExistingRecords: z.boolean().optional(),
});

const isDomainParkedInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const dnssecProgressInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

// ---------------------------------------------------------------------------
// Output schemas
// ---------------------------------------------------------------------------

const successAckSchema = z.object({
  success: z.literal(true),
});

export const dnsRecordSchema = baseDnsRecordSchema;
export type { DnsRecordSelect };

// ---------------------------------------------------------------------------
// Workflow progress shared schemas
// ---------------------------------------------------------------------------

/**
 * Mirror of `WorkflowExecutionStatusName` from `@temporalio/client`, plus
 * the `'NOT_FOUND'` literal we add when the workflow handle cannot be
 * described. Kept as an inline literal union so common does not need a
 * direct dep on `@temporalio/client`.
 */
const workflowStatusSchema = z.union([
  z.literal('UNSPECIFIED'),
  z.literal('RUNNING'),
  z.literal('COMPLETED'),
  z.literal('FAILED'),
  z.literal('CANCELLED'),
  z.literal('TERMINATED'),
  z.literal('CONTINUED_AS_NEW'),
  z.literal('TIMED_OUT'),
  z.literal('UNKNOWN'),
  z.literal('NOT_FOUND'),
]);

const workflowStepStatusSchema = z.union([
  z.literal('PENDING'),
  z.literal('IN_PROGRESS'),
  z.literal('COMPLETED'),
  z.literal('FAILED'),
  z.literal('SKIPPED'),
]);

const stepWorkflowInfoSchema = z.object({
  workflowId: z.string(),
  runId: z.string(),
  progressQueryName: z.string(),
});

// `WorkflowStep` is recursive (steps may have substeps). Use `z.lazy` once,
// reused by every progress payload schema below.
type WorkflowStepShape = {
  id: string;
  status: z.infer<typeof workflowStepStatusSchema>;
  startedAt?: number;
  completedAt?: number;
  message?: string;
  nestedWorkflow?: z.infer<typeof stepWorkflowInfoSchema>;
  substeps?: WorkflowStepShape[];
};

const workflowStepSchema: z.ZodType<WorkflowStepShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    status: workflowStepStatusSchema,
    startedAt: z.number().optional(),
    completedAt: z.number().optional(),
    message: z.string().optional(),
    nestedWorkflow: stepWorkflowInfoSchema.optional(),
    substeps: z.array(workflowStepSchema).optional(),
  }),
);

const workflowProgressStateSchema = z.object({
  steps: z.array(workflowStepSchema),
  phase: z.union([
    z.literal('RUNNING'),
    z.literal('COMPLETED'),
    z.literal('FAILED'),
  ]),
  error: z.string().optional(),
  timestamps: z.object({
    startedAt: z.number(),
    lastUpdatedAt: z.number(),
    completedAt: z.number().optional(),
  }),
});

const workflowProgressPayloadBase = z.object({
  workflowStatus: workflowStatusSchema,
  runId: z.string().nullable(),
  state: workflowProgressStateSchema.nullable(),
  domainName: z.string(),
  fetchedAt: z.string(),
});

const enableDnssecProgressPayloadSchema = workflowProgressPayloadBase;
const disableDnssecProgressPayloadSchema = workflowProgressPayloadBase;
const changeNameserversProgressPayloadSchema =
  workflowProgressPayloadBase.extend({
    workflowType: z
      .union([z.literal('change-nameservers'), z.literal('reset-nameservers')])
      .nullable(),
  });

export type EnableDnssecProgressPayload = z.infer<
  typeof enableDnssecProgressPayloadSchema
>;
export type DisableDnssecProgressPayload = z.infer<
  typeof disableDnssecProgressPayloadSchema
>;
export type ChangeNameserversProgressPayload = z.infer<
  typeof changeNameserversProgressPayloadSchema
>;

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const dnsRecordsContract = createContract(
  { softOutput: true },
  {
    getRecords: {
      type: 'query',
      input: zoneNameInputSchema,
      output: z.array(dnsRecordSchema),
    },

    createDnsRecord: {
      type: 'mutation',
      input: createRecordInputSchema,
      output: dnsRecordSchema,
    },

    updateRecord: {
      type: 'mutation',
      input: updateRecordInputSchema,
      output: dnsRecordSchema,
    },

    deleteRecord: {
      type: 'mutation',
      input: deleteRecordInputSchema,
      output: successAckSchema,
    },

    updateRecords: {
      type: 'mutation',
      input: updateRecordsInputSchema,
      // `batchUpdateRecords` runs N update statements and returns the updated
      // rows as a single flat array (the underlying driver call is opaque, so
      // the handler casts to this contract shape).
      output: z.array(dnsRecordSchema),
    },

    createRecords: {
      type: 'mutation',
      input: createRecordsInputSchema,
      output: z.array(dnsRecordSchema),
    },

    deleteRecords: {
      type: 'mutation',
      input: deleteRecordsInputSchema,
      output: successAckSchema,
    },

    parkDomain: {
      type: 'mutation',
      input: parkDomainInputSchema,
      // `parkDomain` itself returns `void`; the router wraps the call so the
      // wire shape is a stable success ack instead of `undefined`.
      output: successAckSchema,
    },

    isDomainParked: {
      type: 'query',
      input: isDomainParkedInputSchema,
      output: z.boolean(),
    },

    getEnableDnssecProgress: {
      type: 'query',
      input: dnssecProgressInputSchema,
      output: enableDnssecProgressPayloadSchema,
    },

    getDisableDnssecProgress: {
      type: 'query',
      input: dnssecProgressInputSchema,
      output: disableDnssecProgressPayloadSchema,
    },

    getChangeNameserversProgress: {
      type: 'query',
      input: dnssecProgressInputSchema,
      output: changeNameserversProgressPayloadSchema,
    },
  },
);

export type DnsRecordsContract = typeof dnsRecordsContract;
