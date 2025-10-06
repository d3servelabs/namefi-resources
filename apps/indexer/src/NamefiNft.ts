/** biome-ignore-all lint/suspicious/noConsole: we use console.log for logging */
import { ponder, type Context } from 'ponder:registry';
import schema from 'ponder:schema';
import { type Chain, createPublicClient, http, zeroAddress } from 'viem';
import { mainnet, base, sepolia } from 'viem/chains';
import { filter, isNil, isNotNil } from 'ramda';
import { desc, eq, sql } from 'ponder';
import type { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';

const chainsByChainId: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [sepolia.id]: sepolia,
};

const chainIdToAlchemyUrl: Record<number, string> = {
  [mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [base.id]: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

const chainIdToStartBlock: Record<number, bigint> = {
  [mainnet.id]: 19059949n, // Adjust based on when contract was deployed
  [base.id]: 11750288n, // Adjust based on when contract was deployed
  [sepolia.id]: 5129892n, // Adjust based on when contract was deployed
};

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

ponder.on('NamefiNft:setup', async ({ context }) => {
  const start = Date.now();
  const {
    chain: { id: chainId },
    db,
    contracts,
    client,
  } = context;

  const chain = chainsByChainId[chainId] as Chain;
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(chainIdToAlchemyUrl[chainId]),
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
  let fromBlock = chainIdToStartBlock[chainId] ?? 0n;

  if (lastIndexedBlockQuery.length > 0) {
    const lastIndexedBlockNumber = lastIndexedBlockQuery[0]!.lastUpdatedBlock;

    if (contractSetupBlock > lastIndexedBlockNumber) {
      toBlock = contractSetupBlock;
      fromBlock = lastIndexedBlockNumber;
    } else {
      console.log(
        `Skipping indexing for chain ${chainId} from block ${lastIndexedBlockNumber} to block ${latestBlock} because it's too far behind`,
      );
      return;
    }
  }
  const batchSize = 10_000_000n;
  const batchRanges = getBatchRanges(fromBlock, toBlock, batchSize);

  console.log(
    `Indexing NamefiNft for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} `,
  );

  const nftToOwners = new Map<
    bigint,
    { ownerAddress: `0x${string}`; blockNumber: bigint }
  >();

  // Track burn events for historical logging
  const burnEvents: Array<{
    tokenId: bigint;
    fromAddress: `0x${string}`;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: `0x${string}`;
  }> = [];

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
    const blocksTimestamps = new Map<bigint, bigint>();

    for (const event of events) {
      const {
        args: { from, to, tokenId },
        blockNumber,
        transactionHash,
      } = event;
      if (!tokenId || !to) {
        continue;
      }
      if (to === zeroAddress) {
        // This is a burn event - track it
        if (from && from !== zeroAddress) {
          // Get block timestamp for the burn event
          let blockTimestamp = blocksTimestamps.get(blockNumber);
          if (isNil(blockTimestamp)) {
            const block = await publicClient.getBlock({ blockNumber });
            blocksTimestamps.set(blockNumber, block.timestamp);
            blockTimestamp = block.timestamp;
          }
          burnEvents.push({
            tokenId,
            fromAddress: from,
            blockNumber,
            blockTimestamp,
            transactionHash,
          });
        }
        nftToOwners.delete(tokenId);
      } else {
        nftToOwners.set(tokenId, {
          ownerAddress: to,
          blockNumber: blockNumber,
        });
      }
    }
    i++;
  }
  console.log(
    `Found ${nftToOwners.size} NFTs for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock}`,
  );
  const nftToOwnersArray = Array.from(nftToOwners.entries());
  const expirationDates = await publicClient.multicall({
    contracts: nftToOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'getExpiration',
      args: [tokenId],
      blockNumber: toBlock, // from latest block
    })),
  });
  const domainNames = await publicClient.multicall({
    contracts: nftToOwnersArray.map(([tokenId, { blockNumber }]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'idToNormalizedDomainName',
      args: [tokenId],
      blockNumber: blockNumber, // idToNormalizedDomainName doesn't work with expired domains so you need to get historic data
    })),
  });
  const locked = await publicClient.multicall({
    contracts: nftToOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'isLocked',
      args: [tokenId],
      blockNumber: toBlock, // from latest block
    })),
  });

  const data = filter(
    isNotNil,
    nftToOwnersArray.map(([tokenId, { ownerAddress, blockNumber }], index) => {
      const domainName = domainNames[index]?.result as unknown as string;
      const expirationTimeInSeconds = expirationDates[index]
        ?.result as unknown as bigint;
      const isLocked = locked[index]?.result as unknown as boolean;
      if (
        !domainName ||
        !expirationTimeInSeconds ||
        isLocked === undefined ||
        isLocked === null
      ) {
        console.log(
          `Skipping domain ${tokenId} for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} because it has no domain name or expiration date or is locked`,
          {
            normalizedDomainName: domainName,
            expirationTimeInSeconds: expirationTimeInSeconds,
            isLocked,
          },
        );
        return null;
      }
      return {
        tokenId,
        normalizedDomainName: domainName,
        expirationTimeInSeconds: expirationTimeInSeconds,
        ownerAddress,
        chainId,
        lastUpdatedBlock: toBlock,
        lastUpdatedTimestamp: BigInt(Date.now()),
        isLocked,
      };
    }),
  );

  if (data.length <= 0) {
    console.log(
      `No domains found for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock}`,
    );
    throw new Error(
      `No domains found for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock}`,
    );
  }
  console.log(
    `Inserting ${data.length} domains for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock}`,
  );
  await context.db.sql
    .insert(schema.NamefiNft)
    .values(data)
    .onConflictDoUpdate({
      target: [schema.NamefiNft.tokenId, schema.NamefiNft.chainId],
      set: {
        expirationTimeInSeconds: sql.raw('excluded.expiration_time_in_seconds'),
        ownerAddress: sql.raw('excluded.owner_address'),
        lastUpdatedBlock: sql.raw('excluded.last_updated_block'),
        lastUpdatedTimestamp: sql.raw('excluded.last_updated_timestamp'),
        isLocked: sql.raw('excluded.is_locked'),
      },
    });

  // Process and insert burn events if any
  if (burnEvents.length > 0) {
    console.log(
      `Processing ${burnEvents.length} burn events for chain ${chainId}`,
    );

    // Fetch domain names for burned tokens using multicall
    const burnedDomainNames = await Promise.all(
      burnEvents.map(({ tokenId, blockNumber: burnBlockNumber }) => {
        return publicClient.readContract({
          address: contracts.NamefiNft.address,
          abi: contracts.NamefiNft.abi,
          functionName: 'idToNormalizedDomainName',
          args: [tokenId],
          blockNumber: burnBlockNumber - 1n, // Get domain name from the block before burning
        });
      }),
    );

    const burnData = filter(
      isNotNil,
      burnEvents.map((burnEvent, index) => {
        const domainName = burnedDomainNames[index];
        if (!domainName) {
          console.log(
            `Skipping burn event for tokenId ${burnEvent.tokenId} - no domain name found`,
            {
              domainName,
              tokenId: burnEvent.tokenId,
              blockNumber: burnEvent.blockNumber,
              burnedDomainNames: burnedDomainNames[index],
            },
          );
          return null;
        }
        return {
          tokenId: burnEvent.tokenId,
          normalizedDomainName: domainName,
          fromAddress: burnEvent.fromAddress,
          chainId,
          burnedBlock: burnEvent.blockNumber,
          burnedTimestamp: burnEvent.blockTimestamp,
          transactionHash: burnEvent.transactionHash,
        };
      }),
    );

    if (burnData.length > 0) {
      console.log(
        `Inserting ${burnData.length} burn events for chain ${chainId}`,
      );
      await context.db.sql
        .insert(schema.BurnedNamefiNftLog)
        .values(burnData)
        .onConflictDoNothing(); // Skip if already logged
    }
  }

  console.log(
    `Indexed ${data.length} domains for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} in ${Date.now() - start}ms`,
  );
});

