import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowOutput,
} from './domain-ownership/extend-registration.workflow';
import { differenceInCalendarDays } from 'date-fns';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type {
  DomainRenewInfo,
  DomainsUpForRenewalWithUser,
} from '../activities/domain/renew.activities';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import type { PaymentProvider, PaymentSelect } from '@namefi-astra/db/types';
import { isNotNil, pickBy, pluck, sum } from 'ramda';
import { refundUserWorkflow } from './refund-user.workflow';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import type { DomainRenewalResult } from '../activities/order.activities';
import {
  chargeUserAndCreatePaymentWorkflow,
  type ChargeUserAndCreatePaymentWorkflowOutput,
} from './charge-user-and-create-payment.workflow';
import pMap from 'p-map';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import type {
  AutoRenewMetrics,
  AutoRenewReportInput,
} from '../activities/domain/autorenew-report.activities';

const { triggerUpdateDomainIndex } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
  },
});

// Auto-renewal report activities
const {
  collectAutoRenewMetrics,
  formatAutoRenewReport,
  sendAutoRenewReportToSlackWithAttachments,
  sendAutoRenewReportEmailWithAttachments,
  checkDomainTransferPeriods,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '5m',
  },
});

const {
  generalAlertNamefi,
  createAutoRenewOrder,
  criticalAlertNamefi,
  getPaymentDetails,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

const { maybeGetUserEmail } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.NOTIFY,
  options: shortRunningOpts,
});

// Standard activities configuration
const { getDomainsUpForRenewalGroupedByOwner } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    scheduleToStartTimeout: '1 minute',
    startToCloseTimeout: '10 minutes',
    retry: {
      initialInterval: '30 seconds',
      maximumInterval: '2 minutes',
      backoffCoefficient: 2,
      maximumAttempts: 5,
    },
  },
});

