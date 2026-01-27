// This is a combined report for domain renew success and failure

// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import punycode from 'punycode';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { z } from 'zod';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Button } from '@react-email/components';
import { button } from '../styles';
import { addDays, format } from 'date-fns';
import * as styles from '../styles';

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
  chargeAmountInUsdByDomainLdh: Record<string, number>;
  expirationDatesByDomainLdh: Record<string, Date>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
  domainLdhRenewFailed: string[];
  domainLdhRenewSucceeded: string[];
  chargedAmountInUsd: number;
  payments: Array<{
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  refundAmountInUsd: number | null | undefined;
  refundStatus: 'SUCCESS' | 'FAILED';
  orderId?: string | null;
};

// Helper function to truncate wallet address
const truncateWalletAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

function formatNfscPaymentIdentifier(provider: PaymentProvider): string {
  switch (provider) {
    case 'NFSC_BASE':
      return 'NFSC Base';
    case 'NFSC_ETHEREUM':
      return 'NFSC Ethereum';
    case 'NFSC_ETHEREUM_SEPOLIA':
      return 'NFSC Ethereum Sepolia';
    default:
      return 'Unknown';
  }
}
// Helper function to format payment method identifier
const formatPaymentIdentifier = (
  payment: DomainRenewReportProps['payments'][number],
): string => {
  if (payment.walletAddress) {
    return `${truncateWalletAddress(payment.walletAddress)} (${formatNfscPaymentIdentifier(payment.provider)})`;
  }
  if (payment.stripeLast4) {
    return `Credit Card (••••${payment.stripeLast4})`;
  }
  return '';
};

