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
  getDomainsUpForRenewal,
} from '../activities/domain/renew.activities';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import type { PaymentProvider, UserSelect } from '@namefi-astra/db/types';
import { sum } from 'ramda';
import { refundUserWorkflow } from './refund-user.workflow';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import type { DomainRenewalResult } from '../activities/order.activities';
import {
  chargeUserAndCreatePaymentWorkflow,
  type ChargeUserAndCreatePaymentWorkflowOutput,
} from './charge-user-and-create-payment.workflow';
import pMap from 'p-map';

const { generalAlertNamefi, getNamefiUsers, createAutoRenewOrder } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: shortRunningOpts,
  });

const { maybeGetUserEmail } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.NOTIFY,
  options: shortRunningOpts,
});

export async function dailyDomainsUpcomingRenewalsWorkflow() {
  // Standard activities configuration
  const { getDomainsUpForRenewal } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '5 minute',
      retry: {
        initialInterval: '30 seconds',
        maximumInterval: '10 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 5,
      },
    },
  });

  const domainsUpForRenewal = await getDomainsUpForRenewal();
  workflow.log.info(
    `Found ${Object.keys(domainsUpForRenewal).length} domains up for renewal`,
  );

  const users = await getNamefiUsers();

  //Start child workflows for each user to notify and renew
  const results = await pMap(
    users,
    async (user) => {
      try {
        await workflow.executeChild(
          notifyAndRenewDomainsForSingleUserWorkflow,
          {
            args: [user.id, domainsUpForRenewal],
            workflowId: `notify-and-renew-domains-${new Date().toISOString()}-${user.id}`,
            workflowIdConflictPolicy: 'USE_EXISTING',
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
            parentClosePolicy: 'ABANDON',
          },
        );
        return { status: 'fulfilled', user };
      } catch (error) {
        workflow.log.error(
          `Error in notifyAndRenewDomainsForSingleUserWorkflow for user ${user.id}: ${error}`,
        );
        return { status: 'rejected', user, error };
      }
    },
    { concurrency: 10 },
  );
  const successes = results.filter(({ status }) => status === 'fulfilled') as {
    status: 'fulfilled';
    user: UserSelect;
    success: number;
  }[];
  const failures = results.filter(({ status }) => status === 'rejected') as {
    status: 'rejected';
    user: UserSelect;
    error: Error;
  }[];

  return {
    successes,
    failures,
  };
}

const {
  getRenewPriceByDomain,
  getUserDomainsWithAutoRenewOptionAndExpirationTime,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: shortRunningOpts,
});

type UserDomainsUpForRenewal = Awaited<
  ReturnType<typeof getUserDomainsWithAutoRenewOptionAndExpirationTime>
>;

export async function notifyAndRenewDomainsForSingleUserWorkflow(
  userId: string,
  domainsUpForRenewal: Awaited<ReturnType<typeof getDomainsUpForRenewal>>,
) {
  const userDomainsUpForRenewal =
    await getUserDomainsWithAutoRenewOptionAndExpirationTime(
      userId,
      domainsUpForRenewal,
    );

  const userEmail = await maybeGetUserEmail(userId);

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

  if (domainsThatShouldBeRenewed.length === 0) {
    workflow.log.info(
      `For user ${userId}, ${userEmail} there are no domains up for renew`,
    );
    return;
  }

  workflow.log.info(
    `For user ${userId}, ${userEmail} here are domains up for renew: ${JSON.stringify(domainsThatShouldBeRenewed, null, 2)}`,
  );

  const chargeAmountByDomainLdh: Record<string, number> =
    await getRenewPriceByDomain({
      normalizeDomainNameList: userDomainsUpForRenewal.map(
        (domain) => domain.normalizedDomainName,
      ),
    });

  const totalAmountInUsd = sum(
    domainsThatShouldBeRenewed.map(
      (domain) => chargeAmountByDomainLdh[domain.normalizedDomainName],
    ),
  );

  if (userEmail) {
    await _notifyUserForUpcomingRenew(
      userEmail,
      {
        domains: userDomainsUpForRenewal,
        userId,
      },
      chargeAmountByDomainLdh,
    );
  } else {
    workflow.log.warn(
      `We are skipping notifying user ${userId} for charge and renew because user didn't provide an email`,
    );
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
        domainsToRenew: domainsThatShouldBeRenewed,
        chargeAmountInUsd: totalAmountInUsd,
      });
    }

    throw workflow.ApplicationFailure.create({
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
      nonRetryable: true,
    });
    // stop for this user
  }
  const results = await Promise.all(
    /*we are try catching here.*/
    domainsThatShouldBeRenewed.map(async (domain) => {
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
            workflowId: `extend-domain-${new Date().toISOString()}-${domain.normalizedDomainName}`,
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
        ({ domain }) => chargeAmountByDomainLdh[domain.normalizedDomainName],
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
    chargeAmountByDomainLdh,
    totalAmountInUsd,
    successes,
    failures,
  });

  if (!userEmail) {
    workflow.log.warn(
      `We are skipping notifying user(userId:${userId}) for renew result because user didn't provide an email`,
    );
    return;
  }
  await _notifyUserForRenewResult({
    userId,
    userEmail,
    successes,
    failures,
    refundAmountInUsd,
    paymentMethodCharged: chargeResult.paymentType,
    paymentMethodIdentifier: '', // TODO: Add payment method identifier for stripe
    totalAmountInUsd,
  });
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
