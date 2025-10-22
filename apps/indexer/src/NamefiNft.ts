/** biome-ignore-all lint/suspicious/noConsole: we use console.log for logging */
import { ponder, type Context } from 'ponder:registry';
import schema from 'ponder:schema';
import {
  type Chain,
  createPublicClient,
  http,
  zeroAddress,
  type PublicClient,
} from 'viem';
import { filter, isNil, isNotNil } from 'ramda';
import { desc, eq, sql } from 'ponder';
import type { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import {
  chainById,
  alchemyUrlByChainId,
  startBlockByChainId,
} from './lib/consts';
import {
  getHistoricSetExpirationCallsBeforeEventAdded,
  type HistoricSetExpirationCall,
} from './lib/historic-data';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils';

// Helper function to fetch domain name from contract
async function fetchDomainName(
  client: Context['client'],
  contractAddress: `0x${string}`,
  abi: typeof NftAbi,
  tokenId: bigint,
): Promise<string | undefined> {
  try {
    const result = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'idToNormalizedDomainName',
      args: [tokenId],
    });
    return result as string;
  } catch (error) {
    // Log warning but don't fail - domain name resolution is optional
    // Note: In production, this should use a proper logger like pino
    // For now, using console.warn as it's the only available logging method
    console.warn(`Failed to fetch domain name for tokenId ${tokenId}:`, error);
    return undefined;
  }
}

// Helper function to fetch expiration date from contract
async function fetchExpirationDate(
  client: Context['client'],
  contractAddress: `0x${string}`,
  abi: typeof NftAbi,
  tokenId: bigint,
): Promise<bigint | undefined> {
  try {
    const result = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'getExpiration',
      args: [tokenId],
    });
    return result as bigint;
  } catch (error) {
    console.warn(`Failed to fetch expiration for tokenId ${tokenId}:`, error);
    return undefined;
  }
}

// Types for setup function
type TransferEvent = {
  tokenId: bigint;
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  blockNumber: bigint;
  blockTimestamp: bigint;
  transactionHash: `0x${string}`;
  isBurn: boolean;
};

type ExpirationChangeEvent = {
  tokenId: bigint;
  newExpiration: bigint;
  blockNumber: bigint;
  blockTimestamp: bigint;
  transactionHash: `0x${string}`;
  changedBy: `0x${string}`;
};

type SetupConfig = {
  chainId: number;
  fromBlock: bigint;
  toBlock: bigint;
  publicClient: PublicClient;
  contracts: Context['contracts'];
  context: Context;
};

// Helper function to setup block ranges and configuration
async function setupBlockRanges(context: Context): Promise<SetupConfig> {
  const {
    chain: { id: chainId },
    db,
    contracts,
  } = context;

  const chain = chainById[chainId] as Chain;
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(alchemyUrlByChainId[chainId]),
  });

  const latestBlock = await publicClient.getBlockNumber();
  const lastIndexedBlockQuery = await db.sql
    .select()
    .from(schema.NamefiNft)
    .where(eq(schema.NamefiNft.chainId, chainId))
    .orderBy(desc(schema.NamefiNft.lastUpdatedBlock))
    .limit(1)
    .execute();

  const contractSetupBlock =
    contracts.NamefiNft.startBlock === 'latest' ||
    isNil(contracts.NamefiNft.startBlock)
      ? latestBlock
      : BigInt(contracts.NamefiNft.startBlock);

  console.log(`Latest block: ${latestBlock}`);
  console.log(`Contract setup block: ${contractSetupBlock}`);
  console.log(
    `Last indexed block: ${lastIndexedBlockQuery[0]?.lastUpdatedBlock}`,
  );

  let toBlock = contractSetupBlock;
  let fromBlock = startBlockByChainId[chainId] ?? 0n;

  if (lastIndexedBlockQuery.length > 0) {
    const lastIndexedBlockNumber = lastIndexedBlockQuery[0]!.lastUpdatedBlock;

    if (contractSetupBlock > lastIndexedBlockNumber) {
      toBlock = contractSetupBlock;
      fromBlock = lastIndexedBlockNumber;
    } else {
      console.log(
        `Skipping indexing for chain ${chainId} from block ${lastIndexedBlockNumber} to block ${latestBlock} because it's too far behind`,
      );
      throw new Error('Already indexed');
    }
  }

  return {
    chainId,
    fromBlock,
    toBlock,
    publicClient,
    contracts,
    context,
  };
}

