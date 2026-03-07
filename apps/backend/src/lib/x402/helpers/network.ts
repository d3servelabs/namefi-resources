const EIP155_NETWORK_REGEX = /^eip155:(\d+)$/;

export function parseChainIdFromNetwork(network: string): number {
  const match = network.match(EIP155_NETWORK_REGEX);
  if (!match) {
    throw new Error(`Invalid x402 network format: ${network}`);
  }

  return Number.parseInt(match[1], 10);
}
