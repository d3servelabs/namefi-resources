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
import { SignClient } from '@walletconnect/sign-client';

const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
};

type SignTypedDataParams = {
  domain: {
    name: string;
    version: string;
    chainId?: number;
    verifyingContract?: `0x${string}`;
  };
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
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
  signClient: Awaited<ReturnType<typeof SignClient.init>>;
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

      if (method === 'wallet_switchEthereumChain') {
        const [request] = Array.isArray(params) ? params : [];
        const chainIdHex =
          request && typeof request === 'object' && 'chainId' in request
            ? request.chainId
            : undefined;

        if (typeof chainIdHex === 'string') {
          const requestedChainId = Number.parseInt(
            chainIdHex.replace(/^0x/, ''),
            16,
          );
          if (requestedChainId !== chain.id) {
            throw new Error(
              `Connected to chain ${chain.id}. Reconnect with the target chain to switch.`,
            );
          }
        }

        return null;
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
  // Load session from file
  const session = await loadSession();
  if (!session) {
    console.error(
      'No active WalletConnect session. Run connect-wallet.ts first.',
    );
    process.exit(1);
  }

  // Read typed data from stdin
  let input = '';
  for await (const chunk of Bun.stdin.stream()) {
    input += new TextDecoder().decode(chunk);
  }

  if (!input.trim()) {
    console.error('No input provided. Pipe EIP-712 typed data JSON to stdin.');
    process.exit(1);
  }

  let typedData: SignTypedDataParams;
  try {
    typedData = JSON.parse(input);
  } catch (error) {
    console.error('Invalid JSON input:', error);
    process.exit(1);
  }

  // Validate required fields
  if (
    !typedData.domain ||
    !typedData.types ||
    !typedData.primaryType ||
    !typedData.message
  ) {
    console.error(
      'Invalid typed data. Required fields: domain, types, primaryType, message',
    );
    process.exit(1);
  }

  const chain = getSupportedChain(session.chainId);

  // Initialize SignClient with persistent storage
  const signClient = await createSignClient();

  // Resume session
  const wcSession = signClient.session.get(session.topic);
  if (!wcSession) {
    console.error(
      'Session not found. The session may have expired. Run connect-wallet.ts again.',
    );
    process.exit(1);
  }

  // Create provider and wallet client
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

  // Sign typed data
  const signature = await walletClient.signTypedData({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  } as Parameters<typeof walletClient.signTypedData>[0]);

  // Output result as JSON
  const result = {
    signature,
    address: session.address,
    primaryType: typedData.primaryType,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
