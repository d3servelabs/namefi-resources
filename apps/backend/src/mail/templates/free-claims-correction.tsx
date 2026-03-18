// Free claims correction/apology email template

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
import { Button } from '@react-email/components';
import {
  astraTheme,
  button,
  mutedPanel,
  panelText,
  panelTitle,
  sectionHeading,
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

export type FreeClaimsCorrectionProps = {
  recipientName: string;
  campaignKey: string;
  campaignName: string;
  incorrectParentDomain: string; // The wrong domain that was sent
  correctParentDomain: string; // The correct domain
  claimsGranted: Array<{
    source: 'UPVOTE' | 'SHARE' | 'UNKNOWN';
    sourceId: string;
    domainName?: string;
    reason: string;
    expirationDate?: string;
  }>;
  totalClaimsGranted: number;
};

export const FreeClaimsCorrection = buildTemplate<FreeClaimsCorrectionProps>(
  (props) => {
    const {
      recipientName,
      campaignName,
      incorrectParentDomain,
      correctParentDomain,
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

    const apologyMarkdown =
      `Hi ${recipientName ?? ''},\n\n` +
      'We sincerely apologize for the confusion in our previous email! There was an error in the domain information we sent you.\n\n' +
      '**🚨 CORRECTION NEEDED:**\n\n' +
      `* ❌ Previous email incorrectly stated: ${incorrectParentDomain}\n` +
      `* ✅ Correct domain: ${correctParentDomain}\n`;

    const claimSummary = React.useMemo(() => {
      const summary: string[] = [];
      if (upvoteClaims.length > 0) {
        summary.push(
          `- ${upvoteClaims.length} ${pluralize('claim', upvoteClaims.length)} for upvoting domains`,
        );
      }
      if (shareClaims.length > 0) {
        summary.push(
          `- ${shareClaims.length} ${pluralize('claim', shareClaims.length)} for sharing tweets about ${correctParentDomain}`,
        );
      }
      return summary.join('\n');
    }, [upvoteClaims, shareClaims, correctParentDomain]);

    const expirationDate = claimsGranted[0]?.expirationDate;
    const expirationMarkdown = expirationDate
      ? `\n\n**⏰ Important:** Your free ${pluralize('claim', totalClaimsGranted)} will expire on **${new Date(
          expirationDate,
        ).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}**. Make sure to use ${totalClaimsGranted === 1 ? 'it' : 'them'} before then!`
      : '';
    const getSourceTagStyle = (
      source: FreeClaimsCorrectionProps['claimsGranted'][number]['source'],
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
        title={`[Namefi] Correction - You have ${totalClaimsGranted} free ${pluralize('claim', totalClaimsGranted, false)} for ${correctParentDomain}`}
      >
        {/* Apology Section */}
        <Card variant="error" style={{ marginBottom: '24px' }}>
          <h2
            style={{
              ...panelTitle,
              color: astraTheme.errorInk,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            Our Sincere Apologies
          </h2>
          <ReactMarkdown
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] },
              ],
            ]}
          >
            {apologyMarkdown}
          </ReactMarkdown>
        </Card>

        {/* Corrected Claims Summary */}
        <Card variant="success">
          <h3
            style={{
              ...panelTitle,
              color: astraTheme.successInk,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            You have {totalClaimsGranted} free{' '}
            {pluralize('claim', totalClaimsGranted, false)}
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

        {/* Detailed Claims Table */}
        {claimsGranted.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={sectionHeading}>Detailed Breakdown of Your Claims</h3>
            <EmailTable>
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
                      <div>
                        {claim.reason.replace(
                          new RegExp(incorrectParentDomain, 'g'),
                          correctParentDomain,
                        )}
                      </div>
                      {claim.domainName && (
                        <div style={tableCellSubtext}>
                          Domain:{' '}
                          {claim.domainName.replace(
                            incorrectParentDomain,
                            correctParentDomain,
                          )}
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
          </div>
        )}

        {/* How to use section */}
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
          ]}
        >
          {`**How to use your free ${pluralize('claim', totalClaimsGranted)} for ${correctParentDomain}:**\n\n` +
            `1. Go to your dashboard and look for the "Free Claims" section.\n` +
            `2. Choose any available **${correctParentDomain}** domain.\n` +
            '3. Complete the registration process at no cost!\n' +
            expirationMarkdown}
        </ReactMarkdown>

        {/* Action Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button
            className="namefi-button-mobile"
            style={{
              ...button,
            }}
            href={NamefiEmailLinks.freeMints({
              poweredByNamefiDomain,
            })}
          >
            Claim Your {correctParentDomain} Domains
          </Button>
        </div>

        {/* Final apology */}
        <div style={{ ...mutedPanel, textAlign: 'center' }}>
          <ReactMarkdown
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] },
              ],
            ]}
          >
            {`Again, we sincerely apologize for any confusion caused by our error. Your free claims are absolutely still valid for **${correctParentDomain}** domains!\n\nIf you have any questions, please don't hesitate to reach out to our support team.`}
          </ReactMarkdown>
        </div>
        <div style={{ ...panelText, marginTop: '10px' }}>
          You can always reach us at support@namefi.io if you need help with
          claim redemption.
        </div>

        <GoToDashboard />
      </NamefiEmailContainer>
    );
  },
  {
    recipientName: 'Alice',
    campaignKey: '0xcity-promo-2025',
    campaignName: '0x.city 2025 Promotion',
    incorrectParentDomain: '0xcity.com',
    correctParentDomain: '0x.city',
    claimsGranted: [
      {
        source: 'UPVOTE',
        sourceId: 'upvote-123',
        domainName: 'example.0x.city',
        reason: 'Upvoted domain in Namefi Hunt',
        expirationDate: new Date('2025-09-08T00:00:00.000Z').toISOString(),
      },
      {
        source: 'SHARE',
        sourceId: 'share-456',
        reason: 'Shared tweet about 0x.city',
        expirationDate: new Date('2025-09-08T00:00:00.000Z').toISOString(),
      },
    ],
    totalClaimsGranted: 2,
  },
);

export default FreeClaimsCorrection;
