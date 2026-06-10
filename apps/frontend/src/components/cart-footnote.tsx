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
import type {
  DomainAvailabilityInfo,
  TldRegistrationRequirement,
} from '@namefi-astra/common/domain-availability';
import { ExternalLink } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { useCartContext } from '@/components/providers/cart';
import {
  type AggregatedRequirement,
  aggregateRegistrationRequirements,
} from '@/lib/cart-registration-requirements';

const TOS_URL = 'https://namefi.io/tos';

interface CartFootnoteProps {
  domainAvailabilityInfo?: DomainAvailabilityInfo[];
  /**
   * When true (footnote variant), aggregate the cart's TLD registration
   * requirements into the footnote: implicit policies are linked inline in the
   * terms sentence and each explicit policy gets its own acknowledgement
   * checkbox (with a "learn more" modal).
   */
  showPolicies: boolean;
  className?: string;
}

/**
 * Footnote shown beneath the cart submit button. Always states that purchasing
 * implies agreement to Namefi's terms. In the footnote variant it also surfaces
 * the cart's per-TLD registration policies (deduped by TLD): implicit ones
 * inline, explicit ones as per-TLD acknowledgement checkboxes.
 */
export function CartFootnote({
  domainAvailabilityInfo,
  showPolicies,
  className,
}: CartFootnoteProps) {
  const cart = useCartContext();

  const { implicit, explicit } = useMemo(
    () =>
      showPolicies
        ? aggregateRegistrationRequirements(
            cart.cartData,
            domainAvailabilityInfo,
          )
        : { implicit: [], explicit: [] },
    [showPolicies, cart.cartData, domainAvailabilityInfo],
  );

  const implicitLinks = useMemo(
    () =>
      implicit
        .map((a) => ({
          tld: a.requirement.tld,
          url: a.requirement.links[0]?.url,
        }))
        .filter((l): l is { tld: string; url: string } => Boolean(l.url)),
    [implicit],
  );

  const hasExtraPolicies = implicitLinks.length > 0 || explicit.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By purchasing domains from Namefi, you agree to{' '}
        {hasExtraPolicies ? (
          <>
            Namefi&apos;s{' '}
            <a
              href={TOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              terms of service
            </a>
            {implicitLinks.length > 0 && (
              <>
                {' '}
                and <wbr />
                {implicitLinks.length === 1
                  ? 'the policy for '
                  : 'policies for '}
                {implicitLinks.map((link, index) => (
                  <Fragment key={link.tld}>
                    {index > 0 && ', '}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline underline-offset-2 hover:text-foreground"
                    >
                      .{link.tld}
                    </a>
                  </Fragment>
                ))}
              </>
            )}
            .
          </>
        ) : (
          <>
            these{' '}
            <a
              href={TOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              terms &amp; conditions
            </a>
          </>
        )}
      </p>
      {explicit.length > 0 && <ExplicitPolicyList explicit={explicit} />}
    </div>
  );
}

/**
 * One acknowledgement checkbox per explicit-confirmation TLD in the cart.
 * Ticking a box (or pressing "Agree" in its modal) persists the acknowledgement
 * to every cart item of that TLD — which is what gates checkout.
 */
function ExplicitPolicyList({
  explicit,
}: {
  explicit: AggregatedRequirement[];
}) {
  const cart = useCartContext();
  const [openPolicy, setOpenPolicy] =
    useState<TldRegistrationRequirement | null>(null);

  const isAcked = useCallback(
    (entry: AggregatedRequirement) =>
      entry.itemIds.length > 0 &&
      entry.itemIds.every(
        (id) =>
          cart.cartData?.find((item) => item.id === id)?.metadata
            ?.tldRegistrationRequirementAcknowledged === true,
      ),
    [cart.cartData],
  );

  const setAck = useCallback(
    (entry: AggregatedRequirement, value: boolean) => {
      for (const id of entry.itemIds) {
        void cart
          .updateItem({ id, tldRegistrationRequirementAcknowledged: value })
          .catch((error) => {
            console.error(
              'Failed to update registration requirement acknowledgement:',
              error,
            );
          });
      }
    },
    [cart],
  );

  const handleAgree = useCallback(() => {
    if (!openPolicy) {
      return;
    }
    const entry = explicit.find((e) => e.requirement.tld === openPolicy.tld);
    if (entry) {
      setAck(entry, true);
    }
    setOpenPolicy(null);
  }, [openPolicy, explicit, setAck]);

  return (
    <>
      <div className="mx-auto flex max-w-md flex-col gap-1 text-[11px] text-muted-foreground">
        {explicit.map((entry) => {
          const tld = entry.requirement.tld;
          const checkboxId = `cart-req-ack-${tld}`;
          return (
            <div key={tld} className="flex items-start gap-2">
              <Checkbox
                id={checkboxId}
                className="mt-px shrink-0"
                checked={isAcked(entry)}
                onCheckedChange={(checked) => setAck(entry, checked === true)}
              />
              <span className="flex-1">
                <label htmlFor={checkboxId} className="cursor-pointer">
                  <span className="font-medium text-foreground">.{tld}</span>: I
                  accept and understand .{tld} registration and acceptable-use
                  policies.
                </label>{' '}
                <button
                  type="button"
                  onClick={() => setOpenPolicy(entry.requirement)}
                  className="font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
                >
                  learn more
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <Dialog
        open={openPolicy !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenPolicy(null);
          }
        }}
      >
        <DialogContent>
          {openPolicy && (
            <>
              <DialogHeader>
                <DialogTitle>{openPolicy.title}</DialogTitle>
                <DialogDescription>{openPolicy.summary}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                  {openPolicy.outline.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {openPolicy.links.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {openPolicy.links.map((link) => (
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
                <DialogClose render={<Button variant="outline" />}>
                  Close
                </DialogClose>
                <Button onClick={handleAgree}>Agree</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
