import { sldRegistrar } from '#lib/namefi-registry';
import { logger } from '#lib/logger';
import { RenewOption } from '@namefi-astra/registrars/data/types/renew-option';
import type { Registrars } from '@namefi-astra/registrars/registrars-keys';
import pMap from 'p-map';
import { getUnixTime } from 'date-fns';
import {
  prepareTxToChargeNfsc,
  signAndSendTransaction,
  type TxSendResult,
} from '#temporal/activities/mint/mint.activities';
import { db } from '@namefi-astra/db/client';
import {
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { isNull, eq } from 'drizzle-orm';

const toAddress = '0xc461312e7FDD4B04065DD6CcCc14DFAA14791749';
/**
 * Main execution function
 */
async function main2(): Promise<void> {
  const gasPriceMultiplier = 1.25;
  for (const { amountInUsd, reason } of [
    {
      amountInUsd: 59.07,
      reason:
        'charge-user.workflow for Payment with ID: e886183c-a917-4b53-9aff-8cbde0609e32',
    },
    {
      amountInUsd: 41.03,
      reason:
        'charge-user.workflow for Payment with ID: 1d34dd64-623c-4d64-ab59-b5c3eee14672',
    },
  ]) {
    try {
      const tx = await prepareTxToChargeNfsc(
        1,
        toAddress,
        amountInUsd,
        reason,
        '0x0',
      );

      if ('error' in tx) {
        logger.error('Error preparing transaction:', tx.error);
        continue;
      }

      let sendResult: TxSendResult;
      sendResult = await signAndSendTransaction(
        tx.preparedTx,
        1,
        120_000,
        gasPriceMultiplier,
      );
      console.log('Transaction sent:', sendResult);
    } catch (error) {
      logger.error({ error }, 'Error sending transaction:');
    }
  }
}

async function main1(): Promise<void> {
  const toAddress = '0xB5856d4598c919834913b8656ebc15a64d3C7836';

  const domains = [
    // 'learn.capital',
    // 'blockchainification.co',
    // 'blockchainification.app',
    // 'votingsecurities.com',
    '0x1006.click',
    'namefi-testing.click',
    '0x1008.click',
    '0x1003.click',
    '0x1005.click',
    '0x1014.click',
    '10001.click',
    '0xnamer.click',
    '0x911.click',
    '0x1010.click',
    '0x1012.click',
    '0x1002.click',
    'opencontributors.com',
    'd3testing.click',
  ];
  const res = await pMap(
    domains,
    async (domain) => {
      const details = await sldRegistrar.getDomainDetails(domain as any);

      return {
        id: `mint-namefi-nft-[${domain}]`,
        chainId: 8453,
        toAddress,
        normalizedDomainName: details.domainName,
        expirationTimeInSeconds: getUnixTime(details.expirationTime),
      };
    },
    { concurrency: 1 },
  );
  console.log(JSON.stringify(res, null, 4));
}

async function main() {
  const domains = await db
    .with(namefiNftCte)
    .select()
    .from(indexedDomainsTable)
    .leftJoin(
      namefiNftView,
      eq(
        namefiNftView.normalizedDomainName,
        indexedDomainsTable.normalizedDomainName,
      ),
    )
    .where(isNull(namefiNftView.tokenId));
  console.table(
    domains.map((domain) => ({
      name: domain.indexed_domains.normalizedDomainName,
      expirationTime: domain.indexed_domains.expirationTime,
    })),
  );
}

main1().catch((error) => {
  logger.error({ error }, 'Unhandled error in main:');
  process.exit(1);
});

// { "mintTransaction": { "txHash": "0xe9d6de5d4e4a1799a18f16884ccecab08152f82bd0a5d87e95a87b57464b45c6", "recordedAt": "2026-01-11T03:23:40.057Z" } }
// { "mintTransaction": { "txHash": "0xac32e918cbfb4c09e4cdfe11afb8caa9ca41e7fd2b1c6f7324f21c5f5dcf047c", "recordedAt": "2026-01-11T03:23:40.057Z" } }
// { "mintTransaction": { "txHash": "0xe65b6499177cc4bc96f4050fecc9408d8ec88271f60b38506d348b3b438c48f6", "recordedAt": "2026-01-11T03:23:40.057Z" } }
