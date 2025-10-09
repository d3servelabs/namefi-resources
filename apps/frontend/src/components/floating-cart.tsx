import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/components/providers/cart';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { ShoppingCartIcon, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Button } from './ui/shadcn/button';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { SearchMode } from './search/types';
import { useCart } from '@/hooks/use-cart';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import NumberFlow from '@number-flow/react';
import { useSidebar } from '@/components/ui/shadcn/sidebar';
import { useEventListener } from 'usehooks-ts';

const FLOATING_CART_BASE_BOTTOM = 24;

interface ImportableDomain {
  domain: NamefiNormalizedDomain;
  availabilityInfo: DomainAvailabilityInfo;
  eppAuthorizationCode: string;
}

interface FloatingCartProps {
  searchMode?: SearchMode;
  importableDomains?: ImportableDomain[];
  onBusyChange?: (isBusy: boolean) => void;
}

export const FloatingCart = ({
  searchMode,
  importableDomains,
  onBusyChange,
}: FloatingCartProps) => {
  const { cartData: items } = useCartContext();
  const cart = useCart();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(FLOATING_CART_BASE_BOTTOM);
  const footerRef = useRef<HTMLElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const lastCartHeightRef = useRef(0);
  const { state: sidebarState, isMobile } = useSidebar();
  const frameRef = useRef<number | null>(null);

  const leftOffset = useMemo(() => {
    if (isMobile) {
      return '50%';
    }

    const ExpandedOffset = 'calc(50% + 8rem)';
    const CollapsedOffset = 'calc(50% + 1.5rem)';

    return sidebarState === 'expanded' ? ExpandedOffset : CollapsedOffset;
  }, [isMobile, sidebarState]);

  const totalAmountInUsdCents = useMemo(
    () => items?.reduce((sum, item) => sum + item.amountInUSDCents, 0) ?? 0,
    [items],
  );

  // Filter out domains already in cart
  const filteredImportableDomains = useMemo(() => {
    if (!importableDomains || !items) return importableDomains;

    const cartDomains = new Set(items.map((item) => item.normalizedDomainName));
    return importableDomains.filter(({ domain }) => !cartDomains.has(domain));
  }, [importableDomains, items]);

  const logBeginCheckout = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {
        totalAmountInUsdCents,
        cartItems: items
          ? cartItemsToInteractionLoggingCartItems(items)
          : undefined,
      },
    });
  }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

  // Add all valid domains to cart
  const handleAddAllToCart = useCallback(async () => {
    if (!filteredImportableDomains || filteredImportableDomains.length === 0)
      return;

    setIsAddingAll(true);
    onBusyChange?.(true);

    try {
      const validItems = filteredImportableDomains
        .map(({ availabilityInfo, eppAuthorizationCode }) => {
          if (!eppAuthorizationCode || !eppAuthorizationCode.trim())
            return null;

          const minDuration =
            availabilityInfo.durationValidationInYears?.min ?? 1;
          return {
            domainAvailabilityInfo: availabilityInfo,
            durationInYears: minDuration,
            operationType: 'IMPORT' as const,
            eppAuthorizationCode: eppAuthorizationCode,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (validItems.length > 0) {
        await cart.addItem(validItems);
      }
    } catch (_error) {
      // Swallowing error to preserve UX; upstream logging captures cart failures.
    } finally {
      setIsAddingAll(false);
      onBusyChange?.(false);
    }
  }, [filteredImportableDomains, cart, onBusyChange]);

  const itemCount = items?.length ?? 0;
  const hasItems = itemCount > 0;
  const totalAmountInUsd = totalAmountInUsdCents / 100;
  const roundedTotalAmount = Number(totalAmountInUsd.toFixed(2));

  const importableCount = filteredImportableDomains?.length ?? 0;

  const shouldShowAddAllButton =
    searchMode === SearchMode.IMPORT && importableCount > 0;

  const cartStateSignature = `${itemCount}:${importableCount}:${
    isAddingAll ? 1 : 0
  }:${shouldShowAddAllButton ? 1 : 0}`;

  const recalcPosition = useCallback(() => {
    const footerEl =
      footerRef.current ?? document.querySelector<HTMLElement>('footer');
    if (!footerRef.current && footerEl) {
      footerRef.current = footerEl;
    }

    const measuredCartHeight = cartRef.current?.offsetHeight;
    if (typeof measuredCartHeight === 'number' && measuredCartHeight > 0) {
      lastCartHeightRef.current = measuredCartHeight;
    }
    const cartHeight = measuredCartHeight ?? lastCartHeightRef.current;
    const viewportHeight = window.innerHeight;
    let nextBottom = FLOATING_CART_BASE_BOTTOM;

    if (footerEl && cartHeight > 0) {
      const footerRect = footerEl.getBoundingClientRect();
      const footerOverlap = Math.max(0, viewportHeight - footerRect.top);
      const desiredBottom =
        footerOverlap > 0
          ? footerOverlap - cartHeight / 2
          : FLOATING_CART_BASE_BOTTOM;
      const desiredClamped = Math.max(FLOATING_CART_BASE_BOTTOM, desiredBottom);
      nextBottom = desiredClamped;
    }

    setBottomOffset((prev) =>
      Math.abs(prev - nextBottom) > 1 ? nextBottom : prev,
    );
  }, []);

  const scheduleRecalc = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      recalcPosition();
    });
  }, [recalcPosition]);

  useEventListener('scroll', scheduleRecalc, undefined, { passive: true });
  useEventListener('resize', scheduleRecalc);

  useEffect(() => {
    recalcPosition();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [recalcPosition]);

  useEffect(() => {
    if (!hasItems) return;
    void cartStateSignature;
    recalcPosition();
  }, [hasItems, cartStateSignature, recalcPosition]);

  return (
    <AnimatePresence>
      {hasItems ? (
        <motion.aside
          key="floating-cart"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed z-40 w-full max-w-sm -translate-x-1/2 px-4 sm:max-w-xl"
          style={{
            bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
            left: leftOffset,
          }}
        >
          <motion.div
            layout
            ref={cartRef}
            className="pointer-events-auto overflow-hidden rounded-[24px] border border-white/12 bg-black/55 backdrop-blur-xl shadow-[0_22px_48px_-26px_rgba(0,0,0,0.78),0_0_40px_-24px_rgba(94,255,220,0.24)]"
          >
            <div className="flex flex-col gap-2.5 p-3.5 sm:px-5 sm:py-4 sm:gap-3">
              <motion.div
                layout
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex w-full items-center gap-2 sm:gap-3">
                  <span className="flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.2em]">
                    <NumberFlow
                      value={itemCount}
                      className="text-[13px] font-semibold normal-case tracking-normal text-white sm:text-base"
                      style={
                        {
                          '--number-flow-char-height': '1em',
                          '--number-flow-mask-height': '0.35em',
                        } as CSSProperties
                      }
                    />
                    <span className="ml-[3px] whitespace-nowrap">
                      {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </span>
                  <div className="ml-auto flex min-w-0 flex-col items-end text-right text-white/80 sm:ml-0 sm:items-start sm:text-left sm:gap-0">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-white/55 sm:text-[11px] sm:tracking-[0.2em]">
                      Cart total
                    </span>
                    <NumberFlow
                      value={roundedTotalAmount}
                      prefix="$"
                      className="text-sm font-semibold text-white tracking-tight sm:text-xl"
                      style={
                        {
                          '--number-flow-char-height': '1.05em',
                          '--number-flow-mask-height': '0.35em',
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                  {shouldShowAddAllButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddAllToCart}
                      disabled={isAddingAll}
                      className={cn(
                        'inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.02] px-4 text-[11px] font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07] sm:h-10 sm:w-auto sm:px-6 sm:text-sm',
                      )}
                    >
                      {isAddingAll ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      <span className="flex items-center gap-1.5 pl-1.5">
                        Add all
                        <NumberFlow
                          value={importableCount}
                          className="text-sm font-semibold"
                          style={
                            {
                              '--number-flow-char-height': '0.95em',
                              '--number-flow-mask-height': '0.3em',
                            } as CSSProperties
                          }
                        />
                      </span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="default"
                    className={cn(
                      'inline-flex h-10 w-full min-w-[120px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-primary px-5 text-sm font-semibold text-black shadow-[0_15px_35px_-12px_rgba(16,185,129,0.6)] transition hover:bg-brand-primary/90 sm:h-11 sm:w-auto sm:min-w-[140px] sm:px-8 sm:text-base',
                    )}
                    onClick={() => {
                      logBeginCheckout();
                      router.push('/cart');
                    }}
                  >
                    <ShoppingCartIcon className="size-5" />
                    Checkout
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};
