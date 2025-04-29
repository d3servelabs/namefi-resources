import { useIsMobile } from '@/hooks/use-mobile';
import { useLinkedWalletAddresses } from '@/hooks/useUserWalletAddresses';
import { getShortAddress } from '@/lib/utils';
import { supportedChains } from '@/lib/wagmiConfig';
import { CHAINS } from '@namefi-astra/utils';
import type { Chain } from 'viem';
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
  const isMobile = useIsMobile();

  const { linkedWalletAddresses } = useLinkedWalletAddresses();

  if (linkedWalletAddresses.length === 0) {
    return (
      <Button variant="outline" disabled={true}>
        No Connected Wallets
      </Button>
    );
  }

  return (
    <Select disabled={selectTriggerDisabled} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a Wallet" />
      </SelectTrigger>
      <SelectContent>
        {linkedWalletAddresses.map((walletAddress) => (
          <SelectItem
            key={`${walletAddress}`}
            value={`${walletAddress}`}
          >{`${isMobile ? getShortAddress(walletAddress) : walletAddress}`}</SelectItem>
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
      defaultValue={`${CHAINS.base.id}`}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a Chain" />
      </SelectTrigger>
      <SelectContent>
        {supportedChains.map((chain: Chain) => (
          <SelectItem
            key={`${chain.id}`}
            value={`${chain.id}`}
          >{`${chain.name}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
