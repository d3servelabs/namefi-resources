import { cn } from '@/lib/cn';
import { CHAINS, getChain } from '@namefi-astra/utils';
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
} from '@/components/ui/shadcn/tooltip';
import { NetworkIcon } from '@web3icons/react';

const TEST_NETS: number[] = [CHAINS.sepolia.id, CHAINS.baseSepolia.id];
const BASE_NETWORKS: number[] = [CHAINS.base.id, CHAINS.baseSepolia.id];
const ETH_NETWORKS: number[] = [CHAINS.mainnet.id, CHAINS.sepolia.id];

export const NetworkLogo = ({
  network,
  missingNetworkClassName,
  ...props
}: React.ComponentProps<'div'> & {
  network: number;
  missingNetworkClassName?: string;
}) => {
  const testnet = useMemo(() => {
    return TEST_NETS.includes(network);
  }, [network]);
  const networkName = useMemo(() => {
    return getChain(network)?.name || 'Unknown Network';
  }, [network]);

  return (
    <TooltipProvider>
      <Tooltip defaultOpen={false}>
        <TooltipTrigger asChild>
          <div
            {...props}
            className={cn(
              'w-12 h-12',
              'aspect-square rounded-full text-center bg-card flex items-center justify-center',
              testnet && 'grayscale',
              props.className,
            )}
          >
            {ETH_NETWORKS.includes(network) ? (
              <EthNetwork className={cn('w-full h-full')} />
            ) : BASE_NETWORKS.includes(network) ? (
              <BaseNetwork className={cn('w-full h-full')} />
            ) : network ? (
              <NetworkIcon
                variant="branded"
                chainId={network}
                className={cn('w-full h-full')}
              />
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
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{networkName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NetworkLogo;
