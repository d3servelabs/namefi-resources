// Necessary if using App Router to ensure this file runs on the client
'use client';

import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

if (
  process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID &&
  process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN
) {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN,
    site: 'us5.datadoghq.com',
    service: 'namefi-astra-frontend',
    env: process.env.ENVIRONMENT,
    version: process.env.version,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    defaultPrivacyLevel: 'mask-user-input',
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
  });

  datadogRum.startSessionReplayRecording({
    force: true,
  });
}

export default function DatadogRum() {
  // Render nothing - this component is only included so that the init code
  // above will run client-side
  return null;
}
