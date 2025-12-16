import { Button, Text } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import * as styles from '../styles';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Card } from '../components/card';

export type DomainExportPendingProps = {
  recipientName?: string;
  domainName: string;
  supportsApprovingExport: boolean;
};

export const DomainExportPending = buildTemplate<DomainExportPendingProps>(
  ({
    domainName,
    supportsApprovingExport,
    title = 'Domain Export Request Received',
  }) => {
    const poweredByNamefiDomain = usePoweredByNamefiDomain();
    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>
          We received an export request for your domain{' '}
          <strong>{domainName}</strong>.
        </Text>

        <Text style={styles.paragraph}>
          <strong>
            <span className="font-medium text-amber-600">
              [Attention Needed]
            </span>
          </strong>{' '}
          If you did not request this, please contact support immediately.
        </Text>

        {supportsApprovingExport && (
          <Card variant="info">
            <Text style={styles.paragraph}>
              ℹ️ You can approve or reject this export request from your
              dashboard.
            </Text>

            <Button
              href={NamefiEmailLinks.domainSettings({
                domain: domainName,
                poweredByNamefiDomain,
              })}
              style={styles.button}
            >
              Manage Export in Dashboard
            </Button>
          </Card>
        )}

        {!supportsApprovingExport && (
          <Text style={styles.paragraph}>
            The export will proceed automatically unless rejected.
          </Text>
        )}

        <Text style={styles.paragraph}>
          <strong>What happens next?</strong>
        </Text>
        <Text style={styles.paragraph}>
          • If the export completes, your domain will leave Namefi
          <br />• The associated NFT will be burned once the export is confirmed
          <br />• You will receive a confirmation email when the export is
          complete
        </Text>
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
