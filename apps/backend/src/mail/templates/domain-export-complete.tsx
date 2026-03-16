import { Text, Button } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import { getChain } from '@namefi-astra/utils';
import * as styles from '../styles';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { NamefiEmailLinks } from '../email-links';
import { Card } from '../components/card';
import punycode from 'punycode';

export type DomainExportCompleteProps = {
  recipientName?: string;
  domainName: string;
  chainId?: number;
  nftBurnTxHash?: string;
};

/**
 * Get the transaction explorer URL for a given chain and transaction hash
 */
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

export const DomainExportComplete = buildTemplate<DomainExportCompleteProps>(
  ({
    domainName,
    chainId,
    nftBurnTxHash,
    title = '[Namefi] Your Domain Export is Complete',
  }) => {
    const txUrl = getTxExplorerUrl(chainId, nftBurnTxHash);
    const poweredByNamefiDomain = usePoweredByNamefiDomain();
    const unicodeDomain = punycode.toUnicode(domainName);
    const displayDomain =
      unicodeDomain !== domainName
        ? `${unicodeDomain} (${domainName})`
        : domainName;

    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>
          Your domain <strong>{displayDomain}</strong> has been successfully
          exported and is now free to use with any registrar you choose.
        </Text>

        <Card
          variant="info"
          style={{
            paddingBottom: '10px',
            paddingTop: '10px',
          }}
        >
          <Text style={{ ...styles.bodySmall, margin: 0 }}>
            As part of the export, we've burned the Namefi NFT for this domain.{' '}
            {txUrl && (
              <a href={txUrl} style={styles.anchor}>
                View the transaction
              </a>
            )}
            <br />
            Changed your mind? You can always bring it back to Namefi and mint a
            fresh NFT anytime.
            <br />
          </Text>
        </Card>
        <Text style={styles.paragraph}>
          It was great having <strong>{displayDomain}</strong> with us. We hope
          to see you again soon!
        </Text>

        <table
          className="namefi-button-row"
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          style={styles.buttonRowTable}
        >
          <tbody>
            <tr>
              <td className="namefi-button-cell" style={styles.buttonRowCell}>
                <Button
                  className="namefi-button-mobile"
                  style={styles.button}
                  href={NamefiEmailLinks.domains({ poweredByNamefiDomain })}
                >
                  Explore More Domains
                </Button>
              </td>
              <td
                className="namefi-button-cell"
                style={styles.buttonRowCellLast}
              >
                <Button
                  className="namefi-button-mobile"
                  style={styles.button}
                  href={NamefiEmailLinks.dashboard({ poweredByNamefiDomain })}
                >
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
    domainName: 'example.com',
    chainId: 8453, // Base mainnet
    nftBurnTxHash:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainExportComplete;
