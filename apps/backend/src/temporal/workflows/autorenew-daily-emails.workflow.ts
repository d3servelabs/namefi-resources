import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowOutput,
} from './domain-ownership/extend-registration.workflow';
import { differenceInCalendarDays } from 'date-fns';
import { chargeNfscWorkflow as chargeNfsc, mintNfsc } from './mint.workflow';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type {
  DomainRenewInfo,
  DomainsUpForRenewalWithUser,
  getDomainsUpForRenewal,
} from '../activities/domain/renew.activities';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import {
  paymentProviderSchema,
  paymentStatusSchema,
  type PaymentProvider,
} from '@namefi-astra/db/types';
import { CHAINS, type ChecksumWalletAddress } from '@namefi-astra/utils';
import { sum } from 'ramda';
import { refundUserWorkflow } from './refund-user.workflow';
import {
  autoChargeStripeAndCreatePaymentWorkflow,
  type AutoChargeStripeWorkflowOutput,
} from './chargeStripe.workflow';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';

type ChargeUserAndReturnChargePaymentMethodOutput = {
  paymentType: PaymentProvider;
  namefiPaymentIntentId?: string;
};

const { generalAlertNamefi, getNamefiUsers } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

const { maybeGetUserEmail } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.NOTIFY,
  options: shortRunningOpts,
});

const { determineAvailablePaymentMethods } = typedProxyActivities({
  options: shortRunningOpts,
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
});

export async function dailyDomainsUpcomingRenewalsWorkflow(): Promise<void> {
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
  await Promise.allSettled(
    users.map(async (user) =>
      workflow.executeChild(notifyAndRenewDomainsForSingleUserWorkflow, {
        args: [user.id, domainsUpForRenewal],
        workflowId: `notify-and-renew-domains-${new Date().toISOString()}-${user.id}`,
      }),
    ),
  );
}

