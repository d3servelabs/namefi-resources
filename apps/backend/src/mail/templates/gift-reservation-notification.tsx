// Gift reservation notification email template

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

export type GiftReservationNotificationProps = {
  recipientName?: string;
  recipientEmail: string;
  gifterName: string;
  pbnDomain: string;
  exactDomainName?: string;
  parentDomain?: string;
  reason?: string;
  personalMessage?: string;
  expirationDate?: string | null | undefined;
};

export const GiftReservationNotification =
  buildTemplate<GiftReservationNotificationProps>(
    (props) => {
      const {
        recipientName,
        recipientEmail,
        gifterName,
        exactDomainName,
        parentDomain,
        reason,
        personalMessage,
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
        ? `**Important:** This gift expires on **${formatExpirationDate(
            expirationDate,
          )}**. Simply sign in to your Namefi account to claim it!`
        : '';

      const messageMarkdown =
        `${greeting},\n\n` +
        `🎉 **You've received a gift!**\n\n` +
        `**${escape(gifterName)}** has gifted you a free claim for ${nameText}.\n\n` +
        (reason ? `**Reason:** ${escape(reason)}\n\n` : '') +
        (personalMessage
          ? `**Personal message from ${escape(gifterName)}:**\n> ${escape(personalMessage)}\n\n`
          : '') +
        expirationMessage;

      return (
        <NamefiEmailContainer
          title={`[Namefi] ${gifterName} has gifted you a free name claim!`}
        >
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
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#0ea5e9',
              }}
            >
              🎁 Gift Details
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <div>
                <strong>From:</strong> {gifterName}
              </div>
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
            {'**How to claim your gift:**\n\n' +
              `1. Sign in to your Namefi account (or create one if you don't have one)\n` +
              `2. Your gift will automatically appear in your [My Free Mints](${NamefiEmailLinks.freeMints({ poweredByNamefiDomain })})\n` +
              '3. Use your free claim to register your domain\n\n' +
              `That's it! No need to click any buttons - your gift will be waiting for you when you sign in.`}
          </ReactMarkdown>

          <Button
            style={button}
            href={NamefiEmailLinks.freeMints({ poweredByNamefiDomain })}
          >
            Go to Dashboard
          </Button>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p>
              This email was sent to {recipientEmail}. If you did not expect
              this gift, you can safely ignore this email.
            </p>
          </div>

          <GoToDashboard />
        </NamefiEmailContainer>
      );
    },
    {
      recipientName: 'Alice',
      recipientEmail: 'alice@example.com',
      gifterName: 'Bob Smith',
      pbnDomain: 'example.com',
      exactDomainName: 'alice.example.com',
      reason: 'Welcome gift for joining our community',
      personalMessage:
        'Welcome to our community! I hope you enjoy using this domain.',
      expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  );

export default GiftReservationNotification;

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
