import { type VariantProps, cva } from 'class-variance-authority';
import {
  CircleIcon,
  Loader2Icon,
  SquareIcon,
  TriangleIcon,
} from 'lucide-react';
import {
  type FC,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';

const loadingVariants = cva('relative flex items-center justify-center gap-2', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    color: {
      default: 'text-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary',
      muted: 'text-muted-foreground',
      accent: 'text-accent',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    },
    variant: {
      spinner: 'animate-spin',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'spinner',
  },
});

export interface LoadingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof loadingVariants> {
  disabled?: boolean;
  loading?: boolean;
  showText?: boolean;
  text?: string;
  icon?: 'circle' | 'square' | 'triangle' | 'loader';
  fullscreen?: boolean;
  variant?: 'spinner' | 'pulse' | 'bounce';
}

export const Loading: FC<LoadingProps> = forwardRef(
  (
    {
      // disabled = false,
      loading = true,
      showText = true,
      text = 'Loading...',
      icon = 'loader',
      size,
      variant = 'spinner',
      color,
      fullscreen = false,
      className,
      ...rest
    }: LoadingProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    if (!loading) {
      return null;
    }

    const IconComponent = {
      circle: CircleIcon,
      square: SquareIcon,
      triangle: TriangleIcon,
      loader: Loader2Icon,
    }[icon];

    const content = (
      <div
        className={loadingVariants({ size, color, className })}
        ref={ref}
        {...rest}
      >
        <IconComponent className={iconVariants({ size, variant })} />
        {showText && <span>{text}</span>}
      </div>
    );

    if (fullscreen) {
      return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          {content}
        </div>
      );
    }

    return content;
  },
);

Loading.displayName = 'Loading';