export async function notifyAndRenewDomainsForSingleUserWorkflow(
  userId: string,
  domainsUpForRenewal: Awaited<ReturnType<typeof getDomainsUpForRenewal>>,
): Promise<void> {
  const {
    getRenewPriceByDomain,
    getUserDomainsWithAutoRenewOptionAndExpirationTime,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });

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
  const { walletAddressToBeCharged, availablePaymentMethods } =
    await determineAvailablePaymentMethods(totalAmountInUsd, userId);
  let paymentMethodCharged: PaymentProvider;
  let namefiPaymentIntentId: string | undefined;

  try {
    const chargePaymentMethodResult =
      await chargeUserAndReturnChargePaymentMethod(
        userId,
        walletAddressToBeCharged,
        availablePaymentMethods,
        totalAmountInUsd,
      );
    paymentMethodCharged = chargePaymentMethodResult.paymentType;
    namefiPaymentIntentId = chargePaymentMethodResult?.namefiPaymentIntentId;
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
    domain: DomainRenewInfo;
    result: ExtendDomainRegistrationWorkflowOutput;
  }[];
  const failures = results.filter(({ status }) => status === 'rejected') as {
    status: 'rejected';
    domain: DomainRenewInfo;
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
      await _performRefund(
        userId,
        walletAddressToBeCharged,
        refundAmountInUsd,
        paymentMethodCharged,
        namefiPaymentIntentId,
      );
    }
  }
  if (!userEmail) {
    workflow.log.warn(
      `We are skipping notifying user ${userId} for renew result because user didn't provide an email`,
    );
    return;
  }
  await _notifyUserForRenewResult({
    userId,
    userEmail,
    successes,
    failures,
    refundAmountInUsd,
    paymentMethodCharged,
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

// #region Payment Methods

/**
 * We will charge user in the default order, currently: Credit Card, NFSC_BASE, NFSC_ETHEREUM
 */
async function chargeUserAndReturnChargePaymentMethod(
  userId: string,
  walletAddressToBeCharged: ChecksumWalletAddress,
  availablePaymentMethods: PaymentProvider[],
  totalAmountInUsd: number,
): Promise<ChargeUserAndReturnChargePaymentMethodOutput> {
  const chargeMethods = (
    [
      {
        method: paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA,
        workflow: chargeNfsc,
        args: [
          CHAINS.sepolia.id,
          walletAddressToBeCharged,
          totalAmountInUsd,
          'Domain auto-renewal charge',
          '0x0', // empty bytes
        ] as Parameters<typeof chargeNfsc>,
      },
      {
        method: paymentProviderSchema.Values.NFSC_BASE,
        workflow: chargeNfsc,
        args: [
          CHAINS.base.id,
          walletAddressToBeCharged,
          totalAmountInUsd,
          'Domain auto-renewal charge',
          '0x0', // empty bytes
        ] as Parameters<typeof chargeNfsc>,
      },
      {
        method: paymentProviderSchema.Values.NFSC_ETHEREUM,
        workflow: chargeNfsc,
        args: [
          CHAINS.mainnet.id,
          walletAddressToBeCharged,
          totalAmountInUsd,
          'Domain auto-renewal charge',
          '0x0', // empty bytes
        ] as Parameters<typeof chargeNfsc>,
      },
      {
        method: paymentProviderSchema.Values.STRIPE,
        workflow: autoChargeStripeAndCreatePaymentWorkflow,
        args: [
          { userId, totalAmountInUsdCents: totalAmountInUsd * 100 },
        ] as Parameters<typeof autoChargeStripeAndCreatePaymentWorkflow>,
      },
    ] as const
  ).filter((method) => availablePaymentMethods.includes(method.method));

  if (chargeMethods.length === 0) {
    throw workflow.ApplicationFailure.create({
      message: `The user ${walletAddressToBeCharged} has no available payment methods for ${totalAmountInUsd}$USD`,
      nonRetryable: true,
    });
  }
  for (const chargeMethod of chargeMethods) {
    try {
      const result = await workflow.executeChild(chargeMethod.workflow, {
        args: chargeMethod.args,
        taskQueue:
          chargeMethod.method === paymentProviderSchema.Values.STRIPE
            ? TEMPORAL_QUEUES.DEFAULT
            : TEMPORAL_QUEUES.MINT,
        workflowId: `charge-user-${new Date().toISOString()}-${walletAddressToBeCharged}-${totalAmountInUsd}$USD`,
      });
      if (chargeMethod.method === paymentProviderSchema.Values.STRIPE) {
        const autoChargeStripeWorkflowResult =
          result as AutoChargeStripeWorkflowOutput;
        if (
          autoChargeStripeWorkflowResult.paymentStatus ===
          paymentStatusSchema.Values.SUCCEEDED
        )
          return {
            paymentType: chargeMethod.method,
            namefiPaymentIntentId: autoChargeStripeWorkflowResult.paymentId,
          };
      }
      return { paymentType: chargeMethod.method };
    } catch (error) {
      workflow.log.info(
        `Failed to charge ${chargeMethod.method} for user ${walletAddressToBeCharged} with ${totalAmountInUsd}$USD`,
      );
    }
  }

  throw workflow.ApplicationFailure.create({
    message: `We can't charge user ${walletAddressToBeCharged} for ${totalAmountInUsd}$USD after exhausting all methods in ${chargeMethods.map((item) => item.method).join(',')}`,
    nonRetryable: true,
  });
}

async function _performRefund(
  userId: string,
  chargingWalletAddress: ChecksumWalletAddress,
  refundAmountInUsd: number,
  paymentMethodCharged: PaymentProvider,
  namefiPaymentIntentId?: string,
) {
  if (refundAmountInUsd === 0) {
    return;
  }

  const refundMethods = [
    {
      method: paymentProviderSchema.Values.STRIPE,
      workflow: refundUserWorkflow,
      args: [
        {
          paymentId: namefiPaymentIntentId,
          amountToRefundInUsdCents: refundAmountInUsd * 100,
        },
      ] as Parameters<typeof refundUserWorkflow>,
    },
    {
      method: paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA,
      workflow: mintNfsc,
      args: [
        CHAINS.sepolia.id,
        chargingWalletAddress,
        refundAmountInUsd,
      ] as Parameters<typeof mintNfsc>,
    },
    {
      method: paymentProviderSchema.Values.NFSC_BASE,
      workflow: mintNfsc,
      args: [
        CHAINS.base.id,
        chargingWalletAddress,
        refundAmountInUsd,
      ] as Parameters<typeof mintNfsc>,
    },
    {
      method: paymentProviderSchema.Values.NFSC_ETHEREUM,
      workflow: mintNfsc,
      args: [
        CHAINS.mainnet.id,
        chargingWalletAddress,
        refundAmountInUsd,
      ] as Parameters<typeof mintNfsc>,
    },
  ] as const;
  const refundMethod = refundMethods.find(
    (refundMethod) => paymentMethodCharged === refundMethod.method,
  );
  if (!refundMethod) {
    throw workflow.ApplicationFailure.create({
      message: `We can't refund user ${chargingWalletAddress} for ${refundAmountInUsd} after exhausting all methods in ${refundMethods.map((item) => item.method).join(',')}`,
      nonRetryable: true,
    });
  }

  try {
    await workflow.executeChild(refundMethod.workflow, {
      args: refundMethod.args,
      taskQueue:
        refundMethod.method === paymentProviderSchema.Values.STRIPE
          ? TEMPORAL_QUEUES.DEFAULT
          : TEMPORAL_QUEUES.MINT,
      workflowId: `refund-user-${new Date().toISOString()}-${chargingWalletAddress}-${refundAmountInUsd}$USD`,
    });
    return refundMethod.method;
  } catch (error) {
    workflow.log.info(
      `Failed to refund ${refundMethod.method} for user ${chargingWalletAddress} with ${refundAmountInUsd}$USD`,
    );
  }

  throw workflow.ApplicationFailure.create({
    message: `We can't refund user ${chargingWalletAddress} for ${refundAmountInUsd}$USD after exsulated all methods in ${refundMethods.map((item) => item.method).join(',')}`,
    nonRetryable: true,
  });
}

// #endregion Payment Methods
