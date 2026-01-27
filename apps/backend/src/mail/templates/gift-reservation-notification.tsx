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
import rehypeSanitize from 'rehype-sanitize';

export type GiftReservationNotificationProps = {
  recipientName?: string;
  recipientEmail: string;
  gifterName: string;
  pbnDomain: string;
  exactDomainName?: string;
  parentDomain?: string;
  reason?: string;
  personalMessage?: string;
  // Gift claim expiration (free-claim). When present, informs the recipient when the gift expires
  freeClaimExpirationDate?: string | null | undefined;
  // Reservation hold expiration (only when the gift is also reserved/held)
  reservedExpirationDate?: string | null | undefined;
  // Explicitly indicate if this is a gift (vs. reserved-only). If omitted, inferred from freeClaimExpirationDate
  isGift?: boolean;
};

export const GiftReservationNotification =
  buildTemplate<GiftReservationNotificationProps>(
    (props) => {
      const {
        recipientName,
        recipientEmail,
        gifterName,
        pbnDomain,
        exactDomainName,
        parentDomain,
        reason,
        personalMessage,
        freeClaimExpirationDate,
        reservedExpirationDate,
        isGift,
      } = props;

      const poweredByNamefiDomain = usePoweredByNamefiDomain();

      const nameText = exactDomainName
        ? `**${toUnicode(exactDomainName)}**`
        : parentDomain
          ? `a name you can choose from **${toUnicode(parentDomain)}**`
          : 'a name';

      const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there';
      const gift = isGift ?? Boolean(freeClaimExpirationDate);
      const reserved = Boolean(reservedExpirationDate && exactDomainName);
      const expirationMessage = gift
        ? freeClaimExpirationDate
          ? `**Important:** This gift expires on **${formatExpirationDate(
              freeClaimExpirationDate,
            )}**. Simply sign in to your Namefi account to claim it!`
          : ''
        : reservedExpirationDate
          ? `**Important:** This reservation expires on **${formatExpirationDate(
              reservedExpirationDate,
            )}**. Sign in to your Namefi account to claim it!`
          : '';

      const reservedMessage =
        gift && reserved
          ? `\n\n🔒 We've also reserved **${toUnicode(
              exactDomainName as string,
            )}** for you until **${formatExpirationDate(
              reservedExpirationDate as string,
            )}** so no one else can take it before you claim.`
          : '';

      const headline = gift
        ? "**You've received a gift!**"
        : '**A name has been reserved just for you!**';

      const intro = gift
        ? `**${gifterName}** wanted you to have something special - a free domain for ${nameText}. How thoughtful!`
        : `Great news! A free claim for ${nameText} has been set aside especially for you.`;

      const messageMarkdown =
        `${greeting},\n\n` +
        `${headline}\n\n` +
        `${intro}\n\n` +
        (reason ? `**Reason:** ${reason}\n\n` : '') +
        (gift && personalMessage
          ? `**Personal message from ${gifterName}:**\n> ${personalMessage}\n\n`
          : '') +
        expirationMessage +
        reservedMessage;

      return (
        <NamefiEmailContainer
          title={
            gift
              ? `[Namefi] ${gifterName} has gifted you a free domain!`
              : `[Namefi] A name has been reserved for you on ${poweredByNamefiDomain || pbnDomain}`
          }
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
              {gift ? '🎁 Gift Details' : '🔒 Reservation Details'}
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {gift && (
                <div>
                  <strong>From:</strong> {gifterName}
                </div>
              )}
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
              {freeClaimExpirationDate && (
                <div>
                  <strong>Expires:</strong>{' '}
                  {formatExpirationDate(freeClaimExpirationDate)}
                </div>
              )}
              {reservedExpirationDate && (
                <div>
                  <strong>Reservation held until:</strong>{' '}
                  {formatExpirationDate(reservedExpirationDate)}
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
              [rehypeSanitize],
            ]}
            components={{
              a: (props) => <Link style={anchor} {...props} />,
            }}
          >
            {`${gift ? '**How to claim your gift:**' : '**How to claim your reserved name:**'}\n\n` +
              `1. Sign in to your Namefi account (or create one if you don't have one)\n` +
              `2. Your ${gift ? 'gift' : 'reservation'} will automatically appear in your [My Free Mints](${NamefiEmailLinks.freeMints({ poweredByNamefiDomain })})\n` +
              '3. Use your free claim to register your domain\n\n' +
              `That's it! No need to click any buttons - it will be waiting for you when you sign in.`}
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
      freeClaimExpirationDate: new Date(
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
