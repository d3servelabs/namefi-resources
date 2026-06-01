import { Crown, Handshake, Layers, type LucideIcon } from 'lucide-react';
import type {
  MlsSellerTier,
  MlsSellerTierId,
} from '@namefi-astra/common/mls-seller-tiers';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { cn } from '@namefi-astra/ui/lib/cn';

const SELLER_TIER_BADGE_ICONS: Record<MlsSellerTierId, LucideIcon> = {
  'portfolio-builder': Layers,
  'market-maker': Handshake,
  'domain-whale': Crown,
};

const SELLER_TIER_BADGE_CLASS_NAMES: Record<MlsSellerTierId, string> = {
  'portfolio-builder':
    'border-border bg-secondary/70 text-secondary-foreground',
  'market-maker': 'border-primary/40 bg-primary/10 text-primary',
  'domain-whale': 'border-primary/60 bg-primary text-primary-foreground',
};

interface MlsSellerTierBadgeProps {
  tier: MlsSellerTier;
  className?: string;
}

export function MlsSellerTierBadge({
  tier,
  className,
}: MlsSellerTierBadgeProps) {
  const Icon = SELLER_TIER_BADGE_ICONS[tier.id];

  return (
    <Badge
      variant="outline"
      className={cn(SELLER_TIER_BADGE_CLASS_NAMES[tier.id], className)}
      title={tier.description}
      aria-label={`${tier.label}: ${tier.description}`}
    >
      <Icon data-icon="inline-start" />
      {tier.label}
    </Badge>
  );
}
