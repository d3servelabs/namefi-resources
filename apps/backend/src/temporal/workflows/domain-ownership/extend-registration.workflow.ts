import { OperationStatus } from '@namefi-astra/registrars/data/types/operation-status';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import * as workflow from '@temporalio/workflow';
import { addYears, fromUnixTime, getUnixTime } from 'date-fns';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../../shared/workflow-helpers/catch-and-alert-locally';
import {
  createDecisionGateRegistry,
  runWithDecisionGate,
} from '../../shared/workflow-helpers/decision-gate';
import {
  expirationIsoSchema,
  operationStatusSchema,
} from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  pollingOpts,
  shortRunningOpts,
} from '../../shared';
import { setExpirationForNamefiNft } from '../mint.workflow';
import { optimisticSetExpirationForNamefiNftWorkflow } from '../optimistic-nft-tx.workflow';
import { determineDurationLimitsForRenewItems } from '#lib/domains/duration-constraints/determine-renew-duration-limits';

/**
 * How long an extend-registration poll's decision gate waits for an admin to
 * verify registrar state after the (already-bounded) poll exhausts its retries,
 * before failing the workflow. Extend runs with no hard run-timeout (only
 * `parentClosePolicy: REQUEST_CANCEL`), so a multi-day window is safe.
 */
const EXTEND_POLL_DECISION_TIMEOUT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export type ExtendDomainRegistrationWorkflowOutput = {
  /** Status of the EPP (Extensible Provisioning Protocol) operation - either SUCCESS or FAILURE */
  eppOperationStatus: 'SUCCESS' | 'FAILURE';
  /** Transaction hash of the blockchain transaction, only present if transaction was successful */
  txHash?: string;
  /** Status of the blockchain transaction - either SUCCESS or FAILURE */
  txStatus: 'SUCCESS' | 'FAILURE';
};

export type ExtendDomainRegistrationWorkflowInput = {
  /** Ethereum address of the domain owner */
  ownerAddress: ChecksumWalletAddress;
  /** Domain name in LDH (Letter-Digit-Hyphen) format */
  normalizedDomainName: NamefiNormalizedDomain;
  /** Number of years to extend the registration */
  durationInYears: number;
  /** User ID */
  userId: string;
  /** Whether to update the domain index after extension */
  updateDomainIndex?: boolean;
  /**
   * Optional order linkage. When present, the deferred NFT expiration update
   * records the extend tx on the order item (`metadata.extendTransaction`).
   */
  orderId?: string;
  orderItemId?: string;
};

const { submitOperationToExtendRegistrationToRegistrar } = typedProxyActivities(
  {
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumAttempts: 1,
      },
    },
  },
);
const { getEppExpirationTime } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
    retry: {
      ...(shortRunningOpts.retry ?? {}),
      maximumAttempts: 5,
    },
  },
});

const { updateDomainIndexRows, triggerUpdateDomainIndex } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '2m',
    },
  });

/**
 * Temporal workflow that handles domain registration extension process.
 * This workflow coordinates the extension of domain registration period on both:
 * 1. The domain registrar side
 * 2. The corresponding NFT metadata update
 *
 * The workflow does NOT handle any payment processing - payments should be handled separately.
 *
 * Flow:
 * 1. Creates and submits extension operation to registrar via createAndSubmitOperationToExtendRegistration
 * 2. Polls for operation completion using checkExtendRegistrationOperationsStatus with retry logic
 *    - Initial retry interval: 1 minute
 *    - Maximum retry interval: 8 minutes
 *    - Maximum attempts: 10
 * 3. On success:
 *    - Retrieves new expiration time
 *    - Updates NFT expiration via child workflow (setExpirationForNamefiNft)
 *    - Marks operation as successful
 *    - Optionally notifies user
 * 4. On NFT update failure:
 *    - Sends alert via generalAlertNamefi
 *    - Operation remains marked as successful
 * 5. On operation failure:
 *    - Marks operation as failed
 *    - Optionally notifies user
 *
 * @param input - ExtendDomainRegistrationWorkflowInput object containing:
 *   @param input.ownerAddress - Ethereum address of the domain owner
 *   @param input.normalizedDomainName - Domain name in LDH (Letter-Digit-Hyphen) format
 *   @param input.durationInYears - Number of years to extend the registration
 *   @param input.notifyUser - Whether to notify the user about operation outcome
 *
 * @returns ExtendDomainRegistrationWorkflowOutput object containing:
 *   - eppOperationStatus: Status of the EPP operation ('SUCCESS' | 'FAILURE')
 *   - txHash?: Transaction hash of the blockchain transaction (if successful)
 *   - txStatus: Status of the blockchain transaction ('SUCCESS' | 'FAILURE')
 *
 * @throws Will throw if NFT expiration update fails, but registrar operation will still be marked as successful
 */