export const DomainRenewReport = buildTemplate<DomainRenewReportProps>(
  (props) => {
    const {
      recipientUserId,
      recipientName,
      domainLdhRenewSucceeded,
      domainLdhRenewFailed,
      chargeAmountInUsdByDomainLdh,
      expirationDatesByDomainLdh,
      refundAmountInUsd,
      chargedAmountInUsd,
      payments: paymentMethods,
      orderId,
    } = props;
    const poweredByNamefiDomain = usePoweredByNamefiDomain();

    const allSucceeded =
      domainLdhRenewSucceeded.length > 0 && domainLdhRenewFailed.length === 0;
    const allFailed =
      domainLdhRenewFailed.length > 0 && domainLdhRenewSucceeded.length === 0;
    const mixed =
      domainLdhRenewSucceeded.length > 0 && domainLdhRenewFailed.length > 0;

    let introText = '';
    if (allSucceeded) {
      introText =
        domainLdhRenewSucceeded.length === 1
          ? "Great news! Your domain has been renewed and you're all set for another year."
          : "Great news! Your domains have been renewed and you're all set for another year.";
    } else if (allFailed) {
      introText =
        "We ran into some issues while renewing your domains. Here's what happened:";
    } else if (mixed) {
      introText =
        "We've renewed some of your domains, but a few need your attention:";
    }

    const messageMarkdown = `Hi ${recipientName ?? 'there'},\n\n${introText}`;

    const emailTitle = allSucceeded
      ? 'Your Domain Renewal is Complete'
      : allFailed
        ? 'Action Needed: Domain Renewal Issue'
        : 'Domain Renewal Update';

    return (
      <NamefiEmailContainer title={emailTitle}>
        <div style={{ ...styles.text }}>
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
        </div>
        <table
          style={{ ...styles.text, borderCollapse: 'collapse', width: '100%' }}
        >
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
              Expiration Date
            </td>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Renew Price
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
                {format(
                  expirationDatesByDomainLdh[domainNameLdh],
                  'yyyy-MM-dd',
                )}
              </td>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                ${chargeAmountInUsdByDomainLdh[domainNameLdh].toFixed(2)}
              </td>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                <span className="text-green-400">Success</span>
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
                {format(
                  expirationDatesByDomainLdh[domainNameLdh],
                  'yyyy-MM-dd',
                )}
              </td>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                ${chargeAmountInUsdByDomainLdh[domainNameLdh].toFixed(2)}
              </td>
              <td
                className="py-1 px-1"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
              >
                <span className="text-red-400">Failed (Registry Error)</span>
              </td>
            </tr>
          ))}
        </table>
        {/* Show payment method breakdown if multiple payments were used */}
        {paymentMethods && paymentMethods.length > 1 && (
          <>
            <h4
              style={{
                ...styles.text,
                marginTop: '20px',
                marginBottom: '10px',
              }}
            >
              Payments
            </h4>
            <table
              style={{
                ...styles.text,
                borderCollapse: 'collapse',
                width: '100%',
                fontFamily: 'monospace',
              }}
            >
              <tr>
                <td
                  className="py-1 px-1 font-medium"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                />
                <td
                  className="py-1 px-1 font-medium"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                >
                  Amount
                </td>
              </tr>
              {paymentMethods.map((payment) => (
                <tr key={payment.paymentId}>
                  <td
                    className="py-1 px-1"
                    style={{
                      border: '1px #D9D9D9 solid',
                      textAlign: 'left',
                    }}
                  >
                    {formatPaymentIdentifier(payment)}
                  </td>
                  <td
                    className="py-1 px-1 text-red-800"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    ${(payment.amountInUsdCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              {refundAmountInUsd && (
                <>
                  <tr>
                    <td />
                    <td />
                  </tr>
                  <tr>
                    <td
                      className="py-1 px-1"
                      style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                    >
                      Refunded Amount
                    </td>
                    <td
                      className="py-1 px-1 text-green-800"
                      style={{
                        border: '1px #D9D9D9 solid',
                        textAlign: 'right',
                      }}
                    >
                      - ${refundAmountInUsd.toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <td />
                <td />
              </tr>
              <tr>
                <td
                  className="py-1 px-1 font-medium"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                >
                  Total
                </td>
                <td
                  className="py-1 px-1 font-medium"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                >
                  {' '}
                  ${(chargedAmountInUsd - (refundAmountInUsd ?? 0)).toFixed(2)}
                </td>
              </tr>
            </table>
            <div style={{ marginTop: '2px', marginBottom: '30px' }}>
              <span style={{ fontSize: '11px', color: '#666' }}>
                For more details, view the order details
              </span>
            </div>
          </>
        )}
        {orderId && (
          <Button
            style={button}
            href={NamefiEmailLinks.orderDetails({
              orderId,
              poweredByNamefiDomain,
            })}
          >
            View Order Details
          </Button>
        )}
      </NamefiEmailContainer>
    );
  },
  {
    recipientUserId: '123',
    recipientName: 'Alice',
    recipientEmail: 'alice@example.com',
    domainLdhRenewSucceeded: ['test.org'],
    domainLdhRenewFailed: ['example.org', 'example.net'],
    chargeAmountInUsdByDomainLdh: {
      'test.org': 11.1,
      'example.org': 11.1,
      'example.net': 12.52,
    },
    expirationDatesByDomainLdh: {
      'test.org': addDays(new Date(), 1),
      'example.org': addDays(new Date(), 2),
      'example.net': addDays(new Date(), 3),
    },
    chargedAmountInUsd: 11.1 + 11.1 + 12.52,
    availableBalanceInNfsc: 11.1 + 12.52,
    availableOffChainPaymentMethods: ['4242', '0043'],
    payments: [
      {
        provider: paymentProviderSchema.enum.NFSC_BASE,
        amountInUsdCents: Math.round((11.1 + 12.52) * 100),
        paymentId: 'payment-1',
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
      {
        provider: paymentProviderSchema.enum.STRIPE,
        amountInUsdCents: 11.1 * 100,
        paymentId: 'payment-2',
        stripeLast4: '4242',
      },
    ],
    refundAmountInUsd: 11.1 + 12.52,
    refundStatus: 'SUCCESS',
    orderId: 'order-123',
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainRenewReport;
