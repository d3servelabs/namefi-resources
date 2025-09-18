// Internal reservation notification email template

// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button, Link } from '@react-email/components';
import { button, anchor } from '../styles';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';
import { toUnicode } from 'punycode';

export type InternalReservationNotificationProps = {
  recipientName?: string;
  recipientEmail: string;
  pbnDomain: string;
  exactDomainName?: string;
  parentDomain?: string;
  reason?: string;
  expirationDate?: string | null | undefined;
};

export const InternalReservationNotification =
  buildTemplate<InternalReservationNotificationProps>(
    (props) => {
      const {
        recipientName,
        recipientEmail,
        exactDomainName,
        parentDomain,
        reason,
        expirationDate,
      } = props;

      const poweredByNamefiDomain = usePoweredByNamefiDomain();

      const nameText = exactDomainName
        ? `**${toUnicode(exactDomainName)}**`
        : parentDomain
          ? `a name you can choose from **${toUnicode(parentDomain)}**`
          : 'a name';

      const greeting = recipientName
        ? `Hi ${escape(recipientName)}`
        : 'Hi there';
      const expirationMessage = expirationDate
        ? `**Important:** This reservation expires on **${formatExpirationDate(
            expirationDate,
          )}**. Sign in to your Namefi account to claim it!`
        : '';

      const messageMarkdown =
        `${greeting},\n\n` +
        '🔒 **A name has been reserved for you!**\n\n' +
        `A free claim for ${nameText} has been reserved for your account.\n\n` +
        (reason ? `**Reason:** ${escape(reason)}\n\n` : '') +
        expirationMessage;

      return (
        <NamefiEmailContainer title="[Namefi] A name has been reserved for you">
          <ReactMarkdown
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] },
              ],
            ]}
          >
            {messageMarkdown}
          </ReactMarkdown>

          <div
            style={{
              marginTop: '20px',
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#22c55e',
              }}
            >
              🔒 Reservation Details
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {exactDomainName && (
                <div>
                  <strong>Your name:</strong> {toUnicode(exactDomainName)}
                </div>
              )}
              {parentDomain && (
                <div>
                  <strong>Where you can pick a name:</strong>{' '}
                  {toUnicode(parentDomain)}
                </div>
              )}
              {expirationDate && (
                <div>
                  <strong>Expires:</strong>{' '}
                  {formatExpirationDate(expirationDate)}
                </div>
              )}
              {reason && (
                <div>
                  <strong>Purpose:</strong> {reason}
                </div>
              )}
            </div>
          </div>

          <ReactMarkdown
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] },
              ],
            ]}
            components={{
              a: (props) => <Link style={anchor} {...props} />,
            }}
          >
            {'**How to claim your reservation:**\n\n' +
              '1. Sign in to your Namefi account\n' +
              `2. Your reservation will automatically appear in your [My Free Mints](${NamefiEmailLinks.freeMints({ poweredByNamefiDomain })})\n` +
              '3. Use your free claim to register your domain\n\n' +
              'The domain will be available for you to claim once you sign in.'}
          </ReactMarkdown>

          <Button
            style={button}
            href={NamefiEmailLinks.freeMints({ poweredByNamefiDomain })}
          >
            Go to Dashboard
          </Button>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p>
              This email was sent to {recipientEmail}. This reservation was made
              internally by the Namefi team.
            </p>
          </div>

          <GoToDashboard />
        </NamefiEmailContainer>
      );
    },
    {
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      pbnDomain: 'company.com',
      exactDomainName: 'john.company.com',
      reason: 'Reserved for internal team member',
      expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  );

export default InternalReservationNotification;

const formatExpirationDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};