export async function extendDomainRegistrationWorkflow({
  durationInYears,
  normalizedDomainName,
  ownerAddress,
  userId,
  updateDomainIndex = true,
  orderId,
  orderItemId,
}: ExtendDomainRegistrationWorkflowInput): Promise<ExtendDomainRegistrationWorkflowOutput> {
  //#region Activities Defs
  const { getDomainChain, getPoweredByNamefi3PDomains } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      retry: {
        initialInterval: '10 seconds',
        maximumInterval: '1 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 10,
      },
    },
  });

  const { criticalAlertNamefi, parseDomainName: parseDomainNameActivity } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
      },
    });

  //#endregion Activities Defs

  const chainId = await getDomainChain(normalizedDomainName);

  const parseResult = workflow.patched('parse-domain-name-as-activity')
    ? await parseDomainNameActivity(normalizedDomainName)
    : parseDomainName(normalizedDomainName);

  let nextExpirationTime: string | Date;
  if (parseResult.valid && parseResult.registryType === 'traditional') {
    nextExpirationTime = await _extendSldDomainAndReturnNewExpirationTime({
      normalizedDomainName,
      ownerAddress,
      durationInYears,
      chainId,
      userId,
    });
  } else if (parseResult.valid && parseResult.registryType === 'subdomain') {
    const parentDomain = parseResult.immediateParentDomain;
    const allowedParentDomains = await getPoweredByNamefi3PDomains();
    if (!allowedParentDomains.includes(parentDomain)) {
      throw workflow.ApplicationFailure.create({
        message: `Invalid domain name "${normalizedDomainName}", parent domain "${parentDomain}" is not allowed`,
        nonRetryable: true,
      });
    }
    nextExpirationTime = await _extend3ldDomainAndReturnNewExpirationTime({
      normalizedDomainName,
      ownerAddress,
      durationInYears,
      chainId,
      userId,
    });
  } else {
    throw workflow.ApplicationFailure.create({
      message: `Invalid domain name "${normalizedDomainName}"`,
      nonRetryable: true,
    });
  }
  const nextExpirationTimeInSeconds = getUnixTime(nextExpirationTime);

  // NON-BLOCKING NFT expiration update: the registrar renewal has already
  // succeeded above. New runs kick off the on-chain expiration update in the
  // background (ABANDON) behind an optimistic CHANGING_EXPIRATION overlay, so the
  // renewal flow / order settles immediately while My Domains shows the new
  // expiration right away. The wrapper handles NFT-update failure + alerting.
  // Patched so in-flight runs replay on the original awaited path below.
  if (workflow.patched('extend-optimistic-expiration')) {
    try {
      await workflow.startChild(optimisticSetExpirationForNamefiNftWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        args: [
          {
            chainId,
            normalizedDomainName,
            expirationTimeInSeconds: nextExpirationTimeInSeconds,
            orderId,
            orderItemId,
          },
        ],
        workflowId: optimisticSetExpirationForNamefiNftWorkflow.generateId({
          normalizedDomainName,
          chainId,
          expirationTimeInSeconds: nextExpirationTimeInSeconds,
        }),
        parentClosePolicy: 'ABANDON',
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
    } catch (error: any) {
      // Couldn't even start the background NFT update; the renewal still stands.
      await catchAndAlertLocally(
        () =>
          criticalAlertNamefi({
            title: `Failed to start deferred NFT expiration update for ${normalizedDomainName}`,
            message: `Domain ${normalizedDomainName} was renewed at the registrar but the optimistic NFT expiration update could not be started. The NFT expiry may be stale until reconciled.`,
            normalizedDomainName,
            nextExpirationTimeInSeconds,
            operation: 'DOMAIN_RENEW',
            error: error?.message ?? String(error),
          }),
        {
          message:
            'Failed to alert about deferred NFT expiration update start failure',
          details: { normalizedDomainName },
        },
      );
    }

    if (updateDomainIndex) {
      await _updateDomainIndexAfterExtension({
        normalizedDomainName,
        nextExpirationTime,
      });
    }

    return {
      eppOperationStatus: 'SUCCESS',
      txStatus: 'SUCCESS',
    };
  }

  try {
    const txHash = await workflow.executeChild(setExpirationForNamefiNft, {
      taskQueue: TEMPORAL_QUEUES.MINT,
      // TODO(sami -> victor): should this id be deteminstinc based on [chainId,normalizedDomainName,expirationTimeInUnix]?
      workflowId: `set-expiration-for-namefi-nft-${normalizedDomainName}-${chainId}-${nextExpirationTimeInSeconds}`,
      args: [chainId, normalizedDomainName, nextExpirationTimeInSeconds],
      retry: {
        maximumAttempts: 5,
      },
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      parentClosePolicy: 'REQUEST_CANCEL',
    });

    if (updateDomainIndex) {
      await _updateDomainIndexAfterExtension({
        normalizedDomainName,
        nextExpirationTime,
      });
    }

    return {
      eppOperationStatus: 'SUCCESS',
      txHash,
      txStatus: 'SUCCESS',
    };
  } catch (error: any) {
    const info = workflow.workflowInfo();

    workflow.log.error(
      'NFT expiration update failed after successful registrar renewal',
      {
        workflowId: info.workflowId,
        runId: info.runId,
        normalizedDomainName,
        nextExpirationTimeInSeconds,
        chainId,
        error: error?.message ?? String(error),
      },
    );

    try {
      await criticalAlertNamefi({
        title: `PARTIAL FAILURE: Renewal succeeded but NFT expiry stale (${info.workflowId})`,
        message: `Domain ${normalizedDomainName} was renewed at the registrar but the NFT expiration update failed. The NFT shows a stale expiry date which may cause double-charging via auto-renewal or incorrect marketplace listings.`,
        runId: info.runId,
        nextExpirationTimeInSeconds,
        operation: 'DOMAIN_RENEW',
        normalizedDomainName,
        error: error?.message ?? String(error),
      });
    } catch (alertError: any) {
      workflow.log.error(
        'Failed to send critical alert for NFT expiry update failure',
        {
          alertError: alertError?.message ?? String(alertError),
          normalizedDomainName,
        },
      );
    }

    if (updateDomainIndex) {
      await _updateDomainIndexAfterExtension({
        normalizedDomainName,
        nextExpirationTime,
      });
    }

    return {
      eppOperationStatus: 'SUCCESS',
      txStatus: 'FAILURE',
    };
  }
}

