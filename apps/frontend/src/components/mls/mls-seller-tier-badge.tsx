import type {
  MlsSellerTier,
  MlsSellerTierId,
} from '@namefi-astra/common/mls-seller-tiers';
import { ChartLineUpIcon } from '@phosphor-icons/react/dist/csr/ChartLineUp';
import { CrownSimpleIcon } from '@phosphor-icons/react/dist/csr/CrownSimple';
import { StackPlusIcon } from '@phosphor-icons/react/dist/csr/StackPlus';
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { cn } from '@namefi-astra/ui/lib/cn';

const SELLER_TIER_BADGE_CLASS_NAMES: Record<MlsSellerTierId, string> = {
  'portfolio-builder':
    'border-emerald-300/22 bg-emerald-300/[0.07] text-emerald-100',
  'market-maker': 'border-sky-300/22 bg-sky-300/[0.07] text-sky-100',
  'domain-whale': 'border-violet-300/24 bg-violet-300/[0.08] text-violet-100',
};

const SELLER_TIER_ICON_CLASS_NAMES: Record<MlsSellerTierId, string> = {
  'portfolio-builder':
    'border-emerald-200/45 bg-emerald-300/16 text-emerald-200 shadow-emerald-950/30',
  'market-maker':
    'border-sky-200/45 bg-sky-300/16 text-sky-200 shadow-sky-950/30',
  'domain-whale':
    'border-violet-200/45 bg-violet-300/16 text-violet-200 shadow-violet-950/30',
};

const SELLER_TIER_ICONS: Record<MlsSellerTierId, Icon> = {
  'portfolio-builder': StackPlusIcon,
  'market-maker': ChartLineUpIcon,
  'domain-whale': CrownSimpleIcon,
};

interface MlsSellerTierBadgeProps {
  tier: MlsSellerTier;
  className?: string;
  showLabel?: boolean;
}

export function MlsSellerTierBadge({
  tier,
  className,
  showLabel = true,
}: MlsSellerTierBadgeProps) {
  if (!showLabel) {
    return (
      <span title={tier.description} className={cn('shrink-0', className)}>
        <MlsSellerTierBadgeIcon tierId={tier.id} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-2 rounded-full border py-1 pe-2.5 ps-1 text-[0.72rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]',
        SELLER_TIER_BADGE_CLASS_NAMES[tier.id],
        className,
      )}
      title={tier.description}
    >
      <MlsSellerTierBadgeIcon tierId={tier.id} />
      {tier.label}
    </span>
  );
}

function MlsSellerTierBadgeIcon({ tierId }: { tierId: MlsSellerTierId }) {
  const TierIcon = SELLER_TIER_ICONS[tierId];

  return (
    <span
      aria-hidden={true}
      className={cn(
        'relative flex size-5 shrink-0 items-center justify-center rounded-full border shadow-[0_8px_18px_rgba(0,0,0,0.24)]',
        SELLER_TIER_ICON_CLASS_NAMES[tierId],
      )}
    >
      <TierIcon className="size-3.5" weight="duotone" />
    </span>
  );
}
