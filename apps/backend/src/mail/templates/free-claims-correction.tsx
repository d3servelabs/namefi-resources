// Free claims correction/apology email template

import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import rehypeExternalLinks from 'rehype-external-links';
import ReactMarkdown from 'react-markdown';
import { Button } from '@react-email/components';
import { button } from '../styles';
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

    return (
      <NamefiEmailContainer
        title={`[Namefi] Correction - You have ${totalClaimsGranted} free ${pluralize('claim', totalClaimsGranted, false)} for ${correctParentDomain}`}
      >
        {/* Apology Section */}
        <div
          style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: '12px',
          }}
        >
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#dc2626',
              textAlign: 'center',
            }}
          >
            🙏 Our Sincere Apologies
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
        </div>

        {/* Corrected Claims Summary */}
        <div
          style={{
            marginTop: '20px',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '2px solid #22c55e',
            borderRadius: '12px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#16a34a',
              textAlign: 'center',
            }}
          >
            ✅ You have {totalClaimsGranted} free{' '}
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
        </div>

        {/* Detailed Claims Table */}
        {claimsGranted.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#374151',
              }}
            >
              📋 Detailed Breakdown of Your Claims
            </h3>
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
                {claimsGranted.map((claim) => (
                  <tr key={`${claim.source}-${claim.sourceId}`}>
                    <td style={{ ...localStyles.td, textAlign: 'left' }}>
                      <span
                        style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '6px 12px',
                          borderRadius: '6px',
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
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {claim.reason.replace(
                          new RegExp(incorrectParentDomain, 'g'),
                          correctParentDomain,
                        )}
                      </div>
                      {claim.domainName && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            marginTop: '4px',
                          }}
                        >
                          Domain:{' '}
                          {claim.domainName.replace(
                            incorrectParentDomain,
                            correctParentDomain,
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ ...localStyles.td, textAlign: 'left' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
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
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <div
          style={{
            marginTop: '32px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
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

const localStyles = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  td: {
    border: '1px #e5e7eb solid',
    padding: '16px 12px',
    textAlign: 'center',
    verticalAlign: 'top',
    backgroundColor: '#ffffff',
  },
  th: {
    border: '1px #d1d5db solid',
    padding: '16px 12px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#374151',
  },
} as const;
