import { Button } from '@react-email/components';
import { isNil } from 'ramda';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { subDays, addDays, differenceInCalendarDays, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import punycode from 'punycode';
import {
  SEND_RENEW_REMINDERS_THRESHOLD,
  RENEW_EARLY_BY_DAYS,
} from '../../lib/env/consts';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailLinks } from '../email-links';
import { withPoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

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
  last4DigitsOfCreditCardToCharge?: string;
};

export const DomainUpcomingRenewal = withPoweredByNamefiDomain(
  (props: DomainUpcomingRenewalProps) => {
    const {
      domainsRenewInfo,
      recipientName,
      userId,
      nextChargeAmount,
      nextChargeDate,
      last4DigitsOfCreditCardToCharge,
    } = props;
    // TODO: implement pages for these links
    const messageMarkdown = `Hi ${recipientName},

We wanted to kindly remind you that there are domains
in your account ([${userId}](https://app.namefi.io/owner/${userId}))
that will expire within the next ${SEND_RENEW_REMINDERS_THRESHOLD} days. 

To ensure continuous service for your domain names,
we recommend reviewing them immediately. Here's what you should know:  

**Automatic Renewal Service**:  
- For domains with auto-renew enabled, we will attempt to renew them **${RENEW_EARLY_BY_DAYS} days before expiration**
and will reattempt regularly if the initial attempt fails.
- Based on your domains that are enabled for auto-renew, ${
      isNil(nextChargeDate) || nextChargeAmount.amount === 0
        ? 'there are no upcoming charges.'
        : `the next charge will be 
a total amount of **${nextChargeAmount.amount.toFixed(2)} ${nextChargeAmount.currency}** 
charged with your Namefi Service Credit ($NFSC) balance or your [saved credit cards](${NamefiEmailLinks.paymentMethods(
            {
              poweredByNamefiDomain: null,
            },
          )})
${
  last4DigitsOfCreditCardToCharge
    ? `**(ending ${last4DigitsOfCreditCardToCharge})**`
    : ''
} ${subDays(nextChargeDate, 1) < new Date() ? '**today**' : `on or about the date of **${format(subDays(nextChargeDate, 1), 'LLL dd, yyy')}**`}.`
    }

**Your Control & Responsibilities**:  
- To maintain uninterrupted service, please ensure you have either adequate $NFSC balance or a valid credit card on file.
- You may disable auto-renewal for a domain at any time through your dashboard 
if you wish to let it expire to avoid any renewal charges.

**Post-Expiration Timeline**:  
- Days 1-10: Domain resolution will stop functioning normally (grace period) 
- Days 11-30: Domain may be suspended*  
- After 30 days: Domain may be removed*  

**Need Help?**

Our comprehensive guide explains
[what happens after domain expiration](https://help.namefi.io/en/articles/5703766).
For personalized assistance, our support team is always available at
[support@namefi.io](mailto:support@namefi.io) or through your account dashboard.

Please see our [Terms of Service](https://namefi.io/tos) for more details about
what happens after domain expiration.

Happy Domaining!

The Namefi Team`;
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
              Expiration Date
            </td>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Auto Renewal Preference
            </td>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Renewal Price
            </td>
            <td
              className="py-1 px-1 font-medium"
              style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
            >
              Action
            </td>
          </tr>
          {domainsRenewInfo
            .sort(
              (a, b) => a.expirationDate.getTime() - b.expirationDate.getTime(),
            )
            .map(
              ({ domainNameLdh, expirationDate, autoRenew, renewalPrice }) => (
                <tr key={domainNameLdh}>
                  <td
                    className="py-1 px-1"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    <a
                      href={`https://${domainNameLdh}`}
                      style={{ color: '#000', textDecoration: 'none' }}
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
                  </td>
                  <td
                    className="py-1 px-1"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    {format(expirationDate, 'LLL dd, yyy')}
                    <span>
                      {(() => {
                        const daysRemaining = differenceInCalendarDays(
                          expirationDate,
                          new Date(),
                        );
                        let color = '#FFA500'; // dark yellow by default
                        if (daysRemaining > SEND_RENEW_REMINDERS_THRESHOLD) {
                          color = '#000';
                        } else if (daysRemaining < RENEW_EARLY_BY_DAYS) {
                          color = '#D32F2F'; // namefi red
                        }
                        return (
                          <span style={{ color }}> ({daysRemaining} days)</span>
                        );
                      })()}
                    </span>
                  </td>

                  <td
                    className="py-1 px-1 text-right"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    {autoRenew ? (
                      differenceInCalendarDays(expirationDate, new Date()) <
                      RENEW_EARLY_BY_DAYS ? (
                        <span style={{ color: '#000' }}>
                          Automatic
                          <br />
                          <span style={{ fontSize: '10px', color: '#FFA500' }}>
                            We couldn't process payment
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: '#000' }}>Automatic</span>
                      )
                    ) : (
                      <span style={{ color: '#FFA500' }}>Manual ⚠</span>
                    )}
                  </td>

                  <td
                    className="py-1 px-1"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    {`${renewalPrice.amount.toFixed(2)} ${renewalPrice.currency}`}
                  </td>

                  <td
                    className="py-1 px-1"
                    style={{ border: '1px #D9D9D9 solid', textAlign: 'right' }}
                  >
                    <Button
                      style={{ color: '#1F8D30' }}
                      href={NamefiEmailLinks.domainSettings({
                        domain: domainNameLdh,
                        poweredByNamefiDomain: null,
                      })}
                    >
                      Renew
                    </Button>
                  </td>
                </tr>
              ),
            )}
        </table>

        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
);

(DomainUpcomingRenewal as any).PreviewProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  userId: '123',
  domainsRenewInfo: [
    {
      domainNameLdh: 'apple.test',
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30)),
      renewalPrice: {
        amount: Math.max(10, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    {
      domainNameLdh: 'xn--gtvz22d.xn--0zwm56d', // '苹果.测试', translation of "apple.test" in Chinese
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(10, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    {
      // 'सेब.परीक्षण', translation of "apple.test" in Hindi
      domainNameLdh: 'xn--p2bx9b.xn--11b2aty0b2c6e',
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(10, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    {
      // 'manzana.prueba', translation of "apple.test" in Spanish
      domainNameLdh: 'manzana.prueba',
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(10, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    {
      domainNameLdh: 'xn--90ascnx3e.xn--e1aybc', // 'яблуко.тест', translation of "apple.test" in Ukrainian
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(30, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    {
      domainNameLdh: 'xn--90ascmb1h.xn--e1aybc', // 'яблоко.тест', translation of "apple.test" in Russian
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(30, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: true,
    },
    ...new Array(3).fill(0).map((_, i) => ({
      domainNameLdh: `namefi-${i.toString().padStart(2, '0')}.test`,
      expirationDate: addDays(new Date(), -Math.floor(Math.random() * 45)),
      renewalPrice: {
        amount: Math.max(30, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: Math.random() > 0.5,
    })),
    ...new Array(10).fill(0).map((_, i) => ({
      domainNameLdh: `namefi-${i.toString().padStart(2, '0')}.test`,
      expirationDate: addDays(new Date(), Math.floor(Math.random() * 30 + 30)),
      renewalPrice: {
        amount: Math.max(30, Math.floor(Math.random() * 100)),
        currency: 'USD',
      },
      autoRenew: Math.random() > 0.5,
    })),
  ],
  nextChargeAmount: { amount: 100, currency: 'USD' },
  nextChargeDate: addDays(new Date(), 5),
  last4DigitsOfCreditCardToCharge: '1234',
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainUpcomingRenewal;
