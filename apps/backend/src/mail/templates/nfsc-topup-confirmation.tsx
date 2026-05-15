// NFSC top-up confirmation email — sent after an NFSC credit-card top-up order
// is processed (succeeded, failed, or still processing).

import { Button, Text } from '@react-email/components';
import { Card } from '../components/card';
import { Code } from '../components/code';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import {
  astraTheme,
  button,
  buttonRowCell,
  buttonRowCellLast,
  buttonRowTable,
  panelTitle,
  paragraph,
} from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import type React from 'react';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';
import { EmailButtonIcon } from '../components/email-action-icon';

export type NfscTopUpConfirmationProps = {
  orderId: string;
  recipientName: string;
  /**
   * Recipient email — kept on the props for parity with the other email
   * templates (`ProcessedOrderReport`, etc.) and for downstream analytics /
   * tracking, even though the rendered body does not currently use it.
   */
  recipientEmail: string;
  /** NFSC token amount credited, as a decimal string (1 USD = 1 NFSC). */
  nfscAmount: string;
  /** Amount charged, in USD cents. */
  chargedAmountInUsdCents: number;
  /** Display name of the payment method, e.g. "Credit Card". */
  paymentMethodCharged: string;
  /** Card last-4 (e.g. "....4242") or abbreviated wallet address. */
  paymentMethodIdentifier?: string;
  /** Wallet that received the NFSC. */
  recipientWalletAddress: string;
  /** Human-readable network name, e.g. "Base". */
  chainName: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  refund?: {
    amountInUsd: number;
    status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  };
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

export const NfscTopUpConfirmation = buildTemplate<NfscTopUpConfirmationProps>(
  (props) => {
    const {
      orderId,
      recipientName,
      nfscAmount,
      chargedAmountInUsdCents,
      paymentMethodCharged,
      paymentMethodIdentifier,
      recipientWalletAddress,
      chainName,
      status,
      refund,
    } = props;
    const poweredByNamefiDomain = usePoweredByNamefiDomain();

    const safeRecipientName =
      recipientName && recipientName.trim().length > 0
        ? recipientName
        : 'there';

    const title =
      status === 'SUCCEEDED'
        ? '[Namefi] Your NFSC top-up is complete'
        : status === 'PROCESSING'
          ? '[Namefi] Your NFSC top-up is being processed'
          : '[Namefi] Your NFSC top-up needs attention';

    const introMessage =
      status === 'SUCCEEDED'
        ? 'Your wallet has been topped up with NFSC and is ready to use.'
        : status === 'PROCESSING'
          ? "We're processing your NFSC top-up and will update you once it's complete."
          : 'We ran into an issue completing your NFSC top-up. If you were charged, a refund is on its way.';

    const statusInk =
      status === 'SUCCEEDED'
        ? astraTheme.successInk
        : status === 'PROCESSING'
          ? astraTheme.warningInk
          : astraTheme.errorInk;

    return (
      <NamefiEmailContainer title={title}>
        <Text style={paragraph}>Hi {safeRecipientName},</Text>
        <Text style={paragraph}>{introMessage}</Text>

        <Card
          variant={
            status === 'SUCCEEDED'
              ? 'success'
              : status === 'PROCESSING'
                ? 'info'
                : 'error'
          }
        >
          <h3 style={panelTitle}>Top-up details</h3>
          <div style={detailRow}>
            <span>NFSC amount</span>
            <span style={{ fontWeight: 'bold' }}>{nfscAmount} NFSC</span>
          </div>
          <div style={detailRow}>
            <span>Network</span>
            <span style={{ fontWeight: 'bold' }}>{chainName}</span>
          </div>
          <div style={detailRow}>
            <span>Recipient wallet</span>
            <Code>{recipientWalletAddress}</Code>
          </div>
          <div style={{ ...detailRow, marginBottom: 0 }}>
            <span>Status</span>
            <span style={{ fontWeight: 'bold', color: statusInk }}>
              {status === 'SUCCEEDED'
                ? 'Completed'
                : status === 'PROCESSING'
                  ? 'Processing'
                  : 'Failed'}
            </span>
          </div>
        </Card>

        <Card variant="info">
          <h3 style={panelTitle}>Payment summary</h3>
          <div style={{ ...detailRow, marginBottom: refund ? '8px' : 0 }}>
            <span>
              Total charged ({paymentMethodCharged}
              {paymentMethodIdentifier ? ` ${paymentMethodIdentifier}` : ''}):
            </span>
            <span style={{ fontWeight: 'bold' }}>
              ${(chargedAmountInUsdCents / 100).toFixed(2)}
            </span>
          </div>
          {refund && refund.amountInUsd > 0 && (
            <div style={{ ...detailRow, marginBottom: 0 }}>
              <span>Refund amount:</span>
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

        {status === 'FAILED' && (
          <Text style={paragraph}>
            If you'd like to try again or need any help, we're just an email
            away at support@namefi.io.
          </Text>
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
                  View Order Details
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
    nfscAmount: '25',
    chargedAmountInUsdCents: 2500,
    paymentMethodCharged: 'Credit Card',
    paymentMethodIdentifier: '....4242',
    recipientWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainName: 'Base',
    status: 'SUCCEEDED',
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default NfscTopUpConfirmation;
