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
import type { PaymentProvider } from '@namefi-astra/db/types';
import { filter, isNotNil, map, pickBy, pluck, sum } from 'ramda';
import { refundUserWorkflow } from './refund-user.workflow';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import type { DomainRenewalResult } from '../activities/order.activities';
import {
  chargeUserAndCreatePaymentWorkflow,
  type ChargeUserAndCreatePaymentWorkflowOutput,
} from './charge-user-and-create-payment.workflow';
import pMap from 'p-map';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

const { triggerUpdateDomainIndex } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
  },
});

const { generalAlertNamefi, createAutoRenewOrder, criticalAlertNamefi } =
  typedProxyActivities({
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
}: {
  dryRun?: boolean;
} = {}) {
  workflow.log.info(
    `Starting daily domains upcoming renewals workflow, ${dryRun ? 'dryRun' : 'live'}`,
  );
  const domainsUpForRenewalGroupedByOwner =
    await getDomainsUpForRenewalGroupedByOwner();
  workflow.log.info(
    `Found ${Object.keys(domainsUpForRenewalGroupedByOwner).length} domains up for renewal`,
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

  if (failures.length > 0 && !dryRun) {
    await criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Fail to notify and renew domains for ${failures.length} user`,
      userIds: failures.map(({ userId }) => userId),
      level: 'error',
    });
  }

  const report = {
    successes,
    failures,
  };

  try {
    await triggerUpdateDomainIndex();
  } catch (error) {
    workflow.log.error(`Error in triggerUpdateDomainIndex: ${error}`);
  }

  return report;
}

const { getRenewPriceByDomain } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: shortRunningOpts,
});

type UserDomainsUpForRenewal = Exclude<
  Awaited<ReturnType<typeof getDomainsUpForRenewalGroupedByOwner>>[string],
  undefined
>;

export async function notifyAndRenewDomainsForSingleUserWorkflow(
  userId: string,
  userDomainsUpForRenewal: UserDomainsUpForRenewal,
  dryRun: boolean,
) {
  const chargeAmountByDomainLdh: Record<NamefiNormalizedDomain, number | null> =
    await getRenewPriceByDomain({
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
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      count: domainsThatCouldBeRenewed.length,
    };
  }

  if (userEmail) {
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
      `We are skipping notifying user ${userId} for charge and renew because user didn't provide an email`,
    );
  }

  if (domainsThatCouldBeRenewed.length === 0) {
    workflow.log.info(`For user ${userId} there are no domains up for renew`);
    return;
  }

  let chargeResult: ChargeUserAndCreatePaymentWorkflowOutput;

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
      domainsToRenew: domainsThatCouldBeRenewed.map(
        ({ normalizedDomainName }) => normalizedDomainName,
      ),
      domainToRenewCount: domainsThatCouldBeRenewed.length,
      totalAmountInUsd,
      paymentStatus: 'FAILED',
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
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

  const successes = results.filter(({ status }) => status === 'fulfilled') as {
    status: 'fulfilled';
    domain: UserDomainsUpForRenewal[number];
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  const failures = results.filter(({ status }) => status === 'rejected') as {
    status: 'rejected';
    domain: UserDomainsUpForRenewal[number];
    error: Error;
  }[];

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
  };

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
  refundAmountInUsd: number | null;
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
