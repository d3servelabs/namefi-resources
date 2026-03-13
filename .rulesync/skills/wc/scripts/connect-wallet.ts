#!/usr/bin/env bun
import type { Address, Chain } from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import QrCode from 'qrcode';
import { loadSession, saveSession } from './lib/session-store';
import { createSignClient } from './lib/create-sign-client';

const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
};

const REQUIRED_METHODS = [
  'eth_requestAccounts',
  'eth_accounts',
  'eth_chainId',
  'eth_signTypedData_v4',
] as const;

const REQUIRED_EVENTS = ['accountsChanged', 'chainChanged'] as const;

function getSupportedChain(chainId: number): Chain {
  const chain = CHAIN_BY_ID[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chain: ${chainId}. Supported chains: ${Object.keys(CHAIN_BY_ID).join(', ')}`,
    );
  }
  return chain;
}

function resolveSessionAccount(
  accounts: string[],
  preferredChainId: number,
): { address: Address; chainId: number } {
  const account =
    accounts.find((value) => value.startsWith(`eip155:${preferredChainId}:`)) ??
    accounts[0];

  if (!account) {
    throw new Error(
      'WalletConnect session did not include any eip155 accounts',
    );
  }

  const [namespace, chainReference, address] = account.split(':');

  if (namespace !== 'eip155' || !chainReference || !address) {
    throw new Error(`Unexpected WalletConnect account format: ${account}`);
  }

  return {
    address: address as Address,
    chainId: Number.parseInt(chainReference, 10),
  };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let chainId = 84532; // Default to Base Sepolia

  for (const arg of args) {
    if (arg.startsWith('--chainId=')) {
      chainId = Number.parseInt(arg.split('=')[1], 10);
    }
  }

  // Check if already connected
  const existingSession = await loadSession();
  if (existingSession) {
    console.error(
      `Already connected to wallet ${existingSession.address} on chain ${existingSession.chainId} (${existingSession.peerName}).`,
    );
    console.error('Use disconnect.ts first to connect a different wallet.');
    process.exit(1);
  }

  const chain = getSupportedChain(chainId);

  console.log(
    `Creating WalletConnect session for chain ${chain.name} (${chain.id})...`,
  );

  // Initialize SignClient with persistent storage
  const signClient = await createSignClient();

  // Start connection process
  const { approval, uri } = await signClient.connect({
    requiredNamespaces: {
      eip155: {
        methods: [...REQUIRED_METHODS],
        chains: [`eip155:${chain.id}`],
        events: [...REQUIRED_EVENTS],
      },
    },
  });

  if (!uri) {
    throw new Error('Failed to generate WalletConnect URI');
  }

  // Generate and display QR code
  console.log('\nScan this QR code with your mobile wallet:\n');
  const qrText = await QrCode.toString(uri, {
    type: 'terminal',
    small: true,
    scale: 0.7,
  });
  console.log(qrText);
  console.log(`\nOr use this URI: ${uri}\n`);
  console.log('Waiting for approval...');

  // Wait for approval
  const approvedSession = await approval();
  const { address, chainId: resolvedChainId } = resolveSessionAccount(
    approvedSession.namespaces.eip155?.accounts ?? [],
    chain.id,
  );

  // Save session to file
  await saveSession({
    topic: approvedSession.topic,
    address,
    chainId: resolvedChainId,
    peerName: approvedSession.peer.metadata.name,
    createdAt: Date.now(),
  });

  console.log('\n✓ Successfully connected!');
  console.log(`  Address: ${address}`);
  console.log(`  Chain: ${chain.name} (${resolvedChainId})`);
  console.log(`  Wallet: ${approvedSession.peer.metadata.name}`);
  console.log('\nSession saved to sessions.json');

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
