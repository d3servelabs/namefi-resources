import { freeClaimsTable, db } from '@namefi-astra/db';
import { and, eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createLogger } from '#lib/logger';
import React from 'react';
import { render } from '@react-email/components';
import { sendMail } from '../../mail/mail-client';
import { FreeClaimsCorrection } from '../../mail/templates/free-claims-correction';
import { getUserEmailOrThrow } from './notify.activities';

const logger = createLogger({ context: 'free-claims-correction-activities' });

export interface GetClaimsForCampaignInput {
  campaignKey: string;
  parentDomain: NamefiNormalizedDomain;
}

export async function getClaimsForCampaign(
  input: GetClaimsForCampaignInput,
): Promise<(typeof freeClaimsTable.$inferSelect)[]> {
  const { campaignKey, parentDomain } = input;

  logger.info('Getting claims for campaign correction', {
    campaignKey,
    parentDomain,
  });

  const claims = await db
    .select()
    .from(freeClaimsTable)
    .where(
      and(
        eq(freeClaimsTable.groupOrCampaignKey, campaignKey),
        eq(freeClaimsTable.parentDomain, parentDomain),
      ),
    );

  logger.info('Claims retrieved for correction', {
    campaignKey,
    parentDomain,
    count: claims.length,
  });

  return claims;
}

export interface SendFreeClaimsCorrectionEmailInput {
  userId: string;
  campaignKey: string;
  campaignName: string;
  incorrectParentDomain: NamefiNormalizedDomain;
  correctParentDomain: NamefiNormalizedDomain;
  claimsGranted: Array<{
    source: 'UPVOTE' | 'SHARE' | 'UNKNOWN';
    sourceId: string;
    domainName?: string;
    reason: string;
    expirationDate?: string;
  }>;
  totalClaimsGranted: number;
}

export async function sendFreeClaimsCorrectionEmail(
  input: SendFreeClaimsCorrectionEmailInput,
): Promise<void> {
  const {
    userId,
    campaignKey,
    campaignName,
    incorrectParentDomain,
    correctParentDomain,
    claimsGranted,
    totalClaimsGranted,
  } = input;

  logger.info('Sending free claims correction email', {
    userId,
    campaignKey,
    incorrectParentDomain,
    correctParentDomain,
    totalClaimsGranted,
  });

  try {
    // Get user email
    const userEmail = await getUserEmailOrThrow(userId);

    // Get user name from contacts (use email as fallback)
    const userContact = await db.query.userContactsTable.findFirst({
      where: (contacts, { eq }) => eq(contacts.userId, userId),
    });

    const recipientName =
      userContact?.firstName && userContact?.lastName
        ? `${userContact.firstName} ${userContact.lastName}`
        : userEmail.split('@')[0];

    // Render the email template
    const emailContent = React.createElement(FreeClaimsCorrection, {
      recipientName,
      campaignKey,
      campaignName,
      incorrectParentDomain,
      correctParentDomain,
      claimsGranted: claimsGranted.map((claim) => ({
        ...claim,
        expirationDate: claim.expirationDate
          ? new Date(claim.expirationDate).toISOString()
          : undefined,
      })),
      totalClaimsGranted,
    });

    const html = await render(emailContent);
    const plainText = await render(emailContent, { plainText: true });

    // Send the email
    await sendMail({
      to: [userEmail],
      bcc: [
        'customer-email-archive@d3serve.xyz',
        'sami@d3serve.xyz',
        'zzn@d3serve.xyz',
      ],
      subject: `[Namefi] CORRECTION - Free Claims for ${correctParentDomain} - ${campaignName}`,
      content: {
        html,
        plain: plainText,
      },
    });

    logger.info('Free claims correction email sent successfully', {
      userId,
      userEmail,
      campaignKey,
    });
  } catch (error) {
    logger.error('Failed to send free claims correction email', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
