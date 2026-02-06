import * as workflow from '@temporalio/workflow';
import { splitEvery } from 'ramda';
import {
  longRunningOpts,
  shortRunningOpts,
} from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { NftWalletUserBackfillCandidates } from '../activities/migration.activities';

export const backfillNftWalletUsersConfirmSignal = workflow.defineSignal(
  'backfillNftWalletUsersConfirmSignal',
);

export type BackfillNftWalletUsersWorkflowInput = {
  batchSize?: number;
  delayBetweenBatchesSeconds?: number;
};

export type BackfillNftWalletUsersWorkflowOutput = {
  success: boolean;
  totalWallets: number;
  walletsMissingPrivyUser: number;
  privyUsersMissingDbUser: number;
  walletsProcessed: number;
  privyUsersCreated: number;
  usersEnsured: number;
  skippedAmbiguousWallets: number;
  ambiguousWallets: NftWalletUserBackfillCandidates['ambiguousWallets'];
  errors: string[];
};

type BackfillTarget =
  | { mode: 'wallet'; walletAddress: string }
  | { mode: 'privy-user'; privyUserId: string; walletAddress?: string };

type BackfillNftWalletUserResult = {
  success: boolean;
  walletAddress?: string;
  privyUserId?: string;
  userId?: string;
  createdPrivyUser?: boolean;
  error?: string;
};

export async function backfillNftWalletUsersWorkflow({
  batchSize = 10,
  delayBetweenBatchesSeconds = 30,
}: BackfillNftWalletUsersWorkflowInput = {}): Promise<BackfillNftWalletUsersWorkflowOutput> {
  let confirmationReceived = false;
  workflow.setHandler(backfillNftWalletUsersConfirmSignal, () => {
    confirmationReceived = true;
  });

  let cancellationRequested = false;
  workflow.CancellationScope.current().cancelRequested.then(() => {
    workflow.log.info('Cancellation Requested');
    cancellationRequested = true;
  });

  /**
   * it doesn’t throw directly—it relies on
   * workflow.sleep('1ms') inside a cancellable scope to raise
   * a CancelledFailure when cancellation is already requested.
   * If no cancellation is pending, it returns quietly.
   * So the “throw” happens via the cancellable timer,
   * not an explicit throw statement.
   */
  const throwIfCancellationRequested = async () => {
    if (!cancellationRequested) return;
    await workflow.sleep('1ms');
  };

  const { getNftWalletUserBackfillCandidatesActivity } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...longRunningOpts,
    },
  });

  const candidates = await getNftWalletUserBackfillCandidatesActivity();
  const walletsMissingPrivyUser = candidates.walletsMissingPrivyUser;
  const ambiguousWallets = candidates.ambiguousWallets;

  const privyUserMap = new Map<
    string,
    { privyUserId: string; walletAddress: string }
  >();
  for (const entry of candidates.privyUsersMissingDbUser) {
    if (!privyUserMap.has(entry.privyUserId)) {
      privyUserMap.set(entry.privyUserId, entry);
    }
  }

  const privyUsersMissingDbUser = Array.from(privyUserMap.values());

  workflow.log.info('Backfill NFT wallet users candidates computed', {
    totalWallets: candidates.totalWallets,
    walletsMissingPrivyUser: walletsMissingPrivyUser.length,
    privyUsersMissingDbUser: privyUsersMissingDbUser.length,
    ambiguousWallets: ambiguousWallets.length,
  });

  const targets: BackfillTarget[] = [
    ...walletsMissingPrivyUser.map((walletAddress) => ({
      mode: 'wallet' as const,
      walletAddress,
    })),
    ...privyUsersMissingDbUser.map((entry) => ({
      mode: 'privy-user' as const,
      privyUserId: entry.privyUserId,
      walletAddress: entry.walletAddress,
    })),
  ];

  workflow.upsertMemo({ targets });
  if (targets.length === 0) {
    return {
      success: true,
      totalWallets: candidates.totalWallets,
      walletsMissingPrivyUser: walletsMissingPrivyUser.length,
      privyUsersMissingDbUser: privyUsersMissingDbUser.length,
      walletsProcessed: 0,
      privyUsersCreated: 0,
      usersEnsured: 0,
      skippedAmbiguousWallets: ambiguousWallets.length,
      ambiguousWallets,
      errors: [],
    };
  }

  workflow.log.info('Awaiting confirmation to proceed with backfill', {
    walletsMissingPrivyUser: walletsMissingPrivyUser.length,
    privyUsersMissingDbUser: privyUsersMissingDbUser.length,
    ambiguousWallets: ambiguousWallets.length,
  });

  await workflow.condition(() => confirmationReceived);

  workflow.log.info('Confirmation received, starting backfill processing');

  const batches = splitEvery(batchSize, targets);
  let privyUsersCreated = 0;
  let usersEnsured = 0;
  const errors: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    await throwIfCancellationRequested();
    const batch = batches[i];

    workflow.log.info(`Processing batch ${i + 1}/${batches.length}`, {
      batchSize: batch.length,
    });

    try {
      await workflow.CancellationScope.cancellable(async () => {
        for (let j = 0; j < batch.length; j++) {
          await throwIfCancellationRequested();
          const target = batch[j];
          let result: BackfillNftWalletUserResult;
          try {
            const workflowId = `backfill-nft-wallet-user-${Date.now()}-${i}-${j}`;
            result = await workflow.CancellationScope.nonCancellable(() =>
              workflow.executeChild(backfillSingleNftWalletUserWorkflow, {
                args: [target],
                workflowId,
                taskQueue: TEMPORAL_QUEUES.DEFAULT,
              }),
            );
          } catch (error) {
            result = {
              success: false,
              walletAddress: target.walletAddress,
              privyUserId:
                target.mode === 'privy-user' ? target.privyUserId : undefined,
              error: error instanceof Error ? error.message : 'Unknown error',
            } satisfies BackfillNftWalletUserResult;
          }

          if (result.success) {
            if (result.createdPrivyUser) {
              privyUsersCreated++;
            }
            if (result.userId) {
              usersEnsured++;
            }
          } else {
            const identifier =
              result.walletAddress || result.privyUserId || 'unknown';
            const errorMsg = `Backfill failed for ${identifier}: ${
              result.error || 'Unknown error'
            }`;
            errors.push(errorMsg);
            workflow.log.warn(errorMsg);
          }

          await throwIfCancellationRequested();
        }
      });
    } catch (error) {
      if (workflow.isCancellation(error)) {
        workflow.log.warn('Cancellation requested after batch', {
          batchIndex: i + 1,
          batchesTotal: batches.length,
        });
        throw error;
      }
      throw error;
    }

    await throwIfCancellationRequested();

    if (i < batches.length - 1 && delayBetweenBatchesSeconds > 0) {
      workflow.log.info(
        `Waiting ${delayBetweenBatchesSeconds} seconds before next batch...`,
      );
      await workflow.sleep(`${delayBetweenBatchesSeconds} seconds`);
    }
  }

  const output: BackfillNftWalletUsersWorkflowOutput = {
    success: errors.length === 0,
    totalWallets: candidates.totalWallets,
    walletsMissingPrivyUser: walletsMissingPrivyUser.length,
    privyUsersMissingDbUser: privyUsersMissingDbUser.length,
    walletsProcessed: targets.length,
    privyUsersCreated,
    usersEnsured,
    skippedAmbiguousWallets: ambiguousWallets.length,
    ambiguousWallets,
    errors,
  };

  workflow.log.info('Backfill NFT wallet users workflow completed', output);

  return output;
}

