'use client';
import { NetworkLogo } from '@/components/NetworkLogo';
import { CartCard } from '@/components/cart-card';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import { useUserWalletAddresses } from '@/hooks/useUserWalletAddresses';
import { CHAINS, checksumWalletAddressSchema } from '@namefi-astra/utils';
import { useCallback, useState } from 'react';

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

  const handleWalletAddressChange = useCallback(
    (value: string) => {
      onWalletAddressChange(value);
      if (value.length === 0) {
        setError(null);
        return;
      }
      const result = checksumWalletAddressSchema.safeParse(value);
      if (result.success) {
        setError(null);
      } else {
        setError('Invalid wallet address');
      }
    },
    [onWalletAddressChange],
  );

  return (
    <CartCard title="Receiving Wallet Address">
      <WalletEditableSelect
        value={selectedWalletAddress || ''}
        onValueChange={handleWalletAddressChange}
        options={userWalletAddresses}
        placeholder={
          userWalletAddresses.length > 0
            ? 'Paste a wallet address or select from connected wallets'
            : 'Paste a wallet address to receive domains'
        }
        error={error || undefined}
        disabled={!userWalletsReady || disabled}
        helpText="Domains will be sent to this wallet. Make sure it's correct."
        icon={<NetworkLogo network={CHAINS.base.id} className="size-4" />}
      />
    </CartCard>
  );
}
