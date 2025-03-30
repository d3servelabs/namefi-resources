import { render } from '@react-email/components';
import { sendMail } from './mail-client';
import RegisterdDomainSuccessfully from './templates/registered-domain-successfully';

/** Example function to demonstrate email sending with react-email */
export async function sendEmailExample() {
  const element = (
    <RegisterdDomainSuccessfully domainUnicodeName="example.com" />
  );
  const plain = await render(element, { plainText: true });
  const html = await render(element, { plainText: false, pretty: false });

  await sendMail({
    to: ['archive@namefi.io'],
    cc: ['dev-team@namefi.io'],
    subject: 'Domain Registration Successful',
    content: {
      html,
      plain,
    },
  });
}
