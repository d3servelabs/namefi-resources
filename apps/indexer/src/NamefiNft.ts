import { ponder } from 'ponder:registry';
import schema from 'ponder:schema';
import {
  type Chain,
  createPublicClient,
  decodeFunctionData,
  http,
  zeroAddress,
} from 'viem';
import { mainnet, base, sepolia } from 'viem/chains';
import { filter, isNil, isNotNil } from 'ramda';
import { and, desc, eq, sql } from 'ponder';

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
  client: any,
  contractAddress: string,
  abi: any,
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
  client: any,
  contractAddress: string,
  abi: any,
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
    .from(schema.DomainNft)
    .where(eq(schema.DomainNft.chainId, chainId))
    .orderBy(desc(schema.DomainNft.lastUpdatedBlock))
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
  const batchCount = BigInt(
    Math.max(1, Math.ceil(Number((toBlock - fromBlock) / batchSize))),
  );

  console.log(
    `Indexing NamefiNft for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} `,
  );

  const nftOwners = new Map<bigint, string>();

  for (let i = 0; i < Number(batchCount); i++) {
    console.log(`Processing batch ${i} of ${batchCount} for chain ${chainId}`);
    const batchStart =
      BigInt(i) * batchSize + (chainIdToStartBlock[chainId] ?? 0n);
    const batchEnd = BigInt(
      Math.min(Number(batchStart + batchSize), Number(toBlock)),
    );
    const events = await publicClient.getContractEvents({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      eventName: 'Transfer',
      fromBlock: batchStart,
      toBlock: batchEnd,
    });
    console.log(
      `Found ${events.length} events for chain ${chainId} from block ${batchStart} to block ${batchEnd}`,
    );
    for (const event of events) {
      const {
        args: { to, tokenId },
      } = event;
      if (!to || !tokenId) {
        continue;
      }
      if (to === zeroAddress) {
        nftOwners.delete(tokenId);
      } else {
        nftOwners.set(tokenId, to);
      }
    }
  }
  console.log(
    `Found ${nftOwners.size} unique NFT owners for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock}`,
  );
  const nftOwnersArray = Array.from(nftOwners.entries());
  const expirationDates = await publicClient.multicall({
    contracts: nftOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'getExpiration',
      args: [tokenId],
      blockNumber: toBlock,
    })),
  });
  const domainNames = await publicClient.multicall({
    contracts: nftOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'idToNormalizedDomainName',
      args: [tokenId],
      blockNumber: toBlock,
    })),
  });
  const locked = await publicClient.multicall({
    contracts: nftOwnersArray.map(([tokenId]) => ({
      address: contracts.NamefiNft.address,
      abi: contracts.NamefiNft.abi,
      functionName: 'isLocked',
      args: [tokenId],
      blockNumber: toBlock,
    })),
  });

  const data = filter(
    isNotNil,
    nftOwnersArray.map(([tokenId, owner], index) => {
      const domainName = domainNames[index]?.result as unknown as string;
      const expirationDate = expirationDates[index]
        ?.result as unknown as bigint;
      const isLocked = locked[index]?.result as unknown as boolean;
      if (
        !domainName ||
        !expirationDate ||
        isLocked === undefined ||
        isLocked === null
      ) {
        console.log(
          `Skipping domain ${tokenId} for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} because it has no domain name or expiration date or is locked`,
          {
            domainName,
            expirationDate,
            isLocked,
          },
        );
        return null;
      }
      return {
        tokenId,
        domainName,
        expirationDate,
        ownerAddress: owner,
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
    .insert(schema.DomainNft)
    .values(data)
    .onConflictDoUpdate({
      target: [schema.DomainNft.tokenId, schema.DomainNft.chainId],
      set: {
        expirationDate: sql.raw('excluded.expiration_date'),
        ownerAddress: sql.raw('excluded.owner_address'),
        lastUpdatedBlock: sql.raw('excluded.last_updated_block'),
        lastUpdatedTimestamp: sql.raw('excluded.last_updated_timestamp'),
        isLocked: sql.raw('excluded.is_locked'),
      },
    });
  console.log(
    `Indexed ${data.length} domains for chain ${chainId} from block ${chainIdToStartBlock[chainId]} to block ${toBlock} in ${Date.now() - start}ms`,
  );
});

// Main Transfer event handler - this captures all ownership changes
ponder.on('NamefiNft:Transfer', async ({ event, context }) => {
  const {
    block,
    args: { to, tokenId },
  } = event;

  const chainId = context.chain.id;

  // Handle burning (transfer to zero address)
  if (to === zeroAddress) {
    await context.db.delete(schema.DomainNft, {
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

  const expirationDate = await fetchExpirationDate(
    context.client,
    event.log.address,
    context.contracts.NamefiNft.abi,
    tokenId,
  );

  // Create or update domain record
  await context.db
    .insert(schema.DomainNft)
    .values({
      tokenId,
      domainName: domainName || '',
      expirationDate: expirationDate || 0n,
      isLocked: false, // Default to unlocked
      ownerAddress: to,
      chainId,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    })
    .onConflictDoUpdate({
      domainName: domainName || '',
      expirationDate: expirationDate || 0n,
      ownerAddress: to,
      lastUpdatedBlock: block.number,
      lastUpdatedTimestamp: block.timestamp,
    });
});

ponder.on('NamefiNftAccount:transaction:to', async ({ event, context }) => {
  const { transaction, block } = event;
  const chainId = (context.chain as any).id;
  const { to, from, value, input } = transaction;
  const { functionName, args } = decodeFunctionData({
    abi: context.contracts.NamefiNft.abi,
    data: input,
  });
  console.log('Transaction', {
    to,
    from,
    value,
    functionName,
    args,
    chainId,
  });

  if (functionName === 'setExpiration') {
    const [tokenId, expirationTime] = args;
    await updateExpirationDate(context, tokenId, block, chainId);
    return;
  }
  if (
    functionName === 'extendByNameWithCharge' ||
    functionName === 'extendByNameWithChargeAmount'
  ) {
    const [domainName] = args;
    const domains = await context.db.sql
      .select()
      .from(schema.DomainNft)
      .where(
        and(
          eq(schema.DomainNft.domainName, domainName),
          eq(schema.DomainNft.chainId, chainId),
        ),
      )
      .limit(1)
      .execute();
    const domain = domains[0];
    if (!domain) {
      console.log('Domain not found', { domainName, chainId });
      return;
    }

    await updateExpirationDate(context, domain.tokenId, block, chainId);
    return;
  }
});

async function updateExpirationDate(
  context: any,
  tokenId: bigint,
  block: any,
  chainId: number,
) {
  const expirationTime = await context.client.readContract({
    address: context.contracts.NamefiNft.address,
    abi: context.contracts.NamefiNft.abi,
    functionName: 'getExpiration',
    args: [tokenId],
  });
  await context.db.update(schema.DomainNft, { tokenId, chainId }).set({
    expirationDate: expirationTime,
    lastUpdatedBlock: block.number,
    lastUpdatedTimestamp: block.timestamp,
  });
}

// // Expiration updates - important for tracking domain lifecycle
// ponder.on('NamefiNft.setExpiration()', async ({ event, context }) => {
//   const {
//     block,
//     args: [tokenId, expirationTime],
//   } = event;
//   const chainId = context.chain.id;

//   // Update the expiration date in the domain record
//   await context.db.update(schema.DomainNft, { tokenId, chainId }).set({
//     expirationDate: expirationTime,
//     lastUpdatedBlock: block.number,
//     lastUpdatedTimestamp: block.timestamp,
//   });
// });

// Lock/Unlock handlers - now tracking lock status
ponder.on('NamefiNft:Lock', async ({ event, context }) => {
  const {
    block,
    args: { tokenId },
  } = event;
  const chainId = context.chain.id;
  let domainName = '';
  try {
    const domain = await context.db.find(schema.DomainNft, {
      tokenId,
      chainId,
    });
    domainName = domain?.domainName || '';
  } catch (error) {
    console.error('Error fetching domain name', error);
  }
  console.log('Lock', {
    domainName,
    tokenId,
    chainId,
  });

  // Update the lock status
  await context.db.update(schema.DomainNft, { tokenId, chainId }).set({
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
    const domain = await context.db.find(schema.DomainNft, {
      tokenId,
      chainId,
    });
    domainName = domain?.domainName || '';
  } catch (error) {
    console.error('Error fetching domain name', error);
  }
  console.log('Unlock', {
    domainName,
    tokenId,
    chainId,
  });

  // Update the lock status
  await context.db.update(schema.DomainNft, { tokenId, chainId }).set({
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
