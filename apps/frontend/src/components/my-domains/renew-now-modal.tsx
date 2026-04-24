'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
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
              ? `Renew ${safeToUnicode(domains[0].normalizedDomainName)}`
              : `Renew ${domains.length} domains`}
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
            <Label htmlFor="renewal-years">Renewal Period</Label>
            <Select
              value={selectedYears.toString()}
              onValueChange={(value) => {
                if (!value) return;
                setSelectedYears(Number.parseInt(value, 10));
              }}
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
          {/* Disabled when pricing is unavailable so the user sees the cost
              before checkout — backend can calculate, but explicit upfront
              pricing is the agreed UX. */}
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
