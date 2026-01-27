// Free claims notification email template for 0x.city campaign

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
import pluralize from 'pluralize';

export type FreeClaimsNotificationProps = {
  recipientName: string;
  campaignKey: string;
  campaignName: string;
  parentDomain: string;
  claimsGranted: Array<{
    source: 'UPVOTE' | 'SHARE' | 'UNKNOWN';
    sourceId: string;
    domainName?: string;
    reason: string;
    expirationDate?: string;
  }>;
  totalClaimsGranted: number;
};

export const FreeClaimsNotification =
  buildTemplate<FreeClaimsNotificationProps>(
    (props) => {
      const {
        recipientName,
        campaignName,
        parentDomain,
        claimsGranted,
        totalClaimsGranted,
      } = props;

      const poweredByNamefiDomain = usePoweredByNamefiDomain();

      const upvoteClaims = claimsGranted.filter(
        (claim) => claim.source === 'UPVOTE',
      );
      const shareClaims = claimsGranted.filter(
        (claim) => claim.source === 'SHARE',
      );

      const messageMarkdown =
        `Hi ${recipientName ?? 'there'},\n\n` +
        `You've got something special waiting for you! We're excited to let you know that you've earned **${pluralize('free claim', totalClaimsGranted, true)}** for **${parentDomain}** domains through our "**${campaignName}**" campaign.\n\n` +
        `**Here's what you've unlocked:**`;

      const claimSummary = React.useMemo(() => {
        const summary: string[] = [];
        if (upvoteClaims.length > 0) {
          summary.push(
            `- ${upvoteClaims.length} ${pluralize('claim', upvoteClaims.length)} for upvoting domains`,
          );
        }
        if (shareClaims.length > 0) {
          summary.push(
            `- ${shareClaims.length} ${pluralize('claim', shareClaims.length)} for sharing tweets about ${parentDomain}`,
          );
        }
        return summary.join('\n');
      }, [upvoteClaims, shareClaims, parentDomain]);

      const expirationDate = claimsGranted[0]?.expirationDate;
      const expirationMarkdown = expirationDate
        ? `\n\n**Important:** Your free ${pluralize('claim', totalClaimsGranted)} will expire on **${new Date(
            expirationDate,
          ).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}**. Make sure to use ${totalClaimsGranted === 1 ? 'it' : 'them'} before then!`
        : '';

      return (
        <NamefiEmailContainer
          title={`[Namefi] You've been granted ${totalClaimsGranted} free claims for ${parentDomain}`}
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
              🎉 Claims Granted
            </h3>
            <ReactMarkdown
              rehypePlugins={[
                [
                  rehypeExternalLinks,
                  { target: '_blank', rel: ['noopener', 'noreferrer'] },
                ],
              ]}
            >
              {claimSummary}
            </ReactMarkdown>
          </div>

          {claimsGranted.length > 0 && (
            <table style={localStyles.table}>
              <thead>
                <tr>
                  <th style={{ ...localStyles.th, textAlign: 'left' }}>
                    Source
                  </th>
                  <th style={{ ...localStyles.th, textAlign: 'left' }}>
                    Details
                  </th>
                  <th style={{ ...localStyles.th, textAlign: 'left' }}>
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody>
                {claimsGranted.map((claim, index) => (
                  <tr key={`${claim.source}-${claim.sourceId}`}>
                    <td style={{ ...localStyles.td, textAlign: 'left' }}>
                      <span
                        style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {claim.source === 'UPVOTE'
                          ? 'UPVOTE'
                          : claim.source === 'SHARE'
                            ? 'LINK SHARE'
                            : 'GIFT'}
                      </span>
                    </td>
                    <td style={{ ...localStyles.td, textAlign: 'left' }}>
                      <div style={{ fontSize: '14px' }}>{claim.reason}</div>
                      {claim.domainName && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            marginTop: '4px',
                          }}
                        >
                          Domain: {claim.domainName}
                        </div>
                      )}
                    </td>
                    <td style={{ ...localStyles.td, textAlign: 'left' }}>
                      {claim.expirationDate
                        ? new Date(claim.expirationDate).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
            {`**How to use your free ${pluralize('claim', totalClaimsGranted)}:**\n\n` +
              `1. Go to your dashboard and look for the ["My Free Mints"](${NamefiEmailLinks.freeMints({ poweredByNamefiDomain })}) In  the side menu\n` +
              `2. Choose any available **${parentDomain}** domain\n` +
              '3. Complete the registration process at no cost!\n' +
              expirationMarkdown}
          </ReactMarkdown>

          <Button
            style={button}
            href={NamefiEmailLinks.freeMints({
              poweredByNamefiDomain,
            })}
          >
            Claim Your Free Domains
          </Button>

          <GoToDashboard />
        </NamefiEmailContainer>
      );
    },
    {
      recipientName: 'Alice',
      campaignKey: '0xct-promo-2025',
      campaignName: '0x.city 2025 Promotion',
      parentDomain: '0x.city',
      claimsGranted: [
        {
          source: 'UPVOTE',
          sourceId: 'upvote-123',
          domainName: 'example.0x.city',
          reason: 'Upvoted domain in Namefi Hunt (0x.city)',
        },
        {
          source: 'SHARE',
          sourceId: 'share-456',
          reason: 'Shared tweet about 0x.city',
          expirationDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ],
      totalClaimsGranted: 2,
    },
  );

// biome-ignore lint/style/noDefaultExport: required for react-email
export default FreeClaimsNotification;

const localStyles = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '20px',
    marginBottom: '20px',
  },
  td: {
    border: '1px #D9D9D9 solid',
    padding: '12px',
    textAlign: 'center',
    verticalAlign: 'top',
  },
  th: {
    border: '1px #D9D9D9 solid',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    fontWeight: 'bold',
  },
} as const;
