import type { DnssecKey } from '@namefi-astra/registrars/data/types/dnssec';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';
import { pollWithTimeoutAlert } from '../shared/workflow-helpers/poll-with-timeout-alert';
import type { DeferredDsOutcome } from '../activities/domain/dnssec.activities';

export type DeferredAssociateDsStepId =
  | 'await-authoritative-validation'
  | 'await-public-dns-validation'
  | 'submit-to-registrar';

/**
 * Live state of a running deferred-DS workflow, used by the frontend panel
 * to render Pending rows and tooltips.
 */
export type DeferredAssociateDsLiveState = {
  progress: WorkflowProgressState<DeferredAssociateDsStepId>;
  /** Echo of inputs so the panel can populate the Pending row without a
   * separate registrar call. */
  signingConfig: DnssecKey;
  startedAtMs: number;
  authoritativeTimeoutMs: number;
  publicDnsTimeoutMs: number;
};

export const getDeferredAssociateDsProgressQuery =
  defineQuery<DeferredAssociateDsLiveState>('getDeferredAssociateDsProgress');

/** Default timeouts. Exported so the tRPC layer can fill in defaults too. */
export const DEFERRED_DS_DEFAULTS = {
  authoritativeTimeoutMs: 120 * 60_000, // 2h
  publicDnsTimeoutMs: 48 * 60 * 60_000, // 48h
  authoritativeAlertMs: 30 * 60_000, // alert at 30 min
  publicDnsAlertMs: 6 * 60 * 60_000, // alert at 6h
} as const;

export interface DeferredAssociateDsWorkflowInput {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  userId: string;
  /** Hard-fail timeout for the authoritative-NS validation phase. */
  authoritativeTimeoutMs: number;
  /** Hard-fail timeout for the public-DNS validation phase. */
  publicDnsTimeoutMs: number;
}

/**
 * Two-phase polling workflow for "I want to associate this DS but the DNSKEY
 * isn't visible yet" cases. Polls authoritative-NS DNSKEYs first; once they
 * match, polls public-DNS DNSKEYs; once those match too, calls the registrar.
 *
 * On every terminal state (success / either timeout / cancellation /
 * unexpected failure) it emails the domain owner and posts a
 * `generalAlertNamefi` Slack alert for the dev team.
 */