export async function backfillSingleNftWalletUserWorkflow(
  input: BackfillTarget,
): Promise<BackfillNftWalletUserResult> {
  const {
    preparePrivyUserAccounts,
    createPostgresUserActivity,
    deleteExistingPrivyUserActivity,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const { createPrivyUserActivity } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '5 minutes',
      retry: {
        initialInterval: '1 minute',
        maximumInterval: '10 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 5,
        nonRetryableErrorTypes: ['UserNotFoundError'],
      },
    },
  });

  try {
    if (input.mode === 'privy-user') {
      const userId = await createPostgresUserActivity(
        false,
        undefined,
        input.privyUserId,
      );
      return {
        success: true,
        walletAddress: input.walletAddress,
        privyUserId: input.privyUserId,
        userId,
        createdPrivyUser: false,
      };
    }

    const walletAddress = input.walletAddress.toLowerCase();

    const {
      newAccountsToBeLinked,
      existingLinkedAccounts,
      existingPrivyId,
      createNewPrivyUser,
    } = await preparePrivyUserAccounts([walletAddress]);

    let privyUserId = existingPrivyId;
    let newUserCreated = false;

    if (createNewPrivyUser) {
      await deleteExistingPrivyUserActivity(existingPrivyId);

      const result = await createPrivyUserActivity(
        newAccountsToBeLinked,
        existingLinkedAccounts,
        existingPrivyId,
      );
      privyUserId = result.privyUserId;
      newUserCreated = result.newUserCreated;
    }

    if (!privyUserId) {
      return {
        success: false,
        walletAddress,
        error: 'Privy user ID was not resolved for wallet',
      };
    }

    const userId = await createPostgresUserActivity(
      newUserCreated,
      privyUserId,
      existingPrivyId,
    );

    return {
      success: true,
      walletAddress,
      privyUserId,
      userId,
      createdPrivyUser: newUserCreated,
    };
  } catch (error) {
    return {
      success: false,
      walletAddress: input.mode === 'wallet' ? input.walletAddress : undefined,
      privyUserId: input.mode === 'privy-user' ? input.privyUserId : undefined,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

backfillNftWalletUsersWorkflow.generateId = (
  input?: BackfillNftWalletUsersWorkflowInput,
) => {
  const batchSize = input?.batchSize ?? 10;
  return `backfill-nft-wallet-users-${batchSize}-${Date.now()}`;
};
