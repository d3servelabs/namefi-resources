#!/usr/bin/env tsx

import { Button, Text, render } from '@react-email/components';
import { Code } from '../mail/components/code';
import { NamefiEmailContatiner } from '../mail/components/namefi-email-container';
import { getEmailsBaseUrl } from '../mail/consts';
import { sendMail } from '../mail/mail-client';
import { button, paragraph } from '../mail/styles';

// Start the process
async function main(): Promise<void> {
  const email = (
    <NamefiEmailContatiner title={'[Namefi] Test Email'}>
      <Text style={paragraph}> Thank you for using Namefi.</Text>

      <Text style={{ ...paragraph, display: 'inline' }}>Your Test</Text>
      <Code> {'Test 01'} </Code>
      <Text style={{ ...paragraph, display: 'inline' }}>
        {' '}
        is ready for you{' '}
      </Text>
      <Button
        style={button}
        href={`${getEmailsBaseUrl()}/dashboard/domains/${encodeURIComponent('test01')}`}
      >
        Go To Test
      </Button>
    </NamefiEmailContatiner>
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