export async function deferredAssociateDelegationSignerWorkflow(
  input: DeferredAssociateDsWorkflowInput,
): Promise<void> {
  const startedAtMs = Date.now();
  const progress = createWorkflowProgress<DeferredAssociateDsStepId>(
    [
      'await-authoritative-validation',
      'await-public-dns-validation',
      'submit-to-registrar',
    ],
    { workflowType: 'deferredAssociateDelegationSigner' },
  );

  workflow.setHandler(getDeferredAssociateDsProgressQuery, () => ({
    progress: progress.state,
    signingConfig: input.signingConfig,
    startedAtMs,
    authoritativeTimeoutMs: input.authoritativeTimeoutMs,
    publicDnsTimeoutMs: input.publicDnsTimeoutMs,
  }));

  workflow.upsertSearchAttributes({
    domainName: [input.domainName],
  });

  // Polling activities — long-running with infinite retry. The activity
  // itself throws on "not matching yet" so Temporal's retry loop drives the
  // poll cadence. The auth-NS lane runs `dig +tries=3 +time=15` against each
  // nameserver in parallel; the public-DNS lane uses a 10 s DoH AbortController
  // timeout. 3 minutes leaves comfortable headroom over a single slow NS
  // (worst case ~45 s) plus DoH overhead.
  const longRunningActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '3 minutes',
      retry: {
        initialInterval: '30 seconds',
        maximumInterval: '5 minutes',
        backoffCoefficient: 2,
        maximumAttempts: undefined,
      },
    },
  });

  // Submit + notification activities — short-running, bounded retry.
  const standardActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  const { pollAuthoritativeDsValidation, pollPublicDnsDsValidation } =
    longRunningActivities;
  const { associateDelegationSigner, sendDeferredDsOutcomeEmailToUser } =
    standardActivities;

  // Dev-team Slack alert lane runs on the DEFAULT task queue.
  const defaultActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      retry: { maximumInterval: '1 minute', maximumAttempts: 5 },
    },
  });
  const { generalAlertNamefi } = defaultActivities;

  const notify = async (
    outcome: DeferredDsOutcome,
    reason?: string,
  ): Promise<void> => {
    try {
      await sendDeferredDsOutcomeEmailToUser({
        domainName: input.domainName,
        signingConfig: input.signingConfig,
        userId: input.userId,
        outcome,
        reason,
      });
    } catch {
      // Best-effort — email failure already logged in the activity.
    }
    try {
      const info = workflow.workflowInfo();
      await generalAlertNamefi({
        title: `Deferred DS workflow ${outcome}`,
        message: `Domain "${input.domainName}" — keyTag ${input.signingConfig.keyTag ?? '—'}: ${outcome}${reason ? ` (${reason})` : ''}`,
        workflowId: info.workflowId,
        runId: info.runId,
        domainName: input.domainName,
        keyTag: input.signingConfig.keyTag,
        outcome,
      });
    } catch {
      // Slack lane is best-effort; never let alerting failures kill the
      // notify step.
    }
  };

  try {
    // Phase 1 — wait for the user's DNSKEY to appear at their authoritative
    // nameservers.
    progress.startStep(
      'await-authoritative-validation',
      'Waiting for DNSKEY at your authoritative nameservers...',
    );
    await pollWithTimeoutAlert(
      pollAuthoritativeDsValidation({
        domainName: input.domainName,
        signingConfig: input.signingConfig,
      }),
      {
        domainName: input.domainName,
        operationLabel: 'authoritative DS match',
        alertThresholdMs: DEFERRED_DS_DEFAULTS.authoritativeAlertMs,
        failThresholdMs: input.authoritativeTimeoutMs,
      },
    );
    progress.completeStep('await-authoritative-validation');

    // Phase 2 — wait for public DNS to reflect the same DNSKEY.
    progress.startStep(
      'await-public-dns-validation',
      'Waiting for DNSKEY to propagate to public DNS...',
    );
    await pollWithTimeoutAlert(
      pollPublicDnsDsValidation({
        domainName: input.domainName,
        signingConfig: input.signingConfig,
      }),
      {
        domainName: input.domainName,
        operationLabel: 'public DNS DS match',
        alertThresholdMs: DEFERRED_DS_DEFAULTS.publicDnsAlertMs,
        failThresholdMs: input.publicDnsTimeoutMs,
      },
    );
    progress.completeStep('await-public-dns-validation');

    // Phase 3 — submit to registrar. Once we've reached this point both
    // validation lanes have passed and the user expects an association. The
    // registrar call must not be interrupted by a late cancellation: if it
    // were, the registrar could accept the DS while the workflow tells the
    // user it didn't (or vice-versa), leaving an inconsistent state. Run the
    // submit and the success-notify inside a non-cancellable scope.
    await workflow.CancellationScope.nonCancellable(async () => {
      progress.startStep(
        'submit-to-registrar',
        'Submitting DS to the registrar...',
      );
      await associateDelegationSigner(input.domainName, input.signingConfig);
      progress.completeStep('submit-to-registrar');
      progress.complete();
      await notify('success');
    });
  } catch (error) {
    if (workflow.isCancellation(error)) {
      progress.fail('Workflow cancelled');
      await workflow.CancellationScope.nonCancellable(async () => {
        await notify('cancelled');
      });
      throw error;
    }

    const reason = error instanceof Error ? error.message : String(error);
    const outcome = classifyTimeout(error, progress.state);
    if (progress.state.phase !== 'FAILED') {
      progress.fail(reason);
    }
    await notify(outcome, reason);
    throw error;
  }
}

function classifyTimeout(
  error: unknown,
  state: WorkflowProgressState<DeferredAssociateDsStepId>,
): DeferredDsOutcome {
  // pollWithTimeoutAlert throws an ApplicationFailure with type 'polling/timeout'
  // when the hard-fail threshold is reached. Inspect the chain.
  const looksLikeTimeout =
    error instanceof Error &&
    /timed out after \d+ minutes/i.test(error.message);
  if (!looksLikeTimeout) return 'failed';
  // Use the in-flight step to attribute the timeout to a specific phase.
  const inFlight = state.steps.find((s) => s.status === 'IN_PROGRESS');
  if (inFlight?.id === 'await-authoritative-validation') {
    return 'authoritative-timeout';
  }
  if (inFlight?.id === 'await-public-dns-validation') {
    return 'public-dns-timeout';
  }
  return 'failed';
}

deferredAssociateDelegationSignerWorkflow.generateId = (input: {
  domainName: PunycodeDomainName;
  signingConfig: { keyTag?: number };
}): string => {
  return `deferred-associate-ds-[${input.domainName}-${input.signingConfig.keyTag ?? 'unknown'}]`;
};

deferredAssociateDelegationSignerWorkflow.progressQuery =
  getDeferredAssociateDsProgressQuery;
