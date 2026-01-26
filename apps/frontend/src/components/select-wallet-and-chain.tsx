import { useIsMobile } from '@/hooks/use-mobile';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { getShortAddress } from '@/lib/string';
import { CHAINS } from '@namefi-astra/utils/chains';
import { useCallback, useState } from 'react';
import type { Chain } from 'viem';
import { Badge } from './ui/shadcn/badge';
import { Button } from './ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/shadcn/select';

interface SelectWalletProps {
  onValueChange: (walletAddress: string) => void;
  selectTriggerDisabled: boolean;
}

interface SelectChainProps {
  baseChainOnly: boolean;
  onValueChange: (chainId: string) => void;
  selectTriggerDisabled: boolean;
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
    (value: string) => {
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
}: SelectChainProps) {
  const { chains, chainIds } = useAllowedChains();

  const DefaultPaymentChainId = chainIds.includes(CHAINS.base.id)
    ? CHAINS.base.id
    : CHAINS.sepolia.id;

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
      onValueChange={onValueChange}
      defaultValue={`${DefaultPaymentChainId}`}
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
