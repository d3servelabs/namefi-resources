import { cn } from '@namefi-astra/ui/lib/cn';
import { CHAINS, getChain } from '@namefi-astra/utils/chains';
import { AlertTriangleIcon } from 'lucide-react';
import BaseNetwork from '@/components/chains/base-network';
import EthNetwork from '@/components/chains/eth-network';
import type React from 'react';
import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

const TEST_NETS: number[] = [CHAINS.sepolia.id, CHAINS.baseSepolia.id];
const BASE_NETWORKS: number[] = [CHAINS.base.id, CHAINS.baseSepolia.id];
const ETH_NETWORKS: number[] = [CHAINS.mainnet.id, CHAINS.sepolia.id];

export const NetworkLogo = ({
  network,
  missingNetworkClassName,
  ...props
}: React.ComponentProps<'div'> & {
  network?: number | null;
  missingNetworkClassName?: string;
}) => {
  const networkId = typeof network === 'number' ? network : null;
  const testnet = useMemo(() => {
    return networkId ? TEST_NETS.includes(networkId) : false;
  }, [networkId]);
  const networkName = useMemo(() => {
    return (networkId ? getChain(networkId)?.name : null) || 'Unknown Network';
  }, [networkId]);

  return (
    <TooltipProvider>
      <Tooltip defaultOpen={false}>
        <TooltipTrigger
          render={
            <div
              {...props}
              className={cn(
                'w-12 h-12',
                'aspect-square rounded-full text-center bg-card flex items-center justify-center',
                testnet && 'grayscale',
                props.className,
              )}
            />
          }
        >
          {networkId && ETH_NETWORKS.includes(networkId) ? (
            <EthNetwork className={cn('w-full h-full')} />
          ) : networkId && BASE_NETWORKS.includes(networkId) ? (
            <BaseNetwork className={cn('w-full h-full')} />
          ) : networkId === CHAINS.robinhoodTestnet.id ? (
            <div
              className={cn(
                'flex items-center justify-center h-full w-full text-primary',
              )}
            >
              <img
                src="/chains/robinhood-testnet.svg"
                alt="robinhood testnet"
                className={'w-full h-full aspect-square rounded-2xl'}
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center h-full w-full text-primary',
                missingNetworkClassName,
              )}
            >
              <AlertTriangleIcon
                width={50}
                height={50}
                className={'w-7/12 h-7/12 aspect-square'}
              />
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{networkName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NetworkLogo;
