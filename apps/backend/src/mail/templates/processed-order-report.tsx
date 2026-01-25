// Order processing report template for successful and failed items

// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { domainToASCII, domainToUnicode } from 'node:url';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button } from '@react-email/components';
import { button } from '../styles';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';
import pluralize from 'pluralize';

export type ProcessedOrderItem = {
  normalizedDomainName: string;
  duration: number; // in years
  priceInUsdCents: number; // in USD cents
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  failureReason?: string;
  type: 'IMPORT' | 'RENEW' | 'REGISTER';
};

export type ProcessedOrderProps = {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  items: ProcessedOrderItem[];
  chargedAmountInUsdCents: number;
  paymentMethodCharged: string;
  paymentMethodIdentifier: string;
  refund?: {
    amountInUsd: number;
    status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  };
};

export const ProcessedOrderReport = buildTemplate<ProcessedOrderProps>(
  (props) => {
    const {
      orderId,
      recipientName,
      items,
      chargedAmountInUsdCents,
      paymentMethodCharged,
      paymentMethodIdentifier,
      refund,
    } = props;

    const poweredByNamefiDomain = usePoweredByNamefiDomain();

    const successfulItems = items.filter((item) => item.status === 'SUCCEEDED');
    const failedItems = items.filter((item) => item.status === 'FAILED');
    const processingItems = items.filter(
      (item) => item.status === 'PROCESSING',
    );

    const summary = React.useMemo(() => {
      const summary = [];
      if (successfulItems.length > 0) {
        summary.push(
          `${successfulItems.length} item${successfulItems.length > 1 ? 's' : ''} processed successfully`,
        );
      }
      if (failedItems.length > 0) {
        summary.push(
          `${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed`,
        );
      }
      if (processingItems.length > 0) {
        summary.push(
          `${processingItems.length} item${processingItems.length > 1 ? 's' : ''} are still processing`,
        );
      }
      return `**Order Summary:** ${summary.join(', ')}.`;
    }, [successfulItems, failedItems, processingItems]);

    const successfulRegistrations = successfulItems.filter(
      (item) => item.type === 'REGISTER',
    );

    const processingImportItems = processingItems.filter(
      (item) => item.type === 'IMPORT',
    );

    let introMessage = `Your order ${orderId} has been processed.`;

    if (failedItems.length > 0 && successfulItems.length > 0) {
      introMessage = `Your order ${orderId} has been partially processed.`;
    } else if (failedItems.length > 0) {
      introMessage = `Your order ${orderId} failed to process.`;
    } else if (processingItems.length > 0) {
      introMessage = `Your order ${orderId} is still processing.`;
    }

    if (
      successfulRegistrations.length > 0 &&
      failedItems.length === 0 &&
      processingItems.length === 0
    ) {
      if (successfulRegistrations.length === 1) {
        const domain = getDomainWithIdn(
          successfulRegistrations[0].normalizedDomainName,
        );
        introMessage = `Congratulations! Your domain **${domain}** has been successfully registered and is ready for use.`;
      } else {
        introMessage = `Congratulations! Your **${successfulRegistrations.length} domains** have been successfully registered and are ready for use.`;
      }
    }

    const messageMarkdown =
      `Hi ${recipientName ?? ''},\n\n` +
      introMessage +
      ' Here are the details:';

    return (
      <NamefiEmailContainer title="[Namefi] Order Processed Report">
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

        <table style={localStyles.table}>
          <thead>
            <tr>
              <th style={{ ...localStyles.th, textAlign: 'left' }}>Domain</th>
              <th style={localStyles.th}>Type</th>
              <th style={localStyles.th}>Duration</th>
              <th style={{ ...localStyles.th, textAlign: 'right' }}>Price</th>
              <th style={localStyles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.normalizedDomainName}>
                <td style={{ ...localStyles.td, textAlign: 'left' }}>
                  {getDomainWithIdn(item.normalizedDomainName)}
                </td>
                <td style={localStyles.td}>{item.type}</td>
                <td style={localStyles.td}>
                  {pluralize('year', item.duration, true)}
                </td>
                <td style={{ ...localStyles.td, textAlign: 'right' }}>
                  ${(item.priceInUsdCents / 100).toFixed(2)}
                </td>
                <td style={localStyles.td}>
                  <span
                    style={{
                      color:
                        item.status === 'PROCESSING'
                          ? 'orange'
                          : item.status === 'SUCCEEDED'
                            ? 'green'
                            : 'red',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.status === 'PROCESSING'
                      ? 'Processing'
                      : item.status === 'SUCCEEDED'
                        ? 'Succeeded'
                        : 'Failed'}
                  </span>
                  {item.failureReason && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                      }}
                    >
                      {item.failureReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Payment Summary */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f9f9f9',
            border: '1px solid #e0e0e0',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Payment Summary
          </h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span>
              Total Charged ({paymentMethodCharged} {paymentMethodIdentifier}):
            </span>
            <span style={{ fontWeight: 'bold' }}>
              ${(chargedAmountInUsdCents / 100).toFixed(2)}
            </span>
          </div>
          {refund && refund.amountInUsd > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span>Refund Amount:</span>
              <span
                style={{
                  fontWeight: 'bold',
                  color:
                    refund.status === 'SUCCEEDED'
                      ? 'green'
                      : refund.status === 'FAILED'
                        ? 'red'
                        : 'orange',
                }}
              >
                ${refund.amountInUsd.toFixed(2)} ({refund.status})
              </span>
            </div>
          )}
        </div>

        {/* Summary Message */}
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
          ]}
        >
          {summary}
        </ReactMarkdown>

        {failedItems.length > 0 && (
          <ReactMarkdown
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] },
              ],
            ]}
          >
            {refund && refund.amountInUsd > 0
              ? `A refund of $${refund.amountInUsd.toFixed(2)} has been ${refund.status === 'SUCCEEDED' ? 'processed' : refund.status === 'FAILED' ? 'failed' : 'initiated'} to your original payment method. For failed items, please try again or contact support@namefi.io if the problem persists.`
              : 'For failed items, please try again or contact support@namefi.io if the problem persists.'}
          </ReactMarkdown>
        )}

        {processingImportItems.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#fff8e6',
              border: '1px solid #ffd666',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#d48806',
              }}
            >
              About Your Domain Import
            </h3>
            <div style={{ color: '#614700', fontSize: '14px' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>What happens next:</strong>
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
                <li style={{ marginBottom: '6px' }}>
                  Your current registrar will send you an email to confirm the
                  transfer. Please check your inbox (and spam folder).
                </li>
                <li style={{ marginBottom: '6px' }}>
                  The transfer process typically takes <strong>5-7 days</strong>{' '}
                  by default.
                </li>
                <li style={{ marginBottom: '6px' }}>
                  You can <strong>expedite the transfer</strong> by approving it
                  in your old registrar&apos;s dashboard.
                </li>
              </ul>
              <p style={{ margin: '0', fontSize: '13px', color: '#8c6d1f' }}>
                Once the transfer is approved, we will automatically complete
                the process and mint your domain NFT.
              </p>
            </div>
          </div>
        )}

        <Button
          style={button}
          href={NamefiEmailLinks.orderDetails({
            orderId,
            poweredByNamefiDomain,
          })}
        >
          Check Your Order Details
        </Button>
        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
  {
    orderId: 'order-123',
    recipientName: 'Alice',
    recipientEmail: 'alice@example.com',
    items: [
      {
        normalizedDomainName: 'test.org',
        duration: 1,
        priceInUsdCents: 1299,
        status: 'SUCCEEDED',
        type: 'REGISTER',
      },
      {
        normalizedDomainName: 'example.org',
        duration: 2,
        priceInUsdCents: 2598,
        status: 'FAILED',
        failureReason: 'Domain unavailable',
        type: 'REGISTER',
      },
      {
        normalizedDomainName: 'さみ.org',
        duration: 2,
        priceInUsdCents: 2598,
        status: 'SUCCEEDED',
        type: 'REGISTER',
      },
      {
        normalizedDomainName: 'example2.org',
        duration: 2,
        priceInUsdCents: 2598,
        status: 'PROCESSING',
        type: 'IMPORT',
      },
    ],
    chargedAmountInUsdCents: 2598 * 3 + 1299,
    paymentMethodCharged: 'Credit Card',
    paymentMethodIdentifier: '...7890',
    refund: {
      amountInUsd: 25.98,
      status: 'SUCCEEDED',
    },
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default ProcessedOrderReport;

const localStyles = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '20px',
  },
  td: {
    border: '1px #D9D9D9 solid',
    padding: '8px',
    textAlign: 'center',
  },
  th: {
    border: '1px #D9D9D9 solid',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
  },
} as const;

function getDomainWithIdn(domain: string) {
  const unicodeDomain = domainToUnicode(domain);
  const punycodeDomain = domainToASCII(domain) || domain;
  return unicodeDomain === punycodeDomain
    ? domain
    : `${unicodeDomain} (${punycodeDomain})`;
}
