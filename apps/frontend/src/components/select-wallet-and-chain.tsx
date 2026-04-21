import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { getShortAddress } from '@/lib/string';
import { CHAINS } from '@namefi-astra/utils/chains';
import { useCallback, useState } from 'react';
import type { Chain } from 'viem';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';

interface SelectWalletProps {
  onValueChange: (walletAddress: string) => void;
  selectTriggerDisabled: boolean;
}

interface SelectChainProps {
  baseChainOnly: boolean;
  onValueChange: (chainId: string) => void;
  selectTriggerDisabled: boolean;
  parentDomain?: string;
}

export function SelectWallet({
  onValueChange,
  selectTriggerDisabled,
}: SelectWalletProps) {
  const [selectWalletAddress, setSelectedWalletAddress] = useState<
    string | null
  >(null);
  const isMobile = useIsMobile();

  const handleValueChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      setSelectedWalletAddress(value);
      onValueChange(value);
    },
    [onValueChange],
  );

  const { linkedWalletAddresses } = useLinkedWalletAddresses();

  return (
    <Select
      disabled={selectTriggerDisabled || linkedWalletAddresses.length === 0}
      onValueChange={handleValueChange}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            linkedWalletAddresses.length === 0
              ? 'No Linked Wallets'
              : 'Select a Wallet'
          }
        >{`${isMobile ? getShortAddress(selectWalletAddress ?? '') : selectWalletAddress}`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {linkedWalletAddresses.map((walletAddress: string) => (
          <SelectItem key={`${walletAddress}`} value={`${walletAddress}`}>
            <div className="flex items-center gap-2">
              <Badge>Linked</Badge>
              {`${isMobile ? getShortAddress(walletAddress) : walletAddress}`}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SelectChain({
  baseChainOnly,
  onValueChange,
  selectTriggerDisabled,
  parentDomain,
}: SelectChainProps) {
  const {
    nfscBalanceChains: chains,
    defaultNfscBalanceChainId: defaultPaymentChainId,
  } = useAllowedChains(parentDomain);

  if (baseChainOnly) {
    return (
      <Button
        variant="outline"
        disabled={true}
      >{`${CHAINS.base.name} (Default)`}</Button>
    );
  }

  return (
    <Select
      disabled={selectTriggerDisabled}
      onValueChange={(value) => {
        if (!value) return;
        onValueChange(value);
      }}
      defaultValue={`${defaultPaymentChainId}`}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a Chain" />
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain: Chain) => (
          <SelectItem
            key={`${chain.id}`}
            value={`${chain.id}`}
          >{`${chain.name}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