export async function dailyDomainsUpcomingRenewalsWorkflow({
  dryRun = false,
  forceSendReport = false,
}: {
  dryRun?: boolean;
  forceSendReport?: boolean;
} = {}) {
  const startTime = Date.now();
  workflow.log.info(
    `Starting daily domains upcoming renewals workflow, ${dryRun ? 'dryRun' : 'live'}`,
  );
  const domainsUpForRenewalGroupedByOwner =
    await getDomainsUpForRenewalGroupedByOwner();
  workflow.log.info(
    `Found ${Object.keys(domainsUpForRenewalGroupedByOwner).length} users with domains up for renewal`,
  );

  //Start child workflows for each user to notify and renew
  const results = await pMap(
    Object.keys(domainsUpForRenewalGroupedByOwner),
    async (userId) => {
      try {
        if (!domainsUpForRenewalGroupedByOwner[userId]) {
          workflow.log.error(
            `User ${userId} has no domains up for renew, yet we are trying to notify and renew them`,
          );
          return { status: 'skipped', userId };
        }
        const result = await workflow.executeChild(
          notifyAndRenewDomainsForSingleUserWorkflow,
          {
            args: [userId, domainsUpForRenewalGroupedByOwner[userId], dryRun],
            workflowId: `notify-and-renew-domains-${new Date().toISOString()}-${userId}`,
            workflowIdConflictPolicy: 'USE_EXISTING',
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
            parentClosePolicy: 'ABANDON',
          },
        );
        return { status: 'fulfilled', userId, result };
      } catch (error) {
        workflow.log.error(
          `Error in notifyAndRenewDomainsForSingleUserWorkflow for user ${userId}: ${error}`,
        );
        return { status: 'rejected', userId, error };
      }
    },
    { concurrency: 10 },
  );

  const successes = results.filter(({ status }) => status === 'fulfilled') as {
    status: 'fulfilled';
    userId: string;
    result: Awaited<
      ReturnType<typeof notifyAndRenewDomainsForSingleUserWorkflow>
    >;
  }[];
  const failures = results.filter(({ status }) => status === 'rejected') as {
    status: 'rejected';
    userId: string;
    error: Error;
  }[];
  const skipped = results.filter(({ status }) => status === 'skipped');

  if (failures.length > 0 && !dryRun) {
    await criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Fail to notify and renew domains for ${failures.length} user`,
      userIds: failures.map(({ userId }) => userId),
      level: 'error',
    });
  }

  // Trigger domain index update
  try {
    await triggerUpdateDomainIndex();
  } catch (error) {
    workflow.log.error(`Error in triggerUpdateDomainIndex: ${error}`);
  }

  // Generate and send comprehensive report
  const executionTime = Date.now() - startTime;

  if (!dryRun) {
    await _generateAndSendAutoRenewReport({
      successes,
      failures,
      skipped,
      executionTime,
      forceSendReport,
    });
  }

  const report = {
    successes,
    failures,
    executionTime,
    reportSent: !dryRun,
  };

  return report;
}

const { getRenewPriceByDomainInUsd } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: shortRunningOpts,
});

type UserDomainsUpForRenewal = Exclude<
  Awaited<ReturnType<typeof getDomainsUpForRenewalGroupedByOwner>>[string],
  undefined
>;
//----------------------------------------------------------------
// Renew domains for single user workflow
//----------------------------------------------------------------
// #region Renew domains for single user workflow output
type NotifyAndRenewDomainsForSingleUserWorkflowOutput = {
  userId: string;
  userEmail: string | undefined;
  domainsThatShouldBeRenewed: UserDomainsUpForRenewal;
  domainsThatCouldBeRenewed: (UserDomainsUpForRenewal[number] & {
    chargeAmount: number;
  })[];
  domainsMissingPriceData: UserDomainsUpForRenewal;
  chargeAmountByDomainLdh: Record<NamefiNormalizedDomain, number | null>;
  totalAmountInUsd: number;
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  payments: PaymentSelect[];
  paymentMethodCharged?: PaymentProvider;
  paymentMethodIdentifier?: string;
  refundAmountInUsd?: number | null;
  message?: string | undefined;
  successes: {
    status: 'fulfilled';
    domain: UserDomainsUpForRenewal[number];
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  failures: {
    status: 'rejected';
    domain: UserDomainsUpForRenewal[number];
    error: Error;
  }[];
};

export async function notifyAndRenewDomainsForSingleUserWorkflow(
  userId: string,
  userDomainsUpForRenewal: UserDomainsUpForRenewal,
  dryRun: boolean,
): Promise<NotifyAndRenewDomainsForSingleUserWorkflowOutput> {
  const chargeAmountByDomainLdh: Record<NamefiNormalizedDomain, number | null> =
    await getRenewPriceByDomainInUsd({
      normalizeDomainNameList: userDomainsUpForRenewal.map(
        (domain) => domain.normalizedDomainName,
      ),
    });

  const domainsMissingPriceData = userDomainsUpForRenewal.filter(
    (domain) => !chargeAmountByDomainLdh[domain.normalizedDomainName],
  );
  const domainsThatHavePriceData = userDomainsUpForRenewal.filter(
    (domain) => chargeAmountByDomainLdh[domain.normalizedDomainName],
  );

  const domainsThatShouldBeRenewed = userDomainsUpForRenewal.filter(
    ({ autoRenewOption, expirationTime }) => {
      const daysToExpiration = differenceInCalendarDays(
        expirationTime,
        new Date(),
      );
      return (
        autoRenewOption === RenewOption.AUTOMATIC &&
        daysToExpiration <= RENEW_EARLY_BY_DAYS &&
        daysToExpiration >= 0
      );
    },
  );

  const domainsThatCouldBeRenewed = domainsThatShouldBeRenewed
    .map((domain) => ({
      ...domain,
      chargeAmount: chargeAmountByDomainLdh[domain.normalizedDomainName] ?? -1, // -1 means will be filtered out
    }))
    .filter((domain) => domain.chargeAmount && domain.chargeAmount > 0);

  if (
    domainsThatCouldBeRenewed.length !== domainsThatShouldBeRenewed.length ||
    domainsMissingPriceData.length > 0
  ) {
    workflow.log.info(
      `For user ${userId} there are domains that could be renewed but not all of them`,
    );
    await criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `For user ${userId} there are domains that could be renewed but not all of them`,
      level: 'error',
    });
  }

  const userEmail = await maybeGetUserEmail(userId);

  workflow.log.info(
    `For user ${userId}, ${userEmail} here are domains up for renew: ${JSON.stringify(domainsThatCouldBeRenewed, null, 2)}`,
  );

  const totalAmountInUsd = sum(
    pluck('chargeAmount', domainsThatCouldBeRenewed),
  );

  if (dryRun) {
    return {
      userId,
      userEmail,
      domainsThatShouldBeRenewed,
      domainsThatCouldBeRenewed,
      domainsMissingPriceData,
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      paymentStatus: 'SKIPPED',
      successes: [],
      failures: [],
      payments: [],
    };
  }

  if (userEmail && domainsThatHavePriceData.length > 0) {
    await _notifyUserForUpcomingRenew(
      userEmail,
      {
        domains: domainsThatHavePriceData,
        userId,
      },
      pickBy(isNotNil, chargeAmountByDomainLdh),
    );
  } else {
    workflow.log.warn(
      `We are skipping notifying user ${userId} for charge and renew because user didn't provide an email or there are no domains with price data`,
      {
        userEmail,
        domainsThatHavePriceData,
      },
    );
  }

  if (domainsThatCouldBeRenewed.length === 0) {
    workflow.log.info(`For user ${userId} there are no domains up for renew`);
    return {
      userId,
      userEmail,
      domainsThatShouldBeRenewed,
      domainsThatCouldBeRenewed,
      domainsMissingPriceData,
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      paymentStatus: 'SKIPPED',
      successes: [],
      failures: [],
      payments: [],
    };
  }

  let chargeResult: ChargeUserAndCreatePaymentWorkflowOutput;
  const payments: PaymentSelect[] = [];
  try {
    chargeResult = await workflow.executeChild(
      chargeUserAndCreatePaymentWorkflow,
      {
        args: [
          {
            userId,
            totalAmountInUsd,
          },
        ],
        workflowId: `charge-user-${new Date().toISOString()}-${userId}-${totalAmountInUsd}$USD`,
      },
    );
    payments.push(
      await getPaymentDetails({
        paymentId: chargeResult.namefiPaymentIntentId,
      }),
    );
  } catch (_error: unknown) {
    await generalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
      level: 'error',
    });

    if (userEmail) {
      await _notifyUserForFailedToCharge({
        userId,
        userEmail,
        domainsToRenew: domainsThatCouldBeRenewed,
        chargeAmountInUsd: totalAmountInUsd,
      });
    }
    // stop for this user because we failed to charge
    return {
      userId,
      userEmail,
      totalAmountInUsd,
      domainsThatCouldBeRenewed,
      chargeAmountByDomainLdh,
      domainsThatShouldBeRenewed,
      domainsMissingPriceData,
      paymentStatus: 'FAILED',
      payments,
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
      successes: [],
      failures: [],
    };
  }

  const results = await Promise.all(
    /*we are try catching here.*/
    domainsThatCouldBeRenewed.map(async (domain) => {
      try {
        const result = await workflow.executeChild(
          extendDomainRegistrationWorkflow,
          {
            args: [
              {
                normalizedDomainName: domain.normalizedDomainName,
                durationInYears: 1,
                ownerAddress: domain.walletAddress,
                userId,
              },
            ],
            workflowId: extendDomainRegistrationWorkflow.generateId({
              normalizedDomainName: domain.normalizedDomainName,
              durationInYears: 1,
              ownerAddress: domain.walletAddress,
              userId,
            }),
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
            workflowIdConflictPolicy: 'FAIL',
            parentClosePolicy: 'REQUEST_CANCEL',
          },
        );
        return { status: 'fulfilled', domain, result };
      } catch (error) {
        return { status: 'rejected', domain, error };
      }
    }),
  );

  const successes = results.filter(
    ({ status }) => status === 'fulfilled',
  ) as NotifyAndRenewDomainsForSingleUserWorkflowOutput['successes'];
  const failures = results.filter(
    ({ status }) => status === 'rejected',
  ) as NotifyAndRenewDomainsForSingleUserWorkflowOutput['failures'];

  let refundAmountInUsd: number | null = null;
  if (failures.length > 0) {
    refundAmountInUsd = sum(
      failures.map(
        ({ domain }) => chargeAmountByDomainLdh[domain.normalizedDomainName]!, // at this point we know that the charge amount is not null
      ),
    );
    if (refundAmountInUsd > 0) {
      await workflow.executeChild(refundUserWorkflow, {
        args: [
          {
            paymentId: chargeResult.namefiPaymentIntentId,
            amountToRefundInUsdCents: refundAmountInUsd * 100,
          },
        ],
        workflowId: `refund-user-${new Date().toISOString()}-${userId}-${refundAmountInUsd}$USD`,
      });
    }
  }
  await _createAutoRenewOrderForSingleUser({
    userId,
    paymentId: chargeResult.namefiPaymentIntentId,
    chargeAmountByDomainLdh: pickBy(isNotNil, chargeAmountByDomainLdh),
    totalAmountInUsd,
    successes,
    failures,
  });

  const report = {
    userId,
    userEmail,
    failures,
    successes,
    paymentStatus: 'SUCCEEDED',
    paymentMethodCharged: chargeResult.paymentType,
    paymentMethodIdentifier: '', // TODO: Add payment method identifier for stripe
    totalAmountInUsd,
    refundAmountInUsd,
    domainsThatShouldBeRenewed,
    domainsThatCouldBeRenewed,
    chargeAmountByDomainLdh,
    domainsMissingPriceData,
    payments,
  } satisfies NotifyAndRenewDomainsForSingleUserWorkflowOutput;

  if (!userEmail) {
    workflow.log.warn(
      `We are skipping notifying user(userId:${userId}) for renew result because user didn't provide an email`,
    );
    return report;
  }

  await _notifyUserForRenewResult({
    ...report,
    userEmail,
  });
  return report;
}

