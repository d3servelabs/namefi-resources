import { useIsMobile } from '@/hooks/use-mobile';
import { useLinkedWalletAddresses } from '@/hooks/useUserWalletAddresses';
import { config } from '@/lib/env';
import { getShortAddress } from '@/lib/utils';
import { CHAINS, getChain } from '@namefi-astra/utils';
import { filter, isNotNil } from 'ramda';
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

const ALLOWED_CHAINS: Chain[] = filter(
  isNotNil,
  config.ALLOWED_CHAINS.map((chainId) => getChain(chainId) as Chain),
);
const DEFAULT_PAYMENT_CHAIN_ID = config.ALLOWED_CHAINS.includes(CHAINS.base.id)
  ? CHAINS.base.id
  : CHAINS.sepolia.id;

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
        {linkedWalletAddresses.map((walletAddress) => (
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
      defaultValue={`${DEFAULT_PAYMENT_CHAIN_ID}`}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a Chain" />
      </SelectTrigger>
      <SelectContent>
        {ALLOWED_CHAINS.map((chain: Chain) => (
          <SelectItem
            key={`${chain.id}`}
            value={`${chain.id}`}
          >{`${chain.name}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
