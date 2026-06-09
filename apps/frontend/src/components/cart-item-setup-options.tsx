'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import type { OrderItemDomainSetupOptions } from '@namefi-astra/common/contract/entity-schemas';
import { supportsDnssec } from '@namefi-astra/registrars/lib/supports-dnssec';
import { Check, Minus, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';

/**
 * Display defaults for the per-item domain setup chips. These mirror the
 * built-in defaults applied at order processing (`fillDefaultDomainConfig`):
 * autoEns/autoPark/autoRenew = true, dnssec = false. The cart is authoritative
 * — once the user touches a chip the full option set is persisted to the
 * item's `metadata.domainSetupOptions`.
 */
const DEFAULT_DOMAIN_SETUP_OPTIONS = {
  autoRenew: true,
  autoPark: true,
  autoEns: true,
  dnssec: false,
  keepExistingNameservers: false,
} as const;

const KEEP_NS_DISABLED_REASON =
  'Disabled while keeping the existing nameservers.';

interface CartItemSetupOptionsProps {
  item: UnifiedCartItem;
  /** When true, render current values but disable edits. */
  readOnly?: boolean;
}

/**
 * Per-item domain setup flags shown for REGISTER and IMPORT cart items.
 * Persists selections into the cart item's `metadata.domainSetupOptions`,
 * which flows through checkout to the order processing workflow.
 */
export function CartItemSetupOptions({
  item,
  readOnly,
}: CartItemSetupOptionsProps) {
  const { cart, updatingBusy } = useCartRow(item.normalizedDomainName);

  const dnssecSupported = useMemo(
    () => supportsDnssec(item.normalizedDomainName),
    [item.normalizedDomainName],
  );

  const isImport = item.type === itemTypeSchema.enum.IMPORT;

  const current = useMemo(() => {
    const stored = item.metadata?.domainSetupOptions ?? {};
    return {
      autoRenew: stored.autoRenew ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoRenew,
      autoPark: stored.autoPark ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoPark,
      // Auto ENS requires DNSSEC, so it can only be on when the TLD supports it.
      autoEns: dnssecSupported
        ? (stored.autoEns ?? DEFAULT_DOMAIN_SETUP_OPTIONS.autoEns)
        : false,
      // DNSSEC can only be on when the TLD supports it.
      dnssec: dnssecSupported
        ? (stored.dnssec ?? DEFAULT_DOMAIN_SETUP_OPTIONS.dnssec)
        : false,
      keepExistingNameservers: isImport
        ? (stored.keepExistingNameservers ??
          DEFAULT_DOMAIN_SETUP_OPTIONS.keepExistingNameservers)
        : false,
    };
  }, [item.metadata?.domainSetupOptions, dnssecSupported, isImport]);

  const keepOn = isImport && current.keepExistingNameservers;

  const persist = useCallback(
    (next: typeof current) => {
      // When keeping existing nameservers, autoPark/autoEns/dnssec don't apply
      // and are omitted — only autoRenew (and the keep flag) are persisted.
      const domainSetupOptions: OrderItemDomainSetupOptions =
        isImport && next.keepExistingNameservers
          ? {
              autoRenew: next.autoRenew,
              keepExistingNameservers: true,
            }
          : {
              autoRenew: next.autoRenew,
              autoPark: next.autoPark,
              autoEns: dnssecSupported ? next.autoEns : false,
              dnssec: dnssecSupported ? next.dnssec : false,
              ...(isImport ? { keepExistingNameservers: false } : {}),
            };

      void cart
        .updateItem({ id: item.id, domainSetupOptions })
        .catch((error) => {
          // The cart hook rolls back optimistic state on failure.
          console.error('Failed to update domain setup options:', error);
        });
    },
    [cart, item.id, isImport, dnssecSupported],
  );

  const setFlag = useCallback(
    (key: keyof typeof current, value: boolean) => {
      persist({ ...current, [key]: value });
    },
    [current, persist],
  );

  const chips: Array<{
    key: keyof typeof current;
    label: string;
    description: string;
    checked: boolean;
    disabled: boolean;
    disabledReason?: string;
  }> = [
    {
      key: 'autoRenew',
      label: 'AutoRenew',
      description: 'Automatically renew the domain before it expires.',
      checked: current.autoRenew,
      disabled: !!readOnly,
    },
    {
      key: 'autoPark',
      label: 'AutoPark',
      description: 'Automatically park the domain.',
      checked: current.autoPark,
      disabled: !!readOnly || keepOn,
      disabledReason: keepOn ? KEEP_NS_DISABLED_REASON : undefined,
    },
    {
      key: 'autoEns',
      label: 'AutoENS',
      description: 'Automatically enable ENS for the domain.',
      checked: current.autoEns,
      disabled: !!readOnly || keepOn || !dnssecSupported,
      disabledReason: !dnssecSupported
        ? "Auto ENS requires DNSSEC, which this domain doesn't support."
        : keepOn
          ? KEEP_NS_DISABLED_REASON
          : undefined,
    },
    {
      key: 'dnssec',
      label: 'DNSSEC',
      description: 'Enable DNSSEC for the domain.',
      checked: current.dnssec,
      disabled: !!readOnly || keepOn || !dnssecSupported,
      disabledReason: !dnssecSupported
        ? "This domain doesn't support DNSSEC."
        : keepOn
          ? KEEP_NS_DISABLED_REASON
          : undefined,
    },
  ];

  if (isImport) {
    chips.push({
      key: 'keepExistingNameservers',
      label: 'Keep NS',
      description:
        "Keep the domain's current nameservers by skipping the nameserver reset. When on, Auto Park, Auto ENS, and DNSSEC are skipped.",
      checked: current.keepExistingNameservers,
      disabled: !!readOnly,
    });
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-x-3 gap-y-2',
        updatingBusy && 'pointer-events-none animate-pulse opacity-70',
      )}
    >
      {chips.map((chip) => (
        <SetupChip
          key={chip.key}
          label={chip.label}
          description={chip.description}
          disabledReason={chip.disabledReason}
          checked={chip.checked}
          disabled={chip.disabled}
          onToggle={() => setFlag(chip.key, !chip.checked)}
          chipClassName={
            //basis = chipToParentRatio - ( (gapSize=12px) * (#gaps)/ (#chips) )
            'basis-[calc(25%-9px)] md:basis-[calc(20%-(9.6px))]'
          }
        />
      ))}
    </div>
  );
}