// Helper function to fetch all transfer events
async function getAllTransferEvents(
  config: SetupConfig,
): Promise<TransferEvent[]> {
  const { chainId, fromBlock, toBlock, publicClient, contracts } = config;
  const batchSize = 10_000_000n;
  const batchRanges = getBatchRanges(fromBlock, toBlock, batchSize);

  console.log(
    `Indexing NamefiNft for chain ${chainId} from block ${fromBlock} to block ${toBlock}`,
  );

  const transferEvents: TransferEvent[] = [];
  const blocksTimestamps = new Map<bigint, bigint>();

  let i = 0;
  for (const batch of batchRanges) {
    console.log(
      `Processing batch ${i + 1} of ${batchRanges.length} for chain ${chainId}`,
    );

    const events = await publicClient.getContractEvents({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      eventName: 'Transfer',
      fromBlock: batch.start,
      toBlock: batch.end,
    });

    console.log(
      `Found ${events.length} events for chain ${chainId} from block ${batch.start} to block ${batch.end}`,
    );

    for (const event of events) {
      const {
        args: { from, to, tokenId },
        blockNumber,
        transactionHash,
      } = event;

      if (!tokenId || !to || !from) {
        continue;
      }

      // Get block timestamp with caching
      let blockTimestamp = blocksTimestamps.get(blockNumber);
      if (isNil(blockTimestamp)) {
        const block = await publicClient.getBlock({ blockNumber });
        blocksTimestamps.set(blockNumber, block.timestamp);
        blockTimestamp = block.timestamp;
      }

      transferEvents.push({
        tokenId,
        fromAddress: from,
        toAddress: to,
        blockNumber,
        blockTimestamp,
        transactionHash,
        isBurn: to === zeroAddress,
      });
    }
    i++;
  }

  return transferEvents;
}

// Helper function to process ownership from transfer events
function processOwnership(
  transferEvents: TransferEvent[],
): Map<bigint, { ownerAddress: `0x${string}`; blockNumber: bigint }> {
  const nftToOwners = new Map<
    bigint,
    { ownerAddress: `0x${string}`; blockNumber: bigint }
  >();

  for (const event of transferEvents) {
    if (event.toAddress === zeroAddress) {
      // NFT was burned
      nftToOwners.delete(event.tokenId);
    } else {
      // NFT was transferred or minted
      nftToOwners.set(event.tokenId, {
        ownerAddress: event.toAddress,
        blockNumber: event.blockNumber,
      });
    }
  }

  return nftToOwners;
}

// Helper function to identify burn events
function identifyBurnEvents(transferEvents: TransferEvent[]): TransferEvent[] {
  return transferEvents.filter((event) => event.isBurn);
}

// Helper function to fetch all ExpirationChanged events
async function getAllExpirationChangeEvents(
  config: SetupConfig,
): Promise<ExpirationChangeEvent[]> {
  const { chainId, fromBlock, toBlock, publicClient, contracts } = config;
  const batchSize = 10_000_000n;
  const batchRanges = getBatchRanges(fromBlock, toBlock, batchSize);

  console.log(
    `Fetching ExpirationChanged events for chain ${chainId} from block ${fromBlock} to block ${toBlock}`,
  );

  const expirationChangeEvents: ExpirationChangeEvent[] = [];
  const blocksTimestamps = new Map<bigint, bigint>();

  let i = 0;
  for (const batch of batchRanges) {
    console.log(
      `Processing ExpirationChanged batch ${i + 1} of ${batchRanges.length} for chain ${chainId}`,
    );

    const events = await publicClient.getContractEvents({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      eventName: 'ExpirationChanged',
      fromBlock: batch.start,
      toBlock: batch.end,
    });

    console.log(
      `Found ${events.length} ExpirationChanged events for chain ${chainId} from block ${batch.start} to block ${batch.end}`,
    );

    for (const event of events) {
      const {
        args: { tokenId, newExpirationTime },
        blockNumber,
        transactionHash,
      } = event;

      if (!tokenId || !newExpirationTime) {
        continue;
      }

      // Get block timestamp with caching
      let blockTimestamp = blocksTimestamps.get(blockNumber);
      if (isNil(blockTimestamp)) {
        const block = await publicClient.getBlock({ blockNumber });
        blocksTimestamps.set(blockNumber, block.timestamp);
        blockTimestamp = block.timestamp;
      }

      // Get transaction to find who initiated the change
      const transaction = await publicClient.getTransaction({
        hash: transactionHash,
      });

      expirationChangeEvents.push({
        tokenId,
        newExpiration: newExpirationTime,
        blockNumber,
        blockTimestamp,
        transactionHash,
        changedBy: transaction.from,
      });
    }
    i++;
  }

  console.log(
    `Found ${expirationChangeEvents.length} total ExpirationChanged events for chain ${chainId}`,
  );

  return expirationChangeEvents;
}

