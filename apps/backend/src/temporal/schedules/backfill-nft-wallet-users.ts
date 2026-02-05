/**
 * Schedule for backfilling users from NFT wallet ownership
 * Creates Privy users and database users for NFT owner wallets missing records
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { backfillNftWalletUsersWorkflow } from '../workflows/backfill-nft-wallet-users.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const BackfillNftWalletUsersSchedule = BaseSchedule.forWorkflowType(
  backfillNftWalletUsersWorkflow,
);

const config: ScheduleConfig<typeof backfillNftWalletUsersWorkflow> = {
  scheduleId: 'backfill-nft-wallet-users-schedule',
  workflowId: 'backfill-nft-wallet-users',
  name: 'Backfill NFT Wallet Users',
  description:
    'Creates Privy and database users for NFT owner wallets missing user records',
  groupId: 'user-indexing',
  cronExpressions: ['0 */6 * * *'],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  workflowExecutionTimeout: '2h',
  workflowRunTimeout: '2h',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'indexer',
};

export const backfillNftWalletUsersSchedule =
  new BackfillNftWalletUsersSchedule(config);

export const submitScheduleForBackfillNftWalletUsers = () =>
  backfillNftWalletUsersSchedule.submit();

export const triggerBackfillNftWalletUsers = () =>
  backfillNftWalletUsersSchedule.trigger();

export const deleteScheduleForBackfillNftWalletUsers = () =>
  backfillNftWalletUsersSchedule.delete();
