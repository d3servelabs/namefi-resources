'use client';

import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { PageShell } from '@/components/page-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';

import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import {
  convertToDrizzlerFilterOptions,
  useDrizzlerServerFilterStrategy,
} from '@/components/table/filters';
import { useAuth } from '@/hooks/use-auth';
import { useEmailPrompt } from '@/hooks/use-email-prompt';
import {
  useDomainRenewal,
  type RenewalResult,
} from '@/hooks/use-domain-renewal';
import { AddressWithChain } from '@/components/address-with-chain';
import { cn } from '@/lib/cn';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/lib/trpc';
import { formatAmountInUSD } from '@/lib/number';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Label } from '@/components/ui/shadcn/label';
import confetti from 'canvas-confetti';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import {
  CHAINS,
  getNftExplorerUrl,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Loader2,
  SearchIcon,
  MoreVertical,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import {
  type FC,
  type HTMLAttributes,
  type CSSProperties,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isPast,
} from 'date-fns';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import NumberFlow, { NumberFlowGroup, useCanAnimate } from '@number-flow/react';
import { Separator } from '@/components/ui/shadcn/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import {
  EmailRequiredModal,
  DNS_MANAGEMENT_EMAIL_REQUIRED,
} from '@/components/dialogs/email-required-dialog';
import { applyDrizzlerFilterOnDataset } from '@samyx/drizzler-filters-sorters/experimental';
import { useIsMobile } from '@/hooks/use-mobile';
import { groupBy } from 'ramda';
import { MyPreviouslyOwnedDomainsContent } from '@/components/my-previously-owned-domains';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { DnsStatusCell } from '@/components/domain-and-dns-managment/cells/dns-status-cell';
import { BatchDnsDialog } from '@/components/domain-and-dns-managment/dialogs/batch-dns-dialog';
import {
  CalendarPlus,
  BadgeDollarSign,
  Compass,
  Server,
  Globe,
  Mail,
  Hexagon,
  Link as LinkIcon,
  X,
} from 'lucide-react';

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

const DEFAULT_DOMAIN_LIST_PAGE_SIZE = 500;

function getRenewalPriceUsdPerYearForDomain(
  normalizedDomainName: string | null | undefined,
  renewalPriceUsdPerYearByTld: Map<string, number | null>,
) {
  const domainName = normalizedDomainName ?? '';
  const tld = domainName.split('.').pop()?.toLowerCase() ?? '';
  return tld === '' ? null : (renewalPriceUsdPerYearByTld.get(tld) ?? null);
}

// Helper function to format time left with simplified display
// Returns: "Xd" if less than 30 days, "Xm+" if less than 12 months, "Xy+" if more than a year
const formatTimeLeft = (
  expirationDate: string | Date | null | undefined,
): string => {
  if (!expirationDate) return '-';

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return '-';

  const now = new Date();
  const isExpired = isPast(expiry);

  if (isExpired) return 'Expired';

  const daysLeft = differenceInDays(expiry, now);
  const monthsLeft = differenceInMonths(expiry, now);
  const yearsLeft = differenceInYears(expiry, now);

  // Less than 1 full calendar month: show days
  if (monthsLeft < 1) {
    return `${daysLeft}d`;
  }

  // Less than 12 months: show months with + if there are extra days
  if (monthsLeft < 12) {
    const extraDays = daysLeft - monthsLeft * 30;
    return extraDays > 0 ? `${monthsLeft}m+` : `${monthsLeft}m`;
  }

  // More than a year: show years with + if there are extra months
  const extraMonths = monthsLeft - yearsLeft * 12;
  return extraMonths > 0 ? `${yearsLeft}y+` : `${yearsLeft}y`;
};

// Helper function to format expiration date in ISO format yyyy-mm-dd (UTC)
// Uses UTC to avoid timezone-shift issues where a UTC midnight date
// could display as the previous day for users in western timezones
const formatExpirationDateISO = (
  expirationDate: string | Date | null | undefined,
): string => {
  if (!expirationDate) return '-';

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return '-';

  return expiry.toISOString().slice(0, 10);
};

// Animated Auto-Renew Toggle with celebration
interface AnimatedAutoRenewToggleProps {
  checked: boolean;
  onCheckedChange: (
    checked: boolean,
    position: { x: number; y: number } | null,
  ) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const triggerCelebrationAtPosition = (x: number, y: number) => {
  const colors = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

  // Small burst from the toggle position
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    colors,
    startVelocity: 15,
    gravity: 0.6,
    scalar: 0.5,
    ticks: 40,
    shapes: ['circle'],
    drift: 0,
  });
};

const AnimatedAutoRenewToggle: FC<AnimatedAutoRenewToggleProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  isLoading = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    if (disabled || isLoading) return;

    const newValue = !checked;

    // Calculate position for potential celebration (passed to handler)
    let position: { x: number; y: number } | null = null;
    if (newValue && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      position = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    onCheckedChange(newValue, position);
  }, [checked, onCheckedChange, disabled, isLoading]);

  // Determine thumb style based on loading state
  const thumbStyle: CSSProperties = isLoading
    ? {
        animation: checked
          ? 'oscillateOn 0.8s ease-in-out infinite'
          : 'oscillateOff 0.8s ease-in-out infinite',
      }
    : {
        transform: checked ? 'translateX(28px)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
      };

  // Ghost style for ON, muted yellow for OFF
  const trackStyle: CSSProperties = {
    background: checked
      ? 'rgba(34, 197, 94, 0.08)' // Green ghost (ultra subtle)
      : 'rgba(234, 179, 8, 0.25)', // Yellow muted
    transition: 'background 0.3s ease',
  };

  const thumbColor = checked ? 'rgba(34, 197, 94, 0.5)' : '#ca8a04'; // Semi-transparent green for ON (ghost), dark yellow for OFF

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || isLoading}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
      )}
      style={trackStyle}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {/* ON/OFF text labels */}
      <span
        className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
        style={{
          color: checked ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
        }}
      >
        ON
      </span>
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
        style={{
          color: checked ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
        }}
      >
        OFF
      </span>

      {/* Thumb */}
      <span
        className="pointer-events-none absolute block rounded-full shadow-lg ring-0"
        style={{
          ...thumbStyle,
          width: '22px',
          height: '22px',
          top: '3px',
          left: '3px',
          background: thumbColor,
        }}
      />
    </motion.button>
  );
};

