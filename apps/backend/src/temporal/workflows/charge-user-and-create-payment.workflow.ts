import * as workflow from '@temporalio/workflow';
import {
  paymentProviderSchema,
  paymentStatusSchema,
  type AutoRenewalPaymentProvider,
} from '@namefi-astra/db/types';
import { CHAINS, type ChecksumWalletAddress } from '@namefi-astra/utils';
import { shortRunningOpts, TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { chargeNfscWorkflow as chargeNfsc } from './mint.workflow';
import { chargeStripeWorkflow } from './chargeStripe.workflow';

export type ChargeUserAndCreatePaymentWorkflowInput = {
  userId: string;
  totalAmountInUsd: number;
};

export type ChargeUserAndCreatePaymentWorkflowOutput = {
  paymentType: AutoRenewalPaymentProvider;
  namefiPaymentIntentId: string;
};

const {
  createPayment,
  updatePayment,
  determineAvailablePaymentMethods,
  criticalAlertNamefi,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

/**
 *
 * @deprecated
 */
export async function chargeUserAndCreatePaymentWorkflow({
  userId,
  totalAmountInUsd,
}: ChargeUserAndCreatePaymentWorkflowInput): Promise<ChargeUserAndCreatePaymentWorkflowOutput> {
  const {
    walletAddressToBeCharged,
    availablePaymentMethods,
    stripePreferredPaymentMethodId,
  } = await determineAvailablePaymentMethods(totalAmountInUsd, userId);
  const stripeIdempotencyKey = workflow.uuid4(); // This is not Ideal but this workflow is deprecated we are just trying to satisfy Typescript
  // Define all possible charge methods - only AutoRenewalPaymentProvider types (excludes X402)
  const allChargeMethods: {
    method: AutoRenewalPaymentProvider;
    workflow: (...args: any[]) => Promise<any>;
    args: any[];
    taskQueue: TEMPORAL_QUEUES;
  }[] = [
    {
      method: paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
      workflow: chargeNfsc,
      args: [
        CHAINS.sepolia.id,
        walletAddressToBeCharged,
        totalAmountInUsd,
        'Domain auto-renewal charge',
        '0x0', // empty bytes
      ] as Parameters<typeof chargeNfsc>,
      taskQueue: TEMPORAL_QUEUES.MINT,
    },
    {
      method: paymentProviderSchema.enum.NFSC_BASE,
      workflow: chargeNfsc,
      args: [
        CHAINS.base.id,
        walletAddressToBeCharged,
        totalAmountInUsd,
        'Domain auto-renewal charge',
        '0x0', // empty bytes
      ] as Parameters<typeof chargeNfsc>,
      taskQueue: TEMPORAL_QUEUES.MINT,
    },
    {
      method: paymentProviderSchema.enum.NFSC_ETHEREUM,
      workflow: chargeNfsc,
      args: [
        CHAINS.mainnet.id,
        walletAddressToBeCharged,
        totalAmountInUsd,
        'Domain auto-renewal charge',
        '0x0', // empty bytes
      ] as Parameters<typeof chargeNfsc>,
      taskQueue: TEMPORAL_QUEUES.MINT,
    },
    {
      method: paymentProviderSchema.enum.STRIPE,
      workflow: chargeStripeWorkflow,
      args: [
        {
          userId,
          totalAmountInUsdCents: totalAmountInUsd * 100,
          paymentMethodId: stripePreferredPaymentMethodId,
          idempotencyKey: stripeIdempotencyKey,
        },
      ] as Parameters<typeof chargeStripeWorkflow>,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
    },
  ];

  const chargeMethods = allChargeMethods.filter((method) =>
    availablePaymentMethods.includes(method.method),
  );

  if (chargeMethods.length === 0) {
    throw workflow.ApplicationFailure.create({
      message: `The user ${walletAddressToBeCharged} has no available payment methods for ${totalAmountInUsd}$USD`,
      nonRetryable: true,
    });
  }

  const chargeResult = await _tryChargingMethods({
    chargeMethods,
    walletAddressToBeCharged,
    totalAmountInUsd,
    stripePreferredPaymentMethodId,
    userId,
  });

  if (!chargeResult) {
    throw workflow.ApplicationFailure.create({
      message: `We can't charge user ${walletAddressToBeCharged} for ${totalAmountInUsd}$USD after exhausting all methods in ${chargeMethods.map((item) => item.method).join(',')}`,
      nonRetryable: true,
    });
  }

  const { paymentProviderDetails, paymentProviderReferenceId } = chargeResult;

  // For NFSC methods, create payment record after successful charge
  const payment = await createPayment({
    amountInUsdCents: totalAmountInUsd * 100,
    paymentProviderDetails,
  });

  await updatePayment({
    id: payment.id,
    status: paymentStatusSchema.enum.SUCCEEDED,
    paymentProviderReferenceId,
  });

  return {
    paymentType: paymentProviderDetails.paymentProvider,
    namefiPaymentIntentId: payment.id,
  };
}

function _withStripeIdempotencyKey({
  chargeMethod,
  childWorkflowId,
}: {
  chargeMethod: { method: AutoRenewalPaymentProvider; args: any[] };
  childWorkflowId: string;
}) {
  if (chargeMethod.method !== paymentProviderSchema.enum.STRIPE) {
    return chargeMethod.args;
  }
  return [
    {
      ...chargeMethod.args[0],
      // No payment record exists yet at this point, so key the Stripe charge
      // on the (deterministic) child workflow ID to keep activity retries
      // from double-charging.
      idempotencyKey: `payment-intent-${childWorkflowId}`,
    },
  ] as Parameters<typeof chargeStripeWorkflow>;
}

async function _tryChargingMethods({
  chargeMethods,
  walletAddressToBeCharged,
  totalAmountInUsd,
  stripePreferredPaymentMethodId,
  userId,
}: {
  chargeMethods: {
    method: AutoRenewalPaymentProvider;
    workflow: (...args: any[]) => Promise<any>;
    args: any[];
    taskQueue: TEMPORAL_QUEUES;
  }[];
  walletAddressToBeCharged?: ChecksumWalletAddress;
  totalAmountInUsd: number;
  stripePreferredPaymentMethodId?: string;
  userId: string;
}) {
  for (const chargeMethod of chargeMethods) {
    try {
      const childWorkflowId = `charge-user-${new Date().toISOString()}-${walletAddressToBeCharged}-${totalAmountInUsd}$USD`;
      const result = await workflow.executeChild(chargeMethod.workflow, {
        args: chargeMethod.args,
        taskQueue: chargeMethod.taskQueue,
        workflowId: childWorkflowId,
      });

      if (chargeMethod.method === paymentProviderSchema.enum.STRIPE) {
        if (!stripePreferredPaymentMethodId) {
          throw workflow.ApplicationFailure.create({
            message: `Attempted to charge user ${walletAddressToBeCharged} for ${totalAmountInUsd}$USD with Stripe, but payment method ID is undefined`,
            nonRetryable: true,
          });
        }
        const chargeStripeWorkflowResult = result as Awaited<
          ReturnType<typeof chargeStripeWorkflow>
        >;
        if (chargeStripeWorkflowResult.paymentIntentStatus === 'succeeded') {
          return {
            paymentProviderDetails: {
              paymentProvider: chargeMethod.method,
              stripePaymentDetails: {
                paymentMethodId: stripePreferredPaymentMethodId,
              },
            },
            paymentProviderReferenceId:
              chargeStripeWorkflowResult.paymentIntentId,
          };
        }
      } else {
        if (!walletAddressToBeCharged) {
          criticalAlertNamefi({
            workflowInfo: workflow.workflowInfo(),
            message: `Attempted to charge user ${userId} for ${totalAmountInUsd}$USD with NFSC, but wallet address is undefined`,
            level: 'fatal',
          });

          throw workflow.ApplicationFailure.create({
            message: `Failed to charge user ${walletAddressToBeCharged} for ${totalAmountInUsd}$USD with NFSC`,
            nonRetryable: true,
          });
        }

        const workflowResult = result as Awaited<ReturnType<typeof chargeNfsc>>;

        return {
          paymentProviderDetails: {
            paymentProvider: chargeMethod.method,
            nfscPaymentDetails: {
              chainId: (chargeMethod.args as Parameters<typeof chargeNfsc>)[0],
              walletAddress: walletAddressToBeCharged,
            },
          },
          paymentProviderReferenceId: workflowResult,
        };
      }
    } catch (error) {
      workflow.log.info(
        `Failed to charge ${chargeMethod.method} for user ${walletAddressToBeCharged} with ${totalAmountInUsd}$USD`,
      );
    }
  }
}
