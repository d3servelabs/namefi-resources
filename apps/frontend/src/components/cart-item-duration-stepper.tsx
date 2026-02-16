import { DurationStepper } from '@/components/duration-stepper';
import { useRenewalDurationConstraints } from '@/hooks/use-renewal-duration-constraints';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Loader2 } from 'lucide-react';
import type { UnifiedCartItem as CartItem } from '@/hooks/use-cart';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';

function getAllowedDurationValuesForDomain(
  domainName: string,
  min: number,
  max: number,
) {
  const labels = domainName.split('.');
  const isSecondLevelAiDomain =
    labels.length === 2 && labels[1]?.toLowerCase() === 'ai';

  if (!isSecondLevelAiDomain) {
    return undefined;
  }

  const allowedValues: number[] = [];
  for (let value = min; value <= max; value += 2) {
    allowedValues.push(value);
  }

  return allowedValues.length > 0 ? allowedValues : undefined;
}

// Component to handle duration controls for different cart item types
export function CartItemDurationControl({
  item,
  domainAvailabilityInfo,
  onDurationChange,
  isDisabled,
}: {
  item: CartItem;
  domainAvailabilityInfo?: DomainAvailabilityInfo;
  onDurationChange: (itemId: string, newDuration: number) => void;
  isDisabled: boolean;
}) {
  // For RENEW items, use specialized renewal constraints
  if (item.type === itemTypeSchema.enum.RENEW) {
    return (
      <RenewalDurationStepper
        item={item}
        onDurationChange={onDurationChange}
        isDisabled={isDisabled}
      />
    );
  }

  const minYears = domainAvailabilityInfo?.durationValidationInYears?.min ?? 1;
  const maxYears = domainAvailabilityInfo?.durationValidationInYears?.max ?? 10;
  const allowedValues = getAllowedDurationValuesForDomain(
    item.normalizedDomainName,
    minYears,
    maxYears,
  );

  // For REGISTER and IMPORT items, use standard duration validation
  return (
    <DurationStepper
      value={item.durationInYears}
      onChange={(value) => onDurationChange(item.id, value)}
      min={minYears}
      max={maxYears}
      allowedValues={allowedValues}
      disabled={isDisabled || !domainAvailabilityInfo}
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
  item: CartItem;
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

  const allowedValues = getAllowedDurationValuesForDomain(
    item.normalizedDomainName,
    constraints.minYears,
    constraints.maxYears,
  );

  return (
    <DurationStepper
      value={item.durationInYears}
      onChange={(value) => onDurationChange(item.id, value)}
      min={constraints.minYears}
      max={constraints.maxYears}
      allowedValues={allowedValues}
      disabled={isDisabled}
      className="w-32"
    />
  );
}
