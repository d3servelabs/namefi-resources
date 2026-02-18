// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Button, Text } from '@react-email/components';
import { addDays } from 'date-fns';
import punycode from 'punycode';
import pluralize from 'pluralize';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Card } from '../components/card';
import * as styles from '../styles';
import { getCartDomainsPopularVariant } from '../campaigns/cart-domains-popular-variants';

export type CartDomainsPopularProps = {
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  cartItems: Array<{
    domainNameLdh: string;
    addedAt: Date;
    priceInUsdCents?: number;
  }>;
  variant?: number;
};

const formatDomainDisplay = (domainNameLdh: string) => {
  const unicodeName = punycode.toUnicode(domainNameLdh);
  return {
    primary: domainNameLdh,
    unicode: unicodeName !== domainNameLdh ? unicodeName : null,
  };
};

const tableStyles = {
  table: {
    ...styles.text,
    borderCollapse: 'collapse' as const,
    width: '100%',
    margin: '16px 0',
  },
  headerCell: {
    border: '1px solid #D9D9D9',
    padding: '8px',
    textAlign: 'left' as const,
    fontWeight: 600,
    backgroundColor: '#f8fafc',
  },
  cell: {
    border: '1px solid #D9D9D9',
    padding: '8px',
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
  },
  mutedText: {
    color: '#6b7280',
    fontSize: '13px',
    marginLeft: '6px',
  },
  domainLink: {
    ...styles.anchor,
    textDecoration: 'underline',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '14px',
  },
};

export const CartDomainsPopularTemplate = (props: CartDomainsPopularProps) => {
  const poweredByNamefiDomain = usePoweredByNamefiDomain(
    props.poweredByNamefiDomain,
  );
  const safeRecipientName = props.recipientName?.trim()
    ? props.recipientName
    : 'there';
  const showPrice = props.cartItems.some(
    (item) => typeof item.priceInUsdCents === 'number',
  );
  const domainCountLabel = pluralize('domain', props.cartItems.length, true);
  const { variant: copyVariant } = getCartDomainsPopularVariant(
    props.variant ?? 0,
  );

  return (
    <NamefiEmailContainer title={copyVariant.title}>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        Hi {safeRecipientName},
      </Text>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        {copyVariant.intro({ domainCountLabel })}
      </Text>
      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: 0 }}>
          {copyVariant.card}
        </Text>
      </Card>
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th style={tableStyles.headerCell}>Domain</th>
            {showPrice && <th style={tableStyles.headerCell}>Price</th>}
          </tr>
        </thead>
        <tbody>
          {props.cartItems.map((item) => {
            const display = formatDomainDisplay(item.domainNameLdh);

            return (
              <tr key={item.domainNameLdh}>
                <td style={tableStyles.cell}>
                  <a
                    href={NamefiEmailLinks.claimDomain({
                      domain: item.domainNameLdh,
                      poweredByNamefiDomain,
                    })}
                    style={tableStyles.domainLink}
                  >
                    {display.primary}
                  </a>
                  {display.unicode && (
                    <span style={tableStyles.mutedText}>
                      ({display.unicode})
                    </span>
                  )}
                </td>
                {showPrice && (
                  <td style={tableStyles.cell}>
                    {typeof item.priceInUsdCents === 'number'
                      ? `$${(item.priceInUsdCents / 100).toFixed(2)}`
                      : '--'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button
        style={styles.button}
        href={NamefiEmailLinks.cart({ poweredByNamefiDomain })}
      >
        {copyVariant.cta}
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: '12px' }}>
        {copyVariant.footer}
      </Text>
    </NamefiEmailContainer>
  );
};

export const cartDomainsPopularPreviewBase: CartDomainsPopularProps = {
  recipientName: 'Alex',
  recipientEmail: 'alex@example.com',
  cartItems: [
    {
      domainNameLdh: 'brightidea.xyz',
      addedAt: addDays(new Date(), -4),
      priceInUsdCents: 1299,
    },
    {
      domainNameLdh: 'evergreenteam.io',
      addedAt: addDays(new Date(), -2),
      priceInUsdCents: 2499,
    },
  ],
  variant: 0,
  poweredByNamefiDomain: null,
};
