import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import { punycodeFqdnSchema } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
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
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { domainDnssecRouter } from './domainDnssecRouter';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { prepareDomainForExportWorkflow } from '#temporal/workflows/domain-ownership/prepare-domain-for-export.workflow';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { getNamefiNftLock } from '#temporal/activities/namefi-nft';
import { getEppLockState } from '#temporal/activities/domain/registrar.activities';
import { getDomainChain } from '#temporal/activities/domain/index';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { determineDurationLimitsForRenewItems } from '#lib/domains/duration-constraints/determine-renew-duration-limits';
import {
  getDomainsExpirationDatesFromIndex,
  maybeQueryActiveRenewalWorkflow,
} from '../../../temporal/activities/domain/renew.activities';

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
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );
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
            },
          };
        }

        const nameservers = await sldRegistrar.getNameServers(
          toPunycodeDomainName(input.normalizedDomainName),
        );
        const isUsingOldNamefiNameservers =
          await checkIfNameserversAreLegacyNamefiNameservers(nameservers);

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

        return {
          features: {
            domainManagement: {
              enabled: true,
              config: {
                showPanel: true,
              },
            },
            dnsManagement: {
              enabled: isUsingNamefiNameservers,
              config: {
                showPanel: true,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. You need to head to your nameserver provider to manage your domain.',
              },
            },
            nameserversManagement: {
              enabled: true,
              config: {
                showPanel: true,
              },
            },
            dnssecManagement: {
              enabled: isUsingNamefiNameservers,
              config: {
                showPanel: true,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. You need to head to your nameserver provider to manage your dnssec.',
              },
            },
            domainPreferencesManagement: {
              enabled: isUsingNamefiNameservers,
              config: {
                showPanel: true,
                message: isUsingNamefiNameservers
                  ? undefined
                  : 'You are using other nameservers. Domain preferences management is only available when using Namefi nameservers.',
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
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      return await getDomainPreferencesAndConfig(input.domainName);
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
