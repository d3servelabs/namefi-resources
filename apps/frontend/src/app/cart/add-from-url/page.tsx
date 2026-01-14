'use client';

import { CartCard } from '@/components/cart-card';
import { useCartContext } from '@/components/providers/cart';
import { cn } from '@/lib/cn';
import { useTRPCClient } from '@/lib/trpc';
import type { AddToCartParams } from '@/hooks/use-cart';
import {
  isDomainImportable,
  isDomainRegistrable,
} from '@namefi-astra/contracts/domain-availability';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { Loader2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { PageShell } from '@/components/page-shell';

const PARAM_KEY = 'add_to_cart';

type StepKey = 'parse' | 'fetch' | 'add' | 'redirect';
type StepStatus = 'pending' | 'active' | 'done' | 'error';

const STEP_LABEL: Record<StepKey, string> = {
  parse: 'Validating domains',
  fetch: 'Checking availability',
  add: 'Adding to cart',
  redirect: 'Sending you to your cart',
};

const DEFAULT_STATUS: Record<StepKey, StepStatus> = {
  parse: 'pending',
  fetch: 'pending',
  add: 'pending',
  redirect: 'pending',
};

const STATUS_ICON: Record<StepStatus, ReactElement> = {
  active: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

type Summary = {
  requested: string[];
  valid: string[];
  invalid: string[];
  alreadyInCart: string[];
  added: string[];
  importOnly: string[];
  unsupported: string[];
};

export default function AddFromUrlPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpcClient = useTRPCClient();
  const { addItem, isDomainInCart } = useCartContext();

  const [stepStatus, setStepStatus] =
    useState<Record<StepKey, StepStatus>>(DEFAULT_STATUS);
  const [summary, setSummary] = useState<Summary>({
    requested: [],
    valid: [],
    invalid: [],
    alreadyInCart: [],
    added: [],
    importOnly: [],
    unsupported: [],
  });
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const joinedRequested = useMemo(
    () => summary.requested.join(', '),
    [summary.requested],
  );

  useEffect(() => {
    const run = async () => {
      const raw = searchParams.get(PARAM_KEY);
      if (!raw) {
        setError('No domains were provided.');
        setStepStatus((prev) => ({ ...prev, parse: 'error' }));
        setStepStatus((prev) => ({ ...prev, redirect: 'active' }));
        router.replace('/cart');
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;

      try {
        setStepStatus((prev) => ({ ...prev, parse: 'active' }));

        const requested = raw
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);

        const valid: string[] = [];
        const invalid: string[] = [];
        requested.forEach((domain) => {
          const parsed = namefiNormalizedDomainSchema.safeParse(domain);
          if (parsed.success) valid.push(parsed.data);
          else invalid.push(domain);
        });

        const dedupedValid = Array.from(new Set(valid));
        const alreadyInCart = dedupedValid.filter(isDomainInCart);
        const toLookup = dedupedValid.filter(
          (domain) => !alreadyInCart.includes(domain),
        );

        setSummary((prev) => ({
          ...prev,
          requested,
          valid: dedupedValid,
          invalid,
          alreadyInCart,
        }));
        setStepStatus((prev) => ({ ...prev, parse: 'done', fetch: 'active' }));

        const availability = toLookup.length
          ? await trpcClient.registry.getDomainListInfo.query({
              domains: toLookup,
            })
          : [];

        setStepStatus((prev) => ({ ...prev, fetch: 'done', add: 'active' }));

        const importOnly: string[] = [];
        const unsupported: string[] = [];

        const payload: AddToCartParams[] = availability.flatMap((info) => {
          if (!isDomainRegistrable(info)) {
            if (isDomainImportable(info)) {
              importOnly.push(info.domain);
            } else {
              unsupported.push(info.domain);
            }
            return [];
          }
          const durationInYears = info.durationValidationInYears?.min ?? 1;
          return [
            {
              domainAvailabilityInfo: info,
              durationInYears,
              operationType: 'REGISTER',
            } satisfies AddToCartParams,
          ];
        });

        const added =
          payload.length > 0
            ? (await addItem(payload)).map((i) => i.normalizedDomainName)
            : [];

        setSummary((prev) => ({
          ...prev,
          added,
          importOnly,
          unsupported,
        }));
        setStepStatus((prev) => ({ ...prev, add: 'done', redirect: 'active' }));
      } catch (err) {
        console.error('Failed to process add_to_cart param', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while adding to cart.',
        );
        setStepStatus((prev) => ({
          ...prev,
          add: 'error',
          redirect: 'active',
        }));
      } finally {
        setTimeout(() => {
          router.replace('/cart');
        }, 600);
      }
    };

    void run();
  }, [addItem, isDomainInCart, router, searchParams, trpcClient]);

  const detailItems = [
    { label: 'Added', data: summary.added },
    { label: 'Already in cart', data: summary.alreadyInCart },
    { label: 'Requires transfer code', data: summary.importOnly },
    { label: 'Unsupported/unavailable', data: summary.unsupported },
    { label: 'Invalid', data: summary.invalid },
  ].filter((item) => item.data.length > 0);

  return (
    <PageShell size="narrow" padding="relaxed">
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Cart
          </p>
          <h1 className="text-3xl font-semibold">
            Adding domains to your cart
          </h1>
          <p className="text-muted-foreground">
            Sit tight while we validate, check availability, and load everything
            into your cart.
          </p>
        </div>

        <CartCard>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Domains requested</p>
              <p className="text-base font-medium break-words">
                {joinedRequested || '—'}
              </p>
            </div>

            <div className="space-y-3">
              {(Object.keys(STEP_LABEL) as StepKey[]).map((key) => {
                const status = stepStatus[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
                  >
                    {STATUS_ICON[status]}
                    <span
                      className={cn(
                        'text-sm',
                        status === 'done' && 'text-foreground',
                        status === 'active' && 'text-foreground',
                        status === 'pending' && 'text-muted-foreground',
                        status === 'error' && 'text-destructive',
                      )}
                    >
                      {STEP_LABEL[key]}
                    </span>
                  </div>
                );
              })}
            </div>

            {detailItems.length > 0 && (
              <div className="space-y-2">
                {detailItems.map((item) => (
                  <div key={item.label} className="text-sm">
                    <span className="font-medium">{item.label}:</span>{' '}
                    <span className="text-muted-foreground">
                      {item.data.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to your cart…
              </div>
            )}
          </div>
        </CartCard>
      </div>
    </PageShell>
  );
}
