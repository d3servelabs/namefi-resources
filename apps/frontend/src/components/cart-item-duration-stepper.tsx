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
  if (constraints.status === 'loading') {
    return (
      <div className="w-32 h-10 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  // Show error state with appropriate message
  if (constraints.status === 'error') {
    // Show different text based on the error code
    const getErrorText = (errorCode: string) => {
      switch (errorCode) {
        case 'DOMAIN_EXPIRED':
          return 'Expired';
        case 'MAX_REGISTRATION_REACHED':
          return 'Max period';
        case 'EXPIRATION_TIME_UNAVAILABLE':
        case 'DURATION_VALIDATION_MISSING':
          return 'Data missing';
        case 'DOMAIN_DETAILS_LOAD_FAILED':
        case 'AVAILABILITY_INFO_LOAD_FAILED':
        case 'AVAILABILITY_INFO_UNAVAILABLE':
          return 'Load failed';
        default:
          return 'Cannot renew';
      }
    };

    return (
      <div className="w-32 h-10 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-md opacity-50 cursor-not-allowed">
        {getErrorText(constraints.errorCode)}
      </div>
    );
  }

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
