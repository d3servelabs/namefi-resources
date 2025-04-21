'use client';
import { NetworkLogo } from '@/components/NetworkLogo';
import { CartCard } from '@/components/cart-card';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import { CHAINS, checksumWalletAddressSchema } from '@namefi-astra/utils';
import { useWallets } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const { ready: ethereumWalletsReady, wallets: ethereumWallets } =
    useWallets();
  const hasAutoSelectedRef = useRef(false);

  const connectedWalletAddresses = useMemo(() => {
    if (!ethereumWalletsReady) {
      return [];
    }
    return [...ethereumWallets].map((wallet) => wallet.address);
  }, [ethereumWallets, ethereumWalletsReady]);

  // Pre-select first wallet if available and none selected
  useEffect(() => {
    if (
      !(hasAutoSelectedRef.current || selectedWalletAddress) &&
      connectedWalletAddresses.length > 0 &&
      ethereumWalletsReady
    ) {
      onWalletAddressChange(connectedWalletAddresses[0]);
      hasAutoSelectedRef.current = true;
    }
  }, [
    connectedWalletAddresses,
    ethereumWalletsReady,
    onWalletAddressChange,
    selectedWalletAddress,
  ]);

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
        options={connectedWalletAddresses}
        placeholder={
          connectedWalletAddresses.length > 0
            ? 'Paste a wallet address or select from connected wallets'
            : 'Paste a wallet address to receive domains'
        }
        error={error || undefined}
        disabled={!ethereumWalletsReady || disabled}
        helpText="Domains will be sent to this wallet. Make sure it's correct."
        icon={<NetworkLogo network={CHAINS.base.id} className="size-4" />}
      />
    </CartCard>
  );
}