const { parseDomainName: parseDomainNameActivity } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
  },
});
/**
 * Extend EPP domain registration post import workflow
 */
export async function extendEppDomainRegistrationPostImportWorkflow({
  durationInYears,
  normalizedDomainName,
  ownerAddress,
  userId,
}: ExtendDomainRegistrationWorkflowInput): Promise<{
  eppOperationStatus: string;
  newExpirationTime: string;
}> {
  const parseResult = workflow.patched('parse-domain-name-as-activity')
    ? await parseDomainNameActivity(normalizedDomainName)
    : parseDomainName(normalizedDomainName);

  let newExpirationTime: string | Date;
  if (parseResult.valid && parseResult.registryType === 'traditional') {
    newExpirationTime = await _extendSldDomainAndReturnNewExpirationTime({
      normalizedDomainName,
      ownerAddress,
      durationInYears,
      userId,
    });
  } else {
    throw workflow.ApplicationFailure.create({
      message: `extendEppDomainRegistrationPostImportWorkflow: Invalid domain name "${normalizedDomainName}", domain is not an epp domains`,
      nonRetryable: true,
    });
  }

  return {
    eppOperationStatus: 'SUCCESS',
    newExpirationTime: newExpirationTime.toString(),
  };
}

async function _updateDomainIndexAfterExtension({
  normalizedDomainName,
  nextExpirationTime,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  nextExpirationTime: string | Date;
}) {
  // Update domain index after successful extension
  await catchAndAlertLocally(
    () =>
      updateDomainIndexRows([
        {
          domainName: normalizedDomainName,
          expirationTime: new Date(nextExpirationTime),
        },
      ]),
    {
      message: 'Failed to update domain index after domain extension',
      details: {
        domainName: normalizedDomainName,
        workflowId: workflow.workflowInfo().workflowId,
      },
    },
  );

  // Trigger full index update after domain extension
  await catchAndAlertLocally(triggerUpdateDomainIndex, {
    message:
      'Failed to trigger full domain index update after domain extension',
    details: {
      domainName: normalizedDomainName,
      workflowId: workflow.workflowInfo().workflowId,
    },
  });
}

