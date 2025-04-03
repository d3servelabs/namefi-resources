import { db } from '@namefi-astra/db';
import { namefiNftTable } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
import superjson from 'superjson';
// Indexer for Namefi NFT activities
import { type Address, type Chain, keccak256, toBytes } from 'viem';
import { base, mainnet } from 'viem/chains';
import { NftAbi, chainsToUrls } from './helpers/contracts';

// Type definition for normalized domain
type NamefiNormalizedDomain = string;

// Type for domain owner update result
interface DomainOwnerUpdate {
  domainName?: NamefiNormalizedDomain;
  tokenId: bigint;
  currentOwner: Address;
  chain: Chain;
  blockNumber: bigint;
}

// Same address for both base and ethereum
const NAMEFI_NFT_CONTRACT_ADDRESS =
  '0x0000000000cf80e7cf8fa4480907f692177f8e06';

/**
 * Get domain name owner updates between blocks
 * @param contractAddress The NFT contract address
 * @param chainId The blockchain network ID (1=mainnet, 11155111=sepolia, 8453=base)
 * @param fromBlock The starting block to query from
 * @param toBlock The ending block to query to (optional, defaults to latest block)
 * @returns Array of domain name and owner updates
 */
export async function getDomainNameOwnerUpdate(
  chain: Chain,
  fromBlock = 0n,
  toBlock?: bigint,
): Promise<DomainOwnerUpdate[]> {
  // Import dynamically to avoid TypeScript issues
  const { createPublicClient, http } = await import('viem');

  // Create client to interact with blockchain
  const publicClient = createPublicClient({
    chain,
    transport: http(chainsToUrls(chain)),
  });

  try {
    // Get Transfer events between specified blocks
    console.debug(
      'Getting transfer events from block',
      fromBlock,
      'to block',
      toBlock,
    );

    const latestBlock: bigint = toBlock
      ? BigInt(toBlock)
      : await publicClient.getBlockNumber();
    const transferEvents = await publicClient.getContractEvents({
      address: NAMEFI_NFT_CONTRACT_ADDRESS,
      abi: NftAbi,
      eventName: 'Transfer',
      fromBlock: BigInt(fromBlock),
      // If toBlock is not provided, get all events from fromBlock to latest
      toBlock: BigInt(latestBlock),
    });
    console.debug(`Got ${transferEvents.length} transfer events`);
    // Create a map to track the latest owner for each token ID
    const latestOwners = new Map<bigint, `0x${string}`>();

    // Process events to extract latest owners
    for (const event of transferEvents) {
      // Safe access event args
      const to = event.args?.to;
      const tokenId = event.args?.tokenId;

      if (to && tokenId) {
        latestOwners.set(tokenId, to as `0x${string}`);
      }
    }

    // Get domain names for each token ID
    const domainUpdates: DomainOwnerUpdate[] = [];
    const pageSize = 2000;
    const pages = Math.ceil(latestOwners.size / pageSize);
    for (let page = 0; page < pages; page++) {
      const pageStart = page * pageSize;
      const pageEnd = pageStart + pageSize;
      const tokenIdsInPage = Array.from(latestOwners.keys()).slice(
        pageStart,
        pageEnd,
      );

      const domainNamesResults = await publicClient.multicall({
        contracts: tokenIdsInPage.map((tokenId) => ({
          address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: NftAbi,
          functionName: 'idToNormalizedDomainName',
          args: [tokenId],
          blockNumber: BigInt(latestBlock),
        })),
      });
      for (let i = 0; i < tokenIdsInPage.length; i++) {
        const result = domainNamesResults[i];
        const domainName =
          result.status === 'success'
            ? (result.result as NamefiNormalizedDomain)
            : undefined;
        domainUpdates.push({
          domainName: domainName,
          tokenId: tokenIdsInPage[i],
          currentOwner: latestOwners.get(tokenIdsInPage[i]) as `0x${string}`,
          chain: chain,
          blockNumber: latestBlock,
        });
        if (!domainName) {
          console.warn(
            `No domain name found for tokenId = ${tokenIdsInPage[i]}`,
          );
        }
      }
      console.debug(`Added ${domainUpdates.length} domain updates`);
    }

    return domainUpdates;
  } catch (error) {
    console.error(`Error fetching domain owner updates: ${error}`);
    throw new Error(`Failed to get domain owner updates: ${error}`);
  }
}