// Bulk Auto-Renew Toggle with three states: off, mixed, on
type BulkAutoRenewState = 'off' | 'mixed' | 'on';

interface BulkAutoRenewToggleProps {
  state: BulkAutoRenewState;
  onStateChange: (
    newState: 'off' | 'on',
    position: { x: number; y: number } | null,
  ) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const BulkAutoRenewToggle: FC<BulkAutoRenewToggleProps> = ({
  state,
  onStateChange,
  disabled = false,
  isLoading = false,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const midpoint = rect.width / 2;

      // UX: Click position determines state (left=off, right=on)
      // This allows users to explicitly choose the desired state
      // rather than cycling through states, which is clearer for bulk actions
      // when domains have mixed auto-renew states
      const newState = clickX < midpoint ? 'off' : 'on';

      // Calculate position for potential celebration
      let position: { x: number; y: number } | null = null;
      if (newState === 'on') {
        position = {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        };
      }

      onStateChange(newState, position);
    },
    [onStateChange, disabled, isLoading],
  );

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onStateChange('off', null);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStateChange('on', null);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Toggle: if on -> off, otherwise (off or mixed) -> on
          onStateChange(state === 'on' ? 'off' : 'on', null);
          break;
      }
    },
    [onStateChange, disabled, isLoading, state],
  );

  // Determine thumb position: off=left (0), mixed=center (8px), on=right (28px)
  const getThumbTransform = () => {
    if (isLoading) return undefined; // Will use animation instead
    switch (state) {
      case 'off':
        return 'translateX(0)';
      case 'mixed':
        return 'translateX(8px)'; // Center position for 36px toggle with 14px thumb
      case 'on':
        return 'translateX(28px)';
    }
  };

  // Get animation based on state to match static positions
  const getLoadingAnimation = () => {
    switch (state) {
      case 'on':
        return 'oscillateOn 0.8s ease-in-out infinite';
      case 'mixed':
        return 'oscillateMixed 0.8s ease-in-out infinite';
      case 'off':
        return 'oscillateOff 0.8s ease-in-out infinite';
    }
  };

  // Determine thumb style based on loading state
  const thumbStyle: CSSProperties = isLoading
    ? {
        animation: getLoadingAnimation(),
      }
    : {
        transform: getThumbTransform(),
        transition: 'transform 0.3s ease',
      };

  // Track background color based on state (ghost for ON, muted yellow for OFF)
  const getTrackStyle = (): CSSProperties => {
    switch (state) {
      case 'on':
        return { background: 'rgba(34, 197, 94, 0.08)' }; // Green ghost (ultra subtle)
      case 'mixed':
        return { background: 'rgba(234, 179, 8, 0.25)' }; // Yellow muted
      case 'off':
        return { background: 'rgba(234, 179, 8, 0.25)' }; // Yellow muted
    }
  };

  // Thumb color based on state
  const getThumbColor = () => {
    switch (state) {
      case 'on':
        return 'rgba(34, 197, 94, 0.5)'; // Semi-transparent green (ghost)
      case 'mixed':
        return '#ca8a04'; // Dark yellow/amber
      case 'off':
        return '#ca8a04'; // Dark yellow
    }
  };

  // Show text labels only when not in mixed state
  const showTextLabels = state !== 'mixed';

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
      disabled={disabled || isLoading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        showTextLabels ? 'w-14' : 'w-9', // Wider when showing text labels
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
      )}
      style={getTrackStyle()}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {/* ON/OFF text labels - only show when not mixed */}
      {showTextLabels && (
        <>
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
            style={{
              color:
                state === 'on' ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
            }}
          >
            ON
          </span>
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold leading-none tracking-wider transition-colors duration-300 pointer-events-none"
            style={{
              color:
                state === 'off' ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
            }}
          >
            OFF
          </span>
        </>
      )}

      {/* Thumb */}
      <span
        className="pointer-events-none absolute block rounded-full shadow-lg ring-0"
        style={{
          ...thumbStyle,
          width: state === 'mixed' ? '14px' : '22px', // Smaller thumb for mixed state
          height: state === 'mixed' ? '14px' : '22px',
          top: state === 'mixed' ? '7px' : '3px', // Center vertically for mixed (28-14)/2 = 7px
          left: '3px',
          background: getThumbColor(),
        }}
      />
    </motion.button>
  );
};

