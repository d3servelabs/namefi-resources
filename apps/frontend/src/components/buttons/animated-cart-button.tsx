'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import type { ComponentProps } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { forwardRef, useState } from 'react';
import { Loader2, ShoppingCart, Check, Download, Trash } from 'lucide-react';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';

type CartButtonState =
  | 'add-to-cart'
  | 'import'
  | 'adding'
  | 'in-cart'
  | 'removing';

type AnimatedCartButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  state: CartButtonState;
  onAdd?: () => void;
  onRemove?: () => void;
  onGoToCart?: () => void;
  mainDisabled?: boolean;
  showRemoveButton?: boolean;
  children?: never;
};

const stateConfig = {
  'add-to-cart': {
    icon: ShoppingCart,
    text: 'Add to cart',
    className:
      'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90',
    spinning: false,
  },
  import: {
    icon: Download,
    text: 'Import',
    className:
      'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90',
    spinning: false,
  },
  adding: {
    icon: Loader2,
    text: 'Adding...',
    className: 'bg-brand-primary text-primary-foreground',
    spinning: true,
  },
  'in-cart': {
    icon: Check,
    text: 'In cart',
    className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    spinning: false,
  },
  removing: {
    icon: Loader2,
    text: 'Removing...',
    className: 'bg-secondary text-secondary-foreground',
    spinning: true,
  },
};

export const AnimatedCartButton = forwardRef<
  HTMLButtonElement,
  AnimatedCartButtonProps
>(
  (
    {
      state,
      onAdd,
      onRemove,
      onGoToCart,
      mainDisabled = false,
      showRemoveButton = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const isMobile = useIsMobile();
    const removeButtonSize = isMobile ? 'icon-sm' : 'icon';

    const config = stateConfig[state];

    // Override config for in-cart hover state
    const displayConfig =
      state === 'in-cart' && isHovered
        ? { ...config, text: 'View cart', icon: ShoppingCart }
        : config;

    const DisplayIconComponent = displayConfig.icon;

    const handleClick = () => {
      switch (state) {
        case 'add-to-cart':
        case 'import':
          onAdd?.();
          break;
        case 'in-cart':
          onGoToCart?.();
          break;
        case 'removing':
          // No action while removing
          break;
        case 'adding':
          // No action while adding
          break;
      }
    };

    const isInCart = state === 'in-cart';
    const shouldShowRemove = isInCart && showRemoveButton;
    const isDisabled =
      state === 'adding' || state === 'removing' || props.disabled;
    const isMainDisabled = isDisabled || mainDisabled;
    const mainButtonAriaLabel =
      props['aria-label'] ?? (isInCart ? 'View cart' : config.text);

    return (
      <div className="flex gap-x-2 shrink-0">
        {/* Remove button - only shown when in cart and showRemoveButton is true */}
        <AnimatePresence>
          {shouldShowRemove && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Button
                size={removeButtonSize}
                aria-label="Remove from cart"
                className="bg-secondary text-secondary-foreground hover:bg-red-600/80 transition-colors duration-200 rounded-md shrink-0 disabled:opacity-100 flex items-center justify-center"
                onClick={onRemove}
                disabled={isDisabled}
              >
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <Trash className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main cart button */}
        <div className="shrink-0">
          <Button
            ref={ref}
            {...props}
            className={cn(
              'shrink-0 md:w-44 transition-all duration-300 disabled:opacity-100',
              config.className,
              className,
            )}
            size={isMobile ? 'icon' : 'default'}
            aria-label={mainButtonAriaLabel}
            onClick={handleClick}
            disabled={isMainDisabled}
            onMouseEnter={
              state === 'in-cart' ? () => setIsHovered(true) : undefined
            }
            onMouseLeave={
              state === 'in-cart' ? () => setIsHovered(false) : undefined
            }
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                {config.spinning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                  >
                    <DisplayIconComponent className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <DisplayIconComponent className="h-4 w-4" />
                )}
              </div>
              <span className="whitespace-nowrap hidden md:block">
                {displayConfig.text}
              </span>
            </div>
          </Button>
        </div>
      </div>
    );
  },
);

AnimatedCartButton.displayName = 'AnimatedCartButton';
