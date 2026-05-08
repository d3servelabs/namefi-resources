// Order processing report template for successful and failed items

// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { domainToASCII, domainToUnicode } from 'node:url';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button } from '@react-email/components';
import { Card } from '../components/card';
import {
  astraTheme,
  button,
  buttonRowCell,
  buttonRowCellLast,
  buttonRowTable,
  caption,
  panelTitle,
  panelText,
  table,
  tableCell,
  tableCellNumeric,
  tableCellSubtext,
  tableHeaderCell,
  tableHeaderCellNumeric,
} from '../styles';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';
import { EmailButtonIcon } from '../components/email-action-icon';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import pluralize from 'pluralize';
import { getChain } from '@namefi-astra/utils';

export type ProcessedOrderItem = {
  normalizedDomainName: string;
  duration: number; // in years
  priceInUsdCents: number; // in USD cents
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  failureReason?: string;
  type: 'IMPORT' | 'RENEW' | 'REGISTER';
  mintTxHash?: string;
  chainId?: number;
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

    const successfulImportItems = successfulItems.filter(
      (item) => item.type === 'IMPORT',
    );
    const successfulRenewalItems = successfulItems.filter(
      (item) => item.type === 'RENEW',
    );

    const safeRecipientName =
      recipientName && recipientName.trim().length > 0
        ? recipientName
        : 'there';

    let introMessage = '';

    if (failedItems.length > 0 && successfulItems.length > 0) {
      introMessage =
        "We've completed processing your order, though some items need your attention.";
    } else if (failedItems.length > 0 && successfulItems.length === 0) {
      const failedDomains = formatDomainList(
        failedItems.map((item) => item.normalizedDomainName),
      );
      introMessage = `We ran into some issues with your order for ${failedDomains.text}. Don't worry - we're here to help you sort this out.`;
    } else if (processingItems.length > 0) {
      const processingDomains = formatDomainList(
        processingItems.map((item) => item.normalizedDomainName),
      );
      if (successfulItems.length > 0) {
        introMessage = `Your order is being processed. We're still working on ${processingDomains.text} and will update you once complete.`;
      } else {
        introMessage = `Your order is on its way! We're working on ${processingDomains.text} and will update you soon.`;
      }
    } else if (successfulImportItems.length > 0) {
      if (successfulImportItems.length === 1) {
        const domain = getDomainWithIdn(
          successfulImportItems[0].normalizedDomainName,
        );
        introMessage = `Welcome home! **${domain}** has been successfully imported to Namefi. Your domain is now part of the family.`;
      } else {
        const importDomains = formatDomainList(
          successfulImportItems.map((item) => item.normalizedDomainName),
        );
        introMessage = `Welcome home! ${importDomains.text} have been successfully imported to Namefi.`;
      }
    } else if (successfulRenewalItems.length > 0) {
      if (successfulRenewalItems.length === 1) {
        const domain = getDomainWithIdn(
          successfulRenewalItems[0].normalizedDomainName,
        );
        introMessage = `You're all set! **${domain}** has been renewed, so you can keep doing what you do best.`;
      } else {
        const renewDomains = formatDomainList(
          successfulRenewalItems.map((item) => item.normalizedDomainName),
        );
        introMessage = `You're all set! ${renewDomains.text} have been renewed, so you can keep doing what you do best.`;
      }
    } else if (successfulRegistrations.length > 0) {
      if (successfulRegistrations.length === 1) {
        const domain = getDomainWithIdn(
          successfulRegistrations[0].normalizedDomainName,
        );
        introMessage = `Great news! **${domain}** is officially yours. Your new domain is ready and waiting for you to make it shine.`;
      } else {
        const regDomains = formatDomainList(
          successfulRegistrations.map((item) => item.normalizedDomainName),
        );
        introMessage = `Exciting news! ${regDomains.text} are officially yours. They're all set up and ready for you to start building.`;
      }
    } else {
      introMessage = "Your order has been processed. Here's what happened:";
    }

    const messageMarkdown = `Hi ${safeRecipientName},\n\n${introMessage}`;

    // Generate a more user-friendly email title based on order outcome
    // Priority order matches intro message: failed > processing > imports > renewals > registrations
    const getEmailTitle = () => {
      if (failedItems.length > 0) {
        const failedDomainsTitleText = formatDomainList(
          failedItems.map((item) => item.normalizedDomainName),
        ).titleText;
        return successfulItems.length > 0
          ? `[Namefi] Action Needed: ${failedDomainsTitleText}`
          : `[Namefi] We Need Your Attention: ${failedDomainsTitleText}`;
      }
      if (processingItems.length > 0) {
        const processingDomainsTitleText = formatDomainList(
          processingItems.map((item) => item.normalizedDomainName),
        ).titleText;
        return `[Namefi] Processing: ${processingDomainsTitleText}`;
      }
      if (successfulImportItems.length > 0) {
        if (successfulImportItems.length === 1) {
          return `[Namefi] Welcome to Namefi, ${getDomainWithIdn(successfulImportItems[0].normalizedDomainName)}!`;
        }
        const importDomainsTitleText = formatDomainList(
          successfulImportItems.map((item) => item.normalizedDomainName),
        ).titleText;
        return `[Namefi] Your Domains Have Arrived: ${importDomainsTitleText}`;
      }
      if (successfulRenewalItems.length > 0) {
        if (successfulRenewalItems.length === 1) {
          return `[Namefi] Renewed: ${getDomainWithIdn(successfulRenewalItems[0].normalizedDomainName)}`;
        }
        const renewDomainsTitleText = formatDomainList(
          successfulRenewalItems.map((item) => item.normalizedDomainName),
        ).titleText;
        return `[Namefi] Renewed: ${renewDomainsTitleText}`;
      }
      if (successfulRegistrations.length === 1) {
        return `[Namefi] ${getDomainWithIdn(successfulRegistrations[0].normalizedDomainName)} is Yours!`;
      }
      if (successfulRegistrations.length > 1) {
        const regDomainsTitleText = formatDomainList(
          successfulRegistrations.map((item) => item.normalizedDomainName),
        ).titleText;
        return `[Namefi] Your New Domains Are Ready: ${regDomainsTitleText}`;
      }
      return '[Namefi] An Update About Your Recent Order';
    };

    return (
      <NamefiEmailContainer title={getEmailTitle()}>
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

        <EmailTable tableStyle={table}>
          <thead>
            <EmailTableRow>
              <EmailTableHeaderCell style={tableHeaderCell}>
                Domain
              </EmailTableHeaderCell>
              <EmailTableHeaderCell style={tableHeaderCell}>
                Type
              </EmailTableHeaderCell>
              <EmailTableHeaderCell style={tableHeaderCell}>
                Duration
              </EmailTableHeaderCell>
              <EmailTableHeaderCell numeric style={tableHeaderCellNumeric}>
                Price
              </EmailTableHeaderCell>
              <EmailTableHeaderCell style={tableHeaderCell}>
                Status
              </EmailTableHeaderCell>
            </EmailTableRow>
          </thead>
          <tbody>
            {items.map((item) => (
              <EmailTableRow key={item.normalizedDomainName}>
                <EmailTableCell label="Domain" style={tableCell}>
                  {getDomainWithIdn(item.normalizedDomainName)}
                </EmailTableCell>
                <EmailTableCell label="Type" style={tableCell}>
                  {item.type}
                </EmailTableCell>
                <EmailTableCell label="Duration" style={tableCell}>
                  {pluralize('year', item.duration, true)}
                </EmailTableCell>
                <EmailTableCell label="Price" numeric style={tableCellNumeric}>
                  ${(item.priceInUsdCents / 100).toFixed(2)}
                </EmailTableCell>
                <EmailTableCell label="Status" style={tableCell}>
                  <span
                    style={{
                      color:
                        item.status === 'PROCESSING'
                          ? astraTheme.warningInk
                          : item.status === 'SUCCEEDED'
                            ? astraTheme.successInk
                            : astraTheme.errorInk,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.status === 'PROCESSING'
                      ? 'Processing'
                      : item.status === 'SUCCEEDED'
                        ? 'Succeeded'
                        : 'Failed'}
                  </span>
                  {(() => {
                    const nftUrl =
                      item.status === 'SUCCEEDED' &&
                      item.mintTxHash &&
                      item.chainId
                        ? getTxExplorerUrl(item.chainId, item.mintTxHash)
                        : null;
                    return nftUrl ? (
                      <div style={{ marginTop: '4px' }}>
                        <a
                          href={nftUrl}
                          style={{
                            ...tableCellSubtext,
                            color: astraTheme.link,
                            textDecoration: 'underline',
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View NFT
                        </a>
                      </div>
                    ) : null;
                  })()}
                  {item.failureReason && (
                    <div style={tableCellSubtext}>{item.failureReason}</div>
                  )}
                </EmailTableCell>
              </EmailTableRow>
            ))}
          </tbody>
        </EmailTable>

        {/* Payment Summary */}
        <Card variant="info">
          <h3 style={panelTitle}>Payment Summary</h3>
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
                      ? astraTheme.successInk
                      : refund.status === 'FAILED'
                        ? astraTheme.errorInk
                        : astraTheme.warningInk,
                }}
              >
                ${refund.amountInUsd.toFixed(2)} ({refund.status})
              </span>
            </div>
          )}
        </Card>

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
              ? `We've ${refund.status === 'SUCCEEDED' ? 'refunded' : refund.status === 'FAILED' ? 'attempted to refund' : 'started processing a refund of'} **$${refund.amountInUsd.toFixed(2)}** to your original payment method. If you'd like to try again or need any help, we're just an email away at support@namefi.io.`
              : "If you'd like to try again or need any help, we're just an email away at support@namefi.io."}
          </ReactMarkdown>
        )}

        {processingImportItems.length > 0 && (
          <Card variant="warning">
            <h3 style={{ ...panelTitle, color: astraTheme.warningInk }}>
              About Your Domain Import
            </h3>
            <div style={{ ...panelText, color: astraTheme.warningInk }}>
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
              <p
                style={{
                  margin: '0',
                  ...caption,
                  color: astraTheme.warningInk,
                }}
              >
                Once the transfer is approved, we will automatically complete
                the process and mint your domain NFT.
              </p>
            </div>
          </Card>
        )}

        <table
          className="namefi-button-row"
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          style={buttonRowTable}
        >
          <tbody>
            <tr>
              <td className="namefi-button-cell" style={buttonRowCell}>
                <Button
                  className="namefi-button-mobile"
                  style={button}
                  href={NamefiEmailLinks.orderDetails({
                    orderId,
                    poweredByNamefiDomain,
                  })}
                >
                  Check Your Order Details
                </Button>
              </td>
              <td className="namefi-button-cell" style={buttonRowCellLast}>
                <Button
                  className="namefi-button-mobile"
                  style={button}
                  href={NamefiEmailLinks.dashboard({ poweredByNamefiDomain })}
                >
                  <EmailButtonIcon icon="dashboard" />
                  Go To Namefi Dashboard
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
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
        mintTxHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chainId: 8453,
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
        mintTxHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
        chainId: 8453,
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

function getDomainWithIdn(domain: string) {
  const unicodeDomain = domainToUnicode(domain);
  const punycodeDomain = domainToASCII(domain) || domain;
  return unicodeDomain === punycodeDomain
    ? domain
    : `${unicodeDomain} (${punycodeDomain})`;
}

function getTxExplorerUrl(
  chainId: number | undefined,
  txHash: string | undefined,
): string | null {
  if (!chainId || !txHash) return null;
  const chain = getChain(chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (!baseUrl) return null;
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBaseUrl}/tx/${txHash}`;
}

function formatDomainList(
  domains: string[],
  maxToShow = 3,
): { text: string; titleText: string } {
  const formattedDomains = domains.map(getDomainWithIdn);
  if (formattedDomains.length <= maxToShow) {
    const text = formattedDomains.map((d) => `**${d}**`).join(', ');
    const titleText = formattedDomains.join(', ');
    return { text, titleText };
  }
  const shown = formattedDomains.slice(0, maxToShow);
  const remaining = formattedDomains.length - maxToShow;
  const text = `${shown.map((d) => `**${d}**`).join(', ')} and ${remaining} more`;
  const titleText = `${shown.join(', ')} +${remaining} more`;
  return { text, titleText };
}
