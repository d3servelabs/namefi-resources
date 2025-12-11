import Image, { type StaticImageData } from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

type ContentImageProps = Omit<
  ComponentPropsWithoutRef<'img'>,
  'src' | 'alt' | 'width' | 'height' | 'sizes' | 'loading'
> & {
  src: StaticImageData | string;
  alt?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
};

const DEFAULT_SIZES = '(min-width: 1024px) 960px, 100vw';

export function ContentImage({
  src,
  alt,
  className,
  sizes,
  priority,
  width,
  height,
  loading,
  ...rest
}: ContentImageProps) {
  const composedClassName = cn(
    'max-w-full h-auto rounded-3xl border border-border/60 shadow-lg shadow-black/5',
    className,
  );

  if (typeof src === 'object') {
    const hasBlur = 'blurDataURL' in src && Boolean(src.blurDataURL);
    return (
      <Image
        src={src}
        alt={alt ?? ''}
        className={composedClassName}
        width={width}
        height={height}
        sizes={sizes ?? DEFAULT_SIZES}
        placeholder={hasBlur ? 'blur' : 'empty'}
        priority={priority}
        {...rest}
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: fallback for URLs that cannot be statically imported
    <img
      src={src}
      alt={alt ?? ''}
      className={composedClassName}
      width={width}
      height={height}
      loading={loading ?? 'lazy'}
      {...rest}
    />
  );
}
