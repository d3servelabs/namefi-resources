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

import { createLogger, logger } from '#lib/logger';

import { TRPCError } from '@trpc/server';
import { temporalClient } from '../../../temporal/client';
import { enableDnssecWorkflow } from '../../../temporal/workflows/enable-dnssec.workflow';
import { disableDnssecWorkflow } from '../../../temporal/workflows/disable-dnssec.workflow';
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';

const _logger = createLogger({ module: 'domain-dnssec-router' });

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
      _logger.assign({
        method: 'getDomainDnssecDetails',
        domainName: input.domainName,
      });
      _logger.debug('Getting DNSSEC details for domain');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      const dnssecStatusDetails = await getDnssecStatusDetails(
        toPunycodeDomainName(input.domainName),
      );

      _logger.debug('Successfully retrieved DNSSEC details');
      return dnssecStatusDetails;
    }),

  /**
   * Enable DNSSEC for a domain
   */
  enableDnssec: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .mutation(async ({ input, ctx }) => {
      _logger.assign({ method: 'enableDnssec', domainName: input.domainName });
      _logger.debug('Enabling DNSSEC for domain');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await enableAutoDnssecForDomain(toPunycodeDomainName(input.domainName));

      _logger.debug('Successfully enabled DNSSEC');
    }),

  /**
   * Disable DNSSEC for a domain
   */
  disableDnssec: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .mutation(async ({ input, ctx }) => {
      _logger.assign({ method: 'disableDnssec', domainName: input.domainName });
      _logger.debug('Disabling DNSSEC for domain');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await disableDnssecForDomain(
        toPunycodeDomainName(input.domainName),
        ctx.user.id,
      );

      _logger.debug('Successfully disabled DNSSEC');
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
      _logger.assign({
        method: 'associateDelegationSigner',
        domainName: input.domainName,
        algorithm: input.signingConfig.algorithm,
        keyTag: input.signingConfig.keyTag,
      });
      _logger.debug('Associating delegation signer with domain');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await associateDelegationSigner(
        toPunycodeDomainName(input.domainName),
        input.signingConfig,
      );

      _logger.debug('Successfully associated delegation signer');
    }),

  /**
   * Get active DNSSEC operation workflows
   */
  getActiveDnssecOperationWorkflows: protectedProcedure
    .input(z.object({ domainName: namefiNormalizedDomainSchema }))
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      try {
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
      } catch (error: any) {
        logger.error(error);
        if (
          error &&
          'cause' in error &&
          'code' in error.cause &&
          error.cause.code === 14
        ) {
          return {
            hasActiveWorkflow: false,
          };
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error querying active nameservers change workflow',
        });
      }
    }),

  /**
   * Cancel an active DNSSEC workflow (enable or disable).
   * Uses Temporal's native workflow cancellation.
   */
  cancelDnssecWorkflow: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        operation: z.enum(['ENABLE_DNSSEC', 'REMOVE_DNSSEC']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { domainName, operation } = input;

      await assertAuthenticatedUserIsDomainOwner(domainName, ctx.user);

      const punycodeDomain = toPunycodeDomainName(domainName);
      const workflowId =
        operation === 'ENABLE_DNSSEC'
          ? enableDnssecWorkflow.generateId({ domainName: punycodeDomain })
          : disableDnssecWorkflow.generateId({ domainName: punycodeDomain });

      try {
        const handle = temporalClient.workflow.getHandle(workflowId);
        const description = await handle.describe();

        if (description.status.name !== 'RUNNING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Workflow is not running',
          });
        }

        await handle.cancel();

        _logger.info(
          { domainName, operation, workflowId, userId: ctx.user.id },
          'DNSSEC workflow cancellation requested',
        );

        return { success: true, workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        _logger.error(
          { error, domainName, operation, workflowId },
          'Failed to cancel DNSSEC workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel workflow',
          cause: error,
        });
      }
    }),
});
