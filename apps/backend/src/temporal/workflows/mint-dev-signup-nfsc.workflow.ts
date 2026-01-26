import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { mintNfsc } from './mint.workflow';
import { resolve } from '@namefi-astra/utils/promises/resolve';

export const devSignupWalletLinkedSignal = workflow.defineSignal(
  'devSignupWalletLinkedSignal',
);

type DevSignupMintInput = {
  userId: string;
  privyUserId: string;
  chainId: number;
  amountInUsd: number;
};

type DevSignupMintOutput = {
  status: 'MINTED' | 'NO_WALLET';
  walletAddress?: `0x${string}`;
  txHash?: string;
};

export async function mintDevSignupNfscWorkflow(
  input: DevSignupMintInput,
): Promise<DevSignupMintOutput> {
  const receivingWallet: `0x${string}` | undefined =
    await waitForReceivingWallet(input.userId);

  if (receivingWallet) {
    const { txHash } = await prepareAndSendNFSCMintWorkflow({
      chainId: input.chainId,
      walletAddress: receivingWallet,
      amountInUsd: input.amountInUsd,
      userId: input.userId,
      privyUserId: input.privyUserId,
    });

    return {
      status: 'MINTED',
      walletAddress: receivingWallet,
      txHash,
    };
  }

  workflow.log.info(`Dev signup NFSC mint timed out for user ${input.userId}`);

  return { status: 'NO_WALLET' };
}

mintDevSignupNfscWorkflow.generateId = (input: { userId: string }) => {
  return `dev-signup-nfsc-[${input.userId}]`;
};

async function prepareAndSendNFSCMintWorkflow({
  chainId,
  walletAddress,
  amountInUsd,
  userId,
  privyUserId,
}: {
  chainId: number;
  walletAddress: `0x${string}`;
  amountInUsd: number;
  userId: string;
  privyUserId: string;
}) {
  const mintInput = {
    chainId,
    account: walletAddress,
    amountInUsd,
  };
  const workflowId = `dev-signup-mint-nfsc-[${userId}]-[${walletAddress}]`;

  const txHash = await workflow.executeChild(mintNfsc, {
    args: [mintInput],
    workflowId,
    taskQueue: TEMPORAL_QUEUES.MINT,
    searchAttributes: {
      callerType: ['system'],
      caller: ['dev-signup'],
      userId: [userId],
      affectedResources: ['nfsc', `nfsc:${walletAddress}`],
    },
    memo: {
      description: 'Dev signup NFSC mint',
      userId,
      privyUserId,
      amountInUsd,
      chainId,
      walletAddress,
      timestamp: new Date().toISOString(),
    },
    retry: {
      maximumAttempts: 1,
    },
  });
  return { txHash };
}

async function waitForReceivingWallet(userId: string): Promise<`0x${string}`> {
  const { getUserLinkedEvmWallet } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: {
        maximumAttempts: 3,
      },
    },
  });

  let signalTriggered = false;

  workflow.setHandler(devSignupWalletLinkedSignal, () => {
    signalTriggered = true;
  });

  const walletAddresses = await Promise.race([
    workflow
      .condition(() => signalTriggered, '3 days')
      .then((res) => {
        if (res) {
          return getUserLinkedEvmWallet({
            userId,
          });
        }
        return [];
      }),
    pollWalletAddresses(userId),
  ]);

  return walletAddresses?.[0] as `0x${string}`;
}

async function pollWalletAddresses(userId: string): Promise<`0x${string}`[]> {
  const shortPoll = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: {
        maximumAttempts: 30,
        backoffCoefficient: 1.25,
        initialInterval: '1 minute',
        maximumInterval: '5 minutes',
      },
    },
  });
  const longPoll = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: {
        maximumAttempts: 24 * 3, // 3 days
        backoffCoefficient: 1,
        initialInterval: '1 hour',
        maximumInterval: '1 hour',
      },
    },
  });

  const [shortPollError, shortPollResult] = await resolve(
    shortPoll.assertAndGetUserLinkedEvmWallet({
      userId,
    }),
  );

  if (shortPollResult) {
    return shortPollResult;
  }

  const [longPollError, longPollResult] = await resolve(
    longPoll.assertAndGetUserLinkedEvmWallet({
      userId,
    }),
  );

  if (longPollResult) {
    return longPollResult;
  }

  return [];
}
