import { Button } from '@react-email/components';
import { Card } from '../components/card';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { addDays, differenceInCalendarDays, format, isSameDay } from 'date-fns';
import punycode from 'punycode';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailLinks } from '../email-links';
import { buildTemplate } from '../components/build-template';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import { z } from 'zod';
import * as styles from '../styles';
import { map, sum } from 'ramda';
import type { PrepareMultiPaymentsOutput } from '#temporal/workflows/prepare-multi-payments.workflow';

const paymentProviderSchema = z.enum([
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
  'X402',
  'MPP',
]);
type PaymentProvider = z.infer<typeof paymentProviderSchema>;

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

const formatPaymentIdentifier = (
  payment: NonNullable<DomainUpcomingRenewalProps['expectedPayments']>[number],
): string => {
  if (payment.walletAddress) {
    return `${truncateWalletAddress(payment.walletAddress)} (${formatNfscPaymentIdentifier(payment.provider)})`;
  }
  if (payment.stripeLast4) {
    return `Credit Card (••••${payment.stripeLast4})`;
  }
  return '';
};

export type DomainUpcomingRenewalProps = {
  recipientName: string;
  recipientEmail: string;
  userId: string;
  domainsRenewInfo: {
    domainNameLdh: string;
    expirationDate: Date;
    renewalPrice: { amount: number; currency: string };
    autoRenew: boolean;
  }[];
  nextChargeDate: Date | null | undefined;
  nextChargeAmount: { amount: number; currency: string };
  expectedPayments?: {
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }[];
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethodsPublicIdentifiers: string[];
  paymentPreparationSummary: PrepareMultiPaymentsOutput['preparationSummary'];
};

