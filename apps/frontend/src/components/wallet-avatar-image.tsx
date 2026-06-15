'use client';

import { WalletAvatarFallback } from '@namefi-astra/ui/components/namefi/wallet-avatar-fallback';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getEnsDataAvatarUrl } from '@namefi-astra/utils/wallet-avatar';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type WalletAvatarImageProps = {
  address?: string | null;
  className?: string;
  eager?: boolean;
  sizes?: string;
};

export type { WalletAvatarImageProps };

type AvatarImageStatus = 'error' | 'loading' | 'loaded';
type AvatarImageState = {
  src: string | null;
  status: AvatarImageStatus;
};

export function WalletAvatarImage({
  address,
  className,
  eager = false,
  sizes = '32px',
}: WalletAvatarImageProps) {
  const walletAddress = address?.trim() || null;
  const ensAvatarSrc = getEnsDataAvatarUrl(walletAddress);
  const imageRef = useRef<HTMLImageElement>(null);
  const currentSrcRef = useRef<string | null>(ensAvatarSrc);
  currentSrcRef.current = ensAvatarSrc;
  const [imageState, setImageState] = useState<AvatarImageState>(() => ({
    src: ensAvatarSrc,
    status: ensAvatarSrc ? 'loading' : 'error',
  }));
  const imageStatus =
    imageState.src === ensAvatarSrc
      ? imageState.status
      : ensAvatarSrc
        ? 'loading'
        : 'error';

  const setImageStatusForSource = useCallback(
    (src: string | null, status: AvatarImageStatus) => {
      setImageState((current) => {
        if (currentSrcRef.current !== src) return current;
        return { src, status };
      });
    },
    [],
  );

  useEffect(() => {
    if (!ensAvatarSrc) {
      setImageStatusForSource(null, 'error');
      return;
    }

    setImageStatusForSource(ensAvatarSrc, 'loading');

    const updateFromElement = () => {
      const image = imageRef.current;
      if (!image?.complete) return;
      setImageStatusForSource(
        ensAvatarSrc,
        image.naturalWidth > 0 ? 'loaded' : 'error',
      );
    };

    updateFromElement();
    const animationFrameId = requestAnimationFrame(updateFromElement);

    return () => cancelAnimationFrame(animationFrameId);
  }, [ensAvatarSrc, setImageStatusForSource]);

  return (
    <span
      aria-hidden={true}
      data-slot="wallet-avatar-image"
      className={cn(
        'relative block size-full overflow-hidden rounded-full',
        className,
      )}
    >
      {ensAvatarSrc && imageStatus !== 'error' ? (
        <Image
          ref={imageRef}
          src={ensAvatarSrc}
          alt=""
          aria-hidden={true}
          fill={true}
          sizes={sizes}
          quality={90}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          className="z-10 rounded-full object-cover"
          onLoad={(event) => {
            setImageStatusForSource(
              ensAvatarSrc,
              event.currentTarget.naturalWidth > 0 ? 'loaded' : 'error',
            );
          }}
          onError={() => setImageStatusForSource(ensAvatarSrc, 'error')}
        />
      ) : null}
      {imageStatus === 'loading' ? (
        <Skeleton className="absolute inset-0 rounded-full bg-muted-foreground/25 ring-1 ring-border/70 shadow-inner dark:bg-white/15 dark:ring-white/10" />
      ) : null}
      {imageStatus === 'error' ? (
        <WalletAvatarFallback className="absolute inset-0 z-10 rounded-full" />
      ) : null}
    </span>
  );
}
