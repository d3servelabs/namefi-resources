import * as workflow from '@temporalio/workflow';
import { differenceInCalendarDays } from 'date-fns';
import pMap from 'p-map';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { DomainRenewalResult } from '../activities/order.activities';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowOutput,
} from './domain-ownership/extend-registration.workflow';

const POWERED_BY_NAMEFI_PARENT_DOMAINS = [
  'withtrump.club',
  'withharris.club',
] as const;

type PoweredByNamefiParentDomain =
  (typeof POWERED_BY_NAMEFI_PARENT_DOMAINS)[number];

const getPoweredByNamefiParentDomain = (
  normalizedDomainName: NamefiNormalizedDomain,
): PoweredByNamefiParentDomain | null =>
  POWERED_BY_NAMEFI_PARENT_DOMAINS.find((parent) =>
    normalizedDomainName.endsWith(`.${parent}`),
  ) ?? null;

const isPoweredByNamefiSubdomain = (
  normalizedDomainName: NamefiNormalizedDomain,
) => Boolean(getPoweredByNamefiParentDomain(normalizedDomainName));

const isWithinRenewWindow = (expirationTime: Date, allowExpired: boolean) => {
  const daysToExpiration = differenceInCalendarDays(expirationTime, new Date());
  return (
    daysToExpiration <= RENEW_EARLY_BY_DAYS &&
    (allowExpired || daysToExpiration >= 0)
  );
};

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

const { createFreeAutoRenewOrder } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

type UserDomainsUpForRenewal = Exclude<
  Awaited<ReturnType<typeof getDomainsUpForRenewalGroupedByOwner>>[string],
  undefined
>;

export type FreeRenewPoweredByNamefiDomainsUserResult = {
  userId: string;
  status: 'success' | 'failure' | 'skipped' | 'dry_run';
  orderId?: string | null;
  domainsAttempted: NamefiNormalizedDomain[];
  successes: NamefiNormalizedDomain[];
  failures: Array<{ domain: NamefiNormalizedDomain; error: string }>;
  errorMessage?: string;
};

export type FreeRenewPoweredByNamefiDomainsResult = {
  dryRun: boolean;
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  users: FreeRenewPoweredByNamefiDomainsUserResult[];
};

export async function freeRenewPoweredByNamefiDomainsWorkflow({
  dryRun = false,
  allowExpired = false,
}: {
  dryRun?: boolean;
  allowExpired?: boolean;
} = {}): Promise<FreeRenewPoweredByNamefiDomainsResult> {
  const parentDomains = POWERED_BY_NAMEFI_PARENT_DOMAINS.map(
    (domain) => domain as NamefiNormalizedDomain,
  );
  const domainsUpForRenewalGroupedByOwner =
    await getDomainsUpForRenewalGroupedByOwner({
      parentDomains,
      allowExpired,
    });
  const userIds = Object.keys(domainsUpForRenewalGroupedByOwner);

  workflow.log.info('Starting free renew powered-by-namefi domains workflow', {
    dryRun,
    allowExpired,
    userCount: userIds.length,
    parentDomains,
  });

  const results = await pMap(
    userIds,
    async (userId): Promise<FreeRenewPoweredByNamefiDomainsUserResult> => {
      const userDomains = domainsUpForRenewalGroupedByOwner[
        userId
      ] as UserDomainsUpForRenewal;
      if (!userDomains || userDomains.length === 0) {
        return {
          userId,
          status: 'skipped',
          domainsAttempted: [],
          successes: [],
          failures: [],
        };
      }

      const poweredByNamefiDomains = userDomains.filter((domain) =>
        isPoweredByNamefiSubdomain(domain.normalizedDomainName),
      );

      const domainsToRenew = poweredByNamefiDomains.filter((domain) =>
        isWithinRenewWindow(domain.expirationTime, allowExpired),
      );

      const domainsAttempted = domainsToRenew.map(
        (domain) => domain.normalizedDomainName,
      );

      if (domainsToRenew.length === 0) {
        return {
          userId,
          status: 'skipped',
          domainsAttempted,
          successes: [],
          failures: [],
        };
      }

      if (dryRun) {
        return {
          userId,
          status: 'dry_run',
          orderId: null,
          domainsAttempted,
          successes: [],
          failures: [],
        };
      }

      try {
        const results = await Promise.all(
          domainsToRenew.map(async (domain) => {
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
              return { status: 'fulfilled', domain, result } as const;
            } catch (error) {
              return { status: 'rejected', domain, error } as const;
            }
          }),
        );

        const successes = results.filter(
          (result) => result.status === 'fulfilled',
        ) as Array<{
          status: 'fulfilled';
          domain: UserDomainsUpForRenewal[number];
          result: ExtendDomainRegistrationWorkflowOutput;
        }>;

        const failures = results.filter(
          (result) => result.status === 'rejected',
        ) as Array<{
          status: 'rejected';
          domain: UserDomainsUpForRenewal[number];
          error: Error;
        }>;

        const domainRenewResults: DomainRenewalResult[] = [
          ...successes.map(({ domain, result }) => ({
            normalizedDomainName: domain.normalizedDomainName,
            status: 'SUCCESS' as const,
            registrarKey: domain.registrarKey,
            eppOperationStatus: result.eppOperationStatus,
            txHash: result.txHash,
            txStatus: result.txStatus,
            chargeAmountInUsd: 0,
          })),
          ...failures.map(({ domain, error }) => ({
            normalizedDomainName: domain.normalizedDomainName,
            status: 'FAILURE' as const,
            registrarKey: domain.registrarKey,
            error: error instanceof Error ? error : new Error(String(error)),
            chargeAmountInUsd: 0,
          })),
        ];

        const { orderId } = await createFreeAutoRenewOrder({
          userId,
          domainRenewResults,
        });

        return {
          userId,
          status: 'success',
          orderId,
          domainsAttempted,
          successes: successes.map((s) => s.domain.normalizedDomainName),
          failures: failures.map((f) => ({
            domain: f.domain.normalizedDomainName,
            error: f.error?.message || 'Unknown error',
          })),
        };
      } catch (error) {
        workflow.log.error('Failed to renew powered-by-namefi domains', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          userId,
          status: 'failure',
          domainsAttempted,
          successes: [],
          failures: [],
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }
    },
    { concurrency: 10 },
  );

  const totalDomainsProcessed = results.reduce(
    (sum, result) => sum + result.domainsAttempted.length,
    0,
  );
  const totalSucceeded = results.reduce(
    (sum, result) => sum + result.successes.length,
    0,
  );
  const totalFailed = results.reduce(
    (sum, result) => sum + result.failures.length,
    0,
  );

  return {
    dryRun,
    totalUsersProcessed: results.length,
    totalDomainsProcessed,
    totalSucceeded,
    totalFailed,
    users: results,
  };
}
