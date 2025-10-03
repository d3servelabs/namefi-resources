'use client';

import { cn } from '@/lib/cn';
import { Button, type ButtonProps } from '@/components/ui/shadcn/button';
import { motion, type MotionProps } from 'motion/react';
import React from 'react';

const overlayAnimation = {
  transition: {
    repeat: Number.POSITIVE_INFINITY,
    repeatType: 'loop' as const,
    ease: 'linear' as const,
    duration: 2.4,
  },
};

const MotionButton = motion.create(Button);

export type ShinyButtonProps = ButtonProps & MotionProps;

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  ShinyButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <MotionButton
      ref={ref}
      className={cn(
        'relative overflow-hidden transition-shadow duration-300 ease-in-out',
        'backdrop-blur-xl border border-transparent',
        '[&:not(:hover)]:bg-transparent',
        'dark:[&:not(:hover)]:bg-transparent',
        className,
      )}
      {...props}
    >
      <motion.span
        aria-hidden
        className="relative flex items-center justify-center size-full"
        style={{
          ['--x' as unknown as string]: '125%',
          maskImage:
            'linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))',
          WebkitMaskImage:
            'linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))',
        }}
        animate={{ ['--x' as unknown as string]: '-125%' }}
        transition={overlayAnimation.transition}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 block rounded-[inherit] p-px"
        style={{
          ['--x' as unknown as string]: '125%',
          mask: 'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))',
          WebkitMask:
            'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))',
          backgroundImage:
            'linear-gradient(-75deg,var(--primary)/10% calc(var(--x)+20%),var(--primary)/50% calc(var(--x)+25%),var(--primary)/10% calc(var(--x)+100%))',
        }}
        animate={{ ['--x' as unknown as string]: '-125%' }}
        transition={overlayAnimation.transition}
      />
    </MotionButton>
  );
});

ShinyButton.displayName = 'ShinyButton';