// Helper function to fetch domain names with global memoization
async function fetchDomainNames(
  config: SetupConfig,
  allTokenIds: bigint[],
  burnEvents: TransferEvent[],
): Promise<Map<bigint, string>> {
  const { toBlock, publicClient, contracts } = config;
  const domainNameCache = new Map<bigint, string>();

  // First pass: fetch all domain names at latest block
  console.log(
    `Fetching domain names for ${allTokenIds.length} unique tokens at block ${toBlock}`,
  );

  const domainNames = await publicClient.multicall({
    contracts: allTokenIds.map((tokenId) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'idToNormalizedDomainName',
      args: [tokenId],
      blockNumber: toBlock,
    })),
  });

  // Store successful lookups
  allTokenIds.forEach((tokenId, index) => {
    const domainName = domainNames[index]?.result as unknown as string;
    if (domainName) {
      domainNameCache.set(tokenId, domainName);
    }
  });

  // Second pass: for burned tokens without names, fetch at burn block - 1
  const burnedTokensWithoutNames = burnEvents.filter(
    (event) => !domainNameCache.has(event.tokenId),
  );

  if (burnedTokensWithoutNames.length > 0) {
    console.log(
      `Fetching domain names for ${burnedTokensWithoutNames.length} burned tokens at their burn blocks`,
    );

    const burnedDomainNames = await Promise.all(
      burnedTokensWithoutNames.map(async (event) => {
        const domainName = await publicClient.readContract({
          address: contracts.NamefiNft.address,
          abi: contracts.NamefiNft.abi,
          functionName: 'idToNormalizedDomainName',
          args: [event.tokenId],
          blockNumber: event.blockNumber - 1n,
        });
        return domainName;
      }),
    );

    let successCount = 0;
    burnedTokensWithoutNames.forEach((event, index) => {
      const domainName = burnedDomainNames[index];
      if (domainName) {
        domainNameCache.set(event.tokenId, domainName);
        successCount++;
      } else {
        console.log(
          `Failed to fetch domain name for burned tokenId ${event.tokenId} at block ${event.blockNumber - 1n}`,
        );
      }
    });
    console.log(
      `Successfully fetched ${successCount} out of ${burnedTokensWithoutNames.length} burned token names`,
    );
  }

  console.log(`Total domain names cached: ${domainNameCache.size}`);
  return domainNameCache;
}

