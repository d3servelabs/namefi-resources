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
          <table
            style={{
              ...styles.paragraph,
              borderCollapse: 'collapse',
              marginLeft: 'auto',
              marginRight: 'auto',
              minWidth: '80%',
            }}
          >
            <tr>
              <td
                className="py-1 px-1 font-medium"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
              >
                Domain Name
              </td>
              <td
                className="py-1 px-1 font-medium"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
              >
                Expiration Date
              </td>
              <td
                className="py-1 px-1 font-medium"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
              >
                Renew Price
              </td>
            </tr>
            {domainsToRenew.map((domainNameLdh) => (
              <tr key={domainNameLdh}>
                <td
                  className="py-1 px-1"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                >
                  <a
                    href={NamefiEmailLinks.domainSettings({
                      domain: domainNameLdh,
                      poweredByNamefiDomain,
                    })}
                    style={{ color: '#0066cc', textDecoration: 'underline' }}
                  >
                    {domainNameLdh}{' '}
                    {punycode.toUnicode(domainNameLdh) === domainNameLdh
                      ? ''
                      : `(${punycode.toUnicode(domainNameLdh)})`}
                  </a>
                </td>
                <td
                  className="py-1 px-1"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                >
                  {format(
                    expirationDatesByDomainLdh[domainNameLdh],
                    'yyyy-MM-dd',
                  )}
                </td>
                <td
                  className="py-1 px-1"
                  style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
                >
                  ${chargeAmountInUsdByDomainLdh[domainNameLdh].toFixed(2)}
                </td>
              </tr>
            ))}
            <tr>
              <td />
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
                style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
              />
              <td
                className="py-1 px-1 font-medium"
                style={{ border: '1px #D9D9D9 solid', textAlign: 'left' }}
              >
                $
                {sum(
                  map(
                    (domainNameLdh) =>
                      chargeAmountInUsdByDomainLdh[domainNameLdh],
                    domainsToRenew,
                  ),
                ).toFixed(2)}
              </td>
            </tr>
          </table>
          <div style={{ ...styles.paragraph, marginTop: '8px' }}>
            <div>
              Available balance in NFSC: ${availableBalanceInNfsc.toFixed(2)}{' '}
              USD (<span className="text-amber-500">insufficient</span>)
            </div>
            <div>
              Credit cards on profile:
              <ul className="list-none list-outside mt-1">
                {availableOffChainPaymentMethods.map((paymentMethod) => (
                  <li key={paymentMethod}>
                    •••• •••• •••• {paymentMethod} (
                    <span className="text-amber-500">declined</span>)
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ ...styles.paragraph, marginTop: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>What you can do: </span>
            <span>
              Update your payment method or add funds to your NFSC balance, and
              we'll take care of the rest.
            </span>
          </div>
          <Button
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
