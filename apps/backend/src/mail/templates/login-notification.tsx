// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import { Text, Section, Hr } from '@react-email/components';

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

        <Section style={styles.detailsBox}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.labelCell}>Login Method</td>
                <td style={styles.valueCell}>{loginMethod}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>IP Address</td>
                <td style={styles.valueCell}>{ipAddress}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Location</td>
                <td style={styles.valueCell}>{geolocation}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Device</td>
                <td style={styles.valueCell}>{device}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Operating System</td>
                <td style={styles.valueCell}>{os}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Browser</td>
                <td style={styles.valueCell}>{browser}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Time</td>
                <td style={styles.valueCell}>{timestamp}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Hr style={styles.hr} />

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

        <Hr style={styles.hr} />

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
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '14px',
    lineHeight: '22px',
    marginBottom: '16px',
    color: '#333333',
  },
  detailsBox: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  labelCell: {
    padding: '8px 12px 8px 0',
    fontSize: '13px',
    color: '#666666',
    fontWeight: 500,
    width: '140px',
    verticalAlign: 'top' as const,
  },
  valueCell: {
    padding: '8px 0',
    fontSize: '13px',
    color: '#333333',
    wordBreak: 'break-word' as const,
  },
  hr: {
    borderColor: '#e9ecef',
    margin: '24px 0',
  },
  warningText: {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#dc3545',
    marginBottom: '20px',
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
  },
  referenceBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  referenceText: {
    fontSize: '13px',
    color: '#856404',
    margin: '0 0 4px 0',
  },
  referenceHint: {
    fontSize: '12px',
    color: '#856404',
    margin: '0',
    fontStyle: 'italic' as const,
  },
  code: {
    backgroundColor: '#f8f9fa',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  footerText: {
    fontSize: '12px',
    color: '#999999',
    lineHeight: '18px',
  },
} as const;
