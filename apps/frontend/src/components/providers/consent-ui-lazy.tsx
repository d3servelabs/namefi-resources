'use client';

import { ConsentBanner, ConsentDialog } from '@c15t/nextjs';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

function ResponsiveActionLabel({
  label,
  icon,
}: {
  label: string;
  icon: 'accept' | 'reject';
}) {
  const Icon = icon === 'accept' ? Check : X;
  return (
    <>
      <span className="sr-only">{label}</span>
      <span className="namefi-consent-action-icon" aria-hidden="true">
        <Icon className="size-3.5" strokeWidth={2.75} />
      </span>
      <span className="namefi-consent-action-text" aria-hidden="true">
        {label}
      </span>
    </>
  );
}

/**
 * Client-only consent UI components.
 *
 * This module is intentionally kept separate so it can be dynamically
 * imported later if needed. For now it remains a small, direct import.
 *
 * Banner design notes:
 * - Analytics (`measurement`) is our only consent-requiring category, so the
 *   Reject/Accept pair already expresses the full choice — no "Customize" step
 *   is shown on the banner (`layout={[['reject', 'accept']]}`). Per-category
 *   review and later changes stay available via the footer "Cookie Settings"
 *   entry, which opens the <ConsentDialog /> below.
 * - "Reject" here is necessary-only: essential cookies always run (GDPR exempt)
 *   while `measurement` is declined.
 * - The responsive description names the purpose and links to the policy so
 *   the choice stays informed; `hideBranding` drops the vendor tag for a
 *   cleaner, more compact bar.
 */
export function ConsentUIComponents() {
  const t = useTranslations('consent');
  const cookiesLink = (chunks: ReactNode) => (
    <a href="https://namefi.io/tos" className="underline">
      {chunks}
    </a>
  );
  return (
    <>
      <ConsentBanner
        layout={[['reject', 'accept']]}
        primaryButton="accept"
        hideBranding
        title=""
        description={
          <>
            <span className="namefi-consent-copy-small">
              {t.rich('descriptionSmall', { cookiesLink })}
            </span>
            <span className="namefi-consent-copy-desktop">
              {t.rich('descriptionDesktop', { cookiesLink })}
            </span>
          </>
        }
        rejectButtonText={
          <ResponsiveActionLabel label={t('reject')} icon="reject" />
        }
        acceptButtonText={
          <ResponsiveActionLabel label={t('accept')} icon="accept" />
        }
      />
      <ConsentDialog />
    </>
  );
}

export default ConsentUIComponents;
