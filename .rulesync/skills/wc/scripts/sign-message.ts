#!/usr/bin/env bun
import {
  createWalletClient,
  custom,
  toHex,
  type Address,
  type Chain,
} from 'viem';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { loadSession } from './lib/session-store';
import { createSignClient } from './lib/create-sign-client';

const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
};

function getSupportedChain(chainId: number): Chain {
  const chain = CHAIN_BY_ID[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return chain;
}

function createWalletConnectProvider({
  signClient,
  topic,
  address,
  chain,
}: {
  signClient: Awaited<ReturnType<typeof createSignClient>>;
  topic: string;
  address: Address;
  chain: Chain;
}) {
  return {
    request: async ({
      method,
      params,
    }: {
      method: string;
      params?: unknown;
    }) => {
      if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
        return [address];
      }

      if (method === 'eth_chainId') {
        return toHex(chain.id);
      }

      return await signClient.request({
        topic,
        chainId: `eip155:${chain.id}`,
        request: {
          method,
          params: params ?? [],
        },
      });
    },
  };
}

async function main() {
  const session = await loadSession();
  if (!session) {
    process.exit(1);
  }

  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
  }

  const message = input.trim();
  if (!message) {
    process.exit(1);
  }

  const chain = getSupportedChain(session.chainId);
  const signClient = await createSignClient();
  const wcSession = signClient.session.get(session.topic);
  if (!wcSession) {
    process.exit(1);
  }

  const supportedMethods = wcSession.namespaces.eip155?.methods ?? [];
  if (!supportedMethods.includes('personal_sign')) {
    process.stderr.write(
      `personal_sign not supported by connected wallet. Supported methods: ${supportedMethods.join(', ')}\n`,
    );
    process.exit(1);
  }

  const provider = createWalletConnectProvider({
    signClient,
    topic: session.topic,
    address: session.address,
    chain,
  });

  const walletClient = createWalletClient({
    account: session.address,
    chain,
    transport: custom(provider),
  });

  const signature = await walletClient.signMessage({
    message,
  });

  process.stdout.write(
    `${JSON.stringify({ signature, address: session.address, message })}\n`,
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
