import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin EPP testing sub-router (CentralNic OTE2).
 *
 * The router (`apps/backend/src/trpc/routers/admin/eppTestingRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminEppTestingContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 *
 * The router applies a `toPunycodeDomainName` transform inside its own
 * `domainNameSchema`. We mirror the pre-transform shape (`string().min(1)`)
 * here so clients send the same wire input; the router's local schema still
 * performs the transform at runtime.
 */

const domainNameInputSchema = z.object({
  domainName: z.string().min(1),
});

const createDomainInputSchema = z.object({
  domainName: z.string().min(1),
  years: z.number().min(1).max(10).default(1),
});

const requestTransferInputSchema = z.object({
  domainName: z.string().min(1),
  authCode: z.string().min(1),
});

/**
 * EPP registrar long-running operation result — shared by most mutations
 * (`createDomain`, `changeAuthCode`, `requestTransfer`, `approveTransfer`,
 * `rejectTransfer`, `lockDomain`, `unlockDomain`). Keeps the common fields
 * required so frontend consumers can read them without `?.` guards.
 */
const eppOperationResultSchema = z.object({
  success: z.boolean(),
  operationId: z.string().nullable().optional(),
  status: z.string(),
  message: z.string().optional(),
  response: z.any().optional(),
});

/**
 * `getDomainInfo` wraps the registrar response in `{ success, domain }`.
 */
const getDomainInfoResultSchema = z.object({
  success: z.boolean(),
  domain: z.any(),
});

/**
 * `changeAuthCode` returns `{ success, authCode, domainName }`.
 */
const changeAuthCodeResultSchema = z.object({
  success: z.boolean(),
  authCode: z.string(),
  domainName: z.string(),
});

/**
 * `queryTransfer` returns `{ success, hasPendingTransfer, transfer }`.
 */
const queryTransferResultSchema = z.object({
  success: z.boolean(),
  hasPendingTransfer: z.boolean(),
  transfer: z.any().nullable(),
});

/**
 * `checkAvailability` returns `{ success, available, domainName, price }`.
 * `available` is `DomainAvailability` (a registrar-package string enum,
 * not a boolean), so we keep it as `z.any()`.
 */
const checkAvailabilityResultSchema = z.object({
  success: z.boolean(),
  available: z.any(),
  domainName: z.string(),
  price: z.any(),
});

export const adminEppTestingContract = createContract(
  { softOutput: true },
  {
    createDomain: {
      type: 'mutation',
      input: createDomainInputSchema,
      output: eppOperationResultSchema,
    },
    getDomainInfo: {
      type: 'query',
      input: domainNameInputSchema,
      output: getDomainInfoResultSchema,
    },
    changeAuthCode: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: changeAuthCodeResultSchema,
    },
    queryTransfer: {
      type: 'query',
      input: domainNameInputSchema,
      output: queryTransferResultSchema,
    },
    requestTransfer: {
      type: 'mutation',
      input: requestTransferInputSchema,
      output: eppOperationResultSchema,
    },
    approveTransfer: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: eppOperationResultSchema,
    },
    rejectTransfer: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: eppOperationResultSchema,
    },
    lockDomain: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: eppOperationResultSchema,
    },
    unlockDomain: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: eppOperationResultSchema,
    },
    checkAvailability: {
      type: 'query',
      input: domainNameInputSchema,
      output: checkAvailabilityResultSchema,
    },
  },
);

export type AdminEppTestingContract = typeof adminEppTestingContract;
