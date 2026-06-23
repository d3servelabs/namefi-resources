// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Button, Text } from '@react-email/components';
import { addDays } from 'date-fns';
import pluralize from 'pluralize';
import { formatDomainNameForDisplay } from '@namefi-astra/registrars/data/validations';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Card } from '../components/card';
import { EmailButtonIcon } from '../components/email-action-icon';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
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

const tableStyles = {
  table: {
    ...styles.table,
  },
  headerCell: {
    ...styles.tableHeaderCell,
  },
  cell: {
    ...styles.tableCell,
  },
  domainText: {
    ...styles.monospaceText,
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
      <EmailTable>
        <thead>
          <EmailTableRow>
            <EmailTableHeaderCell style={tableStyles.headerCell}>
              Domain
            </EmailTableHeaderCell>
            {showPrice && (
              <EmailTableHeaderCell style={tableStyles.headerCell}>
                Price
              </EmailTableHeaderCell>
            )}
          </EmailTableRow>
        </thead>
        <tbody>
          {props.cartItems.map((item) => {
            return (
              <EmailTableRow key={item.domainNameLdh}>
                <EmailTableCell label="Domain" style={tableStyles.cell}>
                  <span style={tableStyles.domainText}>
                    {formatDomainNameForDisplay(item.domainNameLdh)}
                  </span>
                </EmailTableCell>
                {showPrice && (
                  <EmailTableCell label="Price" style={tableStyles.cell}>
                    {typeof item.priceInUsdCents === 'number'
                      ? `$${(item.priceInUsdCents / 100).toFixed(2)}`
                      : '--'}
                  </EmailTableCell>
                )}
              </EmailTableRow>
            );
          })}
        </tbody>
      </EmailTable>
      <Button
        className="namefi-button-mobile"
        style={styles.button}
        href={NamefiEmailLinks.cart({ poweredByNamefiDomain })}
      >
        <EmailButtonIcon icon="cart" />
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
