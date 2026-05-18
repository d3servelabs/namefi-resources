'use client';

import { AlertCircle } from 'lucide-react';
import { getChain } from '@namefi-astra/utils/chains';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';

interface Props {
  chainId: number;
}

export function UnsupportedChainEmptyState({ chainId }: Props) {
  const chain = getChain(chainId);
  const chainLabel = chain?.name ?? `chain ${chainId}`;
  const supportedNames = MARKETPLACE_SUPPORTED_CHAINS.map(
    (id) => getChain(id)?.name ?? `chain ${id}`,
  ).join(', ');

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
        <AlertCircle className="h-5 w-5 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">
        Marketplace listings aren't supported on {chainLabel} yet
      </h3>
      <p className="mt-2 text-sm text-zinc-400">
        Supported networks: {supportedNames}.
      </p>
    </div>
  );
}
