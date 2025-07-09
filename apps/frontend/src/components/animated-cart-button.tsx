'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/shadcn/button';
import { forwardRef, useState } from 'react';
import { Loader2, ShoppingCart, Check, Download, Trash } from 'lucide-react';

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
    className: 'bg-secondary text-white',
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
      showRemoveButton = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);

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

    return (
      <div className="flex space-x-2 shrink-0">
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
                className="bg-secondary text-secondary-foreground hover:bg-red-600/80 transition-colors duration-200 px-3 rounded-md shrink-0 disabled:opacity-100 flex items-center justify-center"
                onClick={onRemove}
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
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            layout: { duration: 0.3, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
          }}
        >
          <Button
            ref={ref}
            className={cn(
              'shrink-0 w-44 transition-all duration-300 disabled:opacity-100',
              config.className,
              className,
            )}
            onClick={handleClick}
            disabled={isDisabled}
            onMouseEnter={
              state === 'in-cart' ? () => setIsHovered(true) : undefined
            }
            onMouseLeave={
              state === 'in-cart' ? () => setIsHovered(false) : undefined
            }
            {...props}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={state === 'in-cart' ? `${state}-${isHovered}` : state}
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: config.spinning ? 360 : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.15,
                    rotate: config.spinning
                      ? {
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'linear',
                        }
                      : {},
                  }}
                >
                  <DisplayIconComponent className="h-4 w-4" />
                </motion.div>
                <motion.span
                  className="whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                >
                  {displayConfig.text}
                </motion.span>
              </motion.div>
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    );
  },
);

AnimatedCartButton.displayName = 'AnimatedCartButton';
