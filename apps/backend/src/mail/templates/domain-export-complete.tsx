import { Text, Button } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import { getChain } from '@namefi-astra/utils';
import * as styles from '../styles';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { NamefiEmailLinks } from '../email-links';
import { Card } from '../components/card';

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
    title = 'Domain Export Completed',
  }) => {
    const txUrl = getTxExplorerUrl(chainId, nftBurnTxHash);

    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>
          ✅ Your domain <strong>{domainName}</strong> has been successfully
          exported.
        </Text>

        <Card
          variant="info"
          style={{
            paddingBottom: '5px',
            paddingTop: '5px',
            marginLeft: '5px',
            marginRight: '5px',
          }}
        >
          <Text
            style={{ ...styles.paragraph, fontSize: '12px', fontWeight: '400' }}
          >
            The Namefi NFT for this domain has been burned as part of the export
            process.{' '}
            {txUrl && (
              <a href={txUrl} style={styles.anchor}>
                View Transaction
              </a>
            )}
            <br />
            You can always import it back to Namefi again to receive a new NFT.
            <br />
          </Text>
        </Card>
        <Text style={styles.paragraph}>Thank you for using Namefi!</Text>

        <Button style={styles.button} href={'https://namefi.io'}>
          Get Another Domain
        </Button>
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
