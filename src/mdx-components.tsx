import Image from 'next/image';
import type { MDXComponents } from 'mdx/types';
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from 'react';

const cx = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(' ');

const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 675;

type MDXImageProps = Omit<
  ComponentProps<typeof Image>,
  'src' | 'alt' | 'width' | 'height' | 'fill'
> & {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
};

function parseDimension(value?: number | string): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
}

const MDXImage = ({
  src,
  alt = '',
  width,
  height,
  className,
  sizes = '(min-width: 768px) 768px, 100vw',
  ...props
}: MDXImageProps) => {
  if (!src) return null;
  const resolvedWidth = parseDimension(width) ?? DEFAULT_IMAGE_WIDTH;
  const resolvedHeight = parseDimension(height) ?? DEFAULT_IMAGE_HEIGHT;
  const aspectRatio = resolvedWidth / resolvedHeight;

  return (
    <span
      className="relative block overflow-hidden rounded-3xl"
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cx('object-cover object-center', className)}
        {...props}
      />
    </span>
  );
};

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-4xl px-6 py-16 md:px-8 md:py-20 lg:max-w-6xl">
    <article className="prose prose-invert prose-lg md:prose-xl prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-em:text-foreground prose-a:font-semibold prose-a:no-underline prose-hr:border-border/60 prose-table:border-border/60 prose-table:text-foreground prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/60 prose-pre:text-sm prose-code:text-foreground/90">
      {children}
    </article>
  </div>
);

const Anchor = ({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    {...props}
    className={cx(
      'font-semibold text-brand-primary underline decoration-brand-primary/20 underline-offset-4 transition hover:text-brand-secondary hover:decoration-brand-secondary/40',
      className,
    )}
  >
    {children}
  </a>
);

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    a: Anchor,
    Image: MDXImage,
    img: MDXImage,
    wrapper: Wrapper,
    ...components,
  };
}
