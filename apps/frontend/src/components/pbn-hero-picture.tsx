import { cn } from '@namefi-astra/ui/lib/cn';
import type { CSSProperties } from 'react';

export type PbnHeroPictureSources = {
  mobile: string;
  tablet: string;
  desktop: string;
  fallback: string;
};

const IMAGE_EXTENSION_REGEX = /\.(?:avif|webp|png|jpe?g)$/i;

export function getResponsiveHeroSources(
  imagePath: string,
): PbnHeroPictureSources {
  const basePath = imagePath.replace(IMAGE_EXTENSION_REGEX, '');

  return {
    mobile: `${basePath}-mobile.avif`,
    tablet: `${basePath}-tablet.avif`,
    desktop: `${basePath}-desktop.avif`,
    fallback: `${basePath}-desktop.webp`,
  };
}

export function PbnHeroPicture({
  sources,
  className,
  imageClassName,
}: {
  sources: PbnHeroPictureSources;
  alt?: string;
  className?: string;
  imageClassName?: string;
}) {
  const style = {
    '--pbn-hero-bg-mobile': `url("${sources.mobile}")`,
    '--pbn-hero-bg-tablet': `url("${sources.tablet}")`,
    '--pbn-hero-bg-desktop': `url("${sources.desktop}")`,
  } as CSSProperties;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={sources.mobile}
        type="image/avif"
        media="(max-width: 640px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={sources.tablet}
        type="image/avif"
        media="(min-width: 641px) and (max-width: 1024px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={sources.desktop}
        type="image/avif"
        media="(min-width: 1025px)"
        fetchPriority="high"
      />
      <div
        aria-hidden={true}
        className={cn(
          "absolute inset-0 overflow-hidden before:absolute before:inset-0 before:bg-cover before:bg-center before:bg-no-repeat before:bg-[image:var(--pbn-hero-bg-mobile)] before:content-[''] md:before:bg-[image:var(--pbn-hero-bg-tablet)] lg:before:bg-[image:var(--pbn-hero-bg-desktop)]",
          className,
          imageClassName,
        )}
        style={style}
      />
    </>
  );
}