const RenewPricePremiumInfo: FC<{ domainName: string }> = ({ domainName }) => {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild={true}>
        <button
          type="button"
          aria-label={`Renewal price info for ${domainName}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          !
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        Premium domains may have a different renewal price.
      </TooltipContent>
    </Tooltip>
  );
};

// Renew Now Modal Component
interface RenewNowModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domains: Array<{
    normalizedDomainName: string;
    expirationDate: Date | string | null | undefined;
  }>;
  renewalPriceUsdPerYearByTld: Map<string, number | null>;
  getCustomRenewalPrice: (domainName: string) => number | null;
  onRenew: (
    domains: Array<{
      normalizedDomainName: NamefiNormalizedDomain;
      expirationDate?: Date | null;
    }>,
    durationYears: number,
  ) => Promise<RenewalResult[]>;
  onSuccess?: () => void;
}

const RenewNowModal: FC<RenewNowModalProps> = ({
  isOpen,
  onOpenChange,
  domains,
  renewalPriceUsdPerYearByTld,
  getCustomRenewalPrice,
  onRenew,
  onSuccess,
}) => {
  const [selectedYears, setSelectedYears] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset selectedYears when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedYears(1);
    }
  }, [isOpen]);

  const totalPricePerYear = useMemo(() => {
    let total = 0;
    for (const domain of domains) {
      const customPrice = getCustomRenewalPrice(domain.normalizedDomainName);
      if (customPrice !== null) {
        total += customPrice;
      } else {
        const price = getRenewalPriceUsdPerYearForDomain(
          domain.normalizedDomainName,
          renewalPriceUsdPerYearByTld,
        );
        if (price !== null) {
          total += price;
        }
      }
    }
    return total;
  }, [domains, renewalPriceUsdPerYearByTld, getCustomRenewalPrice]);

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      const results = await onRenew(
        domains.map((d) => ({
          normalizedDomainName:
            d.normalizedDomainName as NamefiNormalizedDomain,
          expirationDate: d.expirationDate ? new Date(d.expirationDate) : null,
        })),
        selectedYears,
      );

      // Check if any domains were successfully added
      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        onSuccess?.();
        onOpenChange(false);
      } else {
        // All domains failed - keep modal open so user can adjust
        // Toast notifications are already shown by the renewDomains hook
      }
    } catch (error) {
      toast.error('Failed to add domains to cart. Please try again.');
      console.error('Renewal error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Renew {domains.length === 1 ? 'Domain' : 'Domains'}
          </DialogTitle>
          <DialogDescription>
            {domains.length === 1
              ? `Renew ${domains[0].normalizedDomainName}`
              : `Renew ${domains.length} domains`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Domain list (only show if multiple) */}
          {domains.length > 1 && (
            <div className="max-h-32 overflow-y-auto rounded-md border border-border p-2">
              <ul className="space-y-1 text-sm">
                {domains.map((d) => (
                  <li
                    key={d.normalizedDomainName}
                    className="text-muted-foreground"
                  >
                    {d.normalizedDomainName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Year selection */}
          <div className="flex items-center justify-between">
            <Label htmlFor="renewal-years">Renewal Period</Label>
            <Select
              value={selectedYears.toString()}
              onValueChange={(value) =>
                setSelectedYears(Number.parseInt(value, 10))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select years" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === 1 ? 'year' : 'years'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price display */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price per year</span>
              <span>{formatAmountInUSD(totalPricePerYear)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>
                Total ({selectedYears} {selectedYears === 1 ? 'year' : 'years'})
              </span>
              <span className="text-lg">
                {formatAmountInUSD(totalPricePerYear * selectedYears)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          {/* UX: Disable when totalPricePerYear === 0 (pricing unavailable for all domains).
              This is intentional to prevent user confusion about the cost before checkout.
              Backend can calculate pricing, but we prefer explicit pricing upfront for better UX. */}
          <Button
            onClick={handleRenew}
            disabled={isProcessing || totalPricePerYear === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding to Cart...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ActionTooltip: FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild={true}>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
};

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead>Domain Name</TableHead>
            <TableHead className="w-[180px]">Renewal</TableHead>
            <TableHead className="w-[140px]">Renew (USD/yr)</TableHead>
            <TableHead className="w-[280px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...new Array(6)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-32" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>No domains found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        Start the search for your next domain by clicking the button below
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

function MyDomainsTable(props: {
  title?: string;
  domains: DomainRow[];
  kind: 'active' | 'inactive';
}) {
  const { title, domains, kind } = props;

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const tableKind = kind;
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [listForSaleDialogDomain, setListForSaleDialogDomain] = useState<
    string | null
  >(null);
  const [selectedDomainIds, setSelectedDomainIds] = useState<
    Set<NamefiNormalizedDomain>
  >(() => new Set<NamefiNormalizedDomain>());
  const [processingDomains, setProcessingDomains] = useState<Set<string>>(
    () => new Set(),
  );
  const [batchAction, setBatchAction] = useState<
    'ns' | 'web' | 'mx' | 'ens' | 'forward' | null
  >(null);

  // State for renewal modal
  const [renewNowModalDomains, setRenewNowModalDomains] = useState<
    Array<{
      normalizedDomainName: string;
      expirationDate: Date | string | null | undefined;
    }>
  >([]);

  // State for auto-renewal toggling
  const [togglingAutoRenew, setTogglingAutoRenew] = useState<Set<string>>(
    () => new Set(),
  );

  // Cache for domain auto-renewal status
  const [autoRenewCache, setAutoRenewCache] = useState<Map<string, boolean>>(
    () => new Map(),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DOMAIN_LIST_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'expirationDate', desc: false },
  ]);
  const [domainSearch, setDomainSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    account: false,
    normalizedDomainName: true,
    expirationDate: true,
    dateTokenized: false,
    renewPricing: false,
    urlForward: true,
    listForSale: true,
    actions: true,
  });

  const prevColumnVisibility = useRef<VisibilityState>(columnVisibility);
  const isMobile = useIsMobile();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isMobile) {
      prevColumnVisibility.current = columnVisibility;
      setColumnVisibility((_prev) => ({
        select: true,
        account: false,
        normalizedDomainName: true,
        expirationDate: true,
        dateTokenized: false,
        renewPricing: false,
        urlForward: false,
        listForSale: false,
        actions: true,
      }));
    } else {
      setColumnVisibility(prevColumnVisibility.current ?? columnVisibility);
    }
  }, [isMobile]);

  // Initialize autoRenewCache from domain data when domains are loaded
  useEffect(() => {
    setAutoRenewCache((prev) => {
      const next = new Map(prev);
      let changed = false;

      for (const domain of domains) {
        const domainName = domain.normalizedDomainName;
        if (!domainName || prev.has(domainName)) continue;

        // Use autoRenewEnabled from the backend if available
        if (domain.autoRenewEnabled !== undefined) {
          next.set(domainName, domain.autoRenewEnabled);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [domains]);

  const { hasEmail } = useEmailPrompt();
  const canAnimate = useCanAnimate();
  const { renewDomains } = useDomainRenewal();

  const handleListForSaleClick = useCallback(
    (domainName: string) => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.MyDomainsListForSaleClicked,
        properties: { domainName, tableKind },
      });
      setListForSaleDialogDomain(domainName);
    },
    [logEventWithInteractionLoggers, tableKind],
  );

  // Handle auto-renewal toggle for a single domain
  const handleToggleAutoRenew = useCallback(
    async (
      domainName: string,
      enabled: boolean,
      position: { x: number; y: number } | null,
    ) => {
      // Snapshot previous value before any state updates (safe for rollback)
      const prevValue = autoRenewCache.get(domainName) ?? false;

      setTogglingAutoRenew((prev) => {
        const next = new Set(prev);
        next.add(domainName);
        return next;
      });
      try {
        // Optimistic update
        setAutoRenewCache((prev) => {
          const next = new Map(prev);
          next.set(domainName, enabled);
          return next;
        });

        await trpcClient.domainConfig.updateDomainPreferencesAndConfig.mutate({
          domainName: domainName as NamefiNormalizedDomain,
          domainPreferencesAndConfig: {
            autoRenewEnabled: enabled,
          },
        });
        toast.success(
          `Auto-renew ${enabled ? 'enabled' : 'disabled'} for ${domainName}`,
        );

        // Trigger celebration after successful enable
        if (enabled && position) {
          triggerCelebrationAtPosition(position.x, position.y);
        }
      } catch (error) {
        // Revert optimistic update to actual previous value
        setAutoRenewCache((prev) => {
          const next = new Map(prev);
          next.set(domainName, prevValue);
          return next;
        });
        toast.error(`Failed to update auto-renew for ${domainName}`);
      } finally {
        setTogglingAutoRenew((prev) => {
          const next = new Set(prev);
          next.delete(domainName);
          return next;
        });
      }
    },
    [trpcClient, autoRenewCache],
  );

  // Handle batch auto-renewal toggle
  const handleBatchToggleAutoRenew = useCallback(
    async (enabled: boolean, position?: { x: number; y: number } | null) => {
      const domainsToUpdate = Array.from(selectedDomainIds);
      if (domainsToUpdate.length === 0) return;

      // Snapshot original states synchronously (safe for rollback)
      // Must be done before any state updates to avoid React Strict Mode issues
      const originalStates = new Map<string, boolean>();
      for (const d of domainsToUpdate) {
        originalStates.set(d, autoRenewCache.get(d) ?? false);
      }

      setTogglingAutoRenew((prev) => {
        const next = new Set(prev);
        for (const d of domainsToUpdate) {
          next.add(d);
        }
        return next;
      });

      try {
        // Optimistic update
        setAutoRenewCache((prev) => {
          const next = new Map(prev);
          for (const d of domainsToUpdate) {
            next.set(d, enabled);
          }
          return next;
        });

        // Update domains with concurrency limit to avoid thundering herd
        const ConcurrencyLimit = 8;
        const results: PromiseSettledResult<unknown>[] = [];
        for (let i = 0; i < domainsToUpdate.length; i += ConcurrencyLimit) {
          const chunk = domainsToUpdate.slice(i, i + ConcurrencyLimit);
          const chunkResults = await Promise.allSettled(
            chunk.map((domainName) =>
              trpcClient.domainConfig.updateDomainPreferencesAndConfig.mutate({
                domainName: domainName as NamefiNormalizedDomain,
                domainPreferencesAndConfig: {
                  autoRenewEnabled: enabled,
                },
              }),
            ),
          );
          results.push(...chunkResults);
        }

        // Separate successful and failed domains
        const succeeded: string[] = [];
        const failed: Array<{ domainName: string; error: unknown }> = [];

        results.forEach((result, index) => {
          const domainName = domainsToUpdate[index];
          if (result.status === 'fulfilled') {
            succeeded.push(domainName);
          } else {
            failed.push({ domainName, error: result.reason });
          }
        });

        // Revert only failed domains to their original states
        if (failed.length > 0) {
          setAutoRenewCache((prev) => {
            const next = new Map(prev);
            for (const { domainName } of failed) {
              const originalState = originalStates.get(domainName) ?? false;
              next.set(domainName, originalState);
            }
            return next;
          });
          toast.error(
            `Failed to update ${failed.length} of ${domainsToUpdate.length} domains`,
          );
        }

        // Show success message for succeeded domains
        if (succeeded.length > 0) {
          toast.success(
            `Auto-renew ${enabled ? 'enabled' : 'disabled'} for ${succeeded.length} domain${succeeded.length > 1 ? 's' : ''}`,
          );
        }

        // Trigger celebration when enabling auto-renew for successfully updated domains
        if (enabled && succeeded.length > 0) {
          // Use provided position or default to center-bottom
          const celebrationX = position?.x ?? 0.5;
          const celebrationY = position?.y ?? 0.9;
          setTimeout(
            () => triggerCelebrationAtPosition(celebrationX, celebrationY),
            100,
          );
        }
      } catch (error) {
        // Revert all domains to original states on unexpected error
        setAutoRenewCache((prev) => {
          const next = new Map(prev);
          for (const d of domainsToUpdate) {
            const originalState = originalStates.get(d) ?? false;
            next.set(d, originalState);
          }
          return next;
        });
        toast.error('An unexpected error occurred');
        console.error('Batch toggle error:', error);
      } finally {
        setTogglingAutoRenew((prev) => {
          const next = new Set(prev);
          for (const d of domainsToUpdate) {
            next.delete(d);
          }
          return next;
        });
      }
    },
    [selectedDomainIds, trpcClient, autoRenewCache],
  );

  // Handle renew now with year selection
  const handleRenewNowWithYears = useCallback(
    async (
      domainsToRenew: Array<{
        normalizedDomainName: NamefiNormalizedDomain;
        expirationDate?: Date | null;
      }>,
      durationYears: number,
    ): Promise<RenewalResult[]> => {
      setProcessingDomains((prev) => {
        const next = new Set(prev);
        for (const d of domainsToRenew) {
          next.add(d.normalizedDomainName);
        }
        return next;
      });
      try {
        return await renewDomains(domainsToRenew, durationYears);
      } finally {
        setProcessingDomains((prev) => {
          const next = new Set(prev);
          for (const d of domainsToRenew) {
            next.delete(d.normalizedDomainName);
          }
          return next;
        });
      }
    },
    [renewDomains],
  );

  const tldPricingQuery = useQuery(
    trpc.registry.getTldPricingTable.queryOptions(),
  );
  const renewalPriceUsdPerYearByTld = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of tldPricingQuery.data ?? []) {
      if (!row?.tld) continue;
      map.set(
        String(row.tld).toLowerCase(),
        row.renewalPriceUsdPerYear ?? null,
      );
    }
    return map;
  }, [tldPricingQuery.data]);

  /**
   * Returns a custom fixed renewal price for specific TLDs.
   *
   * TLDs: .0x.city, .defi.build, .astra.namefi.io
   * Price: $5.00
   * Rationale: Promotional pricing for these specific partner domains.
   * Reference: See product requirement for Fixed Rate Partner Domains.
   *
   * TODO: https://app.clickup.com/t/9009140026/NFI-5260 Prompt for LLM: a deeper search in
   * entire codebase, especially backend and database to find whether there is a database
   * that returns the pricing of 0x.city  when user visits 0x.city to register a domain,
   * then see if you need to update getCustomRenewalPrice a instead of locally hardcoded price
   */
  const getCustomRenewalPrice = useCallback((domainName: string) => {
    if (
      domainName.endsWith('.0x.city') ||
      domainName.endsWith('.defi.build') ||
      domainName.endsWith('.astra.namefi.io')
    ) {
      return 5.0;
    }
    return null;
  }, []);

  const drizzlerFilterConfig = useMemo(
    () => ({
      normalizedDomainName: {
        id: 'normalizedDomainName',
        label: 'Domain Name',
        type: 'text' as const,
        columnId: 'normalizedDomainName',
      },
      ownerAddress: {
        id: 'ownerAddress',
        label: 'Wallet',
        type: 'text' as const,
        columnId: 'ownerAddress',
      },
      expirationDate: {
        id: 'expirationDate',
        label: 'Renewal',
        type: 'date' as const,
        columnId: 'expirationDate',
      },
      dateTokenized: {
        id: 'dateTokenized',
        label: 'Date Tokenized',
        type: 'date' as const,
        columnId: 'dateTokenized',
      },
      chainId: {
        id: 'chainId',
        label: 'Chain',
        type: 'select' as const,
        columnId: 'chainId',
        options: [
          { value: CHAINS.base.id, label: CHAINS.base.name },
          { value: CHAINS.mainnet.id, label: CHAINS.mainnet.name },
          { value: CHAINS.sepolia.id, label: CHAINS.sepolia.name },
        ],
      },
    }),
    [],
  );

  const filterStrategy = useDrizzlerServerFilterStrategy<DomainRow>({
    filterConfig: drizzlerFilterConfig as any,
    filterDisplayOptions: { showInHeader: false },
  });
  const filterState = filterStrategy.filterState;

  const drizzlerFilterOptions = useMemo(
    () =>
      convertToDrizzlerFilterOptions<DomainRow>(
        filterState?.columnFilters ?? {},
      ),
    [filterState],
  );

  useEffect(() => {
    setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
      if (prev.size === 0) {
        return prev;
      }
      const allowedIds = new Set<NamefiNormalizedDomain>(
        domains.map(
          (domain) => domain.normalizedDomainName as NamefiNormalizedDomain,
        ),
      );
      let changed = false;
      const next = new Set<NamefiNormalizedDomain>();
      prev.forEach((id) => {
        if (allowedIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [domains]);

  const filteredDomains = useMemo(() => {
    if (!drizzlerFilterOptions) {
      return domains;
    }
    return applyDrizzlerFilterOnDataset(domains, drizzlerFilterOptions);
  }, [domains, drizzlerFilterOptions]);

  const filteredDomainsBySearch = useMemo(() => {
    const needle = domainSearch.trim().toLowerCase();
    if (!needle) {
      return filteredDomains;
    }
    return filteredDomains.filter((domain) =>
      (domain.normalizedDomainName ?? '').toLowerCase().includes(needle),
    );
  }, [filteredDomains, domainSearch]);

  const comparators = useMemo(
    () => ({
      chainId: (a: DomainRow, b: DomainRow) =>
        (a.chainId ?? 0) - (b.chainId ?? 0),
      ownerAddress: (a: DomainRow, b: DomainRow) =>
        (a.ownerAddress ?? '').localeCompare(b.ownerAddress ?? '', undefined, {
          sensitivity: 'base',
        }),
      normalizedDomainName: (a: DomainRow, b: DomainRow) =>
        (a.normalizedDomainName ?? '').localeCompare(
          b.normalizedDomainName ?? '',
          undefined,
          { sensitivity: 'base' },
        ),
      expirationDate: (a: DomainRow, b: DomainRow) => {
        const timeA = a.expirationDate
          ? new Date(a.expirationDate).getTime()
          : 0;
        const timeB = b.expirationDate
          ? new Date(b.expirationDate).getTime()
          : 0;
        return timeA - timeB;
      },
      dateTokenized: (a: DomainRow, b: DomainRow) => {
        const timeA = a.dateTokenized ? new Date(a.dateTokenized).getTime() : 0;
        const timeB = b.dateTokenized ? new Date(b.dateTokenized).getTime() : 0;
        return timeA - timeB;
      },
    }),
    [],
  );

  const sortedDomains = useMemo(() => {
    if (sorting.length === 0) {
      return filteredDomainsBySearch;
    }
    const next = [...filteredDomainsBySearch];
    return next.sort((a, b) => {
      for (const sort of sorting) {
        if (sort.id === 'renewPricing') {
          const priceA = getRenewalPriceUsdPerYearForDomain(
            a.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
          const priceB = getRenewalPriceUsdPerYearForDomain(
            b.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
          if (priceA === null && priceB === null) {
            continue;
          }
          // Keep unknown prices ("—") sorted last in both directions.
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          const result = priceA - priceB;
          if (result !== 0) {
            return sort.desc ? -result : result;
          }
          continue;
        }
        const compareFn = comparators[sort.id as keyof typeof comparators];
        if (!compareFn) {
          continue;
        }
        const result = compareFn(a, b);
        if (result !== 0) {
          return sort.desc ? -result : result;
        }
      }
      return 0;
    });
  }, [
    filteredDomainsBySearch,
    sorting,
    comparators,
    renewalPriceUsdPerYearByTld,
  ]);

  const totalCount = sortedDomains.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setPage((prev) => {
      if (prev > totalPages) {
        return totalPages;
      }
      if (prev < 1) {
        return 1;
      }
      return prev;
    });
  }, [totalPages]);

  useEffect(() => {
    if (!filterState) {
      return;
    }
    setPage(1);
  }, [filterState]);

  useEffect(() => {
    if (!domainSearch) {
      // Still reset to page 1 when clearing search, but avoid redundant sets.
      setPage(1);
      return;
    }
    setPage(1);
  }, [domainSearch]);

  const paginatedDomains = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDomains.slice(start, start + pageSize);
  }, [sortedDomains, page, pageSize]);

  const currentPageIds = useMemo(
    () =>
      paginatedDomains.map(
        (domain) => domain.normalizedDomainName as NamefiNormalizedDomain,
      ),
    [paginatedDomains],
  );

  const pageSelectionState = useMemo(() => {
    if (currentPageIds.length === 0) {
      return { allSelected: false, someSelected: false };
    }
    let selectedCount = 0;
    currentPageIds.forEach((id) => {
      if (selectedDomainIds.has(id)) {
        selectedCount += 1;
      }
    });
    return {
      allSelected: selectedCount > 0 && selectedCount === currentPageIds.length,
      someSelected: selectedCount > 0 && selectedCount < currentPageIds.length,
    };
  }, [currentPageIds, selectedDomainIds]);

  const handleToggleAllCurrentPage = useCallback(
    (selectAll: boolean) => {
      setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
        if (currentPageIds.length === 0) {
          return prev;
        }
        const next = new Set(prev);
        let changed = false;
        currentPageIds.forEach((id) => {
          if (selectAll) {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          } else if (next.delete(id)) {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    },
    [currentPageIds],
  );

  const handleRowSelectionChange = useCallback(
    (domainName: NamefiNormalizedDomain, checked: boolean) => {
      setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) => {
        const alreadySelected = prev.has(domainName);
        if ((checked && alreadySelected) || (!checked && !alreadySelected)) {
          return prev;
        }
        const next = new Set(prev);
        if (checked) {
          next.add(domainName);
        } else {
          next.delete(domainName);
        }
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedDomainIds((prev: Set<NamefiNormalizedDomain>) =>
      prev.size === 0 ? prev : new Set<NamefiNormalizedDomain>(),
    );
  }, []);

  const selectedDomainRows = useMemo(() => {
    if (selectedDomainIds.size === 0) {
      return [];
    }
    return domains.filter((domain) =>
      selectedDomainIds.has(
        domain.normalizedDomainName as NamefiNormalizedDomain,
      ),
    );
  }, [domains, selectedDomainIds]);

  const renewableDomains = useMemo(
    () =>
      selectedDomainRows.filter((domain) =>
        isDomainPossiblyRenewable(domain.expirationDate),
      ),
    [selectedDomainRows],
  );

  const renewableDomainsCount = renewableDomains.length;
  const selectedDomainCount = selectedDomainIds.size;

  // Calculate bulk auto-renew state based on selected domains
  const bulkAutoRenewState = useMemo((): BulkAutoRenewState => {
    if (selectedDomainIds.size === 0) return 'off';

    const selectedDomainNames = Array.from(selectedDomainIds);
    const autoRenewStates = selectedDomainNames.map(
      (name) => autoRenewCache.get(name) ?? false,
    );

    const allOn = autoRenewStates.every((state) => state === true);
    const allOff = autoRenewStates.every((state) => state === false);

    if (allOn) return 'on';
    if (allOff) return 'off';
    return 'mixed';
  }, [selectedDomainIds, autoRenewCache]);

  // Handle bulk auto-renew toggle from the three-state toggle
  const handleBulkAutoRenewToggle = useCallback(
    (newState: 'off' | 'on', position: { x: number; y: number } | null) => {
      handleBatchToggleAutoRenew(newState === 'on', position);
    },
    [handleBatchToggleAutoRenew],
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const columns: ColumnDef<DomainRow>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              pageSelectionState.allSelected
                ? true
                : pageSelectionState.someSelected
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(value) =>
              handleToggleAllCurrentPage(value === true)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const isSelected = selectedDomainIds.has(domainName);
          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(value) =>
                handleRowSelectionChange(domainName, value === true)
              }
              aria-label="Select row"
            />
          );
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'normalizedDomainName',
        header: 'Domain Name',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/domains/${domainName}?tab=dns-overview`}
                aria-label={`Settings for ${domainName}`}
                className="font-medium hover:underline"
              >
                {domainName}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://${domainName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Visit ${domainName}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Visit {domainName}</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => {
          const chainId = row.original.chainId ?? null;
          const ownerAddress = row.original.ownerAddress ?? null;
          return <AddressWithChain address={ownerAddress} chainId={chainId} />;
        },
        size: 200,
      },
      {
        accessorKey: 'expirationDate',
        header: 'Renewal',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDate = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;

          const isToggling = togglingAutoRenew.has(domainName);
          const cachedAutoRenew = autoRenewCache.get(domainName);
          // Use cached value if available, otherwise default to false (will be fetched)
          const isAutoRenewEnabled = cachedAutoRenew ?? false;
          const isExpired = expirationDate
            ? isPast(new Date(expirationDate))
            : false;
          const canRenew = isDomainPossiblyRenewable(expirationDate);

          return (
            <div className="flex flex-col gap-1">
              {/* Auto toggle row - primary text */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Auto
                </span>
                <AnimatedAutoRenewToggle
                  checked={isAutoRenewEnabled}
                  onCheckedChange={(checked, position) =>
                    handleToggleAutoRenew(domainName, checked, position)
                  }
                  disabled={isExpired}
                  isLoading={isToggling}
                />
              </div>

              {/* Time left - secondary text, clickable to open renew modal */}
              {canRenew ? (
                <button
                  type="button"
                  onClick={() =>
                    setRenewNowModalDomains([
                      {
                        normalizedDomainName: domainName,
                        expirationDate,
                      },
                    ])
                  }
                  className="text-left text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
                >
                  {formatExpirationDateISO(expirationDate)} (
                  {formatTimeLeft(expirationDate)})
                </button>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {formatExpirationDateISO(expirationDate)} (
                  {isExpired ? 'Expired' : formatTimeLeft(expirationDate)})
                </span>
              )}
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: 'dateTokenized',
        header: 'Date Tokenized',
        cell: ({ row }) => {
          const dateTokenized = row.getValue('dateTokenized') as
            | Date
            | string
            | null
            | undefined;

          if (!dateTokenized) {
            return <span className="text-muted-foreground">-</span>;
          }

          const date = new Date(dateTokenized);
          if (Number.isNaN(date.getTime())) {
            return <span className="text-muted-foreground">-</span>;
          }

          // Format: yyyy-mm-dd
          const formattedDate = date.toISOString().slice(0, 10);

          return (
            <span className="text-sm text-muted-foreground">
              {formattedDate}
            </span>
          );
        },
        size: 140,
        enableSorting: true,
      },
      {
        id: 'renewPricing',
        header: 'Renew (USD/yr)',
        accessorFn: (row) => {
          const customPrice = getCustomRenewalPrice(
            row.normalizedDomainName ?? '',
          );
          if (customPrice !== null) return customPrice;
          return getRenewalPriceUsdPerYearForDomain(
            row.normalizedDomainName,
            renewalPriceUsdPerYearByTld,
          );
        },
        cell: ({ row }) => {
          const domainName = row.original.normalizedDomainName ?? '';
          const customPrice = getCustomRenewalPrice(domainName);
          let renewalPriceUsdPerYear = row.getValue('renewPricing') as
            | number
            | null;

          if (customPrice !== null) {
            renewalPriceUsdPerYear = customPrice;
          }

          const priceLabel =
            renewalPriceUsdPerYear === null
              ? '—'
              : formatAmountInUSD(renewalPriceUsdPerYear);

          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {priceLabel}
              </span>
              <RenewPricePremiumInfo domainName={domainName} />
            </div>
          );
        },
        size: 140,
        enableSorting: true,
      },
      {
        id: 'dnsStatus',
        header: 'DNS Records',
        cell: ({ row }) => {
          const domainName = row.getValue(
            'normalizedDomainName',
          ) as NamefiNormalizedDomain;
          const status = row.original.dnsStatus;

          if (!status) return <span className="text-muted-foreground">-</span>;

          return <DnsStatusCell domainName={domainName} status={status} />;
        },
        size: 200,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const domainName = row.getValue('normalizedDomainName') as string;
          const expirationDateRaw = row.getValue('expirationDate') as
            | Date
            | string
            | null
            | undefined;
          const expirationDate = expirationDateRaw
            ? new Date(expirationDateRaw)
            : null;
          const isExpired =
            expirationDate !== null
              ? differenceInDays(expirationDate, new Date()) < 0
              : false;
          const explorerUrl = getNftExplorerUrl(
            row.original.chainId ?? null,
            row.original.tokenId?.toString() ?? null,
          );

          const actionButtonBaseClassName =
            'w-9 px-0 gap-0 xl:w-auto xl:px-3 xl:gap-1.5 !text-white border-0 bg-transparent shadow-none hover:bg-muted/30 xl:border xl:bg-background xl:shadow-xs';

          const listForSaleButton = (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                actionButtonBaseClassName,
                'hover:!text-orange-400',
              )}
              onClick={() => handleListForSaleClick(domainName)}
              aria-label={`List ${domainName} for sale`}
            >
              <BadgeDollarSign className="w-4 h-4" />
            </Button>
          );

          const explorerButton =
            !isExpired && explorerUrl ? (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  actionButtonBaseClassName,
                  'hover:!text-blue-400',
                )}
                asChild={true}
              >
                <Link
                  href={explorerUrl}
                  aria-label={`View NFT for ${domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-start items-center"
                >
                  <Compass className="w-4 h-4" />
                </Link>
              </Button>
            ) : null;

          if (isMobile) {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="!text-white border-0 bg-transparent shadow-none hover:bg-muted/30"
                    aria-label={`Actions for ${domainName}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {/* Renew button logic can be added here if needed for mobile, but it's in the column now */}
                  {!!listForSaleButton && (
                    <DropdownMenuItem>{listForSaleButton}</DropdownMenuItem>
                  )}
                  {!!explorerButton && (
                    <DropdownMenuItem>{explorerButton}</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div className="flex gap-2">
              <ActionTooltip label="List for sale">
                {listForSaleButton}
              </ActionTooltip>
              {explorerButton ? (
                <ActionTooltip label="View NFT">{explorerButton}</ActionTooltip>
              ) : null}
            </div>
          );
        },
        size: 280,
        enableSorting: false,
      },
    ],
    [
      handleListForSaleClick,
      handleRowSelectionChange,
      handleToggleAllCurrentPage,
      handleToggleAutoRenew,
      pageSelectionState,
      selectedDomainIds,
      togglingAutoRenew,
      autoRenewCache,
      isMobile,
      renewalPriceUsdPerYearByTld,
      getCustomRenewalPrice,
    ],
  );

  return (
    <>
      <EmailRequiredModal
        isOpen={showEmailModal}
        onOpenChange={setShowEmailModal}
        title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
        description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
        actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
      />
      <Dialog
        open={listForSaleDialogDomain !== null}
        onOpenChange={(open) => {
          if (!open) {
            setListForSaleDialogDomain(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming soon</DialogTitle>
            <DialogDescription>
              Listing domains for sale isn’t available yet.
              {listForSaleDialogDomain ? (
                <>
                  {' '}
                  You clicked:{' '}
                  <span className="font-medium">{listForSaleDialogDomain}</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListForSaleDialogDomain(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Now Modal */}
      <RenewNowModal
        isOpen={renewNowModalDomains.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setRenewNowModalDomains([]);
          }
        }}
        domains={renewNowModalDomains}
        renewalPriceUsdPerYearByTld={renewalPriceUsdPerYearByTld}
        getCustomRenewalPrice={getCustomRenewalPrice}
        onRenew={handleRenewNowWithYears}
        onSuccess={clearSelection}
      />

      {!!title && (
        <h2
          id={title.toLowerCase().replaceAll(' ', '-')}
          className="text-xl font-semibold mb-1"
        >
          {title}
        </h2>
      )}
      <ExtensibleDataTable<DomainRow, typeof filterStrategy>
        columns={columns}
        data={paginatedDomains}
        isLoading={false}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        sorting={sorting}
        onSortingChange={setSorting}
        searchTerm={domainSearch}
        onSearchChange={setDomainSearch}
        searchPlaceholder="Filter domains..."
        filterStrategy={filterStrategy}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        emptyMessage="No domains match your filters"
        loadingMessage="Loading domains..."
        paginationVisibility="auto"
        showPageSizeSelector={false}
      />

      {/* Floating Action Panel */}
      <AnimatePresence>
        {selectedDomainCount > 0 && (
          <motion.div
            initial={{ y: 100, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              duration: 0.4,
            }}
            layout
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="backdrop-blur-2xl bg-background/30 border border-border/50 rounded-2xl shadow-2xl shadow-black/20"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <div className="px-6 py-4">
                <MotionConfig
                  transition={{
                    layout: canAnimate
                      ? { duration: 0.9, bounce: 0, type: 'spring' }
                      : { duration: 0 },
                  }}
                >
                  <div className="flex items-center gap-6">
                    {/* Selection Count */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                        <NumberFlow
                          value={selectedDomainCount}
                          className="text-primary font-bold text-sm"
                          style={
                            {
                              '--number-flow-char-height': '0.85em',
                              '--number-flow-mask-height': '0.3em',
                            } as CSSProperties
                          }
                        />
                      </div>
                      <span className="font-semibold text-foreground text-sm">
                        selected
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className="h-6 w-6 rounded-full hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator
                      orientation="vertical"
                      className="h-8! bg-foreground/30"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Auto-Renew Toggle */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30">
                            <span className="text-xs text-muted-foreground">
                              Auto
                            </span>
                            <BulkAutoRenewToggle
                              state={bulkAutoRenewState}
                              onStateChange={handleBulkAutoRenewToggle}
                              disabled={selectedDomainCount === 0}
                              isLoading={togglingAutoRenew.size > 0}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {bulkAutoRenewState === 'mixed'
                            ? 'Mixed states - click left to disable all, right to enable all'
                            : bulkAutoRenewState === 'on'
                              ? 'Auto-renew enabled - click left to disable'
                              : 'Auto-renew disabled - click right to enable'}
                        </TooltipContent>
                      </Tooltip>

                      <Separator
                        orientation="vertical"
                        className="h-4 bg-border mx-1"
                      />

                      {/* Renew Now */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (renewableDomainsCount === 0) return;
                              setRenewNowModalDomains(
                                renewableDomains.map((domain) => ({
                                  normalizedDomainName:
                                    domain.normalizedDomainName ?? '',
                                  expirationDate: domain.expirationDate,
                                })),
                              );
                            }}
                            className="h-8 w-8 hover:bg-muted"
                            disabled={renewableDomainsCount === 0}
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Renew {renewableDomainsCount} domain
                          {renewableDomainsCount !== 1 ? 's' : ''}
                        </TooltipContent>
                      </Tooltip>

                      <Separator
                        orientation="vertical"
                        className="h-4 bg-border mx-1"
                      />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('web')}
                            className="h-8 w-8"
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set Web Records</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('forward')}
                            className="h-8 w-8"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set URL Forwarding</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBatchAction('ens')}
                            className="h-8 w-8"
                          >
                            <Hexagon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set ENS Record</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </MotionConfig>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BatchDnsDialog
        isOpen={batchAction !== null}
        onOpenChange={(open) => !open && setBatchAction(null)}
        domains={Array.from(selectedDomainIds)}
        action={batchAction}
      />
    </>
  );
}

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsContent />
        </Suspense>
      )}
    </PageShell>
  );
}

