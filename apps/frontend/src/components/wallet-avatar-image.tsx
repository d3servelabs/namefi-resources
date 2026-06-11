'use client';

import { WalletAvatarFallback } from '@namefi-astra/ui/components/namefi/wallet-avatar-fallback';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getEnsDataAvatarUrl } from '@namefi-astra/utils/wallet-avatar';
import { useEffect, useMemo, useRef, useState } from 'react';

type WalletAvatarImageProps = {
  address?: string | null;
  className?: string;
};

export type { WalletAvatarImageProps };

type AvatarImageState = {
  src: string | null;
  status: 'pending' | 'loaded' | 'failed';
};

export function WalletAvatarImage({
  address,
  className,
}: WalletAvatarImageProps) {
  const walletAddress = address?.trim() || null;
  const [avatarImageState, setAvatarImageState] = useState<AvatarImageState>({
    src: null,
    status: 'pending',
  });
  const imageRef = useRef<HTMLImageElement>(null);

  const ensAvatarSrc = useMemo(
    () => getEnsDataAvatarUrl(walletAddress),
    [walletAddress],
  );
  const hasCurrentAvatarState = avatarImageState.src === ensAvatarSrc;
  const hasLoadedEnsAvatar =
    hasCurrentAvatarState && avatarImageState.status === 'loaded';
  const hasFailedEnsAvatar =
    hasCurrentAvatarState && avatarImageState.status === 'failed';

  useEffect(() => {
    setAvatarImageState((current) =>
      current.src === ensAvatarSrc
        ? current
        : { src: ensAvatarSrc, status: 'pending' },
    );

    const image = imageRef.current;
    if (!ensAvatarSrc || !image?.complete) return;

    if (image.naturalWidth > 0) {
      setAvatarImageState({ src: ensAvatarSrc, status: 'loaded' });
    } else {
      setAvatarImageState({ src: ensAvatarSrc, status: 'failed' });
    }
  }, [ensAvatarSrc]);

  if (!ensAvatarSrc || hasFailedEnsAvatar) {
    return <WalletAvatarFallback className={className} />;
  }

  return (
    // biome-ignore lint/performance/noImgElement: ENSData serves already-sized remote avatar media outside Next image optimization
    <img
      ref={imageRef}
      src={ensAvatarSrc}
      className={cn(
        'block size-full rounded-[inherit] object-cover transition-opacity duration-150',
        hasLoadedEnsAvatar ? 'opacity-100' : 'opacity-0',
        className,
      )}
      alt="user-avatar"
      referrerPolicy="no-referrer"
      onLoad={() =>
        setAvatarImageState({ src: ensAvatarSrc, status: 'loaded' })
      }
      onError={() =>
        setAvatarImageState({ src: ensAvatarSrc, status: 'failed' })
      }
    />
  );
}