// Helper function to fetch expiration dates (block-specific)
// Returns two separate maps: one for active NFTs, one for burn events
async function fetchExpirationDates(
  config: SetupConfig,
  activeNfts: Array<
    [bigint, { ownerAddress: `0x${string}`; blockNumber: bigint }]
  >,
  burnEvents: TransferEvent[],
): Promise<{
  activeDomainsExpirations: Map<bigint, bigint>;
  burnedDomainsExpirations: Map<string, bigint>; // key: `${tokenId}-${burnBlockNumber}`
}> {
  const { toBlock, publicClient, contracts } = config;
  const activeExpirations = new Map<bigint, bigint>();
  const burnExpirations = new Map<string, bigint>();

  // Fetch expirations for active NFTs at current block
  if (activeNfts.length > 0) {
    console.log(
      `Fetching expirations for ${activeNfts.length} active NFTs at block ${toBlock}`,
    );

    const expirations = await publicClient.multicall({
      contracts: activeNfts.map(([tokenId]) => ({
        address: contracts.NamefiNft.address,
        abi: contracts.NamefiNft.abi,
        functionName: 'getExpiration',
        args: [tokenId],
        blockNumber: toBlock,
      })),
    });

    activeNfts.forEach(([tokenId], index) => {
      const expiration = expirations[index]?.result as unknown as bigint;
      if (expiration) {
        activeExpirations.set(tokenId, expiration);
      }
    });
  }

  // Fetch expirations for burned NFTs at their burn blocks
  // Each burn event gets its own expiration, keyed by tokenId + blockNumber
  if (burnEvents.length > 0) {
    console.log(
      `Fetching expirations for ${burnEvents.length} burned NFTs at their burn blocks`,
    );

    const burnExpirationsResults = await publicClient.multicall({
      contracts: burnEvents.map((event) => ({
        address: contracts.NamefiNft.address,
        abi: contracts.NamefiNft.abi,
        functionName: 'getExpiration',
        args: [event.tokenId],
        blockNumber: event.blockNumber - 1n, // Block before burn
      })),
    });

    burnEvents.forEach((event, index) => {
      const expiration = burnExpirationsResults[index]
        ?.result as unknown as bigint;
      if (expiration) {
        // Key by tokenId + blockNumber to handle multiple burns of same token
        const burnKey = `${event.tokenId}-${event.blockNumber}`;
        burnExpirations.set(burnKey, expiration);
      }
    });
  }

  return {
    activeDomainsExpirations: activeExpirations,
    burnedDomainsExpirations: burnExpirations,
  };
}

// Helper function to prepare NFT data for database
async function prepareNftData(
  config: SetupConfig,
  nftToOwners: Map<
    bigint,
    { ownerAddress: `0x${string}`; blockNumber: bigint }
  >,
  domainNames: Map<bigint, string>,
  activeExpirations: Map<bigint, bigint>,
): Promise<any[]> {
  const { chainId, toBlock, publicClient, contracts } = config;
  const nftToOwnersArray = Array.from(nftToOwners.entries());

  // Fetch lock status for all active NFTs
  const locked = await publicClient.multicall({
    contracts: nftToOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'isLocked',
      args: [tokenId],
      blockNumber: toBlock,
    })),
  });

  const data = filter(
    isNotNil,
    nftToOwnersArray.map(([tokenId, { ownerAddress }], index) => {
      const domainName = domainNames.get(tokenId);
      const expirationTimeInSeconds = activeExpirations.get(tokenId);
      const isLocked = locked[index]?.result as unknown as boolean;

      if (
        !domainName ||
        !expirationTimeInSeconds ||
        isLocked === undefined ||
        isLocked === null
      ) {
        console.log(`Skipping domain ${tokenId} - missing data`, {
          domainName,
          expirationTimeInSeconds,
          isLocked,
        });
        return null;
      }

      return {
        tokenId,
        normalizedDomainName: domainName,
        expirationTimeInSeconds,
        ownerAddress,
        chainId,
        lastUpdatedBlock: toBlock,
        lastUpdatedTimestamp: BigInt(Date.now()),
        isLocked,
      };
    }),
  );

  return data;
}

// Helper function to prepare transfer log data
function prepareTransferLogData(
  transferEvents: TransferEvent[],
  domainNames: Map<bigint, string>,
  chainId: number,
): any[] {
  return filter(
    isNotNil,
    transferEvents.map((event) => {
      const domainName = domainNames.get(event.tokenId);
      if (!domainName) {
        return null;
      }

      return {
        tokenId: event.tokenId,
        normalizedDomainName: domainName,
        fromAddress: event.fromAddress,
        toAddress: event.toAddress,
        chainId,
        blockNumber: event.blockNumber,
        blockTimestamp: event.blockTimestamp,
        transactionHash: event.transactionHash,
        isBurn: event.isBurn,
      };
    }),
  );
}

