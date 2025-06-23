import { cn } from '@/lib/utils';
import { CHAINS } from '@namefi-astra/utils';
import { AlertTriangleIcon } from 'lucide-react';
import BaseNetwork from '@/components/chains/BaseNetwork';
import EthNetwork from '@/components/chains/EthNetwork';
import type React from 'react';
import { useMemo } from 'react';

const TEST_NETS: number[] = [CHAINS.sepolia.id, CHAINS.baseSepolia.id];
const BASE_NETWORKS: number[] = [CHAINS.base.id, CHAINS.baseSepolia.id];
const ETH_NETWORKS: number[] = [CHAINS.mainnet.id, CHAINS.sepolia.id];

export const NetworkLogo = ({
  network,
  ...props
}: React.ComponentProps<'div'> & {
  network: number;
}) => {
  const testnet = useMemo(() => {
    return TEST_NETS.includes(network);
  }, [network]);

  return (
    <div
      {...props}
      className={cn(
        'w-12 h-12',
        'aspect-square rounded-full text-center bg-brand-dark',
        testnet && 'opacity-50',
        props.className,
      )}
    >
      {ETH_NETWORKS.includes(network) ? (
        <EthNetwork className={cn('w-full h-full')} />
      ) : BASE_NETWORKS.includes(network) ? (
        <BaseNetwork className={cn('w-full h-full')} />
      ) : (
        <div
          className={
            'flex items-center justify-center h-full w-full text-primary'
          }
        >
          <AlertTriangleIcon
            width={50}
            height={50}
            className={'w-7/12 h-7/12 aspect-square'}
          />
        </div>
      )}
    </div>
  );
};

export default NetworkLogo;
