'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { TldRegistrationRequirement } from '@namefi-astra/common/domain-availability';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';

interface CartItemRegistrationRequirementProps {
  item: UnifiedCartItem;
  requirement: TldRegistrationRequirement;
  /** When true, render current state but disable acknowledgement edits. */
  readOnly?: boolean;
}

type BannerTone = 'info' | 'success';

const TONE_STYLES: Record<
  BannerTone,
  { container: string; icon: string; Icon: typeof Info }
> = {
  info: {
    container: 'border-zinc-700/60 bg-zinc-800/30 text-zinc-300',
    icon: 'text-zinc-400',
    Icon: Info,
  },
  success: {
    container: 'border-brand-primary/20 bg-brand-primary/5 text-zinc-300',
    icon: 'text-brand-primary',
    Icon: CheckCircle2,
  },
};

/**
 * Compact, per-item banner surfacing a TLD's registration requirement before
 * checkout (e.g. Google's HTTPS notice for .app/.dev).
 *
 * - `explicit` requirements show a checkbox; the acknowledgement persists to
 *   the cart item's metadata and gates checkout until ticked.
 * - `implicit` requirements are informational only.
 *
 * "Learn more" opens a modal with the full outline and policy links; for
 * explicit requirements the modal's "Agree" button ticks the checkbox.
 */
export function CartItemRegistrationRequirement({
  item,
  requirement,
  readOnly,
}: CartItemRegistrationRequirementProps) {
  const { cart, updatingBusy } = useCartRow(item.normalizedDomainName);
  const [modalOpen, setModalOpen] = useState(false);

  const isExplicit = requirement.confirmation === 'explicit';
  const acknowledged =
    item.metadata?.tldRegistrationRequirementAcknowledged === true;
  const checkboxId = `tld-requirement-ack-${item.id}`;

  const tone: BannerTone = useMemo(
    () => (isExplicit && acknowledged ? 'success' : 'info'),
    [isExplicit, acknowledged],
  );

  const { container, icon, Icon } = TONE_STYLES[tone];

  // Agreeing to a policy applies to every cart item that shares the same TLD,
  // so one acknowledgement automatically covers all matching items.
  const matchingItemIds = useMemo(() => {
    const tld = requirement.tld;
    return (cart.cartData ?? [])
      .filter(
        (row) =>
          (row.type === itemTypeSchema.enum.REGISTER ||
            row.type === itemTypeSchema.enum.IMPORT) &&
          row.normalizedDomainName.split('.').pop()?.toLowerCase() === tld,
      )
      .map((row) => row.id);
  }, [cart.cartData, requirement.tld]);

  const setAcknowledged = useCallback(
    (value: boolean) => {
      if (readOnly) {
        return;
      }
      for (const id of matchingItemIds) {
        void cart
          .updateItem({ id, tldRegistrationRequirementAcknowledged: value })
          .catch((error) => {
            // The cart hook rolls back optimistic state on failure.
            console.error(
              'Failed to update registration requirement acknowledgement:',
              error,
            );
          });
      }
    },
    [cart, matchingItemIds, readOnly],
  );

  const handleAgree = useCallback(() => {
    setAcknowledged(true);
    setModalOpen(false);
  }, [setAcknowledged]);

  return (
    <>
      <div
        className={cn(
          'flex items-start gap-2 rounded-md border px-2.5 py-1.5',
          container,
          updatingBusy && 'animate-pulse opacity-70',
        )}
      >
        <Icon className={cn('mt-0.5 size-3.5 shrink-0', icon)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{requirement.title}</p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[11px] text-zinc-500">
              {requirement.summary}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0 text-[11px] font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Learn more
            </button>
          </div>
          {isExplicit && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'mt-1.5 flex items-center gap-2 text-[11px]',
                readOnly ? 'cursor-default' : 'cursor-pointer',
              )}
            >
              <Checkbox
                id={checkboxId}
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                disabled={readOnly || updatingBusy}
              />
              <span>
                I understand and agree to the .{requirement.tld} requirements.
              </span>
            </label>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{requirement.title}</DialogTitle>
            <DialogDescription>{requirement.summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              {requirement.outline.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {requirement.links.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {requirement.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            {isExplicit ? (
              <>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleAgree} disabled={readOnly}>
                  Agree
                </Button>
              </>
            ) : (
              <DialogClose render={<Button />}>Got it</DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
