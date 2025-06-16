import {
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
} from '@namefi-astra/registrars/lib/abstract-registrar/data/dnssec';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

import { z } from 'zod';
import {
  associateDelegationSigner,
  disableDnssecForDomain,
  enableAutoDnssecForDomain,
  getActiveDnssecOperationWorkflows,
  getDnssecStatusDetails,
} from '#lib/domains/dnssec';

import { logger } from '#lib/logger';

import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';

const _logger = logger.child({ module: 'domainDnssecRouter' });

export const domainDnssecRouter = createTRPCRouter({
  /**
   * Get Domain DNSSEC Details
   */
  getDomainDnssecDetails: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const methodLogger = _logger.child({ method: 'getDomainDnssecDetails' });
      methodLogger.info(
        { domainName: input.domainName },
        'Getting DNSSEC details for domain',
      );

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const dnssecStatusDetails = await getDnssecStatusDetails(
        toPunycodeDomainName(input.domainName),
      );

      methodLogger.info(
        { domainName: input.domainName },
        'Successfully retrieved DNSSEC details',
      );
      return dnssecStatusDetails;
    }),

  /**
   * Enable DNSSEC for a domain
   */
  enableDnssec: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .mutation(async ({ input, ctx }) => {
      const methodLogger = _logger.child({ method: 'enableDnssec' });
      methodLogger.info(
        { domainName: input.domainName },
        'Enabling DNSSEC for domain',
      );

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await enableAutoDnssecForDomain(toPunycodeDomainName(input.domainName));

      methodLogger.info(
        { domainName: input.domainName },
        'Successfully enabled DNSSEC',
      );
    }),

  /**
   * Disable DNSSEC for a domain
   */
  disableDnssec: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .mutation(async ({ input, ctx }) => {
      const methodLogger = _logger.child({ method: 'disableDnssec' });
      methodLogger.info(
        { domainName: input.domainName },
        'Disabling DNSSEC for domain',
      );

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await disableDnssecForDomain(
        toPunycodeDomainName(input.domainName),
        ctx.user.id,
      );

      methodLogger.info(
        { domainName: input.domainName },
        'Successfully disabled DNSSEC',
      );
    }),

  /**
   * Associate a delegation signer with a domain
   */
  associateDelegationSigner: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        signingConfig: z.object({
          algorithm: z.nativeEnum(DnssecAlgorithms),
          publicKey: z.string(),
          flags: z.nativeEnum(DnssecFlags),
          keyTag: z.number(),
          digestType: z.nativeEnum(DnssecDigestType),
          digest: z.string(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const methodLogger = _logger.child({
        method: 'associateDelegationSigner',
      });
      methodLogger.info(
        {
          domainName: input.domainName,
          algorithm: input.signingConfig.algorithm,
          keyTag: input.signingConfig.keyTag,
        },
        'Associating delegation signer with domain',
      );

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await associateDelegationSigner(
        toPunycodeDomainName(input.domainName),
        input.signingConfig,
      );

      methodLogger.info(
        {
          domainName: input.domainName,
          algorithm: input.signingConfig.algorithm,
          keyTag: input.signingConfig.keyTag,
        },
        'Successfully associated delegation signer',
      );
    }),

  /**
   * Get active DNSSEC operation workflows
   */
  getActiveDnssecOperationWorkflows: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const activeDnssecOperationWorkflows =
        await getActiveDnssecOperationWorkflows(
          toPunycodeDomainName(input.domainName),
        );
      if (activeDnssecOperationWorkflows) {
        return {
          workflowDetails: activeDnssecOperationWorkflows,
          hasActiveWorkflow: true,
        };
      }
      return {
        hasActiveWorkflow: false,
      };
    }),
});