// #endregion Renew domains for single user workflow output
// #region Notify User
/**
 * Notify user for upcoming renew, a wrapper to send email
 * @param userEmail
 * @param domainsWithUser
 */
async function _notifyUserForUpcomingRenew(
  userEmail: string,
  domainsWithUser: DomainsUpForRenewalWithUser,
  chargeAmountByDomainLdh: Record<string, number>,
) {
  const { sendEmailNotificationForUpcomingRenew } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });

  await sendEmailNotificationForUpcomingRenew(userEmail, {
    domains: domainsWithUser.domains.map((domain) => ({
      ...domain,
      renewalPrice: chargeAmountByDomainLdh[domain.normalizedDomainName],
    })),
    userId: domainsWithUser.userId,
  });
}

/**
 * Notify user for renew result, a wrapper to send email
 */
async function _notifyUserForRenewResult({
  userId,
  userEmail,
  successes,
  failures,
  refundAmountInUsd,
  paymentMethodCharged,
  paymentMethodIdentifier,
  totalAmountInUsd,
}: {
  userId: string;
  userEmail: string;
  successes: {
    status: 'fulfilled';
    domain: DomainRenewInfo;
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  failures: { status: 'rejected'; domain: DomainRenewInfo; error: Error }[];
  refundAmountInUsd: number | null | undefined;
  paymentMethodCharged: PaymentProvider;
  paymentMethodIdentifier: string;
  totalAmountInUsd: number;
}) {
  const { sendEmailNotificationForRenewResult } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });
  await sendEmailNotificationForRenewResult({
    userId,
    userEmail,
    domainLdhRenewFailed: failures.map(
      ({ domain }) => domain.normalizedDomainName,
    ),
    domainLdhRenewSucceeded: successes.map(
      ({ domain }) => domain.normalizedDomainName,
    ),
    paymentMethodCharged: paymentMethodCharged,
    paymentMethodIdentifier: paymentMethodIdentifier,
    refundAmountInUsd: refundAmountInUsd,
    refundStatus: refundAmountInUsd ? 'SUCCESS' : 'FAILED', // TODO: Add refund status for no refund
    chargedAmountInUsd: totalAmountInUsd,
  });
}

