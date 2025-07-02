import { DurationStepper } from '@/components/duration-stepper';
import { useRenewalDurationConstraints } from '@/hooks/use-renewal-duration-constraints';
import { itemTypeSchema } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { Loader2 } from 'lucide-react';
import type { CartItemSelect } from '@namefi-astra/db/types';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';

interface CartItemSelectWithDomainAvailabilityInfo
  extends Omit<CartItemSelect, 'metadata' | 'updatedAt' | 'userId'> {
  metadata?: unknown;
  updatedAt?: CartItemSelect['updatedAt'];
  userId?: CartItemSelect['userId'];
  domainAvailabilityInfo?: DomainAvailabilityInfo;
}

// Component to handle duration controls for different cart item types
export function CartItemDurationControl({
  item,
  onDurationChange,
  isDisabled,
}: {
  item: CartItemSelectWithDomainAvailabilityInfo;
  onDurationChange: (itemId: string, newDuration: number) => void;
  isDisabled: boolean;
}) {
  // For IMPORT items, always show "1 year" (no duration control)
  if (item.type === itemTypeSchema.Values.IMPORT) {
    return (
      <div className="w-32 h-10 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md">
        1 year
      </div>
    );
  }

  // For RENEW items, use specialized renewal constraints
  if (item.type === itemTypeSchema.Values.RENEW) {
    return (
      <RenewalDurationStepper
        item={item}
        onDurationChange={onDurationChange}
        isDisabled={isDisabled}
      />
    );
  }

  // For REGISTER items, use standard duration validation
  return (
    <DurationStepper
      value={item.durationInYears}
      onChange={(value) => onDurationChange(item.id, value)}
      min={item.domainAvailabilityInfo?.durationValidationInYears?.min ?? 1}
      max={item.domainAvailabilityInfo?.durationValidationInYears?.max ?? 10}
      disabled={isDisabled || !item.domainAvailabilityInfo}
      className="w-32"
    />
  );
}

// Component specifically for renewal duration stepping
function RenewalDurationStepper({
  item,
  onDurationChange,
  isDisabled,
}: {
  item: CartItemSelectWithDomainAvailabilityInfo;
  onDurationChange: (itemId: string, newDuration: number) => void;
  isDisabled: boolean;
}) {
  const constraints = useRenewalDurationConstraints(
    item.normalizedDomainName as NamefiNormalizedDomain,
  );

  // Show loading state while calculating constraints
  if (constraints.isLoading) {
    return (
      <div className="w-32 h-10 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  // Show error state or fall back to fixed duration
  if (constraints.error || constraints.maxYears < 1) {
    return (
      <div className="w-32 h-10 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md">
        {constraints.maxYears < 1 ? 'Cannot renew' : '1 year'}
      </div>
    );
  }

  // Show duration stepper with calculated constraints
  return (
    <DurationStepper
      value={item.durationInYears}
      onChange={(value) => onDurationChange(item.id, value)}
      min={constraints.minYears}
      max={constraints.maxYears}
      disabled={isDisabled}
      className="w-32"
    />
  );
}