// Helper function to prepare burn log data
function prepareBurnLogData(
  burnEvents: TransferEvent[],
  domainNames: Map<bigint, string>,
  burnExpirations: Map<string, bigint>,
  chainId: number,
): any[] {
  console.log(`Preparing burn log data for ${burnEvents.length} burn events`);

  const results = filter(
    isNotNil,
    burnEvents.map((event) => {
      const domainName = domainNames.get(event.tokenId);
      // Use composite key: tokenId + blockNumber to get the correct expiration for this specific burn
      const burnKey = `${event.tokenId}-${event.blockNumber}`;
      const expirationTime = burnExpirations.get(burnKey) || 0n;

      if (!domainName) {
        console.log(
          `Skipping burn event for tokenId ${event.tokenId} at block ${event.blockNumber} - no domain name found`,
        );
        return null;
      }

      return {
        tokenId: event.tokenId,
        normalizedDomainName: domainName,
        fromAddress: event.fromAddress,
        chainId,
        burnedBlock: event.blockNumber,
        burnedTimestamp: event.blockTimestamp,
        transactionHash: event.transactionHash,
        expirationTimeAtBurn: expirationTime,
      };
    }),
  );

  console.log(
    `Successfully prepared ${results.length} burn log entries out of ${burnEvents.length} burn events`,
  );
  return results;
}

// Helper function to prepare expiration change log data
function prepareExpirationChangeLogData(
  expirationChangeEvents: ExpirationChangeEvent[],
  historicSetExpirationCalls: HistoricSetExpirationCall[],
  domainNames: Map<bigint, string>,
  chainId: number,
): any[] {
  console.log(
    `Preparing expiration change log data for ${expirationChangeEvents.length} events`,
  );

  // Sort events by tokenId and blockNumber to track previous values
  type EnrichedExpirationChangeEvent = ExpirationChangeEvent & {
    source: string;
    prevFromSource?: bigint;
  };
  const sortedEvents: EnrichedExpirationChangeEvent[] = [
    ...historicSetExpirationCalls.map((call) => ({
      tokenId: BigInt(call.tokenId),
      newExpiration: call.newExpirationTime,
      blockNumber: call.blockNumber,
      blockTimestamp: BigInt(call.blockTimestamp),
      transactionHash: call.transactionHash as `0x${string}`,
      changedBy: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
      source: call.source,
      prevFromSource: call.previousExpirationTime,
    })),
    ...expirationChangeEvents.map((event) => ({
      ...event,
      source: 'event',
      prevFromSource: undefined,
    })),
  ].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber < b.blockNumber ? -1 : 1;
    }
    return 0;
  });

  // Track the previous expiration for each token
  const tokenPreviousExpiration = new Map<bigint, bigint>();

  const results = filter(
    isNotNil,
    sortedEvents.map((event) => {
      const domainName = domainNames.get(event.tokenId);

      if (!domainName) {
        console.log(
          `Skipping expiration change event for tokenId ${event.tokenId} - no domain name found`,
        );
        return null;
      }

      // Get previous expiration (either from our tracking or assume 0n for first change)
      const previousExpiration =
        tokenPreviousExpiration.get(event.tokenId) ??
        event.prevFromSource ??
        0n;

      // Update tracking for next event
      tokenPreviousExpiration.set(event.tokenId, event.newExpiration);

      return {
        tokenId: event.tokenId,
        normalizedDomainName: domainName,
        previousExpiration,
        newExpiration: event.newExpiration,
        changedBy: event.changedBy,
        chainId,
        blockNumber: event.blockNumber,
        blockTimestamp: event.blockTimestamp,
        transactionHash: event.transactionHash,
        source: event.source,
      };
    }),
  );

  console.log(
    `Successfully prepared ${results.length} expiration change log entries`,
  );
  return results;
}

