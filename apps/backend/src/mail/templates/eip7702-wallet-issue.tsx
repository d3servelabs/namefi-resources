// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Img } from '@react-email/components';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { Code } from '../components/code';
import { buildTemplate } from '../components/build-template';
import * as styles from '../styles';

export type Eip7702WalletIssueProps = {
  domainName: string;
  walletAddress: string;
  screenshotUrl?: string;
};

export const Eip7702WalletIssue = buildTemplate<Eip7702WalletIssueProps>(
  ({ domainName, walletAddress, screenshotUrl }) => {
    return (
      <NamefiEmailContainer title="[Namefi] Your Domain is Safe - Wallet Issue Detected">
        <div style={{ ...styles.paragraph, marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold' }}>
            Your domain <Code>{domainName}</Code> is safe.
          </span>
        </div>

        <div style={{ ...styles.paragraph, marginBottom: '16px' }}>
          There's a slight issue with your wallet.
        </div>

        <div style={{ ...styles.paragraph, marginBottom: '16px' }}>
          Your wallet <Code>{walletAddress}</Code> is using EIP7702 delegation
          and this doesn't handle ERC721 (NFT) properly.
        </div>

        {screenshotUrl && (
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <Img
              src={screenshotUrl}
              alt="Wallet issue screenshot"
              style={{ maxWidth: '100%', borderRadius: '8px' }}
            />
          </div>
        )}
      </NamefiEmailContainer>
    );
  },
  {
    domainName: 'example.eth',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    screenshotUrl: 'https://placehold.co/600x400',
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default Eip7702WalletIssue;
