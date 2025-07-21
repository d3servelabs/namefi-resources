// This is a combined report for domain renew success and failure

import { defaultTo, isEmpty } from 'ramda';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import punycode from 'punycode';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { z } from 'zod';

const paymentProviderSchema = z.enum([
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
]);
type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export type DomainRenewReportProps = {
  recipientUserId: string;
  recipientName: string;
  recipientEmail: string;
  chargedAmountInUsd: number;
  paymentMethodCharged: PaymentProvider;
  domainLdhRenewFailed: string[];
  domainLdhRenewSucceeded: string[];
  paymentMethodIdentifier: string;
  refundAmountInUsd: number | null | undefined;
  refundStatus: 'SUCCESS' | 'FAILED';
};

const defaults: DomainRenewReportProps = {
  recipientUserId: '123',
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  domainLdhRenewSucceeded: ['test.org'],
  domainLdhRenewFailed: ['example.org', 'example.net'],
  chargedAmountInUsd: 120,
  paymentMethodCharged: paymentProviderSchema.Values.STRIPE,
  paymentMethodIdentifier: '...7890',
  refundAmountInUsd: 50,
  refundStatus: 'SUCCESS',
};

// TODO add length check
type EvmAddress = `0x${string}`; // TODO add length check

function abbreviateEvmAddress(address: EvmAddress) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const DomainRenewReport = (props: DomainRenewReportProps) => {
  const {
    recipientUserId,
    recipientName,
    domainLdhRenewSucceeded,
    domainLdhRenewFailed,
    chargedAmountInUsd,
    refundAmountInUsd,
    paymentMethodCharged,
  } = defaultTo(defaults, isEmpty(props) ? null : props);
  const messageMarkdown =
    `Hi ${recipientName ?? ''},\n\n` +
    'We performed the renew for the following domains in your account ' +
    `(${recipientUserId})` + // TODO: add link to user dashboard
    ` charged ${chargedAmountInUsd.toFixed(2)}` +
    ` of the payment method ${paymentMethodCharged} and here is the result:`;
  return (
    <NamefiEmailContainer title="[Namefi] Domain Expiration and Renewal Notice">
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
            Renew Status
          </td>
        </tr>
        {domainLdhRenewSucceeded.map((domainNameLdh) => (
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
              <span style={{ color: 'green' }}>Success</span>
            </td>
          </tr>
        ))}
        {domainLdhRenewFailed.map((domainNameLdh) => (
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
              <span style={{ color: 'red' }}>Failed</span>
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
        {domainLdhRenewFailed.length > 0
          ? `The refund amount of \$${refundAmountInUsd?.toFixed(2)}USD has been initiated to your original payment method(${paymentMethodCharged}).` +
            ' For domains that failed to renew, please renew them on the Namefi App dashboard.' +
            ' If the problem persists, please contact support@namefi.io.'
          : ''}
      </ReactMarkdown>
      <GoToDashboard />
    </NamefiEmailContainer>
  );
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainRenewReport;
