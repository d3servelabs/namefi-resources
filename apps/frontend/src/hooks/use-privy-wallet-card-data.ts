import type { WalletProvider } from '@/components/ui/untitled/wallet-card';

const mapping: Record<string, WalletProvider> = {
  metamask: 'metamask',
  walletconnect: 'walletconnect',
  walletconnect_v2: 'walletconnect',
  coinbase_wallet: 'coinbase',
  coinbase: 'coinbase',
  rainbow: 'rainbow',
  argent: 'argent',
  trust: 'trust',
  ledger: 'ledger',
  safe: 'safe',
  gnosis_safe: 'safe',
};
// Map Privy wallet client types to our WalletProvider types
export function mapPrivyWalletToProvider(
  walletClientType?: string,
): WalletProvider {
  if (!walletClientType) return 'unknown';

  return mapping[walletClientType.toLowerCase()] || 'unknown';
}