/**
 * Notify user for failed to charge, a wrapper to send email
 */
async function _notifyUserForFailedToCharge({
  userId,
  userEmail,
  domainsToRenew,
  chargeAmountInUsd,
}: {
  userId: string;
  userEmail: string;
  domainsToRenew: DomainRenewInfo[];
  chargeAmountInUsd: number;
}) {
  const { sendEmailNotificationForRenewFailedToCharge } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });
  await sendEmailNotificationForRenewFailedToCharge({
    userId,
    userEmail,
    domainsToRenew: domainsToRenew.map(
      ({ normalizedDomainName }) => normalizedDomainName,
    ),
    chargeAmountInUsd: chargeAmountInUsd,
  });
}

// #endregion Notify User

async function _createAutoRenewOrderForSingleUser({
  userId,
  paymentId,
  chargeAmountByDomainLdh,
  totalAmountInUsd,
  successes,
  failures,
}: {
  userId: string;
  paymentId: string;
  chargeAmountByDomainLdh: Record<string, number>;
  totalAmountInUsd: number;
  successes: {
    status: 'fulfilled';
    domain: UserDomainsUpForRenewal[number];
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  failures: {
    status: 'rejected';
    domain: UserDomainsUpForRenewal[number];
    error: Error;
  }[];
}) {
  // Create order record for tracking
  try {
    const domainRenewResults: DomainRenewalResult[] = [
      ...successes.map(({ domain, result }) => ({
        normalizedDomainName: domain.normalizedDomainName,
        status: 'SUCCESS' as const,
        registrarKey: domain.registrarKey,
        eppOperationStatus: result.eppOperationStatus,
        txHash: result.txHash,
        txStatus: result.txStatus,
        chargeAmountInUsd: chargeAmountByDomainLdh[domain.normalizedDomainName],
      })),
      ...failures.map(({ domain, error }) => ({
        normalizedDomainName: domain.normalizedDomainName,
        status: 'FAILURE' as const,
        registrarKey: domain.registrarKey,
        error,
        chargeAmountInUsd: chargeAmountByDomainLdh[domain.normalizedDomainName],
      })),
    ];

    await createAutoRenewOrder({
      userId,
      paymentId,
      domainRenewResults,
      totalAmountInUsd,
    });
  } catch (orderError) {
    workflow.log.error(
      `Failed to create order for user ${userId}: ${orderError}`,
    );
  }
}

// Type for the result of the single user workflow
type SingleUserRenewalResult = Awaited<
  ReturnType<typeof notifyAndRenewDomainsForSingleUserWorkflow>
>;

/**
 * Generate and send comprehensive auto-renewal report
 */
async function _generateAndSendAutoRenewReport({
  successes,
  failures,
  skipped,
  executionTime,
  forceSendReport,
}: {
  successes: Array<{
    status: 'fulfilled';
    userId: string;
    result: SingleUserRenewalResult;
  }>;
  failures: Array<{
    status: 'rejected';
    userId: string;
    error: Error;
  }>;
  skipped: Array<{
    status: string;
    userId: string;
  }>;
  executionTime: number;
  forceSendReport: boolean;
}) {
  workflow.log.info('Generating auto-renewal daily report');

  // Build workflow results for metrics collection
  const workflowResults: AutoRenewReportInput['workflowResults'] = [];

  // Process successful renewals
  for (const success of successes) {
    const result = success.result;
    if (!result) continue;

    const processedDomains: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
    }> = [];
    const failedDomains: Array<{
      domain: NamefiNormalizedDomain;
      reason: string;
      registrar?: string;
    }> = [];

    // Count successes and failures from the result
    if (result.successes) {
      for (const s of result.successes) {
        processedDomains.push({
          domain: s.domain.normalizedDomainName,
          registrar: s.domain.registrarKey,
        });
      }
    }

    if (result.failures) {
      for (const f of result.failures) {
        failedDomains.push({
          domain: f.domain.normalizedDomainName,
          reason: f.error?.message || 'Unknown error',
          registrar: f.domain.registrarKey,
        });
      }
    }

    // Handle payment failures
    if (result.paymentStatus === 'FAILED') {
      if (result.domainsThatCouldBeRenewed) {
        for (const domain of result.domainsThatCouldBeRenewed) {
          failedDomains.push({
            domain: domain.normalizedDomainName,
            reason: result.message || 'Payment failed',
            registrar: undefined,
          });
        }
      }
    }

    // Handle domains with missing price data
    for (const domain of result.domainsMissingPriceData) {
      failedDomains.push({
        domain: domain.normalizedDomainName,
        reason: 'Missing price data',
        registrar: domain.registrarKey,
      });
    }

    workflowResults.push({
      userId: success.userId,
      userEmail: result.userEmail,
      status: result.paymentStatus === 'FAILED' ? 'failure' : 'success',
      domainsProcessed: processedDomains.length + failedDomains.length || 0,
      amountChargedInUsd: result.totalAmountInUsd || 0,
      amountRefundedInUsd: result.refundAmountInUsd || 0,
      payments: result.payments,
      failures: failedDomains,
      successes: processedDomains,
    });
  }

  // Process workflow failures
  for (const failure of failures) {
    workflowResults.push({
      userId: failure.userId,
      status: 'failure',
      domainsProcessed: 0,
      amountChargedInUsd: 0,
      amountRefundedInUsd: 0,
      failures: [
        {
          domain: 'Unknown' as NamefiNormalizedDomain,
          reason: `Workflow failed: ${failure.error?.message || 'Unknown error'}`,
        },
      ],
    });
  }

  // Process skipped users
  for (const skip of skipped) {
    workflowResults.push({
      userId: skip.userId,
      status: 'skipped',
      domainsProcessed: 0,
      amountChargedInUsd: 0,
      amountRefundedInUsd: 0,
    });
  }

  // Calculate detailed metrics
  const metrics: AutoRenewMetrics = {
    reportDate: new Date(),
    totalUsersProcessed: workflowResults.length,
    totalDomainsProcessed: 0,
    successfulRenewals: 0,
    failedRenewals: 0,
    totalAmountChargedInUsd: 0,
    totalAmountRefundedInUsd: 0,
    paymentMethodBreakdown: {
      NFSC_BASE: { count: 0, amountInUsd: 0 },
      NFSC_ETHEREUM: { count: 0, amountInUsd: 0 },
      NFSC_ETHEREUM_SEPOLIA: { count: 0, amountInUsd: 0 },
      STRIPE: { count: 0, amountInUsd: 0 },
    },
    failureBreakdown: {
      failedToCharge: 0,
      registrarErrors: 0,
      missingPriceData: 0,
    },
    criticalDomains: [],
    userCommunication: {
      upcomingRenewalNotifications: successes.length,
      successfulRenewalConfirmations: 0,
      failedRenewalAlerts: 0,
      paymentFailureNotifications: 0,
    },
    executionMetrics: {
      totalExecutionTime: executionTime,
      averageTimePerUser:
        workflowResults.length > 0 ? executionTime / workflowResults.length : 0,
      childWorkflowsSpawned: workflowResults.length,
    },
    registrarBreakdown: {},
    largestTransaction: {
      userId: '',
      amount: 0,
      domainCount: 0,
    },
  };

  // Process metrics from results
  for (const result of workflowResults) {
    metrics.totalDomainsProcessed += result.domainsProcessed || 0;
    metrics.totalAmountChargedInUsd += result.amountChargedInUsd || 0;
    metrics.totalAmountRefundedInUsd += result.amountRefundedInUsd || 0;

    // Count successes and failures
    if (result.successes) {
      metrics.successfulRenewals += result.successes.length;
      for (const success of result.successes) {
        const registrar = success.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].successful++;
      }
    }

    if (result.failures) {
      metrics.failedRenewals += result.failures.length;
      for (const failure of result.failures) {
        const registrar = failure.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].failed++;

        // Categorize failures
        if (
          failure.reason.toLowerCase().includes('charge') ||
          failure.reason.toLowerCase().includes('payment')
        ) {
          metrics.failureBreakdown.failedToCharge++;
        } else if (failure.reason.toLowerCase().includes('price')) {
          metrics.failureBreakdown.missingPriceData++;
        } else {
          metrics.failureBreakdown.registrarErrors++;
        }

        // Add to critical domains if not a simple payment failure
        if (
          !failure.reason.toLowerCase().includes('insufficient') &&
          !failure.reason.toLowerCase().includes('declined')
        ) {
          metrics.criticalDomains.push({
            domain: failure.domain,
            userId: result.userId,
            userEmail: result.userEmail,
            issue: failure.reason,
            registrar: failure.registrar,
            actionRequired: _determineActionRequired(failure.reason),
          });
        }
      }
    }

    // Track payment methods
    if (result.payments && result.amountChargedInUsd) {
      for (const { paymentProvider, amountInUSDCents } of result.payments) {
        if (!metrics.paymentMethodBreakdown[paymentProvider]) {
          metrics.paymentMethodBreakdown[paymentProvider] = {
            count: 0,
            amountInUsd: 0,
          };
        }
        metrics.paymentMethodBreakdown[paymentProvider].count++;
        metrics.paymentMethodBreakdown[paymentProvider].amountInUsd +=
          amountInUSDCents / 100; // Convert cents to USD
      }
    }

    // Track largest transaction
    if (
      result.amountChargedInUsd &&
      result.amountChargedInUsd > metrics.largestTransaction.amount
    ) {
      metrics.largestTransaction = {
        userId: result.userId,
        amount: result.amountChargedInUsd,
        domainCount: result.domainsProcessed || 0,
      };
    }

    // Update communication counts
    if (result.status === 'success' && result.userEmail) {
      metrics.userCommunication.successfulRenewalConfirmations++;
    } else if (result.status === 'failure' && result.userEmail) {
      if (result.failures?.some((f) => f.reason.includes('payment'))) {
        metrics.userCommunication.paymentFailureNotifications++;
      } else {
        metrics.userCommunication.failedRenewalAlerts++;
      }
    }
  }

  // Collect final metrics
  const finalMetrics = await collectAutoRenewMetrics({
    metrics,
    workflowResults,
  });

  // Check domain transfer periods if there are domains to check
  if (finalMetrics.totalDomainsProcessed > 0) {
    const allDomains: NamefiNormalizedDomain[] = [];

    // Collect all processed domains
    for (const result of workflowResults) {
      if (result.successes) {
        for (const success of result.successes) {
          allDomains.push(success.domain);
        }
      }
      if (result.failures) {
        for (const failure of result.failures) {
          allDomains.push(failure.domain);
        }
      }
    }

    // Check transfer periods for all domains
    if (allDomains.length > 0) {
      try {
        const domainLockStatus = await checkDomainTransferPeriods(allDomains);

        // Update metrics with transfer period information
        finalMetrics.domainLockStatus = domainLockStatus;
        finalMetrics.domainsInTransferPeriod = Object.values(
          domainLockStatus,
        ).filter((d) => d.isTransferPeriod).length;
        finalMetrics.domainsInAddPeriod = Object.values(
          domainLockStatus,
        ).filter((d) => d.isAddPeriod).length;
        finalMetrics.lockedDomains = Object.values(domainLockStatus).filter(
          (d) => d.locked,
        ).length;
      } catch (error) {
        workflow.log.warn('Failed to check domain transfer periods', { error });
      }
    }
  }

  // Format the report
  const { title, content } = await formatAutoRenewReport(finalMetrics);

  // Determine if we should send the report
  const shouldSendReport =
    forceSendReport ||
    finalMetrics.failedRenewals > 0 ||
    finalMetrics.criticalDomains.length > 0 ||
    finalMetrics.totalDomainsProcessed > 0;

  if (shouldSendReport) {
    workflow.log.info('Sending auto-renewal report', {
      title,
      totalProcessed: finalMetrics.totalDomainsProcessed,
      failures: finalMetrics.failedRenewals,
      criticalIssues: finalMetrics.criticalDomains.length,
      domainsInTransferPeriod: finalMetrics.domainsInTransferPeriod || 0,
    });

    // Prepare report input for both Slack and email
    const reportInput: AutoRenewReportInput = {
      metrics: finalMetrics,
      workflowResults,
    };

    // Send to Slack with attachment notice
    await catchAndAlertLocally(
      async () => {
        await sendAutoRenewReportToSlackWithAttachments(
          title,
          content,
          reportInput,
          finalMetrics,
        );
      },
      {
        message: 'Failed to send auto-renewal report to Slack',
        details: { title },
      },
    );

    // Send via email with attachments
    await catchAndAlertLocally(
      async () => {
        await sendAutoRenewReportEmailWithAttachments(
          title,
          content,
          reportInput,
          finalMetrics,
        );
      },
      {
        message: 'Failed to send auto-renewal report email with attachments',
        details: { title },
      },
    );

    workflow.log.info('Auto-renewal report sent successfully');
  } else {
    workflow.log.info('No auto-renewal activity to report, skipping report');
  }
}

/**
 * Determine the action required based on the error message
 */
function _determineActionRequired(errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('price') || lowerError.includes('pricing')) {
    return 'Check pricing data';
  }
  if (lowerError.includes('locked')) {
    return 'Unlock domain and retry';
  }
  if (lowerError.includes('timeout')) {
    return 'Retry renewal';
  }
  if (lowerError.includes('api')) {
    return 'Check registrar API';
  }
  if (lowerError.includes('expired')) {
    return 'Domain already expired';
  }
  if (lowerError.includes('balance') || lowerError.includes('payment')) {
    return 'Contact user about payment';
  }
  return 'Manual investigation required';
}
