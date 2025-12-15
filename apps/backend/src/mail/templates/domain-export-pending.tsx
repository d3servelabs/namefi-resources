import { Button, Text } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import * as styles from '../styles';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export type DomainExportPendingProps = {
  recipientName?: string;
  domainName: string;
  supportsApprovingExport: boolean;
};

export const DomainExportPending = buildTemplate<DomainExportPendingProps>(
  ({
    domainName,
    supportsApprovingExport,
    title = 'Domain Export Request Detected',
  }) => {
    const poweredByNamefiDomain = usePoweredByNamefiDomain();
    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>
          We detected a transfer request for your domain{' '}
          <strong>{domainName}</strong>.
        </Text>

        <Text style={styles.paragraph}>
          This means another registrar has initiated a transfer to move your
          domain away from Namefi. If you did not request this transfer, please
          contact support immediately.
        </Text>

        {supportsApprovingExport && (
          <>
            <Text style={styles.paragraph}>
              <strong>Action Required:</strong> <br />
              You can approve or reject this transfer request directly from your
              Namefi dashboard.
            </Text>

            <Button
              href={NamefiEmailLinks.domainSettings({
                domain: domainName,
                poweredByNamefiDomain,
              })}
              style={styles.button}
            >
              Manage Transfer in Dashboard
            </Button>
          </>
        )}

        {!supportsApprovingExport && (
          <Text style={styles.paragraph}>
            The transfer will proceed automatically unless rejected. You should
            receive a confirmation email from your current registrar with
            instructions on how to approve or cancel the transfer.
          </Text>
        )}

        <Text style={styles.paragraph}>
          <strong>What happens next?</strong>
        </Text>
        <Text style={styles.paragraph}>
          • If the transfer completes successfully, your domain will move to the
          new registrar
          <br />• The associated Namefi NFT will be burned once the transfer is
          confirmed
          <br />• You will receive a confirmation email when the export is
          complete
        </Text>

        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
  {
    domainName: 'example.com',
    supportsApprovingExport: true,
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainExportPending;