// Main setup function - now clean and organized
ponder.on('NamefiNft:setup', async ({ context }) => {
  const start = Date.now();
  const {
    chain: { id: chainId },
    db,
  } = context;

  try {
    // 1. Setup configuration and block ranges
    const config = await setupBlockRanges(context);

    // 2. Fetch all events in parallel
    const [transferEvents, expirationChangeEvents, historicSetExpirationCalls] =
      await Promise.all([
        getAllTransferEvents(config),
        getAllExpirationChangeEvents(config),
        getHistoricSetExpirationCallsBeforeEventAdded({ chainId }),
      ]);

    // 3. Process ownership to get final NFT state
    const nftToOwners = processOwnership(transferEvents);
    console.log(`Found ${nftToOwners.size} active NFTs for chain ${chainId}`);

    // 4. Identify burn events
    const burnEvents = identifyBurnEvents(transferEvents);
    console.log(`Found ${burnEvents.length} burn events for chain ${chainId}`);

    // 5. Get all unique tokenIds for domain name fetching
    const allUniqueTokenIds = [
      ...new Set([
        ...Array.from(nftToOwners.keys()),
        ...transferEvents.map((e) => e.tokenId),
        ...expirationChangeEvents.map((e) => e.tokenId),
      ]),
    ];

    // 6. Fetch domain names with global memoization
    const domainNameMap = await fetchDomainNames(
      config,
      allUniqueTokenIds,
      burnEvents,
    );

    // 7. Fetch expiration dates (block-specific)
    const { activeDomainsExpirations, burnedDomainsExpirations } =
      await fetchExpirationDates(
        config,
        Array.from(nftToOwners.entries()),
        burnEvents,
      );

    // 8. Prepare data for each table
    const nftData = await prepareNftData(
      config,
      nftToOwners,
      domainNameMap,
      activeDomainsExpirations,
    );

    const transferLogData = prepareTransferLogData(
      transferEvents,
      domainNameMap,
      chainId,
    );

    const burnLogData = prepareBurnLogData(
      burnEvents,
      domainNameMap,
      burnedDomainsExpirations,
      chainId,
    );

    const expirationChangeLogData = prepareExpirationChangeLogData(
      expirationChangeEvents,
      historicSetExpirationCalls ?? [],
      domainNameMap,
      chainId,
    );

    // 9. Insert data into database
    if (nftData.length > 0) {
      console.log(`Inserting ${nftData.length} domains for chain ${chainId}`);
      await db.sql
        .insert(schema.NamefiNft)
        .values(nftData)
        .onConflictDoUpdate({
          target: [schema.NamefiNft.tokenId, schema.NamefiNft.chainId],
          set: {
            expirationTimeInSeconds: sql.raw(
              'excluded.expiration_time_in_seconds',
            ),
            ownerAddress: sql.raw('excluded.owner_address'),
            lastUpdatedBlock: sql.raw('excluded.last_updated_block'),
            lastUpdatedTimestamp: sql.raw('excluded.last_updated_timestamp'),
            isLocked: sql.raw('excluded.is_locked'),
          },
        });
    }

    if (transferLogData.length > 0) {
      console.log(
        `Inserting ${transferLogData.length} transfer events for chain ${chainId}`,
      );
      await db.sql
        .insert(schema.TransferLog)
        .values(transferLogData)
        .onConflictDoNothing();
    }

    if (burnLogData.length > 0) {
      console.log(
        `Inserting ${burnLogData.length} burn events for chain ${chainId}`,
      );
      await db.sql
        .insert(schema.BurnedNamefiNftLog)
        .values(burnLogData)
        .onConflictDoNothing();
    }

    if (expirationChangeLogData.length > 0) {
      console.log(
        `Inserting ${expirationChangeLogData.length} expiration change events for chain ${chainId}`,
      );
      await db.sql
        .insert(schema.ExpirationChangeLog)
        .values(expirationChangeLogData)
        .onConflictDoNothing();
    }

    console.log(
      `Indexed ${nftData.length} domains, ${transferLogData.length} transfers, ${burnLogData.length} burns, ${expirationChangeLogData.length} expiration changes for chain ${chainId} in ${Date.now() - start}ms`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Already indexed') {
      // This is expected when we're already up to date
      return;
    }
    throw error;
  }
});

