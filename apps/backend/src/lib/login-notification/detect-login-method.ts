import type { User as PrivyUser } from '@privy-io/server-auth';

export function detectLoginMethod(privyUser: PrivyUser): string {
  const linkedAccounts = privyUser.linkedAccounts || [];

  const accountTypes = linkedAccounts.map((account) => account.type);

  if (accountTypes.includes('email')) {
    return 'Email';
  }

  if (accountTypes.includes('google_oauth')) {
    return 'Google';
  }

  if (accountTypes.includes('twitter_oauth')) {
    return 'Twitter';
  }

  if (accountTypes.includes('discord_oauth')) {
    return 'Discord';
  }

  if (accountTypes.includes('github_oauth')) {
    return 'GitHub';
  }

  if (accountTypes.includes('apple_oauth')) {
    return 'Apple';
  }

  if (accountTypes.includes('linkedin_oauth')) {
    return 'LinkedIn';
  }

  if (accountTypes.includes('farcaster')) {
    return 'Farcaster';
  }

  if (accountTypes.includes('wallet')) {
    const walletAccount = linkedAccounts.find(
      (account) => account.type === 'wallet',
    );
    if (walletAccount && 'walletClientType' in walletAccount) {
      const walletType = walletAccount.walletClientType;
      if (walletType === 'metamask') return 'MetaMask Wallet';
      if (walletType === 'coinbase_wallet') return 'Coinbase Wallet';
      if (walletType === 'rainbow') return 'Rainbow Wallet';
      if (walletType === 'wallet_connect') return 'WalletConnect';
      return 'Crypto Wallet';
    }
    return 'Crypto Wallet';
  }

  if (accountTypes.includes('smart_wallet')) {
    return 'Smart Wallet';
  }

  if (accountTypes.includes('phone')) {
    return 'Phone Number';
  }

  return 'Unknown Method';
}