// Main Transfer event handler - this captures all ownership changes
ponder.on('NamefiNft:Transfer', async ({ event, context }) => {
  const {
    block,
    args: { from, to, tokenId },
    transaction,
  } = event;

  const chainId = context.chain.id;

  // Handle burning (transfer to zero address)
  if (to === zeroAddress) {
    // First, fetch the domain name before deletion
    let domainName = '';
    try {
      const domain = await context.db.find(schema.NamefiNft, {
        tokenId,
        chainId,
      });
      domainName = domain?.normalizedDomainName || '';
    } catch (error) {
      console.warn(
        `Failed to fetch domain for burn logging: tokenId ${tokenId}`,
        error,
      );
    }

    // Log the burn event if we have the domain name and a valid from address
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
        })
        .onConflictDoNothing(); // Skip if already logged

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

  // Fetch domain name and expiration from contract
  const domainName = await fetchDomainName(
    context.client,
    event.log.address,
    context.contracts.NamefiNft.abi,
    tokenId,
  );

  const expirationTimeInSeconds = await fetchExpirationDate(
    context.client,
    event.log.address,
    context.contracts.NamefiNft.abi,
    tokenId,
  );

  // Create or update domain record
  await context.db
    .insert(schema.NamefiNft)
    .values({
      tokenId,
      normalizedDomainName: domainName || '',
      expirationTimeInSeconds: expirationTimeInSeconds || 0n,
      isLocked: false, // Default to unlocked
      ownerAddress: to,
      chainId,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    })
    .onConflictDoUpdate({
      normalizedDomainName: domainName || '',
      expirationTimeInSeconds: expirationTimeInSeconds || 0n,
      ownerAddress: to,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    });
});

ponder.on('NamefiNft:ExpirationChanged', async ({ event, context }) => {
  const {
    block,
    args: { tokenId, newExpirationTime },
  } = event;
  const chainId = context.chain.id;

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
