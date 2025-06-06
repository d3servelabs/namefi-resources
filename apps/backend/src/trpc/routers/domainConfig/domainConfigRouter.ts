import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import { createRegistrarService } from '@namefi-astra/registrars/registrars/main-registrar';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { getPoweredByNamefi3PDomains } from '../../../lib/namefi-registry';
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { getDomainLevels } from './getDomainLevels';

const registrar = createRegistrarService();

export const domainConfigRouter = createTRPCRouter({
  /**
   * Get Domain Details
   */
  getDomainDetails: protectedProcedure
    .input(
      z.object({
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);
      const domainDetails = await registrar.getDomainDetails(input.zoneName);
      return domainDetails;
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
        const domainLevels = getDomainLevels(input.normalizedDomainName);
        if (domainLevels.levels.length > 3) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This domain is not supported',
          });
        }

        const isSubDomain = domainLevels.levels.length > 2;

        if (isSubDomain && domainLevels.parentDomain) {
          const thirdPartyDomains = await getPoweredByNamefi3PDomains();

          if (!thirdPartyDomains.includes(domainLevels.parentDomain)) {
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
                  showPanel: true,
                  message: 'Coming Soon ...',
                },
              },
            },
          };
        }

        const isUsingNamefiNameservers = await checkIfUsingNamefiNameservers(
          input.normalizedDomainName,
        );
        const isUsingOldNamefiNameservers =
          await checkIfUsingOldNamefiNameservers(input.normalizedDomainName);

        return {
          features: {
            domainManagement: {
              enabled: isUsingNamefiNameservers,
              config: {
                showPanel: true,
                message: isUsingOldNamefiNameservers
                  ? 'You are using the NamefiApp nameservers.<br /> Please head to the NamefiApp dashboard to manage your domain.'
                  : isUsingNamefiNameservers
                    ? undefined
                    : 'You are using other nameservers.',
                redirectTo: isUsingOldNamefiNameservers
                  ? `https://app.namefi.io/dashboard/domains/${input.normalizedDomainName}`
                  : undefined,
                redirectToLabel: 'Redirect to NamefiApp',
              },
            },
            nameserversManagement: {
              enabled: false,
              config: {
                showPanel: true,
                message: 'Coming Soon ...',
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
});

const checkIfUsingNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await registrar.getNameServers(normalizedDomainName);
  const isUsingOtherNameservers = nameservers.some(
    (ns: Nameserver) =>
      !config.NAMEFI_ASTRA_NAMESERVERS.includes(
        ns as unknown as NamefiNormalizedDomain,
      ),
  );
  return !isUsingOtherNameservers;
};

const checkIfUsingOldNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await registrar.getNameServers(normalizedDomainName);

  const isUsingOtherNameservers = nameservers.some(
    (ns: Nameserver) => !['ns1.namefi.io', 'ns2.namefi.io'].includes(ns),
  );
  return !isUsingOtherNameservers;
};