export const DomainUpcomingRenewal = buildTemplate<DomainUpcomingRenewalProps>(
  (props) => {
    const {
      domainsRenewInfo,
      recipientName,
      nextChargeAmount,
      nextChargeDate,
      expectedPayments,
      availableBalanceInNfsc,
      availableOffChainPaymentMethodsPublicIdentifiers,
      paymentPreparationSummary,
      title = '[Namefi] Your Domain Renewal Reminder',
    } = props;

    const now = new Date();
    const manualRenewalDomains =
      domainsRenewInfo?.filter(({ autoRenew }) => !autoRenew) ?? [];

    const domainsRenewingToday =
      domainsRenewInfo?.filter(({ expirationDate, autoRenew }) => {
        const daysRemaining = differenceInCalendarDays(expirationDate, now);
        return autoRenew && daysRemaining < RENEW_EARLY_BY_DAYS;
      }) ?? [];

    const upcomingAutomaticRenewals =
      domainsRenewInfo?.filter(({ expirationDate, autoRenew }) => {
        const daysRemaining = differenceInCalendarDays(expirationDate, now);
        return autoRenew && daysRemaining >= RENEW_EARLY_BY_DAYS;
      }) ?? [];

    const showPaymentIssueWarning =
      paymentPreparationSummary.status === 'FAILED' ||
      paymentPreparationSummary.status === 'INSUFFICIENT_FUNDS';
    const showDomainsRenewingToday = domainsRenewingToday.length > 0;
    const showManualRenewalDomains = manualRenewalDomains.length > 0;
    const showUpcomingAutomaticRenewals = upcomingAutomaticRenewals.length > 0;
    const showIntroStatement =
      showDomainsRenewingToday || showUpcomingAutomaticRenewals;
    const showNextChargeStatement =
      !!nextChargeDate &&
      !isSameDay(nextChargeDate, now) &&
      !expectedPayments?.length;

    const paymentMethods = expectedPayments ?? [];
    const showPaymentMethodBreakdown = paymentMethods.length > 0;

    const sortedRenewingToday = [...domainsRenewingToday].sort(
      (a, b) => a.expirationDate.getTime() - b.expirationDate.getTime(),
    );
    const sortedManualRenewals = [...manualRenewalDomains].sort(
      (a, b) => a.expirationDate.getTime() - b.expirationDate.getTime(),
    );
    const sortedUpcomingRenewals = [...upcomingAutomaticRenewals].sort(
      (a, b) => a.expirationDate.getTime() - b.expirationDate.getTime(),
    );

    const renewingTodaySubtotal = sum(
      map((domain) => domain.renewalPrice.amount, domainsRenewingToday),
    );
    const manualRenewalSubtotal = sum(
      map((domain) => domain.renewalPrice.amount, manualRenewalDomains),
    );
    const paymentSubtotal = sum(
      map((payment) => payment.amountInUsdCents / 100, paymentMethods),
    );

    const getIntroMessage = () => {
      if (showDomainsRenewingToday && showPaymentMethodBreakdown) {
        return 'Good news: your upcoming renewals are queued and your payment setup looks ready.';
      }
      if (showDomainsRenewingToday) {
        return 'A few domains are in your active renewal window. Please review the details below.';
      }
      if (showUpcomingAutomaticRenewals) {
        return 'This is a reminder of upcoming automatic renewals for your portfolio.';
      }
      return '';
    };

    return (
      <NamefiEmailContainer title={title}>
        <div style={{ ...styles.paragraph, marginBottom: '8px' }}>
          Hi {recipientName || 'there'},
        </div>

        {showIntroStatement && (
          <div style={{ ...styles.paragraph, marginTop: 0 }}>
            {getIntroMessage()}
          </div>
        )}

        {showPaymentIssueWarning && (
          <>
            <Card variant="warning">
              <h3
                style={{
                  ...styles.panelTitle,
                  color: styles.astraTheme.warningInk,
                }}
              >
                {paymentPreparationSummary.status === 'INSUFFICIENT_FUNDS'
                  ? 'Payment attention needed'
                  : 'Payment method attention needed'}
              </h3>
              <div
                style={{
                  ...styles.panelText,
                  color: styles.astraTheme.warningInk,
                  marginBottom: '8px',
                }}
              >
                We were not able to fully prepare renewal payment. Please review
                balances and cards below.
              </div>

              <EmailTable wrapStyle={{ marginTop: '8px' }}>
                <thead>
                  <EmailTableRow>
                    <EmailTableHeaderCell>Payment Method</EmailTableHeaderCell>
                    <EmailTableHeaderCell numeric>
                      Balance / Info
                    </EmailTableHeaderCell>
                  </EmailTableRow>
                </thead>
                <tbody>
                  <EmailTableRow>
                    <EmailTableCell label="Payment Method">
                      NFSC Balance
                    </EmailTableCell>
                    <EmailTableCell label="Balance / Info" numeric>
                      ${availableBalanceInNfsc.toFixed(2)}
                    </EmailTableCell>
                  </EmailTableRow>
                  {availableOffChainPaymentMethodsPublicIdentifiers.length >
                  0 ? (
                    availableOffChainPaymentMethodsPublicIdentifiers.map(
                      (last4) => (
                        <EmailTableRow key={last4}>
                          <EmailTableCell label="Payment Method">
                            Credit Card
                          </EmailTableCell>
                          <EmailTableCell label="Balance / Info" numeric>
                            ••••{last4}
                          </EmailTableCell>
                        </EmailTableRow>
                      ),
                    )
                  ) : (
                    <EmailTableRow>
                      <EmailTableCell label="Payment Method">
                        Credit Card
                      </EmailTableCell>
                      <EmailTableCell label="Balance / Info" numeric>
                        None on file
                      </EmailTableCell>
                    </EmailTableRow>
                  )}
                </tbody>
              </EmailTable>

              {(paymentPreparationSummary.shortByInUsdCents ?? 0) > 0 && (
                <div
                  style={{
                    ...styles.caption,
                    color: styles.astraTheme.warningInk,
                    marginTop: '10px',
                  }}
                >
                  Short by $
                  {(
                    (paymentPreparationSummary.shortByInUsdCents ?? 0) / 100
                  ).toFixed(2)}
                  . Required total is ${nextChargeAmount.amount.toFixed(2)}.
                </div>
              )}
            </Card>

            <table
              className="namefi-button-row"
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              style={styles.buttonRowTable}
            >
              <tbody>
                <tr>
                  <td
                    className="namefi-button-cell"
                    style={styles.buttonRowCell}
                  >
                    <Button
                      className="namefi-button-mobile"
                      style={styles.button}
                      href={NamefiEmailLinks.rechargeNFSC({
                        poweredByNamefiDomain: null,
                      })}
                    >
                      Recharge NFSC
                    </Button>
                  </td>
                  <td
                    className="namefi-button-cell"
                    style={styles.buttonRowCellLast}
                  >
                    <Button
                      className="namefi-button-mobile"
                      style={styles.button}
                      href={NamefiEmailLinks.paymentMethods({
                        poweredByNamefiDomain: null,
                      })}
                    >
                      Add Credit Card
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {showNextChargeStatement && (
          <div style={styles.sectionLead}>
            Next charge: ${nextChargeAmount.amount.toFixed(2)} on{' '}
            {format(nextChargeDate, 'LLL dd, yyyy')}
          </div>
        )}

        {showDomainsRenewingToday && (
          <>
            <div style={styles.sectionHeading}>
              Renewing Soon ({format(now, 'LLL dd, yyyy')})
            </div>
            <EmailTable>
              <thead>
                <EmailTableRow>
                  <EmailTableHeaderCell>Domain Name</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Expiration Date</EmailTableHeaderCell>
                  <EmailTableHeaderCell numeric>
                    Renew Price
                  </EmailTableHeaderCell>
                </EmailTableRow>
              </thead>
              <tbody>
                {sortedRenewingToday.map(
                  ({ domainNameLdh, expirationDate, renewalPrice }) => (
                    <EmailTableRow key={domainNameLdh}>
                      <EmailTableCell label="Domain Name">
                        <DomainNameCell domainNameLdh={domainNameLdh} />
                      </EmailTableCell>
                      <EmailTableCell label="Expiration Date">
                        <DomainExpirationDateCell
                          expirationDate={expirationDate}
                        />
                      </EmailTableCell>
                      <EmailTableCell label="Renew Price" numeric>
                        ${renewalPrice.amount.toFixed(2)}
                      </EmailTableCell>
                    </EmailTableRow>
                  ),
                )}
                <EmailTableRow>
                  <EmailTableCell label="Summary" emphasis>
                    Subtotal
                  </EmailTableCell>
                  <EmailTableCell hideOnMobile />
                  <EmailTableCell label="Renew Price" numeric>
                    ${renewingTodaySubtotal.toFixed(2)}
                  </EmailTableCell>
                </EmailTableRow>
              </tbody>
            </EmailTable>

            {showPaymentMethodBreakdown && (
              <Card variant="success" style={{ marginTop: '14px' }}>
                <h3
                  style={{
                    ...styles.panelTitle,
                    color: styles.astraTheme.successInk,
                  }}
                >
                  Renewal payment split
                </h3>
                <EmailTable>
                  <thead>
                    <EmailTableRow>
                      <EmailTableHeaderCell>
                        Payment Method
                      </EmailTableHeaderCell>
                      <EmailTableHeaderCell numeric>
                        Amount
                      </EmailTableHeaderCell>
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
                    <EmailTableRow>
                      <EmailTableCell label="Summary" emphasis>
                        Subtotal
                      </EmailTableCell>
                      <EmailTableCell label="Amount" numeric>
                        ${paymentSubtotal.toFixed(2)}
                      </EmailTableCell>
                    </EmailTableRow>
                  </tbody>
                </EmailTable>
              </Card>
            )}
          </>
        )}

        {showManualRenewalDomains && (
          <>
            <div
              style={{
                ...styles.sectionHeading,
                color: styles.astraTheme.warningInk,
              }}
            >
              Manual Renewal Required
            </div>
            <div style={styles.sectionLead}>
              Auto-renew is off for the domains below. Renew them manually or
              enable auto-renew in domain settings.
            </div>
            <EmailTable>
              <thead>
                <EmailTableRow>
                  <EmailTableHeaderCell>Domain Name</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Expiration Date</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Action</EmailTableHeaderCell>
                  <EmailTableHeaderCell numeric>
                    Renew Price
                  </EmailTableHeaderCell>
                </EmailTableRow>
              </thead>
              <tbody>
                {sortedManualRenewals.map(
                  ({ domainNameLdh, expirationDate, renewalPrice }) => (
                    <EmailTableRow key={domainNameLdh}>
                      <EmailTableCell label="Domain Name">
                        <DomainNameCell domainNameLdh={domainNameLdh} />
                      </EmailTableCell>
                      <EmailTableCell label="Expiration Date">
                        <DomainExpirationDateCell
                          expirationDate={expirationDate}
                        />
                      </EmailTableCell>
                      <EmailTableCell label="Action">
                        <a
                          style={styles.inlineActionLink}
                          href={NamefiEmailLinks.domainSettings({
                            domain: domainNameLdh,
                            poweredByNamefiDomain: null,
                          })}
                        >
                          Renew Now
                        </a>
                      </EmailTableCell>
                      <EmailTableCell label="Renew Price" numeric>
                        ${renewalPrice.amount.toFixed(2)}
                      </EmailTableCell>
                    </EmailTableRow>
                  ),
                )}
                <EmailTableRow>
                  <EmailTableCell label="Summary" emphasis>
                    Subtotal
                  </EmailTableCell>
                  <EmailTableCell hideOnMobile />
                  <EmailTableCell hideOnMobile />
                  <EmailTableCell label="Renew Price" numeric>
                    ${manualRenewalSubtotal.toFixed(2)}
                  </EmailTableCell>
                </EmailTableRow>
              </tbody>
            </EmailTable>
          </>
        )}

        {showUpcomingAutomaticRenewals && (
          <>
            <div style={styles.sectionHeading}>Upcoming Automatic Renewals</div>
            <EmailTable>
              <thead>
                <EmailTableRow>
                  <EmailTableHeaderCell>Domain Name</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Expiration Date</EmailTableHeaderCell>
                  <EmailTableHeaderCell numeric>
                    Renew Price
                  </EmailTableHeaderCell>
                </EmailTableRow>
              </thead>
              <tbody>
                {sortedUpcomingRenewals.map(
                  ({ domainNameLdh, expirationDate, renewalPrice }) => (
                    <EmailTableRow key={domainNameLdh}>
                      <EmailTableCell label="Domain Name">
                        <DomainNameCell domainNameLdh={domainNameLdh} />
                      </EmailTableCell>
                      <EmailTableCell label="Expiration Date">
                        <DomainExpirationDateCell
                          expirationDate={expirationDate}
                        />
                      </EmailTableCell>
                      <EmailTableCell label="Renew Price" numeric>
                        ${renewalPrice.amount.toFixed(2)}
                      </EmailTableCell>
                    </EmailTableRow>
                  ),
                )}
              </tbody>
            </EmailTable>
          </>
        )}

        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
  {
    ...getExamples('example1'),
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainUpcomingRenewal;

function getExamples(key: 'example1' | 'example2'): DomainUpcomingRenewalProps {
  const commonExampleProps: Pick<
    DomainUpcomingRenewalProps,
    'recipientName' | 'recipientEmail' | 'userId' | 'domainsRenewInfo'
  > = {
    recipientName: 'Alice',
    recipientEmail: 'alice@example.com',
    userId: '123',
    domainsRenewInfo: [
      {
        domainNameLdh: 'apple.test',
        expirationDate: addDays(new Date(), 10),
        renewalPrice: {
          amount: 35,
          currency: 'USD',
        },
        autoRenew: true,
      },
      {
        domainNameLdh: 'xn--gtvz22d.xn--0zwm56d',
        expirationDate: addDays(new Date(), 5),
        renewalPrice: {
          amount: 59,
          currency: 'USD',
        },
        autoRenew: true,
      },
      {
        domainNameLdh: 'xn--p2bx9b.xn--11b2aty0b2c6e',
        expirationDate: addDays(new Date(), 12),
        renewalPrice: {
          amount: 48,
          currency: 'USD',
        },
        autoRenew: false,
      },
      {
        domainNameLdh: 'manzana.prueba',
        expirationDate: addDays(new Date(), 25),
        renewalPrice: {
          amount: 22,
          currency: 'USD',
        },
        autoRenew: false,
      },
      {
        domainNameLdh: 'xn--90ascnx3e.xn--e1aybc',
        expirationDate: addDays(new Date(), 20),
        renewalPrice: {
          amount: 42,
          currency: 'USD',
        },
        autoRenew: true,
      },
      {
        domainNameLdh: 'xn--90ascmb1h.xn--e1aybc',
        expirationDate: addDays(new Date(), 28),
        renewalPrice: {
          amount: 38,
          currency: 'USD',
        },
        autoRenew: true,
      },
    ],
  };

  return {
    example1: {
      ...commonExampleProps,
      nextChargeAmount: { amount: 35 + 59, currency: 'USD' },
      nextChargeDate: new Date(),
      expectedPayments: [],
      availableBalanceInNfsc: 25,
      availableOffChainPaymentMethodsPublicIdentifiers: [],
      paymentPreparationSummary: {
        status: 'INSUFFICIENT_FUNDS' as const,
        message:
          'Insufficient funds available to complete the renewal payment.',
        shortByInUsdCents: 69_00,
      },
    },
    example2: {
      ...commonExampleProps,
      nextChargeAmount: { amount: 35 + 59, currency: 'USD' },
      nextChargeDate: new Date(),
      expectedPayments: [
        {
          provider: 'NFSC_BASE' as const,
          amountInUsdCents: 49 * 100,
          paymentId: 'nfsc-payment-1',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          provider: 'STRIPE' as const,
          amountInUsdCents: 49 * 100,
          paymentId: 'stripe-payment-1',
          stripeLast4: '4242',
        },
      ],
      availableBalanceInNfsc: 49,
      availableOffChainPaymentMethodsPublicIdentifiers: ['4242'],
      paymentPreparationSummary: {
        status: 'SUCCESS' as const,
      },
    },
  }[key];
}

function DomainExpirationDateCell({
  expirationDate,
}: {
  expirationDate: Date;
}) {
  const daysRemaining = differenceInCalendarDays(expirationDate, new Date());
  const color =
    daysRemaining <= 0
      ? styles.astraTheme.errorInk
      : daysRemaining > RENEW_EARLY_BY_DAYS
        ? styles.astraTheme.textMuted
        : styles.astraTheme.warningInk;

  return (
    <React.Fragment>
      {format(expirationDate, 'yyyy-MM-dd')}
      <span style={{ ...styles.caption, color }}>
        {daysRemaining <= 0 ? ' (Expired)' : ` (${daysRemaining} days)`}
      </span>
    </React.Fragment>
  );
}

function DomainNameCell({ domainNameLdh }: { domainNameLdh: string }) {
  const unicodeDomain = punycode.toUnicode(domainNameLdh);

  return unicodeDomain !== domainNameLdh ? (
    <div>
      <div style={styles.monospaceText}>{unicodeDomain}</div>
      <div style={styles.tableCellSubtext}>{domainNameLdh}</div>
    </div>
  ) : (
    <span style={styles.monospaceText}>{domainNameLdh}</span>
  );
}
