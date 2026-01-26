import { db, usersTable } from '@namefi-astra/db';
import { nfscFaucetRequestsTableSchema } from '@namefi-astra/db/schemas/internal';
import { CHAINS, type ChecksumWalletAddress } from '@namefi-astra/utils';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { TRPCError } from '@trpc/server';
import { eq, inArray } from 'drizzle-orm';
import { isNil } from 'ramda';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import {
  devSignupWalletLinkedSignal,
  mintDevSignupNfscWorkflow,
} from '#temporal/workflows/mint-dev-signup-nfsc.workflow';
import { mintNfsc } from '#temporal/workflows/mint.workflow';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '#trpc/utils';

type RequestNfscFaucetInput = {
  walletAddress: ChecksumWalletAddress;
};

type RequestNfscFaucetForPrimaryWalletInput = {
  userId?: string;
  privyUserId?: string;
};

type NfscFaucetRateLimitedResult = {
  status: 'rate_limited';
  walletAddress: ChecksumWalletAddress;
  nextEligibleAt: Date;
};

type NfscFaucetStartedResult = {
  status: 'started';
  workflowId: string;
  walletAddress: ChecksumWalletAddress;
  nextEligibleAt: Date;
};

export type NfscFaucetResult =
  | NfscFaucetRateLimitedResult
  | NfscFaucetStartedResult;

