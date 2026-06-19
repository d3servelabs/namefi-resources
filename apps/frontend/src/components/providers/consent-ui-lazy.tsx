'use client';

import { ConsentBanner, ConsentDialog } from '@c15t/nextjs';
import { useTranslations } from 'next-intl';

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
 *   while `measurement` is declined. Both buttons stay equally prominent, as
 *   GDPR requires.
 * - The one-line description names the purpose and links to the policy so the
 *   choice stays informed; `hideBranding` drops the vendor tag for a cleaner,
 *   more compact bar.
 */
export function ConsentUIComponents() {
  const t = useTranslations('consent');
  return (
    <>
      <ConsentBanner
        layout={[['reject', 'accept']]}
        primaryButton="accept"
        hideBranding
        title=""
        description={
          <>
            {t('description')}{' '}
            <a href="/tos" className="underline">
              {t('privacy')}
            </a>
          </>
        }
        rejectButtonText={t('reject')}
        acceptButtonText={t('accept')}
      />
      <ConsentDialog />
    </>
  );
}

export default ConsentUIComponents;
