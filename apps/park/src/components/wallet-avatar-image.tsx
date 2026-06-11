'use client';

import { WalletAvatarFallback } from '@namefi-astra/ui/components/namefi/wallet-avatar-fallback';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useEffect, useRef, useState } from 'react';

type ParkWalletAvatarImageProps = {
  src?: string | null;
  className?: string;
  fallbackClassName?: string;
};

type ParkWalletAvatarImageState = {
  src: string | null;
  status: 'pending' | 'loaded' | 'failed';
};

export function ParkWalletAvatarImage({
  src,
  className,
  fallbackClassName,
}: ParkWalletAvatarImageProps) {
  const [avatarImageState, setAvatarImageState] =
    useState<ParkWalletAvatarImageState>({ src: null, status: 'pending' });
  const imageRef = useRef<HTMLImageElement>(null);

  const walletAvatarSrc = src || null;
  const hasCurrentSrcState = avatarImageState.src === walletAvatarSrc;
  const hasLoadedSrc =
    hasCurrentSrcState && avatarImageState.status === 'loaded';
  const hasFailedSrc =
    hasCurrentSrcState && avatarImageState.status === 'failed';
  const activeSrc = walletAvatarSrc && !hasFailedSrc ? walletAvatarSrc : null;

  useEffect(() => {
    setAvatarImageState((current) =>
      current.src === walletAvatarSrc
        ? current
        : { src: walletAvatarSrc, status: 'pending' },
    );

    const image = imageRef.current;
    if (!activeSrc || !image?.complete) return;

    if (image.naturalWidth > 0) {
      setAvatarImageState({ src: activeSrc, status: 'loaded' });
    } else {
      setAvatarImageState({ src: activeSrc, status: 'failed' });
    }
  }, [activeSrc, walletAvatarSrc]);

  if (!activeSrc) {
    return <WalletAvatarFallback className={fallbackClassName} />;
  }

  return (
    // biome-ignore lint/performance/noImgElement: remote ENSData avatars do not benefit from Next image optimization
    <img
      ref={imageRef}
      src={activeSrc}
      alt=""
      aria-hidden={true}
      className={cn(
        'block size-full rounded-[inherit] object-cover transition-opacity duration-150',
        hasLoadedSrc ? 'opacity-100' : 'opacity-0',
        className,
      )}
      referrerPolicy="no-referrer"
      onLoad={() => setAvatarImageState({ src: activeSrc, status: 'loaded' })}
      onError={() => setAvatarImageState({ src: activeSrc, status: 'failed' })}
    />
  );
}