export async function requestNfscFaucet(
  input: RequestNfscFaucetInput,
): Promise<NfscFaucetResult> {
  if (!config.DEV_NFSC_ENABLED || config.DEV_NFSC_FAUCET_AMOUNT <= 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'NFSC faucet is disabled',
    });
  }

  const walletAddress = input.walletAddress;
  let privyUserId: string | undefined;
  let userId: string | undefined;

  const [privyUserError, privyUser] = await resolve(
    privyClient.getUserByWalletAddress(walletAddress),
  );

  if (privyUserError) {
    logger.warn(
      { error: privyUserError, walletAddress },
      'Failed to fetch Privy user by wallet address',
    );
  }

  if (privyUser?.id) {
    privyUserId = privyUser.id;
    const dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, privyUser.id),
      columns: { id: true, privyUserId: true },
    });
    if (dbUser?.id) {
      userId = dbUser.id;
      privyUserId = dbUser.privyUserId;
    }
  }

  const now = new Date();
  const cooldownMs = config.DEV_NFSC_FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - cooldownMs);
  const walletKey = `wallet:${walletAddress.toLowerCase()}`;
  const keys = [walletKey];
  const userKey = userId ? `user:${userId.toLowerCase()}` : null;
  if (userKey) {
    keys.push(userKey);
  }
  const initialLastRequestedAt = new Date(0);

  const rateLimitResult = await db.transaction(
    async (tx) => {
      const walletInsert: typeof nfscFaucetRequestsTableSchema.$inferInsert = {
        requestKey: walletKey,
        walletAddress,
        lastRequestedAt: initialLastRequestedAt,
        ...(userId ? { userId } : {}),
      };
      const insertValues: Array<
        typeof nfscFaucetRequestsTableSchema.$inferInsert
      > = [walletInsert];
      if (userKey && userId) {
        insertValues.push({
          requestKey: userKey,
          userId,
          walletAddress,
          lastRequestedAt: initialLastRequestedAt,
        });
      }

      await tx
        .insert(nfscFaucetRequestsTableSchema)
        .values(insertValues)
        .onConflictDoNothing();

      const lockedRows = await tx
        .select({
          requestKey: nfscFaucetRequestsTableSchema.requestKey,
          lastRequestedAt: nfscFaucetRequestsTableSchema.lastRequestedAt,
        })
        .from(nfscFaucetRequestsTableSchema)
        .where(inArray(nfscFaucetRequestsTableSchema.requestKey, keys))
        .for('update');

      const latestRequest = lockedRows.reduce(
        (latest, row) =>
          row.lastRequestedAt > latest ? row.lastRequestedAt : latest,
        initialLastRequestedAt,
      );

      const nextEligibleAt = new Date(latestRequest.getTime() + cooldownMs);

      if (latestRequest >= windowStart) {
        return { allowed: false, nextEligibleAt };
      }

      const updateValues: Partial<
        typeof nfscFaucetRequestsTableSchema.$inferInsert
      > = {
        lastRequestedAt: now,
        walletAddress,
        ...(userId ? { userId } : {}),
      };

      await tx
        .update(nfscFaucetRequestsTableSchema)
        .set(updateValues)
        .where(inArray(nfscFaucetRequestsTableSchema.requestKey, keys));

      return {
        allowed: true,
        nextEligibleAt: new Date(now.getTime() + cooldownMs),
      };
    },
    {
      isolationLevel: 'serializable',
      deferrable: false,
    },
  );

  if (!rateLimitResult.allowed) {
    return {
      status: 'rate_limited',
      walletAddress,
      nextEligibleAt: rateLimitResult.nextEligibleAt,
    };
  }

  const mintInput = {
    chainId: CHAINS.sepolia.id,
    account: walletAddress,
    amountInUsd: config.DEV_NFSC_FAUCET_AMOUNT,
  };
  const workflowId = `faucet-mint-nfsc-[${walletAddress}]-[${CHAINS.sepolia.id}]-[${Date.now()}]`;
  const callerType = userId ? 'user' : 'wallet';
  const callerValue = userId ?? walletAddress;
  const searchAttributes = {
    callerType: [callerType],
    caller: [callerValue],
    affectedResources: ['nfsc', `nfsc:${walletAddress}`],
    ...(userId ? { userId: [userId] } : {}),
  };

  try {
    await temporalClient.workflow.start(mintNfsc, {
      workflowId,
      taskQueue: TEMPORAL_QUEUES.MINT,
      args: [mintInput],
      searchAttributes,
      memo: {
        description: 'Dev NFSC faucet mint',
        userId: userId ?? null,
        privyUserId: privyUserId ?? null,
        walletAddress,
        amountInUsd: config.DEV_NFSC_FAUCET_AMOUNT,
        chainId: CHAINS.sepolia.id,
        timestamp: new Date().toISOString(),
      },
      retry: {
        maximumAttempts: 1,
      },
    });
  } catch (startError) {
    logger.error(
      { error: startError, userId },
      'Failed to start NFSC faucet mint workflow',
    );
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to start faucet mint',
    });
  }

  if (config.DEV_NFSC_SIGNUP_MINT_AMOUNT > 0 && userId) {
    try {
      const signupWorkflowId = mintDevSignupNfscWorkflow.generateId({
        userId,
      });
      await temporalClient.workflow
        .getHandle(signupWorkflowId)
        .signal(devSignupWalletLinkedSignal);
    } catch (signalError) {
      logger.debug(
        { error: signalError, userId },
        'Dev signup mint workflow signal failed',
      );
    }
  }

  return {
    status: 'started',
    workflowId,
    walletAddress,
    nextEligibleAt: rateLimitResult.nextEligibleAt,
  };
}

export async function requestNfscFaucetForPrimaryWallet(
  input: RequestNfscFaucetForPrimaryWalletInput,
): Promise<NfscFaucetResult> {
  if (!input.userId && !input.privyUserId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User identifier is required',
    });
  }

  let privyUserId = input.privyUserId;

  if (!privyUserId && input.userId) {
    const dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, input.userId),
      columns: { id: true, privyUserId: true },
    });
    if (dbUser?.privyUserId) {
      privyUserId = dbUser.privyUserId;
    }
  }

  if (!privyUserId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Could not resolve Privy user',
    });
  }

  const [error, privyUser] = await resolve(
    privyClient.getUserById(privyUserId),
  );

  if (error || isNil(privyUser)) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Could not find user details',
    });
  }

  const walletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses({
    privyUser,
  });

  if (walletAddresses.length === 0) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No linked wallet address found',
    });
  }

  return requestNfscFaucet({
    walletAddress: walletAddresses[0],
  });
}
