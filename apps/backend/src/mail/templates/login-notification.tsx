// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import { Text, Section } from '@react-email/components';
import * as mailStyles from '../styles';

export type LoginNotificationProps = {
  loginMethod: string;
  ipAddress: string;
  geolocation: string;
  os: string;
  browser: string;
  device: string;
  sessionId: string;
  timestamp: string;
};

export const LoginNotification = buildTemplate<LoginNotificationProps>(
  ({
    loginMethod,
    ipAddress,
    geolocation,
    os,
    browser,
    device,
    sessionId,
    timestamp,
  }) => {
    return (
      <NamefiEmailContainer title="New Login to Your Namefi Account">
        <Text style={styles.greeting}>Hello,</Text>

        <Text style={styles.paragraph}>
          Someone just logged in to your Namefi account. Here are the details of
          this login:
        </Text>

        <div className="namefi-table-wrap" style={styles.detailsBox}>
          <table className="namefi-key-value-table" style={styles.table}>
            <tbody>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Login Method
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {loginMethod}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  IP Address
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {ipAddress}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Location
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {geolocation}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Device
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {device}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Operating System
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {os}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Browser
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {browser}
                </td>
              </tr>
              <tr className="namefi-key-value-row">
                <td className="namefi-key-value-label" style={styles.labelCell}>
                  Time
                </td>
                <td className="namefi-key-value-value" style={styles.valueCell}>
                  {timestamp}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Text style={styles.paragraph}>
          <strong>No action is required if this was you.</strong>
        </Text>

        <Text style={styles.warningText}>
          If you did not perform this login, please contact us immediately at{' '}
          <a href="mailto:support@namefi.io" style={styles.link}>
            support@namefi.io
          </a>{' '}
          to secure your account.
        </Text>

        <Section style={styles.referenceBox}>
          <Text style={styles.referenceText}>
            Session Reference ID: <code style={styles.code}>{sessionId}</code>
          </Text>
          <Text style={styles.referenceHint}>
            Please include this reference ID when contacting support.
          </Text>
        </Section>

        <Text style={styles.footerText}>
          This is an automated security notification. You are receiving this
          email because a login was detected on your Namefi account.
        </Text>
      </NamefiEmailContainer>
    );
  },
  {
    loginMethod: 'Email',
    ipAddress: '192.168.1.1',
    geolocation: 'San Francisco, California, United States',
    os: 'macOS Catalina or later',
    browser: 'Chrome 120',
    device: 'Mac',
    sessionId: 'sess_abc123def456',
    timestamp: 'January 27, 2026 at 10:30 AM UTC',
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default LoginNotification;

const styles = {
  greeting: {
    ...mailStyles.paragraph,
    marginBottom: '16px',
  },
  paragraph: {
    ...mailStyles.bodySmall,
    marginBottom: '16px',
  },
  detailsBox: {
    ...mailStyles.tableWrap,
    backgroundColor: mailStyles.astraTheme.surface,
    border: `1px solid ${mailStyles.astraTheme.borderStrong}`,
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '20px',
  },
  table: {
    ...mailStyles.table,
  },
  labelCell: {
    ...mailStyles.tableCellEmphasis,
    color: mailStyles.astraTheme.textSecondary,
    width: '170px',
    verticalAlign: 'top' as const,
  },
  valueCell: {
    ...mailStyles.tableCell,
    wordBreak: 'break-word' as const,
  },
  warningText: {
    ...mailStyles.bodySmall,
    color: mailStyles.astraTheme.errorInk,
    marginBottom: '20px',
  },
  link: {
    ...mailStyles.anchor,
  },
  referenceBox: {
    backgroundColor: mailStyles.astraTheme.warningBackground,
    border: `1px solid ${mailStyles.astraTheme.warningBorder}`,
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '20px',
  },
  referenceText: {
    ...mailStyles.bodySmall,
    color: mailStyles.astraTheme.warningInk,
    margin: '0 0 4px 0',
  },
  referenceHint: {
    ...mailStyles.caption,
    color: mailStyles.astraTheme.warningInk,
    margin: '0',
    fontStyle: 'italic' as const,
  },
  code: {
    ...mailStyles.code,
    padding: '2px 6px',
  },
  footerText: {
    ...mailStyles.footerMeta,
  },
} as const;
