import { CHAINS } from '@namefi-astra/utils';
import { executeChild } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { mintNfsc } from './mint.workflow';

export type MintNfscByUserIdInput = {
  userId: string;
  amountInUsd: number;
  chainId?: number;
};

export type MintNfscByUserIdOutput = {
  userId: string;
  account: `0x${string}`;
  chainId: number;
  amountInUsd: number;
  txHash: string;
};

const { getDefaultEvmWalletForUserOrThrow } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export async function mintNfscByUserIdWorkflow(
  input: MintNfscByUserIdInput,
): Promise<MintNfscByUserIdOutput> {
  const chainId = input.chainId ?? CHAINS.base.id;
  const account = await getDefaultEvmWalletForUserOrThrow(input.userId);
  const mintInput = {
    chainId,
    account,
    amountInUsd: input.amountInUsd,
  };

  const txHash = await executeChild(mintNfsc, {
    args: [mintInput],
    workflowId: mintNfsc.generateId(mintInput),
    taskQueue: TEMPORAL_QUEUES.MINT,
    searchAttributes: {
      callerType: ['system'],
      caller: ['mint-nfsc-by-user-id.workflow'],
      userId: [input.userId],
      affectedResources: ['nfsc', `nfsc:${account}`],
    },
    memo: {
      description: 'Mint NFSC by user ID',
      userId: input.userId,
      account,
      amountInUsd: input.amountInUsd,
      chainId,
      timestamp: new Date().toISOString(),
    },
    retry: {
      maximumAttempts: 1,
    },
  });

  return {
    userId: input.userId,
    account,
    chainId,
    amountInUsd: input.amountInUsd,
    txHash,
  };
}

mintNfscByUserIdWorkflow.generateId = (input: MintNfscByUserIdInput) => {
  return `mint-nfsc-by-user-id-[${input.userId}]-[${input.chainId ?? CHAINS.base.id}]-[${input.amountInUsd}]`;
};
