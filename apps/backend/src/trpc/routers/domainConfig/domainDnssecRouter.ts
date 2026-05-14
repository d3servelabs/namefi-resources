import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

import {
  enableCustomDnssec,
  getCustomDnssecEnableStatus,
  startDeferredAssociateDelegationSignerWorkflow,
} from '#lib/domains/custom-dnssec';
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
import {
  DEFERRED_DS_DEFAULTS,
  getDeferredAssociateDsProgressQuery,
} from '../../../temporal/workflows/deferred-associate-delegation-signer.workflow';
import { TEMPORAL_QUEUES } from '../../../temporal/shared';
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
      await enableAutoDnssecForDomain(
        toPunycodeDomainName(input.domainName),
        ctx.user.id,
      );

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
   * Start a deferred-DS workflow that polls authoritative-NS validation, then
   * public-DNS validation, then submits the DS to the registrar. Used when
   * the user clicks Submit with the override checkbox on a failing
   * validation.
   */
  submitDeferredDelegationSigner: protectedProcedure
    .input(domainConfigContract.dnssec.submitDeferredDelegationSigner.input)
    .output(domainConfigContract.dnssec.submitDeferredDelegationSigner.output)
    .mutation(async ({ input, ctx }) => {
      _logger.assign({
        method: 'submitDeferredDelegationSigner',
        domainName: input.domainName,
        keyTag: input.signingConfig.keyTag,
      });
      _logger.debug('Starting deferred DS association workflow');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);

      const punycodeDomain = toPunycodeDomainName(input.domainName);
      const authoritativeTimeoutMs = input.authoritativeTimeoutMinutes
        ? input.authoritativeTimeoutMinutes * 60_000
        : DEFERRED_DS_DEFAULTS.authoritativeTimeoutMs;
      const publicDnsTimeoutMs = input.publicDnsTimeoutMinutes
        ? input.publicDnsTimeoutMinutes * 60_000
        : DEFERRED_DS_DEFAULTS.publicDnsTimeoutMs;

      try {
        const { workflowId, existed } =
          await startDeferredAssociateDelegationSignerWorkflow({
            domainName: punycodeDomain,
            signingConfig: input.signingConfig as Parameters<
              typeof startDeferredAssociateDelegationSignerWorkflow
            >[0]['signingConfig'],
            userId: ctx.user.id,
            authoritativeTimeoutMs,
            publicDnsTimeoutMs,
          });
        if (existed) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'A deferred DS submission is already running for this key tag.',
          });
        }
        return { workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to start deferred DS workflow',
          cause: error,
        });
      }
    }),

  /**
   * List running deferred-DS workflows for the given domain. Each row
   * carries the live signingConfig + phase so the frontend panel can render
   * a Pending row with phase tooltip.
   */
  getPendingDeferredDelegationSigners: protectedProcedure
    .input(
      domainConfigContract.dnssec.getPendingDeferredDelegationSigners.input,
    )
    .output(
      domainConfigContract.dnssec.getPendingDeferredDelegationSigners.output,
    )
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);

      // The workflow's `domainName` search attribute is set to the punycode
      // form (see submitDeferredDelegationSigner above and the workflow's
      // upsertSearchAttributes call). Filter on the same form so IDN
      // domains aren't silently missed.
      const punycodeDomain = toPunycodeDomainName(input.domainName);
      const escapedDomain = punycodeDomain.replace(/'/g, "''");
      const workflows = temporalClient.workflow.list({
        query: `TaskQueue = '${TEMPORAL_QUEUES.DOMAINS}' AND ExecutionStatus = 'Running' AND WorkflowType = 'deferredAssociateDelegationSignerWorkflow' AND \`domainName\` = '${escapedDomain}'`,
      });

      const pending: Array<{
        workflowId: string;
        runId: string;
        signingConfig: ReturnType<
          (typeof domainConfigContract.dnssec.getPendingDeferredDelegationSigners.output)['parse']
        >['pending'][number]['signingConfig'];
        phase:
          | 'await-authoritative-validation'
          | 'await-public-dns-validation'
          | 'submit-to-registrar';
        startedAtMs: number;
        phaseStartedAtMs?: number;
        authoritativeTimeoutMs: number;
        publicDnsTimeoutMs: number;
      }> = [];

      for await (const workflowExec of workflows) {
        try {
          const handle = temporalClient.workflow.getHandle(
            workflowExec.workflowId,
            workflowExec.runId,
          );
          const live = await handle.query(getDeferredAssociateDsProgressQuery);
          const inFlight = live.progress.steps.find(
            (s) => s.status === 'IN_PROGRESS',
          );
          // If no step is in-flight (race between phases), pick the most
          // recently started not-completed step. Fall back to the first
          // unfinished one.
          const phaseStep =
            inFlight ??
            live.progress.steps.find((s) => s.status !== 'COMPLETED');
          if (!phaseStep) continue;
          pending.push({
            workflowId: workflowExec.workflowId,
            runId: workflowExec.runId,
            // The workflow input requires all DnssecKey fields to be set, so
            // the live state is safe to assert as the strict contract shape.
            signingConfig:
              live.signingConfig as (typeof pending)[number]['signingConfig'],
            phase: phaseStep.id as
              | 'await-authoritative-validation'
              | 'await-public-dns-validation'
              | 'submit-to-registrar',
            startedAtMs: live.startedAtMs,
            // The current step's start timestamp — used by the frontend to
            // compute "remaining" against the phase-specific timeout.
            phaseStartedAtMs: phaseStep.startedAt,
            authoritativeTimeoutMs: live.authoritativeTimeoutMs,
            publicDnsTimeoutMs: live.publicDnsTimeoutMs,
          });
        } catch (error) {
          _logger.warn(
            {
              error,
              workflowId: workflowExec.workflowId,
              runId: workflowExec.runId,
            },
            'Skipping pending workflow row — query handler unavailable',
          );
        }
      }

      return { pending };
    }),

  /**
   * Cancel a deferred-DS workflow. Mirrors `cancelDnssecWorkflow` but keyed
   * on `workflowId` so the row in the panel can be cancelled deterministically.
   */
  cancelDeferredDelegationSigner: protectedProcedure
    .input(domainConfigContract.dnssec.cancelDeferredDelegationSigner.input)
    .output(domainConfigContract.dnssec.cancelDeferredDelegationSigner.output)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);

      try {
        const handle = temporalClient.workflow.getHandle(input.workflowId);
        const description = await handle.describe();
        if (description.status.name !== 'RUNNING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Workflow is not running',
          });
        }
        // Bind the workflowId to the domain the caller owns. Otherwise an
        // owner of domain A could pass A's domainName + B's workflowId and
        // bypass the owner-guard above to cancel B's workflow.
        if (description.type !== 'deferredAssociateDelegationSignerWorkflow') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Workflow is not a deferred-DS submission workflow',
          });
        }
        // The workflow stores the punycode form in its `domainName` search
        // attribute, so compare against the same normalization the submit
        // handler used.
        const storedDomain = description.searchAttributes?.domainName?.[0];
        if (storedDomain !== toPunycodeDomainName(input.domainName)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Workflow does not belong to this domain',
          });
        }
        await handle.cancel();
        _logger.info(
          {
            domainName: input.domainName,
            workflowId: input.workflowId,
            userId: ctx.user.id,
          },
          'Deferred-DS workflow cancellation requested',
        );
        return { success: true, workflowId: input.workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        _logger.error(
          { error, workflowId: input.workflowId },
          'Failed to cancel deferred-DS workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel workflow',
          cause: error,
        });
      }
    }),

  /**
   * Read-only "what will Enable DNSSEC do?" check for the Simple-mode panel.
   * Reports readiness, the detected DNS provider, and a sample of the
   * authoritative NS hostnames so the panel can render the right CTA card
   * (green Enable / amber sad-path / quiet already-active) without the user
   * clicking anything.
   */
  getCustomDnssecEnableStatus: protectedProcedure
    .input(domainConfigContract.dnssec.getCustomDnssecEnableStatus.input)
    .output(domainConfigContract.dnssec.getCustomDnssecEnableStatus.output)
    .query(async ({ input, ctx }) => {
      _logger.assign({
        method: 'getCustomDnssecEnableStatus',
        domainName: input.domainName,
      });
      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      return getCustomDnssecEnableStatus(
        toPunycodeDomainName(input.domainName),
      );
    }),

  /**
   * Simple-mode "Enable DNSSEC" orchestrator. Detects KSK(s) at authoritative
   * NS, derives DS for each, and either submits immediately (both validation
   * lanes pass) or starts a deferred-DS workflow (at least one lane lags).
   * Returns one result entry per KSK so the frontend can compose an accurate
   * toast.
   */
  enableCustomDnssec: protectedProcedure
    .input(domainConfigContract.dnssec.enableCustomDnssec.input)
    .output(domainConfigContract.dnssec.enableCustomDnssec.output)
    .mutation(async ({ input, ctx }) => {
      _logger.assign({
        method: 'enableCustomDnssec',
        domainName: input.domainName,
      });
      _logger.debug('Running custom-DNSSEC enable orchestrator');

      await assertAuthenticatedUserIsDomainOwner(input.domainName, ctx.user);
      return enableCustomDnssec({
        domainName: toPunycodeDomainName(input.domainName),
        userId: ctx.user.id,
      });
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