// Main Transfer event handler - this captures all ownership changes
ponder.on('NamefiNft:Transfer', async ({ event, context }) => {
  const {
    block,
    args: { from, to, tokenId },
    transaction,
  } = event;

  const chainId = context.chain.id;
  const isBurn = to === zeroAddress;

  // For burns, fetch data from the database before deletion
  // For other transfers, fetch from contract
  let domainName = '';
  let expirationTimeInSeconds = 0n;

  if (isBurn) {
    // For burns, get data from database before deletion
    try {
      const domain = await context.db.find(schema.NamefiNft, {
        tokenId,
        chainId,
      });
      domainName = domain?.normalizedDomainName || '';
      expirationTimeInSeconds = domain?.expirationTimeInSeconds || 0n;
    } catch (error) {
      console.warn(
        `Failed to fetch domain for burn logging: tokenId ${tokenId}`,
        error,
      );
    }
  } else {
    // For regular transfers, fetch from contract
    domainName =
      (await fetchDomainName(
        context.client,
        event.log.address,
        context.contracts.NamefiNft.abi,
        tokenId,
      )) || '';

    expirationTimeInSeconds =
      (await fetchExpirationDate(
        context.client,
        event.log.address,
        context.contracts.NamefiNft.abi,
        tokenId,
      )) || 0n;
  }

  // Log ALL transfers to TransferLog
  if (domainName && from && to) {
    await context.db
      .insert(schema.TransferLog)
      .values({
        tokenId,
        normalizedDomainName: domainName,
        fromAddress: from,
        toAddress: to,
        chainId,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
        transactionHash: transaction.hash,
        isBurn,
      })
      .onConflictDoNothing();

    console.log(
      `Logged transfer event for domain ${domainName} (tokenId: ${tokenId}) from ${from} to ${to} on chain ${chainId}`,
    );
  }

  // Handle burning (transfer to zero address)
  if (isBurn) {
    // Log the burn event with expiration time
    if (domainName && from && from !== zeroAddress) {
      await context.db
        .insert(schema.BurnedNamefiNftLog)
        .values({
          tokenId,
          normalizedDomainName: domainName,
          fromAddress: from,
          chainId,
          burnedBlock: block.number,
          burnedTimestamp: block.timestamp,
          transactionHash: transaction.hash,
          expirationTimeAtBurn: expirationTimeInSeconds,
        })
        .onConflictDoNothing();

      console.log(
        `Logged burn event for domain ${domainName} (tokenId: ${tokenId}) on chain ${chainId}`,
      );
    }

    // Delete the NFT from the main table as before
    await context.db.delete(schema.NamefiNft, {
      tokenId,
      chainId,
    });
    return;
  }

  // Create or update domain record
  await context.db
    .insert(schema.NamefiNft)
    .values({
      tokenId,
      normalizedDomainName: domainName || '',
      expirationTimeInSeconds,
      isLocked: false, // Default to unlocked
      ownerAddress: to,
      chainId,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    })
    .onConflictDoUpdate({
      normalizedDomainName: domainName || '',
      expirationTimeInSeconds,
      ownerAddress: to,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    });
});

ponder.on('NamefiNft:ExpirationChanged', async ({ event, context }) => {
  const {
    block,
    args: { tokenId, newExpirationTime },
    transaction,
  } = event;
  const chainId = context.chain.id;

  // Fetch the current domain data to get the previous expiration and domain name
  let previousExpiration = 0n;
  let domainName = '';

  try {
    const domain = await context.db.find(schema.NamefiNft, {
      tokenId,
      chainId,
    });
    previousExpiration = domain?.expirationTimeInSeconds || 0n;
    domainName = domain?.normalizedDomainName || '';
  } catch (error) {
    console.warn(
      `Failed to fetch previous expiration for tokenId ${tokenId}`,
      error,
    );
  }

  // Log the expiration change event
  if (domainName && previousExpiration !== newExpirationTime) {
    await context.db
      .insert(schema.ExpirationChangeLog)
      .values({
        tokenId,
        normalizedDomainName: domainName,
        previousExpiration,
        newExpiration: newExpirationTime,
        changedBy: transaction.from, // The address that initiated the transaction
        chainId,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
        transactionHash: transaction.hash,
        source: 'event',
      })
      .onConflictDoNothing();

    console.log(
      `Logged expiration change for domain ${domainName} (tokenId: ${tokenId}) from ${previousExpiration} to ${newExpirationTime} on chain ${chainId}`,
    );
  }

  // Update the expiration in the main table
  try {
    await context.db.update(schema.NamefiNft, { tokenId, chainId }).set({
      expirationTimeInSeconds: newExpirationTime,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    });
  } catch (error) {
    console.error('Error updating expiration time', {
      tokenId: tokenId.toString(),
      chainId,
      newExpirationTime: newExpirationTime.toString(),
      error,
    });
    throw error;
  }
});

