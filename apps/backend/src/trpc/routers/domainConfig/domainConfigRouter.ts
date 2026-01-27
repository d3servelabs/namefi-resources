import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import {
  isDomainExpirationDatePassed,
  isDomainAssumedInLateRenewalPeriod,
  isDomainAssumedInGraceRestorationPeriod,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  getDomainPreferencesAndConfig,
  updateDomainPreferencesAndConfig,
} from '#lib/domains/domain-preferences';
import {
  queryActiveNameserversChangeWorkflow,
  submitNameserversChangeWorkflow,
  submitResetNameserversWorkflow,
  checkIfNameserversAreNamefiNameservers,
  checkIfNameserversAreLegacyNamefiNameservers,
} from '#lib/domains/nameservers';
import { logger } from '#lib/logger';
import {
  getDomainListInfo,
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '../../../lib/namefi-registry';
import {
  createTRPCRouter,
  protectedProcedure,
  createSignedPayloadProcedure,
  withAudit,
} from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { domainDnssecRouter } from './domainDnssecRouter';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { prepareDomainForExportWorkflow } from '#temporal/workflows/domain-ownership/prepare-domain-for-export.workflow';
import {
  startActivityWorkflow,
  type StartActivityWorkflow,
} from '#temporal/workflows/generic/start-activity.workflow';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '#temporal/shared';
import { getNamefiNftLock } from '#temporal/activities/mint/namefi-nft';
import {
  DEFAULT_CONTACT,
  getEppLockState,
} from '#temporal/activities/domain/registrar.activities';
import { getDomainChain } from '#temporal/activities/domain/index';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { determineDurationLimitsForRenewItems } from '#lib/domains/duration-constraints/determine-renew-duration-limits';
import {
  getDomainsExpirationDatesFromIndex,
  maybeQueryActiveRenewalWorkflow,
} from '../../../temporal/activities/domain/renew.activities';
import { resolve } from '@namefi-astra/utils';
import {
  db,
  domainExportTrackingTable,
  namefiNftCte,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { DomainRegistration } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain';
import type { WithRegistrar } from '@namefi-astra/registrars/registrars/main-registrar';
import { config } from '#lib/env';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/data/renew-option';
import { audit, createAuditRecord, ResourceType } from '#lib/auditor';
import { isNotNil } from 'ramda';

/**
 * Unified EIP-712 type definitions for domain actions.
 * This is displayed to the user in their wallet when signing.
 *
 * The structure includes:
 * - domainName: The domain being acted upon
 * - action: The action being performed (e.g., 'APPROVE_EXPORT', 'CHANGE_NAMESERVERS')
 * - payload: Optional additional data for the action (e.g., nameservers list)
 * - message: Human-readable description of the action (display only, not validated)
 * - timestamp: Unix timestamp in seconds when the signature was created (validated to be within 5 seconds)
 */
export const DOMAIN_ACTION_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  DomainAction: [
    { name: 'domainName', type: 'string' },
    { name: 'action', type: 'string' },
    { name: 'payload', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * Maximum allowed time difference in seconds between signature timestamp and server time.
 */
const SIGNATURE_TIMESTAMP_TOLERANCE_SECONDS = 30;

/**
 * Valid domain actions for EIP-712 signing.
 */
export const DOMAIN_ACTIONS = {
  APPROVE_EXPORT: 'APPROVE_EXPORT',
  REJECT_EXPORT: 'REJECT_EXPORT',
  ENABLE_EXPORT: 'ENABLE_EXPORT',
  CHANGE_NAMESERVERS: 'CHANGE_NAMESERVERS',
  RESET_NAMESERVERS: 'RESET_NAMESERVERS',
  GET_AUTH_CODE: 'GET_AUTH_CODE',
} as const;

export type DomainAction = (typeof DOMAIN_ACTIONS)[keyof typeof DOMAIN_ACTIONS];

/**
 * Input schema for domain action signed payloads.
 */
export const domainActionInputSchema = z.object({
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  payload: z.object({
    domainName: namefiNormalizedDomainSchema,
    action: z.enum([
      DOMAIN_ACTIONS.APPROVE_EXPORT,
      DOMAIN_ACTIONS.REJECT_EXPORT,
      DOMAIN_ACTIONS.ENABLE_EXPORT,
      DOMAIN_ACTIONS.CHANGE_NAMESERVERS,
      DOMAIN_ACTIONS.RESET_NAMESERVERS,
      DOMAIN_ACTIONS.GET_AUTH_CODE,
    ]),
    payload: z.string(), // Additional payload data (e.g., nameservers)
    message: z.string(), // Human-readable description (display only)
    timestamp: z.number().int().positive(), // Unix timestamp in seconds
  }),
});

/**
 * Creates a signed payload procedure for domain actions.
 * Validates that the action in the payload matches the expected action
 * and that the timestamp is within the allowed tolerance.
 */
function createDomainActionProcedure(expectedAction: DomainAction) {
  return createSignedPayloadProcedure({
    types: DOMAIN_ACTION_EIP712_TYPES,
    primaryType: 'DomainAction',
    getPayloadFromInput: (input: unknown) =>
      (input as z.infer<typeof domainActionInputSchema>).payload,
    getSignatureFromInput: (input: unknown) =>
      (input as z.infer<typeof domainActionInputSchema>).signature,
  }).use(async ({ ctx, next, getRawInput }) => {
    const rawInput = (await getRawInput()) as z.infer<
      typeof domainActionInputSchema
    >;

    // Validate the action matches what's expected
    if (rawInput.payload.action !== expectedAction) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid action. Expected ${expectedAction}, got ${rawInput.payload.action}`,
      });
    }

    // Validate the timestamp is within tolerance
    const nowSeconds = Math.floor(Date.now() / 1000);
    const timestampDiff = Math.abs(nowSeconds - rawInput.payload.timestamp);
    if (timestampDiff > SIGNATURE_TIMESTAMP_TOLERANCE_SECONDS) {
      logger.warn(
        {
          timestamp: rawInput.payload.timestamp,
          nowSeconds,
          diff: timestampDiff,
          action: expectedAction,
        },
        'Signature timestamp expired',
      );
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Signature has expired. Please sign again.',
      });
    }

    return next({ ctx });
  });
}

export const domainConfigRouter = createTRPCRouter({
  /**
   * Get Domain Details
   */
  getDomainDetails: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const parseResult = parseDomainName(input.domainName);
      if (!parseResult.valid) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'invalid domain name provided',
        });
      }
      if (parseResult.registryType === 'subdomain') {
        const [[nft], { autoRenewEnabled }] = await Promise.all([
          db
            .with(namefiNftCte)
            .select()
            .from(namefiNftCte)
            .where(eq(namefiNftCte.normalizedDomainName, input.domainName))
            .limit(1),
          getDomainPreferencesAndConfig(input.domainName),
        ]);
        if (!nft) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `${input.domainName} is not found`,
          });
        }
        return {
          supportsDnssec: true,
          contacts: {
            registrantContact: DEFAULT_CONTACT(input.domainName, 'registrant'),
          },
          contactsPrivacy: {
            registrantContact: 'CONTACT_PRIVACY_UNSPECIFIED',
          },
          nameservers: config.NAMEFI_ASTRA_NAMESERVERS,
          registrarKey: 'namefi',
          expirationTime: nft.expirationTime,
          domainName: toPunycodeDomainName(nft.normalizedDomainName),
          creationTime: new Date(Number(nft.lastUpdatedTimestamp)),
          autoRenewOption: autoRenewEnabled
            ? RenewOption.AUTOMATIC
            : RenewOption.MANUAL,
        } satisfies WithRegistrar<DomainRegistration>;
      }
      const domainDetails = await sldRegistrar.getDomainDetails(
        toPunycodeDomainName(input.domainName),
      );
      return domainDetails;
    }),

  getDomainRenewalDetails: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );
      const [workflow, domainListInfo, { autoRenewEnabled }, expirationDates] =
        await Promise.all([
          maybeQueryActiveRenewalWorkflow(input.normalizedDomainName),
          getDomainListInfo([input.normalizedDomainName]),
          getDomainPreferencesAndConfig(input.normalizedDomainName),
          getDomainsExpirationDatesFromIndex([input.normalizedDomainName]), // TODO: use getLiveExpirationDate when implemented
        ]);

      const domainInfo = domainListInfo?.[0];
      if (!domainInfo) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Domain not found' });
      }
      const durationValidationInYears = domainInfo.durationValidationInYears;

      if (!durationValidationInYears) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain duration validation in years not found',
        });
      }
      const domainPricingDetails = domainInfo.pricingDetails;
      if (!domainPricingDetails) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain pricing details not found',
        });
      }

      const expirationTime =
        expirationDates[input.normalizedDomainName] ?? null;
      if (!expirationTime) {
        logger.error(
          { domainName: input.normalizedDomainName },
          'No expiration date found for domain',
        );
        return {
          autoRenewEnabled: false,
          renewable: false,
          domainPricingDetails,
          expirationDate: null,
          maxAdditionalYears: 0,
          minimumPossibleRenewalYears: 0,
          activeRegistrationYears: 0,
          pendingRenewalRequest: !!workflow,
        };
      }

      const minRegistrationYears = durationValidationInYears.min;
      const maxRegistrationYears = durationValidationInYears.max;

      const {
        maxAdditionalYears,
        minimumPossibleRenewalYears,
        activeRegistrationYears,
      } = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: minRegistrationYears,
        maxYears: maxRegistrationYears,
      });

      return {
        autoRenewEnabled,
        domainPricingDetails: domainPricingDetails,
        expirationDate: expirationTime,
        maxAdditionalYears,
        minimumPossibleRenewalYears,
        activeRegistrationYears,
        renewable: maxAdditionalYears > 0,
        pendingRenewalRequest: !!workflow,
      };
    }),

  /**
   * Change Domain Nameservers.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to confirm the nameserver change.
   */
  changeDomainNameservers: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.CHANGE_NAMESERVERS),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'change_nameservers',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
        nameservers: (input as z.infer<typeof domainActionInputSchema>).payload
          .payload,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      // Parse nameservers from payload (comma-separated string)
      const nameserversList = input.payload.payload
        .split(',')
        .map((ns) => ns.trim())
        .filter((ns) => ns.length > 0);

      if (nameserversList.length < 2 || nameserversList.length > 4) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Must provide between 2 and 4 nameservers',
        });
      }

      await submitNameserversChangeWorkflow(
        toPunycodeDomainName(input.payload.domainName),
        nameserversList.map((nameserver) => toPunycodeFqdn(nameserver)),
      );
    }),

  /**
   * Reset Domain Nameservers to Namefi defaults.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to confirm the reset.
   */
  resetDomainNameservers: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.RESET_NAMESERVERS),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'reset_nameservers',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      await submitResetNameserversWorkflow(
        toPunycodeDomainName(input.payload.domainName),
      );
    }),

  queryActiveNameserversChangeWorkflow: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      try {
        const activeNameserversChangeWorkflow =
          await queryActiveNameserversChangeWorkflow(
            toPunycodeDomainName(input.domainName),
          );

        return activeNameserversChangeWorkflow;
      } catch (error: any) {
        logger.error(error);
        if (
          error &&
          'cause' in error &&
          'code' in error.cause &&
          error.cause.code === 14
        ) {
          return null;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error querying active nameservers change workflow',
        });
      }
    }),

  /**
   * Get the supported features for a domain
   */
  getDomainSupportedFeatures: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      // This data is all public and does not require authorization
      // await assertAuthenticatedUserIsDomainOwner(
      //   input.normalizedDomainName,
      //   ctx.user,
      // );
      try {
        const parsedDomainName = parseDomainName(input.normalizedDomainName);
        if (!parsedDomainName.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid domain name',
          });
        }

        if (parsedDomainName.registryType === 'subdomain') {
          const thirdPartyDomains = await getPoweredByNamefi3PDomains();

          if (
            !thirdPartyDomains.includes(parsedDomainName.immediateParentDomain)
          ) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'This domain is not supported',
            });
          }
          return {
            features: {
              domainManagement: {
                enabled: true,
                config: {
                  showPanel: false,
                },
              },
              nameserversManagement: {
                enabled: false,
                config: {
                  showPanel: false,
                  message: 'Not Allowed',
                },
              },
              dnssecManagement: {
                enabled: true,
                config: {
                  autoManaged: true,
                  showPanel: true,
                  message: `DNSSEC is automatically managed by Namefi for subdomains of ${parsedDomainName.immediateParentDomain}.`,
                },
              },
              domainPreferencesManagement: {
                enabled: true,
                config: {
                  showPanel: true,
                },
              },
              domainExport: {
                enabled: false,
                config: {
                  showPanel: false,
                  message: 'Domain export is not available for subdomains.',
                },
              },
            },
          };
        }

        const [expirationDate, nameserverRes] = await Promise.all([
          getDomainsExpirationDatesFromIndex([input.normalizedDomainName]).then(
            (expirationDates) => expirationDates[input.normalizedDomainName],
          ),
          resolve(
            sldRegistrar.getNameServers(
              toPunycodeDomainName(input.normalizedDomainName),
            ),
          ),
        ]);

        const isExpired = isDomainExpirationDatePassed(expirationDate);
        const isInLateRenewalPeriod =
          isDomainAssumedInLateRenewalPeriod(expirationDate);
        const isInGraceRestorationPeriod =
          isDomainAssumedInGraceRestorationPeriod(expirationDate);

        const [error, nameservers] = nameserverRes;
        if (error) {
          if (isInLateRenewalPeriod || isInGraceRestorationPeriod) {
            return {
              canAttemptRenewal: false,
              isInLateRenewalPeriod,
              isInGraceRestorationPeriod,
              features: {
                domainManagement: {
                  enabled: true,
                  config: {
                    showPanel: true,
                    message:
                      'You are in the late renewal period or grace restoration period. You can still manage your domain but some features are disabled.',
                  },
                },
                dnsManagement: {
                  enabled: false,
                  config: {
                    showPanel: false,
                    message:
                      'DNS management is not available in the late renewal period or grace restoration period.',
                  },
                },
                nameserversManagement: {
                  enabled: false,
                  config: {
                    showPanel: false,
                    message:
                      'Nameservers management is not available in the late renewal period or grace restoration period.',
                  },
                },
                dnssecManagement: {
                  enabled: false,
                  config: {
                    showPanel: false,
                    message:
                      'DNSSEC management is not available in the late renewal period or grace restoration period.',
                  },
                },
                domainPreferencesManagement: {
                  enabled: false,
                  config: {
                    showPanel: false,
                    message:
                      'Domain preferences management is not available in the late renewal period or grace restoration period.',
                  },
                },
                domainExport: {
                  enabled: false,
                  config: {
                    showPanel: false,
                    message:
                      'Domain export is not available in the late renewal period or grace restoration period.',
                  },
                },
              },
            };
          }
          throw error;
        }
        const isUsingOldNamefiNameservers =
          checkIfNameserversAreLegacyNamefiNameservers(nameservers);

        if (isUsingOldNamefiNameservers) {
          return {
            features: {
              domainManagement: {
                enabled: true,
                config: {
                  showPanel: true,
                  message:
                    'You are using the NamefiApp nameservers.<br /> Please head to the NamefiApp dashboard to manage your domain.',
                  redirectTo: `https://app.namefi.io/dashboard/domains/${input.normalizedDomainName}`,
                  redirectToLabel: 'Redirect to NamefiApp',
                },
              },
              dnssecManagement: {
                enabled: false,
                config: {
                  showPanel: true,
                  message:
                    'You are using the legacy Namefi nameservers. Please head to the NamefiApp dashboard to manage your domain.',
                  redirectTo: `https://app.namefi.io/dashboard/domains/${input.normalizedDomainName}`,
                  redirectToLabel: 'Redirect to NamefiApp',
                },
              },

              nameserversManagement: {
                enabled: true,
                config: {
                  showPanel: true,
                },
              },
            },
          };
        }

        const isUsingNamefiNameservers =
          checkIfNameserversAreNamefiNameservers(nameservers);

        const disableAllFeatures = isExpired;
        return {
          canAttemptRenewal: true,
          isInLateRenewalPeriod,
          isInGraceRestorationPeriod,
          features: {
            domainManagement: {
              enabled: true,
              config: {
                showPanel: true,
              },
            },
            dnsManagement: {
              enabled: isUsingNamefiNameservers && !disableAllFeatures,
              config: {
                showPanel: true && !disableAllFeatures,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. You need to head to your nameserver provider to manage your domain.',
              },
            },
            nameserversManagement: {
              enabled: true && !disableAllFeatures,
              config: {
                showPanel: true && !disableAllFeatures,
              },
            },
            dnssecManagement: {
              enabled: isUsingNamefiNameservers && !disableAllFeatures,
              config: {
                showPanel: true && !disableAllFeatures,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. You need to head to your nameserver provider to manage your dnssec.',
              },
            },
            domainPreferencesManagement: {
              enabled: isUsingNamefiNameservers && !disableAllFeatures,
              config: {
                showPanel: true && !disableAllFeatures,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. Domain preferences management is only available when using Namefi nameservers.',
              },
            },
            domainExport: {
              enabled: true && !disableAllFeatures,
              config: {
                showPanel: true && !disableAllFeatures,
              },
            },
          },
        };
      } catch (error) {
        logger.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error checking domain supported features',
        });
      }
    }),

  getDomainPreferencesAndConfig: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const [_, domainPreferencesAndConfig] = await Promise.all([
        assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user),
        getDomainPreferencesAndConfig(input.domainName),
      ]);
      return domainPreferencesAndConfig;
    }),

  updateDomainPreferencesAndConfig: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        domainPreferencesAndConfig: z.object({
          forwardTo: z.string().optional(),
          autoEnsEnabled: z.boolean().optional(),
          autoParkEnabled: z.boolean().optional(),
          autoRenewEnabled: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const autoRenewEnabled =
        input.domainPreferencesAndConfig.autoRenewEnabled;
      const otherConfig = {
        forwardTo: input.domainPreferencesAndConfig.forwardTo,
        autoEnsEnabled: input.domainPreferencesAndConfig.autoEnsEnabled,
        autoParkEnabled: input.domainPreferencesAndConfig.autoParkEnabled,
      };
      const auditAutoRenew = isNotNil(autoRenewEnabled);
      const auditOtherConfigs = Object.values(otherConfig).some(isNotNil);
      try {
        await updateDomainPreferencesAndConfig(
          input.domainName,
          ctx.user.id,
          input.domainPreferencesAndConfig,
        );

        if (auditAutoRenew) {
          audit(
            createAuditRecord({
              actorType: 'user',
              actorId: ctx.user.id,
              resourceType: ResourceType.DOMAIN,
              resourceId: input.domainName,
              action: 'update_auto_renew',
              extraInput: {
                autoRenewEnabled,
              },
            }),
          );
        }

        if (auditOtherConfigs) {
          audit(
            createAuditRecord({
              actorType: 'user',
              actorId: ctx.user.id,
              resourceType: ResourceType.DOMAIN,
              resourceId: input.domainName,
              action: 'update_config',
              extraInput: {
                ...otherConfig,
              },
            }),
          );
        }
      } catch (error) {
        logger.error(
          { error },
          'Error updating domain preferences and config:',
        );
        throw error;
      }
    }),

  /**
   * Request to enable domain export.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to confirm enabling export.
   */
  requestDomainExport: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.ENABLE_EXPORT),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'enable_export',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      const parsedDomainName = parseDomainName(input.payload.domainName);
      if (!parsedDomainName.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid domain name',
        });
      }
      if (parsedDomainName.registryType !== 'traditional') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export is only supported for traditional domains',
        });
      }
      await temporalClient.workflow.start(prepareDomainForExportWorkflow, {
        args: [
          {
            domainName: toPunycodeDomainName(input.payload.domainName),
            userId: ctx.user.id,
          },
        ],
        workflowId: prepareDomainForExportWorkflow.generateId({
          domainName: toPunycodeDomainName(input.payload.domainName),
          userId: ctx.user.id,
        }),
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowIdConflictPolicy: 'USE_EXISTING',
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
    }),

  getDomainExportDetails: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      const domainName = toPunycodeDomainName(input.domainName);
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);

      const supportsExport = await doesDomainSupportExport(domainName);
      if (!supportsExport) {
        return {
          supportsExport: false,
          message: 'Domain does not support export',
        };
      }

      let workflowStatus: WorkflowExecutionStatusName | undefined;
      try {
        const workflow = await temporalClient.workflow.getHandle(
          prepareDomainForExportWorkflow.generateId({
            domainName,
            userId: user.id,
          }),
        );
        if (workflow) {
          workflowStatus = (await workflow.describe()).status.name;
        }
      } catch (error) {
        logger.error(error);
      }

      const pendingRequestToEnableExport = workflowStatus === 'RUNNING';
      const readyToExport =
        !pendingRequestToEnableExport &&
        (await areExportConditionsMet(domainName));

      return {
        supportsExport,
        readyToExport,
        pendingRequestToEnableExport,
        message: pendingRequestToEnableExport
          ? 'Domain is being prepared for export'
          : !readyToExport
            ? 'Domain is not ready to export'
            : undefined,
      };
    }),

  /**
   * Get the auth code for a domain export.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to retrieve the auth code.
   */
  getAuthCode: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.GET_AUTH_CODE),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'get_auth_code',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      const domainName = toPunycodeDomainName(input.payload.domainName);
      const supportsExport = await doesDomainSupportExport(domainName);
      if (!supportsExport) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Domain does not support export',
        });
      }

      const readyToExport = await areExportConditionsMet(domainName);

      if (!readyToExport) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Domain is not ready to export',
        });
      }
      const authCode = await sldRegistrar.retrieveAuthCode(domainName);
      return {
        authCode,
      };
    }),

  /**
   * Get the wallet address that owns the domain NFT.
   * This is used by the frontend to request the specific wallet connection
   * for operations that require signing with the owner wallet.
   */
  getDomainOwnerWallet: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);

      const nft = await db
        .with(namefiNftOwnersCte)
        .select({ ownerAddress: namefiNftOwnersView.ownerAddress })
        .from(namefiNftOwnersView)
        .where(eq(namefiNftOwnersView.normalizedDomainName, input.domainName))
        .limit(1);

      if (!nft[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain NFT not found',
        });
      }

      return {
        ownerWalletAddress: nft[0].ownerAddress,
      };
    }),

  /**
   * Get pending transfer status for a domain
   */
  getPendingTransfer: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const domainName = toPunycodeDomainName(input.domainName);
      const pendingTransfer =
        await sldRegistrar.queryPendingTransfer(domainName);
      return pendingTransfer;
    }),

  /**
   * Approve a pending export for a domain.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to confirm the export approval.
   */
  approveTransfer: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.APPROVE_EXPORT),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'approve_export',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      const domainName = toPunycodeDomainName(input.payload.domainName);

      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      // Get the owner address from the NFT
      const nfts = await db
        .with(namefiNftCte)
        .select({
          ownerAddress: namefiNftCte.ownerAddress,
          chainId: namefiNftCte.chainId,
        })
        .from(namefiNftCte)
        .where(eq(namefiNftCte.normalizedDomainName, input.payload.domainName))
        .limit(1);
      const nft = nfts[0];

      const ownerAddress = nft?.ownerAddress;
      if (!ownerAddress) {
        logger.warn(
          { domainName },
          'Could not find owner address for domain when approving transfer',
        );
      }

      const result = await sldRegistrar.approveTransfer(domainName);

      // Upsert export tracking record to mark client approval
      // This allows safe NFT burning once domain leaves our account
      // The record might not exist yet if the export tracking workflow hasn't detected the pending transfer
      await db
        .insert(domainExportTrackingTable)
        .values({
          normalizedDomainName: domainName,
          chainId: nft.chainId,
          ownerAddress,
          status: 'PENDING_TRANSFER',
          clientApprovedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            domainExportTrackingTable.normalizedDomainName,
            domainExportTrackingTable.chainId,
          ],
          set: {
            clientApprovedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      try {
        temporalClient.workflow.start(
          startActivityWorkflow as StartActivityWorkflow<
            typeof TEMPORAL_ENUMS.INDEXERS,
            'triggerDomainExportTracking'
          >,
          {
            workflowId: 'triggerDomainExportTracking',
            taskQueue: TEMPORAL_QUEUES.INDEXERS,
            args: [
              {
                temporalEnum: TEMPORAL_ENUMS.INDEXERS,
                activityName: 'triggerDomainExportTracking',
                args: [],
              },
            ],
            startDelay: '30 seconds',
            workflowIdConflictPolicy: 'USE_EXISTING',
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          },
        );
      } catch (error) {
        logger.error(error, 'Failed to start workflow');
      }
      return result;
    }),

  /**
   * Reject a pending transfer for a domain.
   * This is a dangerous operation that requires EIP-712 signature verification.
   * The user must sign the payload with their wallet to confirm rejecting the transfer.
   */
  rejectTransfer: withAudit(
    createDomainActionProcedure(DOMAIN_ACTIONS.REJECT_EXPORT),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as z.infer<typeof domainActionInputSchema>).payload
        .domainName,
      action: 'reject_export',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(domainActionInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      const domainName = toPunycodeDomainName(input.payload.domainName);
      const result = await sldRegistrar.rejectTransfer(domainName);
      return result;
    }),

  dnssec: domainDnssecRouter,
});

const doesDomainSupportExport = async (domainName: NamefiNormalizedDomain) => {
  const parsedDomainName = parseDomainName(domainName);
  if (!parsedDomainName.valid) {
    return false;
  }
  if (parsedDomainName.registryType !== 'traditional') {
    return false;
  }
  return true;
};

const areExportConditionsMet = async (domainName: NamefiNormalizedDomain) => {
  const [nftIsLocked, eppLock] = await Promise.all([
    getDomainChain(domainName).then((chainId) =>
      getNamefiNftLock(chainId, domainName),
    ),
    getEppLockState(toPunycodeDomainName(domainName)),
  ]);

  const readyToExport = nftIsLocked && !eppLock.locked;

  return readyToExport;
};
