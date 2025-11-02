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

      const messageMarkdown =
        `Hi ${recipientName},\n\n` +
        'While renewing the following domains, We failed to process the payment.';

      return (
        <NamefiEmailContainer title="[Namefi] Important: Domain Renewal Payment Failed">
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
                  {domainNameLdh}{' '}
                  {punycode.toUnicode(domainNameLdh) === domainNameLdh
                    ? ''
                    : `(${punycode.toUnicode(domainNameLdh)})`}
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
            <span style={{ fontWeight: 'bold' }}>Action Required: </span>
            <span>Please update your payment methods.</span>
          </div>
          <Button
            style={styles.button}
            href={NamefiEmailLinks.paymentMethods({ poweredByNamefiDomain })}
          >
            Update Payment Methods
          </Button>
          <div style={{ ...styles.paragraph, marginTop: '8px' }}>
            Failure to renew on time may risk the loss of your domains due to
            expiration.
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