// Lock/Unlock handlers - now tracking lock status

ponder.on('NamefiNft:Lock', async ({ event, context }) => {
  const {
    block,
    args: { tokenId },
  } = event;
  const chainId = context.chain.id;
  let domainName = '';
  try {
    const domain = await context.db.find(schema.NamefiNft, {
      tokenId,
      chainId,
    });
    domainName = domain?.normalizedDomainName || '';
  } catch (error) {
    console.error('Error fetching domain name', error);
  }
  console.log('Lock', {
    domainName,
    tokenId,
    chainId,
  });

  // Update the lock status
  await context.db.update(schema.NamefiNft, { tokenId, chainId }).set({
    isLocked: true,
    lastUpdatedBlock: block.number,
    lastUpdatedTimestamp: block.timestamp,
  });
});

ponder.on('NamefiNft:Unlock', async ({ event, context }) => {
  const {
    block,
    args: { tokenId },
  } = event;
  const chainId = context.chain.id;

  let domainName = '';
  try {
    const domain = await context.db.find(schema.NamefiNft, {
      tokenId,
      chainId,
    });
    domainName = domain?.normalizedDomainName || '';
  } catch (error) {
    console.error('Error fetching domain name', error);
  }
  console.log('Unlock', {
    domainName,
    tokenId,
    chainId,
  });

  // Update the lock status
  await context.db.update(schema.NamefiNft, { tokenId, chainId }).set({
    isLocked: false,
    lastUpdatedBlock: block.number,
    lastUpdatedTimestamp: block.timestamp,
  });
});

/*
 * Note: The following function calls are NOT handled separately because:
 *
 * 1. Mint functions (safeMintByNameNoCharge, safeMintByNameWithCharge):
 *    - These internally call the Transfer event (from 0x0 to recipient)
 *    - Ponder automatically captures the Transfer event, so we get all the data we need
 *    - No additional processing required as Transfer handler covers ownership changes
 *
 * 2. Burn functions (burnByName):
 *    - These internally call the Transfer event (from owner to 0x0)
 *    - Ponder automatically captures the Transfer event
 *    - Our Transfer handler already handles burning (deletes the domain record)
 *
 * 3. Lock/Unlock ByName functions (lockByName, unlockByName):
 *    - These call lock and unlock internally
 *    - Ponder automatically captures the lock/unlock calls
 *    - Our lock/unlock handlers update the isLocked status
 *
 * 4. Transfer functions (safeTransferFromByName):
 *    - These internally call the standard Transfer event
 *    - Ponder captures the Transfer event automatically
 *    - No additional processing needed
 *
 * This DRY approach ensures we don't duplicate logic and rely on Ponder's automatic
 * event detection from internal contract calls.
 */

function getBatchRanges(
  fromBlock: bigint,
  toBlock: bigint,
  batchSize: bigint,
): { start: bigint; end: bigint }[] {
  const batchRanges: { start: bigint; end: bigint }[] = [];
  while (true) {
    const previousRangeEnd = batchRanges[batchRanges.length - 1]?.end;
    const batchStart: bigint = isNotNil(previousRangeEnd)
      ? previousRangeEnd + 1n
      : fromBlock;
    const virtualBatchEnd = batchStart + batchSize;
    const actualBatchEnd =
      virtualBatchEnd > toBlock ? toBlock : virtualBatchEnd;
    batchRanges.push({
      start: batchStart,
      end: actualBatchEnd,
    });
    if (actualBatchEnd >= toBlock) {
      break;
    }
  }
  return batchRanges;
}
