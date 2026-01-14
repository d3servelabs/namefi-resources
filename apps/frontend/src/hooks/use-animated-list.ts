import { useEffect, useRef, useState, useMemo, useId } from 'react';
import type { Domain } from '@/components/hunt/domains-list-item';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

interface UseAnimatedListOptions {
  /**
   * Delay between staggered animations in seconds
   */
  staggerDelay?: number;
  /**
   * Duration for layout animations in seconds
   */
  layoutDuration?: number;
  /**
   * Whether to enable reduced motion for accessibility
   */
  reduceMotion?: boolean;
}

export function useAnimatedList(
  items: Domain[],
  options: UseAnimatedListOptions = {},
) {
  const {
    staggerDelay = 0.08,
    layoutDuration = 0.8,
    reduceMotion = false,
  } = options;

  // Generate unique ID for this list instance to prevent cross-contamination
  const listId = useId();

  const prevItemsRef = useRef<Domain[]>([]);
  const [reorderingItems, setReorderingItems] = useState<
    Set<NamefiNormalizedDomain>
  >(new Set());

  // Track which items have changed position
  const itemChanges = useMemo(() => {
    const prev = prevItemsRef.current;
    const current = items;

    if (prev.length === 0) {
      return {
        new: new Set(current.map((item) => item.domainName)),
        moved: new Set<NamefiNormalizedDomain>(),
      };
    }

    const prevPositions = new Map(
      prev.map((item, index) => [item.domainName, index]),
    );

    const newItems = new Set<NamefiNormalizedDomain>();
    const movedItems = new Set<NamefiNormalizedDomain>();

    current.forEach((item, currentIndex) => {
      const prevIndex = prevPositions.get(item.domainName);

      if (prevIndex === undefined) {
        newItems.add(item.domainName);
      } else if (prevIndex !== currentIndex) {
        movedItems.add(item.domainName);
      }
    });

    return { new: newItems, moved: movedItems };
  }, [items]);

  // Update previous items reference
  useEffect(() => {
    prevItemsRef.current = items;
  }, [items]);

  // Track reordering state
  useEffect(() => {
    if (itemChanges.moved.size > 0) {
      setReorderingItems(itemChanges.moved);
    }
  }, [itemChanges.moved]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : staggerDelay,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 20,
      scale: reduceMotion ? 1 : 0.95,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: reduceMotion ? 'tween' : 'spring',
        stiffness: 300,
        damping: 24,
        duration: reduceMotion ? 0.2 : undefined,
      },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -20,
      scale: reduceMotion ? 1 : 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const getItemTransition = (_domainName: NamefiNormalizedDomain) => ({
    layout: {
      type: reduceMotion ? 'tween' : ('spring' as const),
      bounce: reduceMotion ? 0 : 0.2,
      duration: reduceMotion ? 0.3 : layoutDuration,
    },
  });

  const getItemStyle = (domainName: NamefiNormalizedDomain) => ({
    position: 'relative' as const,
    zIndex: reorderingItems.has(domainName) ? 10 : 1,
  });

  const isItemReordering = (domainName: NamefiNormalizedDomain) =>
    reorderingItems.has(domainName);
  const isItemNew = (domainName: NamefiNormalizedDomain) =>
    itemChanges.new.has(domainName);

  const onLayoutAnimationComplete = () => {
    setReorderingItems(new Set());
  };

  // Generate unique key for each item to prevent cross-contamination between lists
  const getItemKey = (domainName: NamefiNormalizedDomain) =>
    `${listId}-${domainName}`;

  return {
    containerVariants,
    itemVariants,
    getItemTransition,
    getItemStyle,
    isItemReordering,
    isItemNew,
    onLayoutAnimationComplete,
    getItemKey,
    itemChanges,
    reorderingItems: Array.from(reorderingItems),
  };
}
