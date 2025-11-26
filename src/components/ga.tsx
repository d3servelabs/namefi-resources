'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent } from '@/components/providers/cookie-consent';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.GA_MEASUREMENT_ID ??
  '';

export function GoogleAnalyticsCookieConsentGated() {
  const { consent } = useCookieConsent();

  const isDevelopment =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ||
    process.env.ENVIRONMENT === 'development' ||
    process.env.NODE_ENV !== 'production';

  useEffect(() => {
    window.gtag?.('consent', 'update', {
      analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }, [consent]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const domain =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'astra';
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      origin_type: 'first_party',
      origin_domain: domain,
      update: true,
    });
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
          });
        `}
      </Script>

      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script id="ga-config" strategy="afterInteractive">
        {`
          gtag('js', new Date());

          gtag('config', '${GA_MEASUREMENT_ID}', {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            origin_type: 'first_party',
            origin_domain: (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'astra',
            debug_mode: ${isDevelopment}
          });
        `}
      </Script>
    </>
  );
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
