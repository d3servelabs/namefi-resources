// Order processing report template for successful and failed items

import { defaultTo, isEmpty } from 'ramda';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import punycode from 'punycode';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button } from '@react-email/components';
import { button } from '../styles';
import {
  addPoweredByNamefiToUrl,
  usePoweredByNamefiDomain,
  withPoweredByNamefiDomain,
} from '../components/powered-by-namefi-url-context';
import {
  paymentProviderSchema,
  type PaymentProvider,
} from '@namefi-astra/db/types';

export type ProcessedOrderItem = {
  normalizedDomainName: string;
  duration: number; // in years
  price: number; // in USD
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
};

export type ProcessedOrderProps = {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  items: ProcessedOrderItem[];
  chargedAmountInUsd: number;
  paymentMethodCharged: PaymentProvider;
  paymentMethodIdentifier: string;
  refundAmountInUsd?: number;
  refundStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  ctaLink?: string;
};

const defaults: ProcessedOrderProps = {
  orderId: 'order-123',
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  items: [
    {
      normalizedDomainName: 'test.org',
      duration: 1,
      price: 12.99,
      status: 'SUCCESS',
    },
    {
      normalizedDomainName: 'example.org',
      duration: 2,
      price: 25.98,
      status: 'FAILED',
      failureReason: 'Domain unavailable',
    },
  ],
  chargedAmountInUsd: 38.97,
  paymentMethodCharged: paymentProviderSchema.Values.STRIPE,
  paymentMethodIdentifier: '...7890',
  refundAmountInUsd: 25.98,
  refundStatus: 'SUCCESS',
};

export const ProcessedOrderReport = withPoweredByNamefiDomain(
  (props: ProcessedOrderProps) => {
    const {
      orderId,
      recipientName,
      items,
      chargedAmountInUsd,
      paymentMethodCharged,
      paymentMethodIdentifier,
      refundAmountInUsd,
      refundStatus,
      ctaLink,
    } = defaultTo(defaults, isEmpty(props) ? null : props);

    const poweredByNamefiDomain = usePoweredByNamefiDomain();

    const successfulItems = items.filter((item) => item.status === 'SUCCESS');
    const failedItems = items.filter((item) => item.status === 'FAILED');

    const messageMarkdown =
      `Hi ${recipientName ?? ''},\n\n` +
      `Your order ${orderId} has been processed. Here are the details:`;

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

        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: '1px #D9D9D9 solid',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                }}
              >
                Domain Name
              </th>
              <th
                style={{
                  border: '1px #D9D9D9 solid',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  textAlign: 'center',
                }}
              >
                Duration
              </th>
              <th
                style={{
                  border: '1px #D9D9D9 solid',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  textAlign: 'right',
                }}
              >
                Price
              </th>
              <th
                style={{
                  border: '1px #D9D9D9 solid',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  textAlign: 'center',
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.normalizedDomainName}>
                <td
                  style={{
                    border: '1px #D9D9D9 solid',
                    padding: '8px',
                    textAlign: 'left',
                  }}
                >
                  {item.normalizedDomainName}{' '}
                  {punycode.toUnicode(item.normalizedDomainName) ===
                  item.normalizedDomainName
                    ? ''
                    : `(${punycode.toUnicode(item.normalizedDomainName)})`}
                </td>
                <td
                  style={{
                    border: '1px #D9D9D9 solid',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  {item.duration} year{item.duration > 1 ? 's' : ''}
                </td>
                <td
                  style={{
                    border: '1px #D9D9D9 solid',
                    padding: '8px',
                    textAlign: 'right',
                  }}
                >
                  ${item.price.toFixed(2)}
                </td>
                <td
                  style={{
                    border: '1px #D9D9D9 solid',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      color: item.status === 'SUCCESS' ? 'green' : 'red',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.status === 'SUCCESS' ? 'Success' : 'Failed'}
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
              ${chargedAmountInUsd.toFixed(2)}
            </span>
          </div>
          {refundAmountInUsd && refundAmountInUsd > 0 && (
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
                    refundStatus === 'SUCCESS'
                      ? 'green'
                      : refundStatus === 'FAILED'
                        ? 'red'
                        : 'orange',
                }}
              >
                ${refundAmountInUsd.toFixed(2)} ({refundStatus})
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
          {successfulItems.length > 0 && failedItems.length > 0
            ? `**Order Summary:** ${successfulItems.length} item${successfulItems.length > 1 ? 's' : ''} processed successfully, ${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed.`
            : successfulItems.length > 0
              ? `**Order Summary:** All ${successfulItems.length} item${successfulItems.length > 1 ? 's' : ''} processed successfully!`
              : `**Order Summary:** All ${failedItems.length} item${failedItems.length > 1 ? 's' : ''} failed to process.`}
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
            {refundAmountInUsd && refundAmountInUsd > 0
              ? `A refund of $${refundAmountInUsd.toFixed(2)} has been ${refundStatus === 'SUCCESS' ? 'processed' : refundStatus === 'FAILED' ? 'failed' : 'initiated'} to your original payment method. For failed items, please try again or contact support@namefi.io if the problem persists.`
              : 'For failed items, please try again or contact support@namefi.io if the problem persists.'}
          </ReactMarkdown>
        )}
        {ctaLink && (
          <Button
            style={button}
            href={addPoweredByNamefiToUrl(
              ctaLink,
              poweredByNamefiDomain ?? null,
            )}
          >
            Check Your Order Details
          </Button>
        )}
        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default ProcessedOrderReport;
