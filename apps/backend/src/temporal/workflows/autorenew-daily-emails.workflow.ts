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
import { fromPairs, isNotNil, pickBy, pluck, sum, filter } from 'ramda';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import type { DomainRenewalResult } from '../activities/order.activities';
import pMap from 'p-map';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { multiRefundWorkflow } from './multi-refund.workflow';
import {
  prepareMultiPaymentsWorkflow,
  type PrepareMultiPaymentsOutput,
} from './prepare-multi-payments.workflow';
import {
  chargePreparedPaymentsWorkflow,
  type ChargePreparedPaymentsOutput,
} from './charge-prepared-payments.workflow';
import { generateAndSendInternalAutoRenewReportWorkflow } from './autorenew-daily-report.workflow';

const { triggerUpdateDomainIndex } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
  },
});

const {
  generalAlertNamefi,
  createAutoRenewOrder,
  criticalAlertNamefi,
  getStripePaymentMethodPublicIdentifier,
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
  ownersIdFilter,
  allowExpired = true,
}: {
  dryRun?: boolean;
  forceSendReport?: boolean;
  /**
   * Filter domains by owner ID
   * Mainly for testing purposes
   */
  ownersIdFilter?: string[];
  allowExpired?: boolean;
} = {}) {
  const startTime = Date.now();
  workflow.log.info(
    `Starting daily domains upcoming renewals workflow, ${dryRun ? 'dryRun' : 'live'}`,
  );
  const domainsUpForRenewalGroupedByOwner =
    await getDomainsUpForRenewalGroupedByOwner({ allowExpired });
  workflow.log.info(
    `Found ${Object.keys(domainsUpForRenewalGroupedByOwner).length} users with domains up for renewal`,
  );

  //Start child workflows for each user to notify and renew
  const results = await pMap(
    Object.keys(domainsUpForRenewalGroupedByOwner),
    async (userId) => {
      if (ownersIdFilter && !ownersIdFilter.includes(userId)) {
        return { status: 'skipped', userId };
      }
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
            args: [
              userId,
              domainsUpForRenewalGroupedByOwner[userId],
              dryRun,
              allowExpired,
            ],
            workflowId: `notify-and-renew-domains-${new Date().toISOString()}-${userId}`,
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
    await generateAndSendInternalAutoRenewReportWorkflow({
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

/*
 * ------------------------------------------------------------
 * Prepare Domains for Renew
 * ------------------------------------------------------------
 */
async function _prepareDomainsForRenew(
  userId: string,
  userDomainsUpForRenewal: UserDomainsUpForRenewal,
  allowExpired: boolean,
) {
  const chargeAmountByDomainLdh: Record<NamefiNormalizedDomain, number | null> =
    await getRenewPriceByDomainInUsd({
      normalizeDomainNameList: userDomainsUpForRenewal.map(
        (domain) => domain.normalizedDomainName,
      ),
    });
  const expirationDatesByDomainLdh: Record<NamefiNormalizedDomain, Date> =
    fromPairs(
      userDomainsUpForRenewal.map((domain) => [
        domain.normalizedDomainName,
        new Date(domain.expirationTime),
      ]),
    );

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
        (allowExpired ? daysToExpiration >= -30 : daysToExpiration >= 0)
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

  return {
    domainsThatShouldBeRenewed,
    domainsThatCouldBeRenewed,
    domainsMissingPriceData,
    domainsThatHavePriceData,
    expirationDatesByDomainLdh,
    chargeAmountByDomainLdh,
  };
}

type DomainWithChargeAmount = UserDomainsUpForRenewal[number] & {
  chargeAmount: number;
};

/*
 * ------------------------------------------------------------
 * Select Affordable Subset of Domains
 * ------------------------------------------------------------
 *
 * Greedy ascending-by-cost: sort domains by chargeAmount ascending, then
 * fill while the running total stays within the USD budget. Operates in
 * integer cents to avoid float drift. Stable tiebreak on
 * normalizedDomainName keeps Temporal replay deterministic.
 *
 * Optimal for maximizing the number of domains renewed under a fixed
 * budget (exchange argument). Used when prepareMultiPaymentsWorkflow
 * returns INSUFFICIENT_FUNDS — lets an NFSC-only user still renew the
 * subset their balance can cover.
 */
function _selectAffordableDomainsByNfscCents(
  domains: DomainWithChargeAmount[],
  availableBalanceInUsd: number,
): {
  fits: DomainWithChargeAmount[];
  skipped: DomainWithChargeAmount[];
  totalFitsInUsdCents: number;
} {
  // Floor the budget so we never over-select from cent-rounding.
  const budgetCents = Math.floor(availableBalanceInUsd * 100);

  const sorted = [...domains].sort((a, b) => {
    const aCents = Math.round(a.chargeAmount * 100);
    const bCents = Math.round(b.chargeAmount * 100);
    if (aCents !== bCents) return aCents - bCents;
    return a.normalizedDomainName.localeCompare(b.normalizedDomainName);
  });

  const fits: DomainWithChargeAmount[] = [];
  const skipped: DomainWithChargeAmount[] = [];
  let runningCents = 0;

  for (const domain of sorted) {
    const amountCents = Math.round(domain.chargeAmount * 100);
    if (runningCents + amountCents <= budgetCents) {
      fits.push(domain);
      runningCents += amountCents;
    } else {
      skipped.push(domain);
    }
  }

  return { fits, skipped, totalFitsInUsdCents: runningCents };
}

/*
 * ------------------------------------------------------------
 * Prepare Payments for Renew
 * ------------------------------------------------------------
 */
async function _preparePaymentsForRenew(
  userId: string,
  domainsThatCouldBeRenewed: (UserDomainsUpForRenewal[number] & {
    chargeAmount: number;
  })[],
  totalAmountInUsd: number,
) {
  let expectedPayments: Array<{
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }> = [];
  const stripeLast4ByMethodId: Record<string, string | undefined> = {};
  const paymentPrepareResult = await workflow.executeChild(
    prepareMultiPaymentsWorkflow,
    {
      args: [
        {
          userId,
          totalAmountInUsd,
        },
      ],
      workflowId: `prepare-multi-payments-and-charge-${new Date().toISOString()}-${userId}-${totalAmountInUsd}$USD`,
    },
  );
  if (paymentPrepareResult.preparationSummary.status === 'SUCCESS') {
    expectedPayments = await Promise.all(
      paymentPrepareResult.payments.map(async (payment) => {
        let stripeLast4: string | undefined;
        if (payment.stripePaymentMethodId) {
          const last4Result = await getStripePaymentMethodPublicIdentifier({
            paymentMethodId: payment.stripePaymentMethodId,
          });
          stripeLast4 = last4Result ?? undefined;
          stripeLast4ByMethodId[payment.stripePaymentMethodId] = stripeLast4;
        }
        return {
          provider: payment.provider,
          amountInUsdCents: payment.amountInUsdCents,
          paymentId: payment.paymentId,
          walletAddress: payment.walletAddress,
          stripeLast4,
        };
      }),
    );
  }
  const userPaymentSources = paymentPrepareResult.paymentSources;

  const availableBalanceInNfsc = sum(
    userPaymentSources.nfscSources.flatMap((source) =>
      filter(isNotNil, Object.values(source.balances)),
    ),
  );

  const availableOffChainPaymentMethodsPublicIdentifiers =
    userPaymentSources.stripePaymentMethods.map(
      (method) => stripeLast4ByMethodId[method.id],
    );
  return {
    expectedPayments,
    paymentPrepareResult,
    stripeLast4ByMethodId,
    userPaymentSources,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
  };
}

/*
 * ------------------------------------------------------------
 * Renew domains for single user workflow
 * ------------------------------------------------------------
 */
export async function notifyAndRenewDomainsForSingleUserWorkflow(
  userId: string,
  userDomainsUpForRenewal: UserDomainsUpForRenewal,
  dryRun: boolean,
  allowExpired: boolean,
): Promise<NotifyAndRenewDomainsForSingleUserWorkflowOutput> {
  const userEmail = await maybeGetUserEmail(userId);

  const {
    domainsThatShouldBeRenewed,
    domainsThatCouldBeRenewed: initialDomainsThatCouldBeRenewed,
    domainsMissingPriceData,
    domainsThatHavePriceData,
    chargeAmountByDomainLdh,
  } = await _prepareDomainsForRenew(
    userId,
    userDomainsUpForRenewal,
    allowExpired,
  );
  // May be narrowed by the partial-renewal branch below when the initial
  // payment preparation returns INSUFFICIENT_FUNDS.
  let domainsThatCouldBeRenewed = initialDomainsThatCouldBeRenewed;

  workflow.log.info(
    `For user ${userId}, ${userEmail} here are domains up for renew: ${JSON.stringify(domainsThatCouldBeRenewed, null, 2)}`,
  );
  let totalAmountInUsd = sum(pluck('chargeAmount', domainsThatCouldBeRenewed));

  let {
    expectedPayments,
    paymentPrepareResult,
    stripeLast4ByMethodId,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
  } = await _preparePaymentsForRenew(
    userId,
    domainsThatCouldBeRenewed,
    totalAmountInUsd,
  );

  // Track domains skipped due to insufficient balance so they surface in
  // the result email and the internal daily report.
  let domainsSkippedDueToInsufficientFunds: DomainWithChargeAmount[] = [];
  let shortfallInUsdCents: number | undefined;

  if (dryRun) {
    return {
      userId,
      userEmail,
      domainsThatShouldBeRenewed,
      domainsThatCouldBeRenewed,
      domainsMissingPriceData,
      domainsSkippedDueToInsufficientFunds,
      shortfallInUsdCents,
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      paymentStatus: 'SKIPPED',
      successes: [],
      failures: [],
      payments: [],
    };
  }

  // Notify user for upcoming renew
  if (userEmail && domainsThatHavePriceData.length > 0) {
    await _notifyUserForUpcomingRenew({
      userEmail,
      domainsWithUser: {
        domains: domainsThatHavePriceData,
        userId,
      },
      expectedPayments,
      chargeAmountByDomainLdh: pickBy(isNotNil, chargeAmountByDomainLdh),
      availableBalanceInNfsc,
      availableOffChainPaymentMethodsPublicIdentifiers:
        availableOffChainPaymentMethodsPublicIdentifiers.filter(isNotNil),
      paymentPreparationSummary: paymentPrepareResult.preparationSummary,
    });
  } else {
    workflow.log.warn(
      `We are skipping notifying user ${userId} for charge and renew because user didn't provide an email or there are no domains with price data`,
      {
        userEmail,
        domainsThatHavePriceData,
      },
    );
  }

  // Partial-renewal fallback: if payment prep was short of budget, try
  // the affordable subset (greedy by ascending cost) rather than failing
  // the whole user. Triggers only for NFSC-only users — with a Stripe
  // card, prepareMultiPaymentsWorkflow covers any remainder and never
  // returns INSUFFICIENT_FUNDS.
  if (
    paymentPrepareResult.preparationSummary.status === 'INSUFFICIENT_FUNDS' &&
    domainsThatCouldBeRenewed.length > 0
  ) {
    shortfallInUsdCents =
      paymentPrepareResult.preparationSummary.shortByInUsdCents;
    const selection = _selectAffordableDomainsByNfscCents(
      domainsThatCouldBeRenewed,
      availableBalanceInNfsc,
    );

    if (selection.fits.length > 0) {
      workflow.log.info(
        `Partial renewal for user ${userId}: fits=${selection.fits.length}, skipped=${selection.skipped.length}, shortBy=$${((shortfallInUsdCents ?? 0) / 100).toFixed(2)}`,
      );
      domainsThatCouldBeRenewed = selection.fits;
      domainsSkippedDueToInsufficientFunds = selection.skipped;
      totalAmountInUsd = selection.totalFitsInUsdCents / 100;

      // Re-prepare payments for the reduced set — expected to return SUCCESS.
      ({
        expectedPayments,
        paymentPrepareResult,
        stripeLast4ByMethodId,
        availableBalanceInNfsc,
        availableOffChainPaymentMethodsPublicIdentifiers,
      } = await _preparePaymentsForRenew(
        userId,
        domainsThatCouldBeRenewed,
        totalAmountInUsd,
      ));
    } else {
      // Nothing fits (balance < smallest domain). Fall through to the
      // existing FAILED path. We deliberately leave
      // `domainsSkippedDueToInsufficientFunds` empty here to avoid
      // double-counting: the FAILED path (below) already reports each
      // domain, and the internal daily report will use
      // `shortfallInUsdCents` to label the reason as insufficient balance.
      workflow.log.info(
        `No domains fit in balance for user ${userId}: skipped=${selection.skipped.length}, shortBy=$${((shortfallInUsdCents ?? 0) / 100).toFixed(2)}`,
      );
    }
  }

  // No domains to renew
  if (domainsThatCouldBeRenewed.length === 0) {
    workflow.log.info(`For user ${userId} there are no domains up for renew`);
    return {
      userId,
      userEmail,
      domainsThatShouldBeRenewed,
      domainsThatCouldBeRenewed,
      domainsMissingPriceData,
      domainsSkippedDueToInsufficientFunds,
      shortfallInUsdCents,
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      paymentStatus: 'SKIPPED',
      successes: [],
      failures: [],
      payments: [],
    };
  }

  // Fail to prepare payments
  if (paymentPrepareResult.preparationSummary.status !== 'SUCCESS') {
    workflow.log.error(`Fail to prepare payments for user ${userId}`, {
      paymentPrepareResult,
    });
    return {
      userId,
      userEmail,
      domainsThatShouldBeRenewed,
      domainsThatCouldBeRenewed,
      domainsMissingPriceData,
      domainsSkippedDueToInsufficientFunds,
      shortfallInUsdCents,
      chargeAmountByDomainLdh,
      totalAmountInUsd,
      paymentStatus: 'FAILED',
      successes: [],
      failures: [],
      payments: [],
      message: `Fail to prepare payments for user ${userId}`,
    };
  }

  let chargeResult: ChargePreparedPaymentsOutput;
  let payments: {
    id: string;
    paymentProvider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripePaymentMethodId?: string;
  }[] = [];

  try {
    chargeResult = await workflow.executeChild(chargePreparedPaymentsWorkflow, {
      args: [
        {
          userId,
          preparedPayments: paymentPrepareResult.payments ?? [],
          orderId: undefined,
          failOnNotAllCharged: true,
        },
      ],
      workflowId: `charge-user-${new Date().toISOString()}-${userId}-${totalAmountInUsd}$USD`,
    });
    payments = chargeResult.payments;
  } catch (_error: unknown) {
    await generalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
      level: 'error',
    });

    if (userEmail) {
      // Build chargeAmountByDomainLdh from domainsThatCouldBeRenewed
      const chargeAmountByDomainLdhForEmail: Record<string, number> = {};
      for (const domain of domainsThatCouldBeRenewed) {
        chargeAmountByDomainLdhForEmail[domain.normalizedDomainName] =
          domain.chargeAmount;
      }

      await _notifyUserForFailedToCharge({
        userId,
        userEmail,
        domainsToRenew: domainsThatCouldBeRenewed,
        chargeAmountByDomainLdh: chargeAmountByDomainLdhForEmail,
        availableBalanceInNfsc,
        availableOffChainPaymentMethods:
          availableOffChainPaymentMethodsPublicIdentifiers.filter(isNotNil),
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
      domainsSkippedDueToInsufficientFunds,
      shortfallInUsdCents,
      paymentStatus: 'FAILED',
      payments,
      message: `Fail to charge user(userId:${userId}) for ${totalAmountInUsd}$USD`,
      successes: [],
      failures: [],
    };
  }

  // Renew domains
  const results = await Promise.all(
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

  // Refund payments for failed renewals
  let refundAmountInUsd: number | null = null;
  if (failures.length > 0) {
    refundAmountInUsd = sum(
      failures.map(
        ({ domain }) => chargeAmountByDomainLdh[domain.normalizedDomainName]!, // at this point we know that the charge amount is not null
      ),
    );
    if (refundAmountInUsd > 0 && payments.length > 0) {
      await workflow.executeChild(multiRefundWorkflow, {
        args: [
          {
            paymentIds: payments.map((p) => p.id),
            amountToRefundInUsdCents: refundAmountInUsd * 100,
          },
        ],
        workflowId: `refund-user-${new Date().toISOString()}-${userId}-${refundAmountInUsd}$USD`,
      });
    }
  }

  // Create auto renew order
  const orderId = await _createAutoRenewOrderForSingleUser({
    userId,
    paymentIds: payments.map((p) => p.id),
    chargeAmountByDomainLdh: pickBy(isNotNil, chargeAmountByDomainLdh),
    totalAmountInUsd,
    successes,
    failures,
  });

  const result = {
    userId,
    userEmail,
    failures,
    successes,
    paymentStatus: 'SUCCEEDED' as const,
    totalAmountInUsd,
    refundAmountInUsd,
    orderId,
    domainsThatShouldBeRenewed,
    domainsThatCouldBeRenewed,
    chargeAmountByDomainLdh,
    domainsMissingPriceData,
    domainsSkippedDueToInsufficientFunds,
    shortfallInUsdCents,
    payments,
  } satisfies NotifyAndRenewDomainsForSingleUserWorkflowOutput;

  if (userEmail) {
    await _notifyUserForRenewResult({
      userEmail,
      userId,
      successes,
      failures,
      refundAmountInUsd,
      chargedAmountInUsd: totalAmountInUsd,
      expirationDatesByDomainLdh: fromPairs(
        domainsThatHavePriceData.map((domain) => [
          domain.normalizedDomainName,
          domain.expirationTime,
        ]),
      ),
      payments: payments.map((payment) => ({
        provider: payment.paymentProvider,
        amountInUsdCents: payment.amountInUsdCents,
        paymentId: payment.paymentId,
        walletAddress: payment.walletAddress,
        stripeLast4: stripeLast4ByMethodId[payment.stripePaymentMethodId ?? ''],
      })),
      chargeAmountByDomainLdh: pickBy(isNotNil, chargeAmountByDomainLdh),
      orderId,
      availableBalanceInNfsc,
      availableOffChainPaymentMethods:
        availableOffChainPaymentMethodsPublicIdentifiers.filter(isNotNil),
      domainLdhSkippedDueToInsufficientFunds:
        domainsSkippedDueToInsufficientFunds.map(
          (domain) => domain.normalizedDomainName,
        ),
      shortfallInUsdCents,
    });
  }
  return result;
}
// Type for the result of the single user workflow
export type SingleUserRenewalResult = Awaited<
  ReturnType<typeof notifyAndRenewDomainsForSingleUserWorkflow>
>;
type NotifyAndRenewDomainsForSingleUserWorkflowOutput = {
  userId: string;
  userEmail: string | undefined;
  domainsThatShouldBeRenewed: UserDomainsUpForRenewal;
  domainsThatCouldBeRenewed: DomainWithChargeAmount[];
  domainsMissingPriceData: UserDomainsUpForRenewal;
  /**
   * Domains that the user could not renew this cycle because their NFSC
   * balance did not cover them. These are deferred to the next cycle
   * (auto-renewal re-queries eligible domains daily).
   */
  domainsSkippedDueToInsufficientFunds: DomainWithChargeAmount[];
  /** USD cents short of the full original renewal bill, if partial-renewal triggered. */
  shortfallInUsdCents?: number;
  chargeAmountByDomainLdh: Record<NamefiNormalizedDomain, number | null>;
  totalAmountInUsd: number;
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  payments: {
    id: string;
    paymentProvider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
    paymentProviderReferenceId?: string;
  }[];
  refundAmountInUsd?: number | null;
  orderId?: string | null;
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

// #region Notify User
/*
 * ------------------------------------------------------------
 * Notify User for Upcoming Renew
 * ------------------------------------------------------------
 */
/**
 * Notify user for upcoming renew, a wrapper to send email
 * @param userEmail
 * @param domainsWithUser
 */
async function _notifyUserForUpcomingRenew(args: {
  userEmail: string;
  domainsWithUser: DomainsUpForRenewalWithUser;
  expectedPayments: Array<{
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  chargeAmountByDomainLdh: Record<string, number>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethodsPublicIdentifiers: string[];
  paymentPreparationSummary: PrepareMultiPaymentsOutput['preparationSummary'];
}) {
  const {
    userEmail,
    domainsWithUser,
    expectedPayments,
    chargeAmountByDomainLdh,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
    paymentPreparationSummary,
  } = args;
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
    expectedPayments,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
    paymentPreparationSummary,
  });
}

type NotifyUserForRenewResultInput = {
  userId: string;
  userEmail: string;
  successes: {
    status: 'fulfilled';
    domain: DomainRenewInfo;
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  failures: { status: 'rejected'; domain: DomainRenewInfo; error: Error }[];
  refundAmountInUsd: number | null | undefined;
  chargedAmountInUsd: number;
  expirationDatesByDomainLdh: Record<string, Date>;
  payments: Array<{
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  chargeAmountByDomainLdh: Record<string, number | null>;
  orderId?: string | null;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
  /** Domains we couldn't renew this cycle because NFSC balance was short. */
  domainLdhSkippedDueToInsufficientFunds: string[];
  /** USD cents short of the full original renewal bill, if applicable. */
  shortfallInUsdCents?: number;
};

/*
 * ------------------------------------------------------------
 * Notify User for Renew Result
 * ------------------------------------------------------------
 */
/**
 * Notify user for renew result, a wrapper to send email
 */
async function _notifyUserForRenewResult({
  userId,
  userEmail,
  successes,
  failures,
  refundAmountInUsd,
  chargedAmountInUsd,
  payments,
  chargeAmountByDomainLdh,
  expirationDatesByDomainLdh,
  availableBalanceInNfsc,
  availableOffChainPaymentMethods,
  orderId,
  domainLdhSkippedDueToInsufficientFunds,
  shortfallInUsdCents,
}: NotifyUserForRenewResultInput) {
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
    paymentMethods: payments,
    refundAmountInUsd,
    chargedAmountInUsd,
    refundStatus: refundAmountInUsd ? 'SUCCESS' : 'FAILED',
    orderId,
    chargeAmountInUsdByDomainLdh: pickBy(isNotNil, chargeAmountByDomainLdh),
    expirationDatesByDomainLdh: expirationDatesByDomainLdh,
    availableBalanceInNfsc,
    availableOffChainPaymentMethods,
    domainLdhSkippedDueToInsufficientFunds,
    shortfallInUsdCents,
  });
}

/*
 * ------------------------------------------------------------
 * Notify User for Failed to Charge
 * ------------------------------------------------------------
 */

/**
 * Notify user for failed to charge, a wrapper to send email
 */
async function _notifyUserForFailedToCharge({
  userId,
  userEmail,
  domainsToRenew,
  chargeAmountByDomainLdh,
  availableBalanceInNfsc,
  availableOffChainPaymentMethods,
}: {
  userId: string;
  userEmail: string;
  domainsToRenew: DomainRenewInfo[];
  chargeAmountByDomainLdh: Record<string, number>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
}) {
  const { sendEmailNotificationForRenewFailedToCharge } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });

  // Build expiration dates map from domain info
  const expirationDatesByDomainLdh: Record<string, Date> = {};
  for (const domain of domainsToRenew) {
    expirationDatesByDomainLdh[domain.normalizedDomainName] =
      domain.expirationTime;
  }

  await sendEmailNotificationForRenewFailedToCharge({
    userId,
    userEmail,
    domainsToRenew: domainsToRenew.map(
      ({ normalizedDomainName }) => normalizedDomainName,
    ),
    chargeAmountInUsdByDomainLdh: chargeAmountByDomainLdh,
    expirationDatesByDomainLdh,
    availableBalanceInNfsc,
    availableOffChainPaymentMethods,
  });
}

// #endregion Notify User

/*
 * ------------------------------------------------------------
 * Order Creation
 * ------------------------------------------------------------
 */
async function _createAutoRenewOrderForSingleUser({
  userId,
  paymentIds,
  chargeAmountByDomainLdh,
  totalAmountInUsd,
  successes,
  failures,
}: {
  userId: string;
  paymentIds: string[];
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
}): Promise<string | null> {
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

    const { orderId } = await createAutoRenewOrder({
      userId,
      paymentIds,
      domainRenewResults,
      totalAmountInUsd,
    });

    return orderId;
  } catch (orderError) {
    workflow.log.error(
      `Failed to create order for user ${userId}: ${orderError}`,
    );
    return null;
  }
}