// Save domain to database
export const saveDomainToDatabase = async (
  domainUpdates: DomainOwnerUpdate[],
) => {
  const domainUpdatesToSave: DomainOwnerUpdate[] = [];
  for (const domain of domainUpdates) {
    if (!domain.domainName) {
      console.warn(
        `No domain name found for domain ${superjson.stringify(domain)}`,
      );
      continue;
    }
    const domainName = domain.domainName;
    const tokenId: bigint = domain.tokenId;
    // convert domain name to bytes
    const domainNameToId = BigInt(keccak256(toBytes(domainName)));
    if (domainNameToId !== tokenId) {
      console.warn(
        `Domain name to id mismatch for domain ${superjson.stringify(domain)}`,
      );
      continue;
    }

    domainUpdatesToSave.push(domain);
  }

  if (domainUpdatesToSave.length === 0) {
    console.debug('No valid domain updates to save.');
    return;
  }

  console.debug(
    `ChainId of domainUpdatesToSave = ${domainUpdatesToSave[0].chain.id}`,
  );
  // bulk insert into namefi_nft table
  await db
    .insert(namefiNftTable)
    .values(
      domainUpdatesToSave.map((domain) => ({
        // biome-ignore lint/style/noNonNullAssertion: We validate the domain name in the previous step
        normalizedDomainName: domain.domainName!,
        chainId: domain.chain.id,
        asOfBlockNumber: BigInt(domain.blockNumber),
        ownerAddress: domain.currentOwner,
      })),
    )
    .onConflictDoUpdate({
      target: namefiNftTable.normalizedDomainName,
      set: {
        chainId: sql`excluded.chain_id`,
        ownerAddress: sql`excluded.owner_address`,
        asOfBlockNumber: sql`excluded.as_of_block_number`,
      },
    });
  console.debug(
    `Saved ${domainUpdatesToSave.length} domain updates to the database.`,
  );
};

/**
 * Update the Namefi NFT index
 *
 * This function will get the latest domain owner updates for both mainnet and base
 * and save them to the database.
 *
 * It will also print the results in a readable format to the console.
 */
export const updateNamefiNftIndex = async () => {
  // get highest block number for each chain from the database
  const highestBlocksByChain = await db
    .select({
      chainId: namefiNftTable.chainId,
      maxBlockNumber: sql<bigint>`MAX(${namefiNftTable.asOfBlockNumber})`,
    })
    .from(namefiNftTable)
    .groupBy(namefiNftTable.chainId);

  console.debug(
    `Highest blocks by chain = ${superjson.stringify(highestBlocksByChain)}`,
  );

  for (const chain of [mainnet, base]) {
    console.debug(`Updating chain ${chain.name}`);
    const highestBlockRaw = highestBlocksByChain.find(
      (block) => block.chainId === chain.id,
    )?.maxBlockNumber;

    let highestBlockBigInt = 0n;
    if (highestBlockRaw !== undefined && highestBlockRaw !== null) {
      try {
        highestBlockBigInt = BigInt(highestBlockRaw);
      } catch (e) {
        console.error(
          `Could not convert highest block ${highestBlockRaw} to BigInt for chain ${chain.name}. Using 0n.`,
          e,
        );
        highestBlockBigInt = 0n;
      }
    } else {
      highestBlockBigInt = 0n;
    }

    console.debug(
      `Highest block number for chain ${chain.name} is ${highestBlockBigInt.toString()}`,
    );
    const updates = await getDomainNameOwnerUpdate(
      chain,
      highestBlockBigInt,
      undefined,
    );
    console.debug(
      `Found ${updates.length} domain owner updates for chain ${chain.name}`,
    );

    if (updates.length > 0) {
      // Calculate column widths for nice formatting
      const domainColumnWidth = Math.max(
        ...updates.map((update) => update.domainName?.length ?? 0),
        'Domain Name'.length,
      );

      // Print header
      console.log(`${'Domain Name'.padEnd(domainColumnWidth)} | Current Owner`);
      console.log(`${'-'.repeat(domainColumnWidth)}-+-${'-'.repeat(42)}`);

      // Print each row
      for (const update of updates) {
        console.log(
          `${(update.domainName ?? 'N/A').slice(0, domainColumnWidth).padEnd(domainColumnWidth)} | ${update.currentOwner}`,
        );
      }
      // print the block number of the updates
      await saveDomainToDatabase(updates);
    } else {
      console.debug(`No domain owner updates found for chain ${chain.name}`);
    }
  }
};
