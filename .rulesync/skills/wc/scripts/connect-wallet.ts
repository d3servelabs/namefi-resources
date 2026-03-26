#!/usr/bin/env bun
import { rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Address, Chain } from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import QrCode from 'qrcode';
import { loadSession, saveSession } from './lib/session-store';
import { createSignClient } from './lib/create-sign-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QR_PNG_PATH = resolve(__dirname, '../wc-qr.png');

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
  'personal_sign',
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
    process.exit(1);
  }

  const chain = getSupportedChain(chainId);

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

  const qrText = await QrCode.toString(uri, {
    type: 'terminal',
    small: true,
    scale: 0.7,
  });
  await QrCode.toFile(QR_PNG_PATH, uri, { type: 'png', width: 400, margin: 2 });

  process.stdout.write('Approve this WalletConnect session in your wallet:\n');
  process.stdout.write(`${uri}\n`);
  process.stdout.write(`${qrText}\n`);
  process.stdout.write(`QR PNG saved to: ${QR_PNG_PATH}\n`);

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

  // Clean up QR PNG
  await rm(QR_PNG_PATH, { force: true });

  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
