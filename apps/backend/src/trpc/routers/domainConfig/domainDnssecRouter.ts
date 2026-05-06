import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

import {
  associateDelegationSigner,
  disableDnssecForDomain,
  disassociateDelegationSigner,
  enableAutoDnssecForDomain,
  getActiveDnssecOperationWorkflows,
  getDnssecStatusDetails,
} from '#lib/domains/dnssec';
import {
  deriveDelegationSigner,
  validateDelegationSignerAgainstPublishedDnskeys,
} from '#lib/domains/dnssec-validation';

import { createLogger, logger } from '#lib/logger';

import { TRPCError } from '@trpc/server';
import { temporalClient } from '../../../temporal/client';
import { enableDnssecWorkflow } from '../../../temporal/workflows/enable-dnssec.workflow';
import { disableDnssecWorkflow } from '../../../temporal/workflows/disable-dnssec.workflow';
import { protectedProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { domainConfigContract } from '@namefi-astra/common/contract/domain-config-contract';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';

const _logger = createLogger({ module: 'domain-dnssec-router' });

export const domainDnssecRouter = createContractTRPCRouter<
  (typeof domainConfigContract)['dnssec']
>({
  /**
   * Get Domain DNSSEC Details
   */
  getDomainDnssecDetails: protectedProcedure
    .input(domainConfigContract.dnssec.getDomainDnssecDetails.input)
    .output(domainConfigContract.dnssec.getDomainDnssecDetails.output)
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
    .input(domainConfigContract.dnssec.enableDnssec.input)
    .output(domainConfigContract.dnssec.enableDnssec.output)
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
    .input(domainConfigContract.dnssec.disableDnssec.input)
    .output(domainConfigContract.dnssec.disableDnssec.output)
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
    .input(domainConfigContract.dnssec.associateDelegationSigner.input)
    .output(domainConfigContract.dnssec.associateDelegationSigner.output)
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
        input.signingConfig as Parameters<typeof associateDelegationSigner>[1],
      );

      _logger.debug('Successfully associated delegation signer');
    }),

  /**
   * Remove a single delegation signer from the domain. The frontend passes
   * the row identifier (id / publicKey / keyTag-as-string) it has for the
   * signer being removed.
   */
  disassociateDelegationSigner: protectedProcedure
    .input(domainConfigContract.dnssec.disassociateDelegationSigner.input)
    .output(domainConfigContract.dnssec.disassociateDelegationSigner.output)
    .mutation(async ({ input, ctx }) => {
      _logger.assign({
        method: 'disassociateDelegationSigner',
        domainName: input.domainName,
        keyId: input.keyId,
      });
      _logger.debug('Disassociating delegation signer');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      await disassociateDelegationSigner(
        toPunycodeDomainName(input.domainName),
        input.keyId,
      );
    }),

  /**
   * Validate a user-supplied DS record against the DNSKEY RRsets at the
   * domain's authoritative nameservers AND at a public recursive resolver
   * (Google DoH). Returns a two-lane result so the form can show both.
   */
  validateDelegationSigner: protectedProcedure
    .input(domainConfigContract.dnssec.validateDelegationSigner.input)
    .output(domainConfigContract.dnssec.validateDelegationSigner.output)
    .mutation(async ({ input, ctx }) => {
      _logger.assign({
        method: 'validateDelegationSigner',
        domainName: input.domainName,
        keyTag: input.signingConfig.keyTag,
        algorithm: input.signingConfig.algorithm,
      });
      _logger.debug('Validating user-supplied DS against published DNSKEYs');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      return validateDelegationSignerAgainstPublishedDnskeys({
        domainName: toPunycodeDomainName(input.domainName),
        signingConfig: input.signingConfig as Parameters<
          typeof validateDelegationSignerAgainstPublishedDnskeys
        >[0]['signingConfig'],
      });
    }),

  /**
   * Derive a DS payload either from a user-pasted record (DNSKEY or DS, full
   * or rdata-only) or by autodetect — fetching the KSK DNSKEY from the
   * domain's authoritative nameservers. Returns one candidate per KSK so the
   * frontend can surface a chooser when rotation is in progress.
   */
  deriveDelegationSigner: protectedProcedure
    .input(domainConfigContract.dnssec.deriveDelegationSigner.input)
    .output(domainConfigContract.dnssec.deriveDelegationSigner.output)
    .mutation(async ({ input, ctx }) => {
      _logger.assign({
        method: 'deriveDelegationSigner',
        domainName: input.domainName,
        digestType: input.digestType,
        mode: input.text ? 'paste' : 'auto',
      });
      _logger.debug('Deriving delegation signer');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      return deriveDelegationSigner({
        domainName: toPunycodeDomainName(input.domainName),
        text: input.text,
        digestType: input.digestType,
      });
    }),

  /**
   * Get active DNSSEC operation workflows
   */
  getActiveDnssecOperationWorkflows: protectedProcedure
    .input(domainConfigContract.dnssec.getActiveDnssecOperationWorkflows.input)
    .output(
      domainConfigContract.dnssec.getActiveDnssecOperationWorkflows.output,
    )
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
    .input(domainConfigContract.dnssec.cancelDnssecWorkflow.input)
    .output(domainConfigContract.dnssec.cancelDnssecWorkflow.output)
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
