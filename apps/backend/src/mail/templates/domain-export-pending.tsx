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
import { EmailButtonIcon } from '../components/email-action-icon';

export type DomainExportPendingProps = {
  recipientName?: string;
  domainName: string;
  supportsApprovingExport: boolean;
};

export const DomainExportPending = buildTemplate<DomainExportPendingProps>(
  ({
    domainName,
    supportsApprovingExport,
    title = '[Namefi] Export Request for Your Domain',
  }) => {
    const poweredByNamefiDomain = usePoweredByNamefiDomain();
    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>
          We've received a request to export <strong>{domainName}</strong> from
          Namefi.
        </Text>

        <Text style={styles.paragraph}>
          <strong>Didn't request this?</strong> Please contact us at
          support@namefi.io right away - we'll help you secure your domain.
        </Text>

        {supportsApprovingExport && (
          <Card variant="info">
            <Text style={styles.paragraph}>
              You're in control. You can approve or cancel this export request
              from your dashboard whenever you're ready.
            </Text>

            <Button
              className="namefi-button-mobile"
              href={NamefiEmailLinks.domainSettings({
                domain: domainName,
                poweredByNamefiDomain,
              })}
              style={styles.button}
            >
              <EmailButtonIcon icon="settings" />
              Review Export Request
            </Button>
          </Card>
        )}

        {!supportsApprovingExport && (
          <Text style={styles.paragraph}>
            This export will proceed automatically. If you need to stop it,
            please reach out to us as soon as possible.
          </Text>
        )}

        <Text style={styles.paragraph}>
          <strong>Here's what to expect:</strong>
        </Text>
        <Text style={styles.paragraph}>
          Once the export is complete, your domain will be transferred out of
          Namefi and the associated NFT will be burned. Don't worry - we'll send
          you a confirmation email when everything is done, and you can always
          bring your domain back to Namefi in the future.
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
