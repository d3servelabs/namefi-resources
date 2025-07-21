import { defaultTo, isEmpty } from 'ramda';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import punycode from 'punycode';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { NamefiEmailLinks } from '../email-links';
import { withPoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export type DomainRenewFailedToChargeProps = {
  recipientName: string;
  recipientEmail: string;
  recipientUserId: string;
  domainsToRenew: string[];
  chargeAmountInUsd: number;
};

const defaults: DomainRenewFailedToChargeProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  recipientUserId: '123',
  domainsToRenew: ['example.org', 'example.net'],
  chargeAmountInUsd: 120,
};

export const DomainRenewFailedToCharge = withPoweredByNamefiDomain(
  (props: DomainRenewFailedToChargeProps) => {
    const {
      recipientName,
      recipientUserId,
      domainsToRenew,
      chargeAmountInUsd,
    } = defaultTo(defaults, isEmpty(props) ? null : props);

    const messageMarkdown =
      `Hi ${recipientName},\n\n` +
      `In order to renew the following domains in your account (${recipientUserId}),` + // TODO: add link to user dashboard
      ` we attempted to process a payment of \$${chargeAmountInUsd.toFixed(2)} USD,` +
      ' but the payment process was unsuccessful.' +
      ' This is usually due to lack of saved Stripe payment information and no enough available NamefiServiceCredits(NFSC) balance in your crypto account.';

    return (
      <NamefiEmailContainer title="[Namefi] Important: Domain Renewal Payment Failed">
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
          ]}
        >
          {messageMarkdown}
        </ReactMarkdown>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Domain Name
            </td>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Status
            </td>
          </tr>
          {domainsToRenew.map((domainNameLdh) => (
            <tr key={domainNameLdh}>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                {domainNameLdh}{' '}
                {punycode.toUnicode(domainNameLdh) === domainNameLdh
                  ? ''
                  : `(${punycode.toUnicode(domainNameLdh)})`}
              </td>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                <span style={{ color: 'red' }}>Payment Failed</span>
              </td>
            </tr>
          ))}
        </table>
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
          ]}
        >
          {`**Action Required**: Please visit the [Namefi Dashboard](${NamefiEmailLinks.dashboard(
            {
              poweredByNamefiDomain: null,
            },
          )}) as soon as possible to update your payment information and renew these domains. Failure to renew on time may result in your domains expiring and becoming available for others to register.

If you need any assistance, please contact our support team at support@namefi.io.`}
        </ReactMarkdown>
        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainRenewFailedToCharge;
