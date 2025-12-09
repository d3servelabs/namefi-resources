import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import { punycodeFqdnSchema } from '@namefi-astra/registrars/lib/data/validations';
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
  NAMEFI_EIP712_DOMAIN,
} from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { domainDnssecRouter } from './domainDnssecRouter';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { prepareDomainForExportWorkflow } from '#temporal/workflows/domain-ownership/prepare-domain-for-export.workflow';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { getNamefiNftLock } from '#temporal/activities/mint/namefi-nft';
import { getEppLockState } from '#temporal/activities/domain/registrar.activities';
import { getDomainChain } from '#temporal/activities/domain/index';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { determineDurationLimitsForRenewItems } from '#lib/domains/duration-constraints/determine-renew-duration-limits';
import {
  getDomainsExpirationDatesFromIndex,
  maybeQueryActiveRenewalWorkflow,
} from '../../../temporal/activities/domain/renew.activities';
import { differenceInDays, isBefore } from 'date-fns';
import { resolve } from '@namefi-astra/utils';
import { db, namefiNftOwnersCte, namefiNftOwnersView } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';

/**
 * EIP-712 type definitions for approving a domain export.
 * This is displayed to the user in their wallet when signing.
 */
export const APPROVE_EXPORT_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  ApproveExport: [{ name: 'domainName', type: 'string' }],
};

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
   * Change Domain Nameservers
   */
  changeDomainNameservers: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        nameservers: z.array(punycodeFqdnSchema).min(2).max(4),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await submitNameserversChangeWorkflow(
        toPunycodeDomainName(input.domainName),
        input.nameservers.map((nameserver) => toPunycodeFqdn(nameserver)),
      );
    }),

  /**
   * Change Domain Nameservers
   */
  resetDomainNameservers: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await submitResetNameserversWorkflow(
        toPunycodeDomainName(input.domainName),
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
      return await updateDomainPreferencesAndConfig(
        input.domainName,
        ctx.user.id,
        input.domainPreferencesAndConfig,
      );
    }),

  requestDomainExport: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const parsedDomainName = parseDomainName(input.domainName);
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
            domainName: toPunycodeDomainName(input.domainName),
            userId: ctx.user.id,
          },
        ],
        workflowId: prepareDomainForExportWorkflow.generateId({
          domainName: toPunycodeDomainName(input.domainName),
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

  getAuthCode: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const domainName = toPunycodeDomainName(input.domainName);
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
    createSignedPayloadProcedure({
      types: APPROVE_EXPORT_EIP712_TYPES,
      primaryType: 'ApproveExport',
      getPayloadFromInput: (input: unknown) =>
        (input as { payload: { domainName: string } }).payload,
      getSignatureFromInput: (input: unknown) =>
        (input as { signature: string }).signature,
    }),
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: (input as { payload: { domainName: string } }).payload
        .domainName,
      action: 'approve_export',
      extraInput: {
        signedPayload: true,
        signerWalletAddress: (ctx as { signerWalletAddress?: string })
          .signerWalletAddress,
      },
    }),
  )
    .input(
      z.object({
        signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
        payload: z.object({
          domainName: namefiNormalizedDomainSchema,
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.payload.domainName,
        ctx.user,
      );
      const domainName = toPunycodeDomainName(input.payload.domainName);
      const result = await sldRegistrar.approveTransfer(domainName);
      return result;
    }),

  /**
   * Reject a pending transfer for a domain
   */
  rejectTransfer: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const domainName = toPunycodeDomainName(input.domainName);
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
