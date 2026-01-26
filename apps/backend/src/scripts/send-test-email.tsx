#!/usr/bin/env tsx

import { Button, Text, render } from '@react-email/components';
import { Code } from '../mail/components/code';
import { NamefiEmailContainer } from '../mail/components/namefi-email-container';
import { sendMail } from '../mail/mail-client';
import { button, paragraph } from '../mail/styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import {
  usePoweredByNamefiDomain,
  withPoweredByNamefiDomain,
} from '../mail/components/powered-by-namefi-url-context';
import { NamefiEmailLinks } from '../mail/email-links';
import {
  buildEmailTrackUrl,
  withEmailTracking,
} from '../mail/components/email-tracking';

const TestEmail = withEmailTracking(
  withPoweredByNamefiDomain(() => {
    const poweredByNamefiDomain = usePoweredByNamefiDomain();
    return (
      <NamefiEmailContainer title={'[Namefi] Test Email'}>
        <Text style={paragraph}> Thank you for using Namefi.</Text>

        <Text style={{ ...paragraph, display: 'inline' }}>Your Test</Text>
        <Code> {'Test 01'} </Code>
        <Text style={{ ...paragraph, display: 'inline' }}>
          {' '}
          is ready for you{' '}
        </Text>
        <Button
          style={button}
          href={NamefiEmailLinks.domainSettings({
            domain: 'test01.com',
            poweredByNamefiDomain,
          })}
        >
          Go To Test
        </Button>
      </NamefiEmailContainer>
    );
  }),
);
// Start the process
async function main(): Promise<void> {
  const trackingUrl = await buildEmailTrackUrl({
    trackUrl:
      'https://armipotent-servilely-sarita.ngrok-free.dev/v1/email/track/open/',
    data: { userId: '1234567890', email: 'test@example.com' },
  });
  console.log('trackingUrl', trackingUrl);
  const email = (
    <TestEmail
      poweredByNamefiDomain={'0x.city'}
      trackingUrl={trackingUrl.url}
    />
  );
  const html = await render(email, { plainText: false, pretty: false });
  const plain = await render(email, { plainText: true, pretty: false });
  await sendMail({
    to: ['dev-team@d3serve.xyz'],
    subject: 'Test Email',
    content: {
      html,
      plain,
    },
  });
}

main()
  .then(() => console.log('Test email sent successfully'))
  .catch((err) => {
    const error = err as Error;
    console.error('Unhandled error:', error);
    process.exit(1);
  });
