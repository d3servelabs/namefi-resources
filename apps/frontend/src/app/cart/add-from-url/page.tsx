'use client';

import { CartCard } from '@/components/cart-card';
import { PageShell } from '@/components/page-shell';
import { useCartContext } from '@/components/providers/cart';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { AddToCartParams } from '@/hooks/use-cart';
import { useTRPCClient } from '@/lib/trpc';
import {
  isDomainImportable,
  isDomainRegistrable,
} from '@namefi-astra/common/domain-availability';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils/namefi-flavor';
import { AlertTriangle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

const PARAM_KEY = 'add_to_cart';

type StepKey = 'parse' | 'fetch' | 'add' | 'redirect';
type StepStatus = 'pending' | 'active' | 'done' | 'error';

const STEP_KEYS: StepKey[] = ['parse', 'fetch', 'add', 'redirect'];

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
  valid: NamefiNormalizedDomain[];
  invalid: string[];
  alreadyInCart: NamefiNormalizedDomain[];
  readyToAdd: NamefiNormalizedDomain[];
  added: NamefiNormalizedDomain[];
  importOnly: NamefiNormalizedDomain[];
  unsupported: NamefiNormalizedDomain[];
};

export default function AddFromUrlPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
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
    readyToAdd: [],
    added: [],
    importOnly: [],
    unsupported: [],
  });
  const [payload, setPayload] = useState<AddToCartParams[]>([]);
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
        setError(t('addFromUrl.errors.noDomains'));
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

        const valid: NamefiNormalizedDomain[] = [];
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

        setSummary({
          requested,
          valid: dedupedValid,
          invalid,
          alreadyInCart,
          readyToAdd: [],
          added: [],
          importOnly: [],
          unsupported: [],
        });
        setStepStatus((prev) => ({ ...prev, parse: 'done', fetch: 'active' }));

        const availability = toLookup.length
          ? await trpcClient.registry.getDomainListInfo.query({
              domains: toLookup,
            })
          : [];

        const importOnly: NamefiNormalizedDomain[] = [];
        const unsupported: NamefiNormalizedDomain[] = [];
        const readyToAdd: NamefiNormalizedDomain[] = [];

        const nextPayload: AddToCartParams[] = availability.flatMap((info) => {
          if (!isDomainRegistrable(info)) {
            if (isDomainImportable(info)) {
              importOnly.push(info.domain);
            } else {
              unsupported.push(info.domain);
            }
            return [];
          }
          readyToAdd.push(info.domain);
          const durationInYears = info.durationValidationInYears?.min ?? 1;
          return [
            {
              domainAvailabilityInfo: info,
              durationInYears,
              operationType: 'REGISTER',
            } satisfies AddToCartParams,
          ];
        });

        setPayload(nextPayload);
        setSummary((prev) => ({
          ...prev,
          readyToAdd,
          importOnly,
          unsupported,
        }));
        setStepStatus((prev) => ({ ...prev, fetch: 'done', add: 'pending' }));
      } catch (err) {
        console.error('Failed to process add_to_cart param', err);
        setError(
          err instanceof Error
            ? err.message
            : t('addFromUrl.errors.validationFailed'),
        );
        setStepStatus((prev) => ({ ...prev, fetch: 'error' }));
      }
    };

    void run();
  }, [isDomainInCart, router, searchParams, trpcClient, t]);

  const handleConfirmAdd = useCallback(async () => {
    if (!payload.length || stepStatus.add === 'active') return;
    setStepStatus((prev) => ({ ...prev, add: 'active' }));
    setError(null);

    try {
      const added =
        payload.length > 0
          ? (await addItem(payload)).map((i) => i.normalizedDomainName)
          : [];

      setSummary((prev) => {
        const skipped = prev.readyToAdd.filter(
          (domain) => !added.includes(domain),
        );
        const mergedAlreadyInCart = skipped.length
          ? Array.from(new Set([...prev.alreadyInCart, ...skipped]))
          : prev.alreadyInCart;
        return {
          ...prev,
          added,
          alreadyInCart: mergedAlreadyInCart,
        };
      });

      setStepStatus((prev) => ({ ...prev, add: 'done', redirect: 'active' }));
      setTimeout(() => {
        router.replace('/cart');
      }, 600);
    } catch (err) {
      console.error('Failed to add to cart', err);
      setError(
        err instanceof Error ? err.message : t('addFromUrl.errors.addFailed'),
      );
      setStepStatus((prev) => ({ ...prev, add: 'error' }));
    }
  }, [addItem, payload, router, stepStatus.add, t]);

  const readyLabel =
    stepStatus.add === 'done'
      ? t('addFromUrl.detail.added')
      : t('addFromUrl.detail.readyToAdd');
  const readyData =
    stepStatus.add === 'done' ? summary.added : summary.readyToAdd;

  const detailItems = [
    { label: readyLabel, data: readyData },
    {
      label: t('addFromUrl.detail.alreadyInCart'),
      data: summary.alreadyInCart,
    },
    {
      label: t('addFromUrl.detail.requiresTransferCode'),
      data: summary.importOnly,
    },
    { label: t('addFromUrl.detail.unsupported'), data: summary.unsupported },
    { label: t('addFromUrl.detail.invalid'), data: summary.invalid },
  ].filter((item) => item.data.length > 0);

  const showConfirm =
    stepStatus.fetch === 'done' && stepStatus.redirect !== 'active';
  const canConfirm =
    payload.length > 0 &&
    stepStatus.fetch === 'done' &&
    stepStatus.add !== 'active' &&
    stepStatus.redirect !== 'active';
  const confirmLabel =
    stepStatus.add === 'active'
      ? t('addFromUrl.confirm.addingToCart')
      : stepStatus.add === 'error'
        ? tCommon('actions.tryAgain')
        : t('addFromUrl.confirm.addToCart');
  const confirmHelper = payload.length
    ? t('addFromUrl.confirm.reviewHelper')
    : t('addFromUrl.confirm.noRegistrableHelper');

  return (
    <PageShell size="narrow" padding="relaxed">
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {t('addFromUrl.cart')}
          </p>
          <h1 className="text-3xl font-semibold">{t('addFromUrl.heading')}</h1>
          <p className="text-muted-foreground">{t('addFromUrl.subheading')}</p>
        </div>

        <CartCard>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('addFromUrl.domainsRequested')}
              </p>
              <p className="text-base font-medium break-words">
                {joinedRequested || '—'}
              </p>
            </div>

            <div className="space-y-3">
              {STEP_KEYS.map((key) => {
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
                      {t(`addFromUrl.steps.${key}`)}
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

            {showConfirm && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{confirmHelper}</p>
                <Button onClick={handleConfirmAdd} disabled={!canConfirm}>
                  {confirmLabel}
                </Button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {stepStatus.redirect === 'active' && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('addFromUrl.redirecting')}
              </div>
            )}
          </div>
        </CartCard>
      </div>
    </PageShell>
  );
}
