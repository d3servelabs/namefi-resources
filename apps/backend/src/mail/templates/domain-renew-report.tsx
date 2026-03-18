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
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import { button } from '../styles';
import { addDays, format } from 'date-fns';
import * as styles from '../styles';

const paymentProviderSchema = z.enum([
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
  'X402',
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
    case 'X402':
      return 'x402 (USDC)';
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

    const safeRecipientName =
      recipientName && recipientName.trim().length > 0
        ? recipientName
        : 'there';

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
    } else {
      introText = "Here's an update about your domain renewal:";
    }

    const messageMarkdown = `Hi ${safeRecipientName},\n\n${introText}`;

    const emailTitle = allSucceeded
      ? '[Namefi] Your Domain Renewal is Complete'
      : allFailed
        ? '[Namefi] Action Needed: Domain Renewal Issue'
        : '[Namefi] Domain Renewal Update';

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
        <EmailTable>
          <thead>
            <EmailTableRow>
              <EmailTableHeaderCell>Domain Name</EmailTableHeaderCell>
              <EmailTableHeaderCell>Expiration Date</EmailTableHeaderCell>
              <EmailTableHeaderCell numeric>Renew Price</EmailTableHeaderCell>
              <EmailTableHeaderCell>Renew Status</EmailTableHeaderCell>
            </EmailTableRow>
          </thead>
          <tbody>
            {domainLdhRenewSucceeded.map((domainNameLdh) => (
              <EmailTableRow key={domainNameLdh}>
                <EmailTableCell label="Domain Name">
                  {domainNameLdh}{' '}
                  {punycode.toUnicode(domainNameLdh) === domainNameLdh
                    ? ''
                    : `(${punycode.toUnicode(domainNameLdh)})`}
                </EmailTableCell>
                <EmailTableCell label="Expiration Date">
                  {format(
                    expirationDatesByDomainLdh[domainNameLdh],
                    'yyyy-MM-dd',
                  )}
                </EmailTableCell>
                <EmailTableCell label="Renew Price" numeric>
                  ${chargeAmountInUsdByDomainLdh[domainNameLdh].toFixed(2)}
                </EmailTableCell>
                <EmailTableCell label="Renew Status">
                  <span style={{ color: styles.astraTheme.successInk }}>
                    Success
                  </span>
                </EmailTableCell>
              </EmailTableRow>
            ))}
            {domainLdhRenewFailed.map((domainNameLdh) => (
              <EmailTableRow key={domainNameLdh}>
                <EmailTableCell label="Domain Name">
                  {domainNameLdh}{' '}
                  {punycode.toUnicode(domainNameLdh) === domainNameLdh
                    ? ''
                    : `(${punycode.toUnicode(domainNameLdh)})`}
                </EmailTableCell>
                <EmailTableCell label="Expiration Date">
                  {format(
                    expirationDatesByDomainLdh[domainNameLdh],
                    'yyyy-MM-dd',
                  )}
                </EmailTableCell>
                <EmailTableCell label="Renew Price" numeric>
                  ${chargeAmountInUsdByDomainLdh[domainNameLdh].toFixed(2)}
                </EmailTableCell>
                <EmailTableCell label="Renew Status">
                  <span style={{ color: styles.astraTheme.errorInk }}>
                    Failed (Registry Error)
                  </span>
                </EmailTableCell>
              </EmailTableRow>
            ))}
          </tbody>
        </EmailTable>
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
            <EmailTable>
              <thead>
                <EmailTableRow>
                  <EmailTableHeaderCell>Payment Method</EmailTableHeaderCell>
                  <EmailTableHeaderCell numeric>Amount</EmailTableHeaderCell>
                </EmailTableRow>
              </thead>
              <tbody>
                {paymentMethods.map((payment) => (
                  <EmailTableRow key={payment.paymentId}>
                    <EmailTableCell label="Payment Method">
                      {formatPaymentIdentifier(payment)}
                    </EmailTableCell>
                    <EmailTableCell label="Amount" numeric>
                      ${(payment.amountInUsdCents / 100).toFixed(2)}
                    </EmailTableCell>
                  </EmailTableRow>
                ))}
                {refundAmountInUsd ? (
                  <EmailTableRow>
                    <EmailTableCell label="Payment Method">
                      Refunded Amount
                    </EmailTableCell>
                    <EmailTableCell label="Amount" numeric>
                      - ${refundAmountInUsd.toFixed(2)}
                    </EmailTableCell>
                  </EmailTableRow>
                ) : null}
                <EmailTableRow>
                  <EmailTableCell label="Summary" emphasis>
                    Total
                  </EmailTableCell>
                  <EmailTableCell label="Amount" numeric>
                    $
                    {(chargedAmountInUsd - (refundAmountInUsd ?? 0)).toFixed(2)}
                  </EmailTableCell>
                </EmailTableRow>
              </tbody>
            </EmailTable>
            <div style={{ marginTop: '2px', marginBottom: '30px' }}>
              <span style={styles.caption}>
                For more details, view the order details
              </span>
            </div>
          </>
        )}
        {orderId && (
          <Button
            className="namefi-button-mobile"
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
