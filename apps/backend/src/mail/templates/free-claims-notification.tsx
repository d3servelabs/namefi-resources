// Free claims notification email template for 0x.city campaign

// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { Card } from '../components/card';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button, Link } from '@react-email/components';
import {
  astraTheme,
  anchor,
  button,
  panelText,
  panelTitle,
  tag,
  table,
  tableCell,
  tableCellSubtext,
  tableHeaderCell,
  tableWrap,
} from '../styles';
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

      const safeRecipientName =
        recipientName && recipientName.trim().length > 0
          ? recipientName
          : 'there';

      const upvoteClaims = claimsGranted.filter(
        (claim) => claim.source === 'UPVOTE',
      );
      const shareClaims = claimsGranted.filter(
        (claim) => claim.source === 'SHARE',
      );

      const messageMarkdown =
        `Hi ${safeRecipientName},\n\n` +
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
      const getSourceTagStyle = (
        source: FreeClaimsNotificationProps['claimsGranted'][number]['source'],
      ) => {
        if (source === 'UPVOTE') {
          return {
            ...tag,
            backgroundColor: astraTheme.successBackground,
            borderColor: astraTheme.successBorder,
            color: astraTheme.successInk,
          };
        }
        if (source === 'SHARE') {
          return {
            ...tag,
            backgroundColor: astraTheme.infoBackground,
            borderColor: astraTheme.infoBorder,
            color: astraTheme.infoInk,
          };
        }
        return tag;
      };

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

          <Card variant="info">
            <h3 style={{ ...panelTitle, color: astraTheme.infoInk }}>
              Claims Granted
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
          </Card>

          {claimsGranted.length > 0 && (
            <EmailTable wrapStyle={tableWrap}>
              <thead>
                <EmailTableRow>
                  <EmailTableHeaderCell>Source</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Details</EmailTableHeaderCell>
                  <EmailTableHeaderCell>Expires</EmailTableHeaderCell>
                </EmailTableRow>
              </thead>
              <tbody>
                {claimsGranted.map((claim) => (
                  <EmailTableRow key={`${claim.source}-${claim.sourceId}`}>
                    <EmailTableCell label="Source" style={tableCell}>
                      <span style={getSourceTagStyle(claim.source)}>
                        {claim.source === 'UPVOTE'
                          ? 'UPVOTE'
                          : claim.source === 'SHARE'
                            ? 'LINK SHARE'
                            : 'GIFT'}
                      </span>
                    </EmailTableCell>
                    <EmailTableCell label="Details" style={tableCell}>
                      <div>{claim.reason}</div>
                      {claim.domainName && (
                        <div style={tableCellSubtext}>
                          Domain: {claim.domainName}
                        </div>
                      )}
                    </EmailTableCell>
                    <EmailTableCell label="Expires" style={tableCell}>
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
                    </EmailTableCell>
                  </EmailTableRow>
                ))}
              </tbody>
            </EmailTable>
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
            className="namefi-button-mobile"
            style={button}
            href={NamefiEmailLinks.freeMints({
              poweredByNamefiDomain,
            })}
          >
            Claim Your Free Domains
          </Button>
          <div style={{ ...panelText, marginTop: '12px' }}>
            Your available claims are visible any time in your dashboard under
            free mints.
          </div>

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
