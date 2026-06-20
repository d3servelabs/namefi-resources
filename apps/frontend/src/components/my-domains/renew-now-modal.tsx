'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { formatAmountInUSD } from '@/lib/number';
import type { RenewalResult } from '@/hooks/use-domain-renewal';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { getRenewalPriceUsdPerYearForDomain, safeToUnicode } from './utils';

export interface RenewNowModalProps {
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

export const RenewNowModal: FC<RenewNowModalProps> = ({
  isOpen,
  onOpenChange,
  domains,
  renewalPriceUsdPerYearByTld,
  getCustomRenewalPrice,
  onRenew,
  onSuccess,
}) => {
  const t = useTranslations('domains');
  const tCommon = useTranslations('common');
  const [selectedYears, setSelectedYears] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

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
        continue;
      }
      const price = getRenewalPriceUsdPerYearForDomain(
        domain.normalizedDomainName,
        renewalPriceUsdPerYearByTld,
      );
      if (price !== null) {
        total += price;
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

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        onSuccess?.();
        onOpenChange(false);
      }
      // All-failure path: keep the modal open so the user can adjust — the
      // renewDomains hook already surfaces toasts for each failed row.
    } catch (error) {
      toast.error(t('renewModal.addToCartFailed'));
      console.error('Renewal error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'max-w-md')}
        data-testid="domains.renew-modal.content"
      >
        <DialogHeader>
          <DialogTitle>
            {t('renewModal.title', { count: domains.length })}
          </DialogTitle>
          <DialogDescription>
            {domains.length === 1
              ? t('renewModal.descriptionSingle', {
                  domain: safeToUnicode(domains[0].normalizedDomainName),
                })
              : t('renewModal.descriptionMultiple', {
                  count: domains.length,
                })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {domains.length > 1 && (
            <div className="max-h-32 overflow-y-auto rounded-md border border-border p-2">
              <ul className="space-y-1 text-sm">
                {domains.map((d) => (
                  <li
                    key={d.normalizedDomainName}
                    className="text-muted-foreground"
                  >
                    {safeToUnicode(d.normalizedDomainName)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="renewal-years">
              {t('renewModal.renewalPeriod')}
            </Label>
            <Select
              value={selectedYears.toString()}
              onValueChange={(value) => {
                if (!value) return;
                setSelectedYears(Number.parseInt(value, 10));
              }}
            >
              <SelectTrigger
                className="w-32"
                data-testid="domains.renew-modal.years-trigger"
              >
                <SelectValue placeholder={t('renewModal.selectYears')} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {t('renewModal.yearOption', { years: year })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('renewModal.pricePerYear')}
              </span>
              <span>{formatAmountInUSD(totalPricePerYear)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>{t('renewModal.total', { years: selectedYears })}</span>
              <span className="text-lg" data-testid="domains.renew-modal.total">
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
            data-testid="domains.renew-modal.cancel"
          >
            {tCommon('actions.cancel')}
          </Button>
          {/* Disabled when pricing is unavailable so the user sees the cost
              before checkout — backend can calculate, but explicit upfront
              pricing is the agreed UX. */}
          <Button
            onClick={handleRenew}
            disabled={isProcessing || totalPricePerYear === 0}
            data-testid="domains.renew-modal.add-to-cart"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t('renewModal.addingToCart')}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 me-2" />
                {t('renewModal.addToCart')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
