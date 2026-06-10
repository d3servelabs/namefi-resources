'use client';

import { generateAvatarURL } from '@cfx-kit/wallet-avatar';
import { AvatarImage } from '@namefi-astra/ui/components/shadcn/avatar';
import { useQuery } from '@tanstack/react-query';
import { useEnsAvatar, useEnsName } from 'wagmi';

type WalletAvatarImageProps = {
  address?: string | null;
  className?: string;
};

export function WalletAvatarImage({
  address,
  className,
}: WalletAvatarImageProps) {
  const ensName = useEnsName({
    query: {
      enabled: !!address,
    },
    address: address as `0x${string}` | undefined,
    chainId: 1,
  });
  const ensAvatar = useEnsAvatar({
    name: ensName.data ?? '',
    query: {
      enabled: !!ensName.data,
    },
    chainId: 1,
  });
  const metamaskAvatar = useQuery({
    queryFn: () => generateAvatarURL(address ?? ''),
    enabled: !!address,
    queryKey: [`metamask:avatar:${address}`],
  });

  return (
    <AvatarImage
      src={ensAvatar.data || metamaskAvatar.data}
      className={className}
      alt="user-avatar"
    />
  );
}
