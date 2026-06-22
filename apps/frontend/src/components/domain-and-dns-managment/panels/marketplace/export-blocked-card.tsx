'use client';

import { Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Shown in place of the listings/offers cards when a domain is exportable to
 * another registrar. An exportable domain can't be listed — its NFT may be
 * burned when the export completes, which would strand any active order.
 */
export function ExportBlockedCard() {
  const t = useTranslations('domains');
  return (
    <div
      data-testid="domains.marketplace.export-blocked.card"
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
        <Ban className="h-5 w-5 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">
        {t('marketplace.exportBlocked.title')}
      </h3>
      <p className="mt-2 text-sm text-zinc-400">
        {t.rich('marketplace.exportBlocked.description', {
          link: (chunks) => (
            <a
              href="mailto:support@namefi.io"
              className="text-brand-primary hover:underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}
