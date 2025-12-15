import { Text } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import { getChain } from '@namefi-astra/utils';
import * as styles from '../styles';

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
          Your domain <strong>{domainName}</strong> has been successfully
          exported.
        </Text>

        <Text style={styles.paragraph}>
          The domain transfer has been completed and is now managed by your new
          registrar.
        </Text>

        <Text style={styles.paragraph}>
          <strong>NFT Burned:</strong> The Namefi NFT associated with this
          domain has been burned as part of the export process.
          {txUrl && (
            <>
              <br />
              You can view the burn transaction on the blockchain:{' '}
              <a href={txUrl} style={{ color: '#3498db' }}>
                View Transaction
              </a>
            </>
          )}
        </Text>

        <Text style={styles.paragraph}>
          Thank you for using Namefi! If you ever want to bring your domain
          back, you can always transfer it to Namefi again to receive a new NFT.
        </Text>

        <GoToDashboard />
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
