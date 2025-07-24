import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/shadcn/button';
import { forwardRef, useState } from 'react';
import { Loader2, Heart } from 'lucide-react';

export type WishlistButtonState =
  | 'wishlisted'
  | 'not-wishlisted'
  | 'adding'
  | 'removing';

export interface AnimatedWishlistButtonProps
  extends Omit<ComponentProps<'button'>, 'children'> {
  state: WishlistButtonState;
  onToggle?: () => void;
  'aria-label'?: string;
  disabled?: boolean;
}

const stateConfig = {
  'not-wishlisted': {
    icon: Heart,
    className:
      'text-gray-400 hover:text-pink-500 bg-transparent hover:bg-pink-500/10',
    spinning: false,
    filled: false,
  },
  wishlisted: {
    icon: Heart,
    className: 'text-pink-500 bg-pink-500/10',
    spinning: false,
    filled: true,
  },
  adding: {
    icon: Loader2,
    className: 'text-pink-500 bg-pink-500/10',
    spinning: true,
    filled: false,
  },
  removing: {
    icon: Loader2,
    className: 'text-gray-400 bg-transparent',
    spinning: true,
    filled: false,
  },
};

export const AnimatedWishlistButton = forwardRef<
  HTMLButtonElement,
  AnimatedWishlistButtonProps
>(
  (
    { state, onToggle, className, disabled, 'aria-label': ariaLabel, ...props },
    ref,
  ) => {
    const [isBouncing, setIsBouncing] = useState(false);
    const config = stateConfig[state];
    const IconComponent = config.icon;
    const isBusy = state === 'adding' || state === 'removing' || disabled;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBusy) return;
      setIsBouncing(true);
      onToggle?.();
      setTimeout(() => setIsBouncing(false), 350);
    };

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(
          'relative group transition-all',
          config.className,
          isBusy && 'opacity-60 pointer-events-none',
          className,
        )}
        aria-label={ariaLabel}
        onClick={handleClick}
        tabIndex={0}
        disabled={isBusy}
        {...props}
      >
        {config.spinning ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <motion.span
            animate={isBouncing ? { scale: 1.2 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="flex items-center justify-center"
          >
            <IconComponent
              className={cn(
                'w-6 h-6 transition-transform',
                config.filled ? 'fill-pink-500' : 'fill-none',
              )}
              fill={config.filled ? 'currentColor' : 'none'}
            />
          </motion.span>
        )}
        <span className="sr-only">{ariaLabel}</span>
      </Button>
    );
  },
);

AnimatedWishlistButton.displayName = 'AnimatedWishlistButton';
