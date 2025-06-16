import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import { punycodeFqdnSchema } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  checkIfUsingNamefiNameservers,
  checkIfUsingOldNamefiNameservers,
  setNameserversForDomain,
} from '#lib/domains/nameservers';
import { logger } from '#lib/logger';
import {
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '../../../lib/namefi-registry';
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { getDomainLevels } from './getDomainLevels';
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
      await setNameserversForDomain({
        domainName: toPunycodeDomainName(input.domainName),
        nameservers: input.nameservers.map((nameserver) =>
          toPunycodeFqdn(nameserver),
        ),
      });
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
        const isUsingOldNamefiNameservers =
          await checkIfUsingOldNamefiNameservers(input.normalizedDomainName);

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
            },
          };
        }

        const isUsingNamefiNameservers = await checkIfUsingNamefiNameservers(
          input.normalizedDomainName,
        );

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