async function _extendSldDomainAndReturnNewExpirationTime({
  normalizedDomainName,
  ownerAddress,
  durationInYears,
  chainId,
}: Exclude<ExtendDomainRegistrationWorkflowInput, 'updateDomainIndex'> & {
  chainId?: number;
}) {
  const { pollEppExtendRegistrationStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '10 seconds',
      retry: {
        initialInterval: '1 minute',
        maximumInterval: '8 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 20,
      },
    },
  });

  const { pollAndExpectExpirationChange } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...pollingOpts,
      retry: {
        ...pollingOpts.retry,
        initialInterval: '10 seconds',
        maximumInterval: '2 minutes',
        maximumAttempts: 30,
      },
    },
  });

  // New runs wrap each (already-bounded) poll in a decision gate: when a poll
  // exhausts its retry budget the operation is still queued at the registrar, so
  // alert + wait for an admin to verify and RETRY (re-poll) / RESPOND (verified
  // value) / CANCEL, instead of dead-ending. In-flight (pre-patch) runs keep the
  // original throw-on-exhaustion path. Explicit prefix keeps the registry from
  // colliding with a host workflow's own registry if extend ever runs embedded.
  const pollGateRegistry = workflow.patched(
    'extend-registration-poll-decision-gate',
  )
    ? createDecisionGateRegistry({ prefix: 'extend-registration' })
    : undefined;

  const previousExpirationTime = await getEppExpirationTime({
    normalizedDomainName,
  });
  const { operationId: externalOperationId } =
    await submitOperationToExtendRegistrationToRegistrar({
      normalizedDomainName,
      durationInYears,
    });
  if (!externalOperationId) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: 'Failed to submit operation to extend registration',
    });
  }

  // Surfaced to the admin gate-evidence gatherer (keyed by `gateKind`) so it can
  // read the domain's expiration from every source (registrar / NFT / registrar
  // index / RDAP-WHOIS), look up the registrar operation by id, and compare
  // against the expected post-renewal date to tell whether the renewal already
  // landed. All values are already-computed + serializable (no new activity
  // calls), so attaching them stays replay-safe.
  const extendGateEvidenceParams = {
    normalizedDomainName,
    externalOperationId,
    durationInYears,
    previousExpirationTimeIso: workflow.patched(
      'fix typescript previousExpirationTime.toISOString',
    )
      ? 'toISOString' in previousExpirationTime
        ? previousExpirationTime.toISOString()
        : previousExpirationTime
      : previousExpirationTime.toISOString(),
    ...(chainId !== undefined ? { chainId } : {}),
  };

  // `pollEppExtendRegistrationStatus` is a retry-bounded poll (20 attempts): it
  // keeps polling until the status is terminal, then throws if it exhausts the
  // budget. That throw opens the gate, so no extra action deadline is needed.
  const status = pollGateRegistry
    ? await runWithDecisionGate<{ status: OperationStatus }, OperationStatus>({
        registry: pollGateRegistry,
        gateKind: 'extend-epp-status-poll',
        interactionId: 'extend-epp-status-poll',
        evidenceParams: extendGateEvidenceParams,
        action: () =>
          pollEppExtendRegistrationStatus({
            normalizedDomainName,
            externalOperationId,
          }),
        onResult: (result) => result.status,
        validateResponse: (raw) => operationStatusSchema.parse(raw),
        allowedActors: ['ADMIN'],
        allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
        timeoutMs: EXTEND_POLL_DECISION_TIMEOUT_MS,
        onTimeout: { kind: 'throw' },
        alertMessage: `EPP extend-registration status poll exhausted its retries for ${normalizedDomainName} (operationId=${externalOperationId}); verify registrar state`,
        alertDetails: {
          normalizedDomainName,
          externalOperationId,
          durationInYears,
        },
      })
    : (
        await pollEppExtendRegistrationStatus({
          normalizedDomainName,
          externalOperationId,
        })
      ).status;

  if (status !== OperationStatus.SUCCESSFUL) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `Renew Operation Failed From Registrar Side (Status: ${status})`,
      details: [
        {
          ownerAddress,
          normalizedDomainName,
          durationInYears,
          externalOperationId,
          chainId,
        },
      ],
    });
  }

  // Renewal succeeded at the registrar; `pollAndExpectExpirationChange` is a
  // retry-bounded poll (30 attempts) that waits for the new expiration to
  // propagate. If it exhausts its budget the renewal is already done — an admin
  // can RESPOND with the verified ISO expiration so NFT expiry still gets updated.
  const nextExpirationTime = pollGateRegistry
    ? await runWithDecisionGate<string, string>({
        registry: pollGateRegistry,
        gateKind: 'extend-expiration-poll',
        interactionId: 'extend-expiration-poll',
        evidenceParams: extendGateEvidenceParams,
        action: () =>
          pollAndExpectExpirationChange({
            normalizedDomainName,
            durationInYears,
            previousExpirationTime,
          }),
        validateResponse: (raw) => expirationIsoSchema.parse(raw),
        allowedActors: ['ADMIN'],
        allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
        timeoutMs: EXTEND_POLL_DECISION_TIMEOUT_MS,
        onTimeout: { kind: 'throw' },
        alertMessage: `Expiration-change poll exhausted its retries for ${normalizedDomainName} after a successful renewal; verify the registrar's new expiration`,
        alertDetails: { normalizedDomainName, durationInYears },
      })
    : await pollAndExpectExpirationChange({
        normalizedDomainName,
        durationInYears,
        previousExpirationTime,
      });
  return nextExpirationTime;
}

