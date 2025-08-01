import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from 'motion/react';
import { DomainItemSkeleton } from './domain-item-skeleton';
import { type Domain, DomainsListItem } from './domains-list-item';
import { useAnimatedList } from '@/hooks/use-animated-list';

export const DomainsList = ({
  domains,
  isLoading,
  isError,
  skeletonCount = 1,
}: {
  domains: Domain[];
  isLoading?: boolean;
  isError?: boolean;
  skeletonCount?: number;
}) => {
  const shouldReduceMotion = useReducedMotion();

  const {
    containerVariants,
    itemVariants,
    getItemTransition,
    getItemStyle,
    isItemReordering,
    onLayoutAnimationComplete,
  } = useAnimatedList(domains, {
    reduceMotion: shouldReduceMotion ?? false,
    staggerDelay: 0.08,
    layoutDuration: 0.8,
  });

  return (
    <LayoutGroup>
      <motion.div
        className="divide-y divide-border"
        layout
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {isLoading && <DomainItemSkeleton count={skeletonCount} />}
        {isError && (
          <motion.div
            className="p-8 text-center text-red-500"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Failed to load domains
          </motion.div>
        )}

        {isLoading || isError ? null : domains.length === 0 ? (
          <motion.div
            className="p-8 text-center text-muted-foreground"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            No more domains, please try again later.
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {domains.map((domain) => (
              <motion.div
                key={domain.domainName}
                layoutId={`domain-${domain.domainName}`}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                transition={getItemTransition(domain.domainName)}
                style={getItemStyle(domain.domainName)}
                className={isItemReordering(domain.domainName) ? 'z-10' : ''}
                onLayoutAnimationComplete={onLayoutAnimationComplete}
              >
                <DomainsListItem domain={domain} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </LayoutGroup>
  );
};
