#!/usr/bin/env bun
import type { Chain } from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { loadSession } from './lib/session-store';

const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
};

async function main() {
  const session = await loadSession();

  if (!session) {
    console.log(JSON.stringify({ connected: false }, null, 2));
    process.exit(0);
  }

  const chain = CHAIN_BY_ID[session.chainId];
  const chainName = chain?.name ?? `Unknown (${session.chainId})`;

  const result = {
    connected: true,
    address: session.address,
    chainId: session.chainId,
    chainName,
    peerName: session.peerName,
    createdAt: session.createdAt,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