async function _extend3ldDomainAndReturnNewExpirationTime({
  chainId,
  normalizedDomainName,
  durationInYears,
}: Exclude<ExtendDomainRegistrationWorkflowInput, 'updateDomainIndex'> & {
  chainId: number;
}): Promise<string | Date> {
  const { getNftExpirationTimeInSeconds } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      ...shortRunningOpts,
    },
  });
  const { getDomainDurationConstraints } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });
  const { minYears, maxYears } =
    await getDomainDurationConstraints(normalizedDomainName);
  const nftExpirationTime = await getNftExpirationTimeInSeconds(
    chainId,
    normalizedDomainName,
  );
  const {
    minimumPossibleRenewalYears,
    maxAdditionalYears,
    activeRegistrationYears,
  } = determineDurationLimitsForRenewItems(fromUnixTime(nftExpirationTime), {
    minYears,
    maxYears,
  });

  if (maxAdditionalYears <= 0) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `NFT Registration Duration is currently ${maxYears} years, cannot extend registration`,
    });
  }
  if (durationInYears < minimumPossibleRenewalYears) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `you are trying to extend the registration for ${durationInYears} years, which is not allowed. the min additional years is ${minimumPossibleRenewalYears} years. the active registration years are ${activeRegistrationYears} years. the max total years is ${maxYears} years`,
    });
  }
  if (durationInYears > maxAdditionalYears) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `you are trying to extend the registration for ${durationInYears} years, which is not allowed. the max additional years is ${maxAdditionalYears} years. the active registration years are ${activeRegistrationYears} years. the max total years is ${maxYears} years`,
    });
  }
  return addYears(fromUnixTime(nftExpirationTime), durationInYears);
}

extendDomainRegistrationWorkflow.generateId = (
  input: ExtendDomainRegistrationWorkflowInput,
) => {
  return `extend-domain-[${input.normalizedDomainName}]`;
};

extendDomainRegistrationWorkflow.attemptParseId = (id: string) => {
  const parsedWorkflowId = /extend-domain-\[?(?<domainName>.+)\]?/.exec(id);
  if (parsedWorkflowId) {
    return {
      normalizedDomainName: parsedWorkflowId.groups?.domainName || '',
    };
  }
  return null;
};
