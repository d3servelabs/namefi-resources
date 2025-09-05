'use client';

import Script from 'next/script';
import { config } from '@/lib/env';
import { useCookieConsent } from '@/components/providers/cookie-consent';
import { useEffect } from 'react';
import { useOrigin } from '@/components/providers/origin';

export function GoogleAnalyticsCookieConsentGated() {
  const { consent } = useCookieConsent();
  const originInfo = useOrigin();

  useEffect(() => {
    window.gtag?.('consent', 'update', {
      analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }, [consent]);

  useEffect(() => {
    window.gtag?.('config', config.GA_MEASUREMENT_ID, {
      origin_type: originInfo.isFirstPartyOrigin
        ? 'first_party'
        : 'third_party',
      origin_domain: originInfo.thirdPartyHostname || 'astra',
      update: true,
    });
  }, [originInfo.isFirstPartyOrigin, originInfo.thirdPartyHostname]);

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
        src={`https://www.googletagmanager.com/gtag/js?id=${config.GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script id="ga-config" strategy="afterInteractive">
        {`
          gtag('js', new Date());
                    
          gtag('config', '${config.GA_MEASUREMENT_ID}', {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            origin_type: '${originInfo.isFirstPartyOrigin ? 'first_party' : 'third_party'}',
            origin_domain: '${originInfo.thirdPartyHostname || 'astra'}',
            debug_mode: ${config.TYPE === 'development'},
          });
        `}
      </Script>
    </>
  );
}
