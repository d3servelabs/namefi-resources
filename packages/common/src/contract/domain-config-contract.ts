import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';
import {
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
} from '@namefi-astra/zod-dns';

/**
 * Contract for the domain-config router and its nested `dnssec` sub-router.
 *
 * The top-level router (`apps/backend/src/trpc/routers/domainConfig/domainConfigRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof domainConfigContract>`. The nested dnssec
 * router (`domainDnssecRouter.ts`) is type-checked against
 * `domainConfigContract.dnssec`. Middleware (protectedProcedure,
 * signed-payload procedures, withAudit, etc.) is decided at the router
 * files — the contract only pins IO shapes.
 *
 * Most outputs are backend-only registrar/temporal types (DomainRegistration,
 * DomainSupportedFeatureResponse, WithRegistrar wrappers, etc.) and are
 * modeled with `z.custom<T>()` escape hatches.
 */

// ---------------------------------------------------------------------------
// Shared inputs
// ---------------------------------------------------------------------------

const domainNameInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const normalizedDomainNameInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

/**
 * Domain action signed-payload input (shared by change/reset nameservers,
 * request export, get auth code, approve/reject transfer). Mirror of
 * `domainActionInputSchema` in the router file.
 */
const DOMAIN_ACTION_LITERALS = [
  'APPROVE_EXPORT',
  'REJECT_EXPORT',
  'ENABLE_EXPORT',
  'CHANGE_NAMESERVERS',
  'RESET_NAMESERVERS',
  'GET_AUTH_CODE',
] as const;

const domainActionInputSchema = z.object({
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  payload: z.object({
    domainName: namefiNormalizedDomainSchema,
    action: z.enum(DOMAIN_ACTION_LITERALS),
    payload: z.string(),
    message: z.string(),
    timestamp: z.number().int().positive(),
  }),
});

const updateDomainPreferencesAndConfigInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  domainPreferencesAndConfig: z.object({
    forwardTo: z.string().optional(),
    autoEnsEnabled: z.boolean().optional(),
    autoParkEnabled: z.boolean().optional(),
    autoRenewEnabled: z.boolean().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Output escape hatches (structural types mirrored from backend / registrars)
// ---------------------------------------------------------------------------

/**
 * `getDomainDetails` returns a subdomain shape OR a `WithRegistrar<DomainRegistration>`
 * from the registrar package. We don't import the registrar types — the
 * frontend reads only a few fields, so we type them structurally and
 * leave the rest as `z.any()` to accept the backend's richer payload.
 */
const domainDetailsSchema = z.object({
  supportsDnssec: z.boolean().optional(),
  contacts: z.any().optional(),
  contactsPrivacy: z.any().optional(),
  nameservers: z.array(z.string()).optional(),
  registrarKey: z.string().optional(),
  expirationTime: z.date().optional(),
  domainName: z.string().optional(),
  creationTime: z.date().optional(),
  autoRenewOption: z.enum(['AUTOMATIC', 'MANUAL']).optional(),
});

const domainRenewalDetailsSchema = z.object({
  autoRenewEnabled: z.boolean(),
  renewable: z.boolean(),
  domainPricingDetails: z.any(),
  expirationDate: z.date().nullable(),
  maxAdditionalYears: z.number(),
  minimumPossibleRenewalYears: z.number(),
  activeRegistrationYears: z.number(),
  pendingRenewalRequest: z.boolean(),
});

const nameserversChangeWorkflowSchema = z.custom<{
  operation: string;
  workflowId: string;
  runId: string;
  workflowType: string;
  status: 'RUNNING';
}>(() => true);

/**
 * Mirror of `DomainSupportedFeatureResponse` from the router's handler
 * file — a `canAttemptRenewal` flag plus a set of feature-specific
 * `enabled / config` pairs.
 */
const baseFeatureConfigSchema = z.object({
  enabled: z.boolean(),
  config: z
    .object({
      showPanel: z.boolean(),
      message: z.string().optional(),
      redirectTo: z.string().optional(),
      redirectToLabel: z.string().optional(),
    })
    .loose(),
});

const dnssecFeatureConfigSchema = z.object({
  enabled: z.boolean(),
  config: z
    .object({
      showPanel: z.boolean(),
      message: z.string().optional(),
      redirectTo: z.string().optional(),
      redirectToLabel: z.string().optional(),
      autoManaged: z.boolean().optional(),
    })
    .loose(),
});

const domainSupportedFeaturesSchema = z.object({
  canAttemptRenewal: z.boolean(),
  isInLateRenewalPeriod: z.boolean(),
  isInGraceRestorationPeriod: z.boolean(),
  features: z.object({
    domainManagement: baseFeatureConfigSchema,
    dnsManagement: baseFeatureConfigSchema,
    nameserversManagement: baseFeatureConfigSchema,
    dnssecManagement: dnssecFeatureConfigSchema,
    domainPreferencesManagement: baseFeatureConfigSchema,
    domainExport: baseFeatureConfigSchema,
  }),
});

const domainPreferencesAndConfigSchema = z.object({
  autoRenewEnabled: z.boolean(),
  autoEnsEnabled: z.boolean(),
  autoParkEnabled: z.boolean(),
  ownerAddress: z.string(),
  forwardTo: z.string().optional(),
});

const domainExportDetailsSchema = z.object({
  supportsExport: z.boolean(),
  readyToExport: z.boolean().optional(),
  pendingRequestToEnableExport: z.boolean().optional(),
  message: z.string().optional(),
});

const getAuthCodeOutputSchema = z.object({
  authCode: z.string(),
});

// TODO(contract): replace with structural schema for NFT owner row.
const nftOwnerRowSchema = z.custom<{
  ownerAddress: string;
  chainId: number;
}>(() => true);

const getDomainOwnerWalletOutputSchema = z.object({
  ownerWalletAddress: z.string(),
  nft: nftOwnerRowSchema,
});

/**
 * Mirror of `PendingTransferInfo` from
 * `packages/registrars/src/lib/abstract-registrar/data/transfer-status.ts`.
 */
const pendingTransferSchema = z.object({
  domainName: z.string(),
  status: z.enum([
    'pending',
    'clientApproved',
    'serverApproved',
    'clientRejected',
    'serverRejected',
    'clientCancelled',
    'serverCancelled',
  ]),
  requestingRegistrarId: z.string(),
  requestDate: z.date(),
  actionRegistrarId: z.string(),
  actionDate: z.date(),
  expirationDate: z.date().optional(),
});

/**
 * `LongRunningOperationResult<any> & { registrarKey: string }` from the
 * registrar package. Same reasoning as `pendingTransferSchema`: bare
 * object so nominal registrar types assign without width-subtyping
 * friction.
 */
const transferActionResultSchema = z.object({
  registrarKey: z.string(),
});

const cancelWorkflowOutputSchema = z.object({
  success: z.boolean(),
  workflowId: z.string(),
});

// ---------------------------------------------------------------------------
// DNSSEC sub-contract
// ---------------------------------------------------------------------------

/**
 * Mirror of `DnssecStatusDetails` returned by
 * `getDomainDnssecDetails`. Two variants distinguished by whether a
 * delegation signer is configured. Frontend reads `dnssecStatus`,
 * `hasDelegationSigner`, `isUsingNamefiDelegationSigner`,
 * `zoneHasActiveDnssec`, etc. — we type those concretely and leave
 * `delegationSigners` / `zoneSigningConfig` / `nameservers` opaque.
 */
const dnssecStatusDetailsSchema = z.object({
  dnssecStatus: z.string(),
  supportsDnssec: z.boolean(),
  hasDelegationSigner: z.boolean(),
  isUsingNamefiDelegationSigner: z.boolean().optional(),
  zoneHasActiveDnssec: z.boolean(),
  isUsingNamefiNameservers: z.boolean(),
  nameservers: z.array(z.string()),
  delegationSigners: z.array(z.any()).optional(),
  zoneSigningConfig: z.any().optional(),
});

const dnssecActiveWorkflowsSchema = z.custom<
  | {
      workflowDetails: {
        operation: 'ENABLE_DNSSEC' | 'REMOVE_DNSSEC';
        workflowId: string;
        runId: string;
        workflowType: string;
        status: 'RUNNING';
      };
      hasActiveWorkflow: boolean;
    }
  | {
      workflowDetails?: undefined;
      hasActiveWorkflow: boolean;
    }
>(() => true);

/**
 * Signing config shape mirrors `DnssecSigningConfig` from
 * `@namefi-astra/registrars` without importing it (keeps common free of
 * registrar deps). The backend router casts this through the registrar
 * function, and any divergence is caught at the call site.
 */
const dnssecSigningConfigSchema = z.object({
  algorithm: z.nativeEnum(DnssecAlgorithms),
  publicKey: z.string(),
  flags: z.nativeEnum(DnssecFlags),
  keyTag: z.number(),
  digestType: z.nativeEnum(DnssecDigestType),
  digest: z.string(),
});

const associateDelegationSignerInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  signingConfig: dnssecSigningConfigSchema,
});

const cancelDnssecWorkflowInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  operation: z.enum(['ENABLE_DNSSEC', 'REMOVE_DNSSEC']),
});

const validateDelegationSignerResultSchema = z.object({
  isValid: z.boolean(),
  matchedDnskey: z
    .object({
      keyTag: z.number().int(),
      flags: z.number().int(),
      algorithm: z.number().int(),
      publicKey: z.string(),
    })
    .optional(),
  publishedDnskeys: z.array(
    z.object({
      flags: z.number().int(),
      algorithm: z.number().int(),
      publicKey: z.string(),
      computedKeyTag: z.number().int(),
      computedDigest: z.string(),
      matchesProvided: z.boolean(),
    }),
  ),
  nameserversQueried: z.array(z.string()),
  errorMessage: z.string().optional(),
});

const deriveDsFromDnskeyInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  dnskeyRecord: z.string().min(1),
  digestType: z.nativeEnum(DnssecDigestType),
});

const domainDnssecContract = createContract(
  { softOutput: true },
  {
    getDomainDnssecDetails: {
      type: 'query',
      input: domainNameInputSchema,
      output: dnssecStatusDetailsSchema,
    },
    enableDnssec: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: z.void(),
    },
    disableDnssec: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: z.void(),
    },
    associateDelegationSigner: {
      type: 'mutation',
      input: associateDelegationSignerInputSchema,
      output: z.void(),
    },
    validateDelegationSigner: {
      type: 'mutation',
      input: associateDelegationSignerInputSchema,
      output: validateDelegationSignerResultSchema,
    },
    deriveDsFromDnskey: {
      type: 'mutation',
      input: deriveDsFromDnskeyInputSchema,
      output: dnssecSigningConfigSchema,
    },
    getActiveDnssecOperationWorkflows: {
      type: 'query',
      input: domainNameInputSchema,
      output: dnssecActiveWorkflowsSchema,
    },
    cancelDnssecWorkflow: {
      type: 'mutation',
      input: cancelDnssecWorkflowInputSchema,
      output: cancelWorkflowOutputSchema,
    },
  },
);

export type DomainDnssecContract = typeof domainDnssecContract;

// ---------------------------------------------------------------------------
// Top-level contract (includes nested `dnssec`)
// ---------------------------------------------------------------------------

export const domainConfigContract = createContract(
  { softOutput: true },
  {
    getDomainDetails: {
      type: 'query',
      input: domainNameInputSchema,
      output: domainDetailsSchema,
    },
    getDomainRenewalDetails: {
      type: 'query',
      input: normalizedDomainNameInputSchema,
      output: domainRenewalDetailsSchema,
    },
    changeDomainNameservers: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: z.void(),
    },
    resetDomainNameservers: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: z.void(),
    },
    queryActiveNameserversChangeWorkflow: {
      type: 'query',
      input: domainNameInputSchema,
      output: nameserversChangeWorkflowSchema.nullable(),
    },
    getDomainSupportedFeatures: {
      type: 'query',
      input: normalizedDomainNameInputSchema,
      output: domainSupportedFeaturesSchema,
    },
    getDomainPreferencesAndConfig: {
      type: 'query',
      input: domainNameInputSchema,
      output: domainPreferencesAndConfigSchema,
    },
    updateDomainPreferencesAndConfig: {
      type: 'mutation',
      input: updateDomainPreferencesAndConfigInputSchema,
      output: z.void(),
    },
    requestDomainExport: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: z.void(),
    },
    getDomainExportDetails: {
      type: 'query',
      input: domainNameInputSchema,
      output: domainExportDetailsSchema,
    },
    getAuthCode: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: getAuthCodeOutputSchema,
    },
    getDomainOwnerWallet: {
      type: 'query',
      input: domainNameInputSchema,
      output: getDomainOwnerWalletOutputSchema,
    },
    getPendingTransfer: {
      type: 'query',
      input: domainNameInputSchema,
      output: pendingTransferSchema.nullable(),
    },
    approveTransfer: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: transferActionResultSchema,
    },
    rejectTransfer: {
      type: 'mutation',
      input: domainActionInputSchema,
      output: transferActionResultSchema,
    },
    cancelNameserversWorkflow: {
      type: 'mutation',
      input: domainNameInputSchema,
      output: cancelWorkflowOutputSchema,
    },
    dnssec: domainDnssecContract,
  },
);

export type DomainConfigContract = typeof domainConfigContract;
