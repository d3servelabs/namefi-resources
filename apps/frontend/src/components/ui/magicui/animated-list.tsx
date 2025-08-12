'use client';

import { cn } from '@/lib/cn';
import { AnimatePresence, motion } from 'motion/react';
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from 'react';

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    useEffect(() => {
      if (childrenArray.length === 0) return;

      const interval = setInterval(() => {
        setIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearInterval(interval);
    }, [delay, childrenArray.length]);

    const itemsToShow = useMemo(() => {
      if (childrenArray.length === 0) return [];

      // First cycle: show items progressively (0, then 0+1, then 0+1+2, etc.)
      if (index < childrenArray.length) {
        return childrenArray.slice(0, index + 1).reverse();
      }

      // After first cycle: rotate all items continuously
      const rotationIndex =
        (index - childrenArray.length) % childrenArray.length;
      const rotatedArray = [
        ...childrenArray.slice(rotationIndex),
        ...childrenArray.slice(0, rotationIndex),
      ];

      return rotatedArray.reverse();
    }, [index, childrenArray]);

    return (
      <div
        className={cn('flex flex-col items-center gap-4', className)}
        {...props}
      >
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = 'AnimatedList';