const MyDomainsContent = () => {
  const trpc = useTRPC();
  const { data: _domains } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const { data: orderItems } = useQuery(
    trpc.orders.getOrderItems.queryOptions(),
  );

  const processingOrderItems = useMemo(() => {
    if (!orderItems) return [];
    return orderItems.filter((item) =>
      ['CREATED', 'PROCESSING'].includes(item.status ?? ''),
    );
  }, [orderItems]);

  const { activeDomains, inactiveDomains } = useMemo(() => {
    const { activeDomains, expiredDomains, otherDomains } = groupBy(
      (domain) => {
        const expirationDate = domain.expirationDate
          ? new Date(domain.expirationDate)
          : null;
        const canBeRenewed = isDomainPossiblyRenewable(expirationDate);
        const isExpired =
          expirationDate !== null
            ? differenceInDays(expirationDate, new Date()) < 0
            : false;

        if (canBeRenewed && !isExpired) {
          return 'activeDomains';
        }
        if (!canBeRenewed && isExpired) {
          return 'expiredDomains';
        }
        return 'otherDomains';
      },
      _domains,
    );
    return {
      activeDomains: activeDomains ?? [],
      inactiveDomains: [...(expiredDomains ?? []), ...(otherDomains ?? [])],
    };
  }, [_domains]);

  if (
    activeDomains.length === 0 &&
    inactiveDomains.length === 0 &&
    processingOrderItems.length === 0
  ) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <div className="space-y-4">
      {processingOrderItems.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            ⏳{' '}
            {processingOrderItems
              .map((item) => item.normalizedDomainName)
              .join(', ')}
          </span>{' '}
          are being processed. Visit{' '}
          <Link href="/orders" className="text-primary hover:underline">
            Orders
          </Link>{' '}
          to see their status.
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="w-fit">
          <TabsTrigger value="active">My Domains</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Domains</TabsTrigger>
          <TabsTrigger value="previously-owned">
            Previously Owned Domains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>No active domains</EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="active" domains={activeDomains} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {inactiveDomains.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Title>
                No inactive domains
              </EmptyPlaceholder.Title>
            </EmptyPlaceholder>
          ) : (
            <MyDomainsTable kind="inactive" domains={inactiveDomains} />
          )}
        </TabsContent>

        <TabsContent value="previously-owned" className="mt-4">
          <MyPreviouslyOwnedDomainsContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function isDomainPossiblyRenewable(expirationDate?: Date | string | null) {
  if (!expirationDate) {
    return false;
  }
  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }
  return expiry > new Date();
}
