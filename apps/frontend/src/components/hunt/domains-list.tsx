import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from 'motion/react';
import { DomainItemSkeleton } from './domain-item-skeleton';
import {
  type Domain,
  DomainsListItem,
  type DomainsListItemProps,
} from './domains-list-item';
import { useAnimatedList } from '@/hooks/use-animated-list';

export interface DomainsListProps extends Omit<DomainsListItemProps, 'domain'> {
  domains: Domain[];
  isLoading?: boolean;
  isError?: boolean;
  skeletonCount?: number;
}

export const DomainsList = ({
  domains,
  isLoading,
  isError,
  skeletonCount = 1,
  upvote,
  unvote,
  isVotePending,
}: DomainsListProps) => {
  const shouldReduceMotion = useReducedMotion();

  const {
    containerVariants,
    itemVariants,
    getItemTransition,
    getItemStyle,
    isItemReordering,
    onLayoutAnimationComplete,
    getItemKey,
  } = useAnimatedList(domains, {
    reduceMotion: shouldReduceMotion ?? false,
    staggerDelay: 0.08,
    layoutDuration: 0.8,
  });

  return (
    <LayoutGroup>
      <motion.div
        className="divide-y divide-border"
        layout="position"
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
                key={getItemKey(domain.domainName)}
                layoutId={getItemKey(domain.domainName)}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout="position"
                transition={getItemTransition(domain.domainName)}
                style={getItemStyle(domain.domainName)}
                className={isItemReordering(domain.domainName) ? 'z-10' : ''}
                onLayoutAnimationComplete={onLayoutAnimationComplete}
              >
                <DomainsListItem
                  domain={domain}
                  upvote={upvote}
                  unvote={unvote}
                  isVotePending={isVotePending}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </LayoutGroup>
  );
};
