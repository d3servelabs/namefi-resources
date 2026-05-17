import { Text } from '@react-email/components';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import punycode from 'punycode';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import * as styles from '../styles';
import { Card } from '../components/card';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export type DomainExportFailedProps = {
  recipientName?: string;
  /**
   * The user's primary email. Required by the repo's email-template contract
   * (`apps/backend/src/mail/.claude-rules`) so downstream tracking and
   * personalisation hooks have a stable handle even when the body doesn't
   * render it directly.
   */
  recipientEmail: string;
  /**
   * Optional override for the powered-by domain. Defaults to the value from
   * the email render context.
   */
  poweredByNamefiDomain?: string | null;
  domainName: string;
  /**
   * Optional human-readable reason surfaced from the registrar or check
   * (e.g. "transfer cancelled at the gaining registrar"). Falls back to a
   * generic explanation when omitted.
   */
  reason?: string;
};

/**
 * Default preview/sample props consumed by react-email's dev server. Held in
 * a named const so `buildTemplate` and the explicit `.PreviewProps`
 * assignment below stay in lockstep — `buildTemplate` already wires the
 * `.PreviewProps` attribute from its second argument, the explicit assignment
 * satisfies the documented `Component.PreviewProps = ...` rule in
 * `apps/backend/src/mail/.claude-rules`.
 */
const previewProps: DomainExportFailedProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  poweredByNamefiDomain: null,
  domainName: 'example.com',
  reason: 'Transfer was cancelled at the gaining registrar.',
};

export const DomainExportFailed = buildTemplate<DomainExportFailedProps>(
  (props) => {
    const { recipientName, domainName, reason } = props;
    // Subscribe to the powered-by domain context so links rendered inside
    // this template resolve to the correct host (kept consistent with the
    // other domain-export templates).
    usePoweredByNamefiDomain(props.poweredByNamefiDomain);

    const unicodeDomain = punycode.toUnicode(domainName);
    const displayDomain =
      unicodeDomain !== domainName
        ? `${unicodeDomain} (${domainName})`
        : domainName;

    const title = '[Namefi] Your Domain Export Did Not Complete';

    return (
      <NamefiEmailContainer title={title}>
        <Text style={styles.paragraph}>Hi {recipientName || 'there'},</Text>

        <Text style={styles.paragraph}>
          The export request for <strong>{displayDomain}</strong> did not
          complete and the domain remains in your Namefi account.
        </Text>

        {reason && (
          <Card variant="info">
            <Text style={styles.paragraph}>
              <strong>Reason:</strong> {reason}
            </Text>
          </Card>
        )}

        <Text style={styles.paragraph}>
          You don't need to do anything — your domain and its associated NFT are
          unchanged. If you'd like to retry the export, you can initiate a new
          transfer request from the gaining registrar.
        </Text>

        <Text style={styles.paragraph}>
          If you weren't expecting this notice or have questions, please reach
          out to support@namefi.io.
        </Text>

        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
  previewProps,
);

DomainExportFailed.PreviewProps = previewProps;

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainExportFailed;