interface SetupChipProps {
  label: string;
  description: string;
  disabledReason?: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  chipClassName?: string;
}

/**
 * A compact, custom-styled option chip (outline style). Three visual states:
 * - on:       check icon, primary border + faint primary fill, primary text
 * - off:      x icon, neutral border, transparent fill, muted text
 * - disabled: minus icon, dim border + muted text, transparent (not clickable)
 *
 * The whole chip is the tooltip trigger (no info icon); the tooltip carries
 * the description and, when disabled, the reason. The element stays
 * interactive at the DOM level even when "disabled" so hover/focus still
 * surface the tooltip — clicks are ignored instead.
 */
function SetupChip({
  label,
  description,
  disabledReason,
  checked,
  disabled,
  onToggle,
  chipClassName,
}: SetupChipProps) {
  const Icon = disabled ? Minus : checked ? Check : X;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <button
              {...props}
              type="button"
              aria-disabled={disabled}
              aria-pressed={checked}
              onClick={disabled ? undefined : onToggle}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                disabled
                  ? 'cursor-not-allowed border-zinc-700 bg-transparent text-zinc-600'
                  : checked
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-zinc-600 bg-transparent text-zinc-300 hover:border-zinc-400',
                props.className,
                chipClassName,
              )}
            >
              <Icon className="size-3 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          )}
        >
          {}
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
          {disabledReason ? (
            <p className="mt-1 text-background/70">{disabledReason}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
