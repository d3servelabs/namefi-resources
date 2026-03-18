// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import punycode from 'punycode';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { NamefiEmailLinks } from '../email-links';
import { buildTemplate } from '../components/build-template';
import * as styles from '../styles';
import { addDays, format } from 'date-fns';
import { sum, map } from 'ramda';
import { Button } from '@react-email/components';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Card } from '../components/card';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';

export type DomainRenewFailedToChargeProps = {
  recipientName: string;
  recipientEmail: string;
  domainsToRenew: string[];
  chargeAmountInUsdByDomainLdh: Record<string, number>;
  expirationDatesByDomainLdh: Record<string, Date>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
};

export const DomainRenewFailedToCharge =
  buildTemplate<DomainRenewFailedToChargeProps>(
    (props) => {
      const {
        recipientName,
        domainsToRenew,
        chargeAmountInUsdByDomainLdh,
        expirationDatesByDomainLdh,
        availableBalanceInNfsc,
        availableOffChainPaymentMethods,
      } = props;

      const poweredByNamefiDomain = usePoweredByNamefiDomain();

      const domainText =
        domainsToRenew.length === 1
          ? 'your domain'
          : `your ${domainsToRenew.length} domains`;

      const messageMarkdown =
        `Hi ${recipientName || 'there'},\n\n` +
        `We tried to renew ${domainText}, but the payment didn't go through. No worries - your domains are still safe for now, and we want to help you get this sorted out.`;

      return (
        <NamefiEmailContainer title="[Namefi] Quick Action Needed: Payment Issue">
          <div style={{ ...styles.paragraph, marginBottom: '8px' }}>
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
              </EmailTableRow>
            </thead>
            <tbody>
              {domainsToRenew.map((domainNameLdh) => (
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
                </EmailTableRow>
              ))}
              <EmailTableRow>
                <EmailTableCell label="Summary" emphasis>
                  Total
                </EmailTableCell>
                <EmailTableCell hideOnMobile />
                <EmailTableCell label="Renew Price" numeric>
                  $
                  {sum(
                    map(
                      (domainNameLdh) =>
                        chargeAmountInUsdByDomainLdh[domainNameLdh],
                      domainsToRenew,
                    ),
                  ).toFixed(2)}
                </EmailTableCell>
              </EmailTableRow>
            </tbody>
          </EmailTable>
          <Card variant="warning" style={{ marginTop: '12px' }}>
            <div
              style={{
                ...styles.panelText,
                color: styles.astraTheme.warningInk,
              }}
            >
              Available NFSC balance: ${availableBalanceInNfsc.toFixed(2)} USD
              (insufficient).
            </div>
            <div
              style={{
                ...styles.panelText,
                color: styles.astraTheme.warningInk,
                marginTop: '8px',
              }}
            >
              Credit cards on file:
            </div>
            <ul
              style={{
                color: styles.astraTheme.warningInk,
                margin: '8px 0 0 16px',
                padding: 0,
              }}
            >
              {availableOffChainPaymentMethods.map((paymentMethod) => (
                <li key={paymentMethod} style={{ marginBottom: '4px' }}>
                  •••• •••• •••• {paymentMethod} (declined)
                </li>
              ))}
            </ul>
          </Card>
          <div style={{ ...styles.paragraph, marginTop: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>What you can do: </span>
            <span>
              Update your payment method or add funds to your NFSC balance, and
              we'll take care of the rest.
            </span>
          </div>
          <Button
            className="namefi-button-mobile"
            style={styles.button}
            href={NamefiEmailLinks.paymentMethods({ poweredByNamefiDomain })}
          >
            Update Payment Methods
          </Button>
          <div style={{ ...styles.paragraph, marginTop: '8px' }}>
            We want to make sure you don't lose your domains - they're important
            to us too! If you need any help, just reach out to
            support@namefi.io.
          </div>
        </NamefiEmailContainer>
      );
    },
    {
      recipientName: 'Alice',
      recipientEmail: 'alice@example.com',
      domainsToRenew: ['example.org', 'example.net'],
      chargeAmountInUsdByDomainLdh: {
        'example.org': 11.1,
        'example.net': 12.52,
      },
      expirationDatesByDomainLdh: {
        'example.org': addDays(new Date(), 5),
        'example.net': addDays(new Date(), 2),
      },
      availableBalanceInNfsc: 10.43,
      availableOffChainPaymentMethods: ['4242', '0043'],
    },
  );

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainRenewFailedToCharge;
