import { Button } from '@react-email/components';
import { Card } from '../components/card';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import punycode from 'punycode';
import { RENEW_EARLY_BY_DAYS } from '../../lib/env/consts';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailLinks } from '../email-links';
import { buildTemplate } from '../components/build-template';
import { z } from 'zod';
import * as styles from '../styles';
import { sum, map } from 'ramda';
import type { PrepareMultiPaymentsOutput } from '#temporal/workflows/prepare-multi-payments.workflow';
import { isSameDay } from 'date-fns';
const paymentProviderSchema = z.enum([
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
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
// Helper function to format payment method identifier
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
      title = 'Your Domain Renewal Reminder',
    } = props;

    const manualRenewalDomains =
      domainsRenewInfo?.filter(({ autoRenew }) => !autoRenew) ?? [];

    // Categorize domains into three groups
    const domainsRenewingToday =
      domainsRenewInfo?.filter(({ expirationDate, autoRenew }) => {
        const daysRemaining = differenceInCalendarDays(
          expirationDate,
          new Date(),
        );
        return autoRenew && daysRemaining < RENEW_EARLY_BY_DAYS;
      }) ?? [];

    const upcomingAutomaticRenewals =
      domainsRenewInfo?.filter(({ expirationDate, autoRenew }) => {
        const daysRemaining = differenceInCalendarDays(
          expirationDate,
          new Date(),
        );
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
      !isSameDay(nextChargeDate, new Date()) &&
      !expectedPayments?.length;

    const showPaymentMethodBreakdown =
      expectedPayments && expectedPayments.length > 0;

    // Generate friendly intro message based on situation
    const getIntroMessage = () => {
      if (showDomainsRenewingToday && showPaymentMethodBreakdown) {
        return "Good news - we're about to renew your domains and everything is set up perfectly.";
      }
      if (showDomainsRenewingToday) {
        return 'Just a heads up - some of your domains are coming up for renewal soon.';
      }
      if (showUpcomingAutomaticRenewals) {
        return 'We wanted to give you a friendly reminder about your upcoming domain renewals.';
      }
      return '';
    };

    return (
      <NamefiEmailContainer title={title}>
        <div style={{ ...styles.text }}>
          Hi {recipientName || 'there'},<br />
          <br />
          {showIntroStatement && getIntroMessage()}
        </div>
        {/* Show payment issue warning if payment preparation failed or insufficient funds */}
        {showPaymentIssueWarning && (
          <>
            <Card variant="warning">
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#CC5500',
                  marginBottom: '12px',
                }}
              >
                ⚠️{' '}
                {paymentPreparationSummary.status === 'INSUFFICIENT_FUNDS'
                  ? 'Insufficient Funds'
                  : 'Payment Issue Detected'}
              </div>

              <div
                style={{
                  borderRadius: '8px',
                  border: '1.5px #D9D9D9 solid',
                  marginTop: '12px',
                }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    ...styles.text,
                    width: '100%',
                    borderStyle: 'hidden',
                  }}
                >
                  <tr>
                    <TD
                      textAlign="left"
                      monospace={false}
                      className="font-medium"
                      topLeft
                    >
                      Available Payment Methods
                    </TD>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topRight
                    >
                      Balance/Info
                    </TD>
                  </tr>
                  <tr>
                    <TD textAlign="left" monospace={false}>
                      NFSC Balance
                    </TD>
                    <TD textAlign="right" monospace={true}>
                      ${availableBalanceInNfsc.toFixed(2)}
                    </TD>
                  </tr>
                  {availableOffChainPaymentMethodsPublicIdentifiers.map(
                    (last4, index) => (
                      <tr key={last4}>
                        <TD
                          textAlign="left"
                          monospace={false}
                          bottomLeft={
                            index ===
                            availableOffChainPaymentMethodsPublicIdentifiers.length -
                              1
                          }
                        >
                          Credit Card
                        </TD>
                        <TD
                          textAlign="right"
                          monospace={true}
                          bottomRight={
                            index ===
                            availableOffChainPaymentMethodsPublicIdentifiers.length -
                              1
                          }
                        >
                          ••••{last4}
                        </TD>
                      </tr>
                    ),
                  )}
                </table>
              </div>

              {(paymentPreparationSummary.shortByInUsdCents ?? 0) > 0 && (
                <div
                  style={{
                    ...styles.text,
                    marginTop: '12px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#666',
                  }}
                >
                  * You need to have ${nextChargeAmount.amount.toFixed(2)}.
                </div>
              )}
            </Card>
            <div className="mt-4 grid sm:grid-cols-2 grid-cols-1 gap-6 px-8">
              <Button
                style={{ ...styles.outlineButton }}
                href={NamefiEmailLinks.rechargeNFSC({
                  poweredByNamefiDomain: null,
                })}
              >
                Recharge NFSC
              </Button>
              <Button
                style={{ ...styles.outlineButton }}
                href={NamefiEmailLinks.paymentMethods({
                  poweredByNamefiDomain: null,
                })}
              >
                Add Credit Card
              </Button>
            </div>
          </>
        )}

        {showNextChargeStatement && (
          <div
            style={{ ...styles.text, marginTop: '20px', marginBottom: '10px' }}
          >
            Next charge will be ${nextChargeAmount.amount.toFixed(2)} on{' '}
            {format(nextChargeDate, 'LLL dd, yyyy')}
          </div>
        )}

        {/* Table A: Domains Renewing Today */}
        {showDomainsRenewingToday && (
          <>
            <div className="font-normal mt-10 mb-4" style={{ ...styles.text }}>
              Upcoming Renewals and Charges ({format(new Date(), 'LLL dd, yyy')}
              )
            </div>
            <div className="px-4 mb-5">
              <div
                style={{ borderRadius: '8px', border: '1.5px #D9D9D9 solid' }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    ...styles.text,
                    width: '100%',
                    borderStyle: 'hidden',
                  }}
                >
                  <tr>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topLeft
                    >
                      Domain Name
                    </TD>
                    <TD
                      textAlign="left"
                      monospace={false}
                      className="font-medium"
                    >
                      Expiration Date
                    </TD>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topRight
                    >
                      Renew Price
                    </TD>
                  </tr>
                  {domainsRenewingToday
                    .sort(
                      (a, b) =>
                        a.expirationDate.getTime() - b.expirationDate.getTime(),
                    )
                    .map(
                      (
                        { domainNameLdh, expirationDate, renewalPrice },
                        index,
                      ) => (
                        <tr key={domainNameLdh}>
                          <TD
                            textAlign="right"
                            monospace={false}
                            bottomLeft={
                              index === domainsRenewingToday.length - 1
                            }
                          >
                            <DomainNameCell domainNameLdh={domainNameLdh} />
                          </TD>
                          <TD textAlign="left" monospace={true}>
                            <DomainExpirationDateCell
                              expirationDate={expirationDate}
                            />
                          </TD>
                          <TD
                            textAlign="right"
                            monospace={true}
                            bottomRight={
                              index === domainsRenewingToday.length - 1
                            }
                          >
                            ${`${renewalPrice.amount.toFixed(2)}`}
                          </TD>
                        </tr>
                      ),
                    )}
                  <tr>
                    <td />
                    <td />
                    <td />
                  </tr>
                  <tr key={'total'} className="font-bold">
                    <TD
                      className="font-bold"
                      textAlign="right"
                      monospace={false}
                      bottomLeft
                    >
                      Subtotal
                    </TD>
                    <TD textAlign="left" monospace={true} />
                    <TD textAlign="right" monospace={true} bottomRight>
                      $
                      {`${sum(
                        map(
                          (domain) => domain.renewalPrice.amount,
                          domainsRenewingToday,
                        ),
                      ).toFixed(2)}`}
                    </TD>
                  </tr>
                </table>
              </div>

              {showPaymentMethodBreakdown && (
                <Card variant="success">
                  <div className="font-bold text-lg text-green-800 mb-2">
                    ✅ You are all set!
                  </div>
                  <div
                    style={{
                      borderRadius: '8px',
                      border: '1.5px #D9D9D9 solid',
                    }}
                  >
                    <table
                      style={{
                        ...styles.text,
                        borderCollapse: 'collapse',
                        width: '100%',
                        fontFamily: 'monospace',
                        borderStyle: 'hidden',
                      }}
                    >
                      <tr>
                        <TD
                          textAlign="left"
                          monospace={false}
                          className="font-medium"
                          topLeft
                        >
                          Payment Method
                        </TD>
                        <TD
                          textAlign="right"
                          monospace={false}
                          className="font-medium"
                          topRight
                        >
                          Amount
                        </TD>
                      </tr>

                      {expectedPayments.map((payment) => (
                        <tr key={payment.paymentId}>
                          <TD
                            textAlign="left"
                            monospace={false}
                            className="pl-8"
                          >
                            {formatPaymentIdentifier(payment)}
                          </TD>
                          <TD textAlign="right" monospace={true}>
                            ${(payment.amountInUsdCents / 100).toFixed(2)}
                          </TD>
                        </tr>
                      ))}
                      <tr>
                        <TD
                          bottomLeft
                          className="font-bold"
                          textAlign="left"
                          monospace={false}
                        >
                          Subtotal
                        </TD>
                        <TD
                          bottomRight
                          className="font-bold"
                          textAlign="right"
                          monospace={true}
                        >
                          $
                          {`${sum(
                            map(
                              (payment) => payment.amountInUsdCents / 100,
                              expectedPayments,
                            ),
                          ).toFixed(2)}`}
                        </TD>
                      </tr>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Table B: Manual Renewal Domains */}
        {showManualRenewalDomains && (
          <>
            <div className="font-normal mt-10 mb-4" style={{ ...styles.text }}>
              <span className="font-medium text-amber-500">
                [Attention Needed]
              </span>{' '}
              Auto renewal is{' '}
              <span className="font-medium text-amber-500">Off</span> for some
              domains.
              <br />
              <span className="text-sm font-normal text-gray-500">
                Please don't forget to renew them on-time manually or update the
                settings to [auto]
              </span>
            </div>
            <div className="px-4 mb-5">
              <div
                style={{ borderRadius: '8px', border: '1.5px #D9D9D9 solid' }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    ...styles.text,
                    width: '100%',
                    borderStyle: 'hidden',
                  }}
                >
                  <tr>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topLeft
                    >
                      Domain Name
                    </TD>
                    <TD
                      textAlign="left"
                      monospace={false}
                      className="font-medium"
                    >
                      Expiration Date
                    </TD>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                    >
                      Action
                    </TD>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topRight
                    >
                      Renew Price
                    </TD>
                  </tr>

                  {manualRenewalDomains
                    .sort(
                      (a, b) =>
                        a.expirationDate.getTime() - b.expirationDate.getTime(),
                    )
                    .map(
                      (
                        { domainNameLdh, expirationDate, renewalPrice },
                        index,
                      ) => (
                        <tr key={domainNameLdh}>
                          <TD textAlign="right" monospace={false}>
                            <DomainNameCell domainNameLdh={domainNameLdh} />
                          </TD>
                          <TD textAlign="left" monospace={true}>
                            <DomainExpirationDateCell
                              expirationDate={expirationDate}
                            />
                          </TD>
                          <TD textAlign="right" monospace={false}>
                            <Button
                              style={{ color: '#1F8D30' }}
                              href={NamefiEmailLinks.domainSettings({
                                domain: domainNameLdh,
                                poweredByNamefiDomain: null,
                              })}
                            >
                              Renew
                            </Button>
                          </TD>
                          <TD textAlign="right" monospace={true}>
                            ${`${renewalPrice.amount.toFixed(2)}`}
                          </TD>
                        </tr>
                      ),
                    )}
                  <tr>
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                  <tr key={'total'} className="font-bold">
                    <TD
                      bottomLeft
                      className="font-bold"
                      textAlign="right"
                      monospace={false}
                    >
                      Subtotal
                    </TD>
                    <TD textAlign="left" monospace={true} />
                    <TD textAlign="right" monospace={true} />
                    <TD
                      bottomRight
                      className="font-bold"
                      textAlign="right"
                      monospace={true}
                    >
                      $
                      {`${sum(
                        map(
                          (domain) => domain.renewalPrice.amount,
                          manualRenewalDomains,
                        ),
                      ).toFixed(2)}`}
                    </TD>
                  </tr>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Table C: Upcoming Automatic Renewals */}
        {showUpcomingAutomaticRenewals && (
          <>
            <div className="font-normal mt-10 mb-4" style={{ ...styles.text }}>
              <span className="font-medium">[FYI]</span> Upcoming Automatic
              Renewals
            </div>
            <div className="px-4 mb-5">
              <div
                style={{ borderRadius: '8px', border: '1.5px #D9D9D9 solid' }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    ...styles.text,
                    width: '100%',
                    borderStyle: 'hidden',
                  }}
                >
                  <tr>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topLeft
                    >
                      Domain Name
                    </TD>
                    <TD
                      textAlign="left"
                      monospace={false}
                      className="font-medium"
                    >
                      Expiration Date
                    </TD>
                    <TD
                      textAlign="right"
                      monospace={false}
                      className="font-medium"
                      topRight
                    >
                      Renew Price
                    </TD>
                  </tr>
                  {upcomingAutomaticRenewals
                    .sort(
                      (a, b) =>
                        a.expirationDate.getTime() - b.expirationDate.getTime(),
                    )
                    .map(
                      (
                        { domainNameLdh, expirationDate, renewalPrice },
                        index,
                      ) => (
                        <tr key={domainNameLdh}>
                          <TD
                            textAlign="right"
                            monospace={false}
                            bottomLeft={
                              index === upcomingAutomaticRenewals.length - 1
                            }
                          >
                            <DomainNameCell domainNameLdh={domainNameLdh} />
                          </TD>
                          <TD textAlign="left" monospace={true}>
                            <DomainExpirationDateCell
                              expirationDate={expirationDate}
                            />
                          </TD>
                          <TD
                            textAlign="right"
                            monospace={true}
                            bottomRight={
                              index === upcomingAutomaticRenewals.length - 1
                            }
                          >
                            ${`${renewalPrice.amount.toFixed(2)}`}
                          </TD>
                        </tr>
                      ),
                    )}
                </table>
              </div>
            </div>
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
      // Domains renewing today (autoRenew: true, < 15 days)
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
        domainNameLdh: 'xn--gtvz22d.xn--0zwm56d', // '苹果.测试', translation of "apple.test" in Chinese
        expirationDate: addDays(new Date(), 5),
        renewalPrice: {
          amount: 59,
          currency: 'USD',
        },
        autoRenew: true,
      },
      // Manual renewal domains (autoRenew: false)
      {
        // 'सेब.परीक्षण', translation of "apple.test" in Hindi
        domainNameLdh: 'xn--p2bx9b.xn--11b2aty0b2c6e',
        expirationDate: addDays(new Date(), 12),
        renewalPrice: {
          amount: 48,
          currency: 'USD',
        },
        autoRenew: false,
      },
      {
        // 'manzana.prueba', translation of "apple.test" in Spanish
        domainNameLdh: 'manzana.prueba',
        expirationDate: addDays(new Date(), 25),
        renewalPrice: {
          amount: 22,
          currency: 'USD',
        },
        autoRenew: false,
      },
      // Upcoming automatic renewals (autoRenew: true, >= 15 days)
      {
        domainNameLdh: 'xn--90ascnx3e.xn--e1aybc', // 'яблуко.тест', translation of "apple.test" in Ukrainian
        expirationDate: addDays(new Date(), 20),
        renewalPrice: {
          amount: 42,
          currency: 'USD',
        },
        autoRenew: true,
      },
      {
        domainNameLdh: 'xn--90ascmb1h.xn--e1aybc', // 'яблоко.тест', translation of "apple.test" in Russian
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
      availableBalanceInNfsc: 25_00, // $25.00 in cents
      availableOffChainPaymentMethodsPublicIdentifiers: [],
      paymentPreparationSummary: {
        status: 'INSUFFICIENT_FUNDS' as const,
        message:
          'Insufficient funds available to complete the renewal payment.',
        shortByInUsdCents: 69_00, // Short by $69.00
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
      availableBalanceInNfsc: 49_00, // $49.00 in cents
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
  const color = daysRemaining > RENEW_EARLY_BY_DAYS ? 'inherit' : '#FFA500';
  if (daysRemaining <= 0) {
    return (
      <React.Fragment>
        {format(expirationDate, 'yyyy-MM-dd')}
        <span className="text-red-700"> (Expired)</span>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {' '}
      {format(expirationDate, 'yyyy-MM-dd')}
      <span style={{ color, fontSize: '12px' }}> ({daysRemaining} days)</span>
    </React.Fragment>
  );
}

function DomainNameCell({ domainNameLdh }: { domainNameLdh: string }) {
  return (
    <a
      href={`https://${domainNameLdh}`}
      style={{ ...styles.text, textDecoration: 'none' }}
    >
      {punycode.toUnicode(domainNameLdh) !== domainNameLdh ? (
        <span>
          {punycode.toUnicode(domainNameLdh)}
          <br />({domainNameLdh})
        </span>
      ) : (
        domainNameLdh
      )}
    </a>
  );
}

function TD({
  children,
  textAlign,
  monospace,
  className,
  style,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  children?: React.ReactNode;
  textAlign: 'right' | 'left';
  monospace: boolean;
  className?: string;
  style?: React.CSSProperties;
  topLeft?: boolean;
  topRight?: boolean;
  bottomLeft?: boolean;
  bottomRight?: boolean;
}) {
  return (
    <td
      className={'py-1 px-1 ' + (className ? className : '')}
      style={{
        border: '1.5px #D9D9D9 solid',
        textAlign,
        fontFamily: monospace ? 'monospace' : 'inherit',
        ...style,
        borderTopLeftRadius: topLeft ? '8px' : '0px',
        borderTopRightRadius: topRight ? '8px' : '0px',
        borderBottomLeftRadius: bottomLeft ? '8px' : '0px',
        borderBottomRightRadius: bottomRight ? '8px' : '0px',
      }}
    >
      {children}
    </td>
  );
}
