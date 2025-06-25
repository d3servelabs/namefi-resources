'use client';
import { NetworkLogo } from '@/components/NetworkLogo';
import { CartCard } from '@/components/cart-card';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import {
  useLinkedWalletAddresses,
  useUserWalletAddresses,
} from '@/hooks/useUserWalletAddresses';
import { config } from '@/lib/env';
import { CHAINS, checksumWalletAddressSchema } from '@namefi-astra/utils';
import { useCallback, useMemo, useState } from 'react';

const DEFAULT_RECEIVING_WALLET_CHAIN_ID = config.ALLOWED_CHAINS.includes(
  CHAINS.base.id,
)
  ? CHAINS.base.id
  : CHAINS.sepolia.id;

export interface NftWalletCardProps {
  onWalletAddressChange: (walletAddress: string | null) => void;
  selectedWalletAddress: string | null;
  disabled?: boolean;
}

export function NftWalletCard({
  onWalletAddressChange,
  selectedWalletAddress,
  disabled,
}: NftWalletCardProps) {
  const [error, setError] = useState<string | null>(null);

  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();

  const { options, optionsReady } = useMemo(() => {
    if (!(linkedWalletsReady && userWalletsReady)) {
      return { options: [], optionsReady: false };
    }

    const options: { walletAddress: string; isLinkedWallet: boolean }[] =
      userWalletAddresses.map((walletAddress) => {
        if (linkedWalletAddresses.includes(walletAddress)) {
          return { walletAddress, isLinkedWallet: true };
        }

        return { walletAddress, isLinkedWallet: false };
      });

    return { options, optionsReady: true };
  }, [
    linkedWalletAddresses,
    linkedWalletsReady,
    userWalletAddresses,
    userWalletsReady,
  ]);

  const handleWalletAddressChange = useCallback(
    (value: string) => {
      if (value.length === 0) {
        setError(null);
        onWalletAddressChange(null);
        return;
      }
      const result = checksumWalletAddressSchema.safeParse(value);
      if (result.success) {
        setError(null);
        onWalletAddressChange(value);
      } else {
        setError('Invalid wallet address');
        onWalletAddressChange(null);
      }
    },
    [onWalletAddressChange],
  );

  return (
    <CartCard title="Receiving Wallet Address">
      <WalletEditableSelect
        value={selectedWalletAddress || ''}
        onValueChange={handleWalletAddressChange}
        options={options}
        placeholder={
          userWalletAddresses.length > 0
            ? 'Paste a wallet address or select from connected wallets'
            : 'Paste a wallet address to receive domains'
        }
        error={error || undefined}
        disabled={!optionsReady || disabled}
        helpText="Domains will be sent to this wallet. Make sure it's correct."
        icon={
          <NetworkLogo
            network={DEFAULT_RECEIVING_WALLET_CHAIN_ID}
            className="size-4"
          />
        }
      />
    </CartCard>
  );
}
