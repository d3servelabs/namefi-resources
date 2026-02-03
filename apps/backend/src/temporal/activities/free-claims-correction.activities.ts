import { freeClaimsTable, db } from '@namefi-astra/db';
import { and, eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createLogger } from '#lib/logger';
import React from 'react';
import { render } from '@react-email/components';
import { sendMail } from '../../mail/mail-client';
import { FreeClaimsCorrection } from '../../mail/templates/free-claims-correction';
import pluralize from 'pluralize';
import { privyClient } from '../../trpc/utils';
import {
  privyStorageToPrivyCustomMetadata,
  type PrivyCustomMetadata,
} from '../../trpc/types';

const logger = createLogger({ context: 'free-claims-correction-activities' });

export interface GetClaimsForCampaignInput {
  campaignKey: string;
  parentDomain: NamefiNormalizedDomain;
}

export async function getClaimsForCampaign(
  input: GetClaimsForCampaignInput,
): Promise<(typeof freeClaimsTable.$inferSelect)[]> {
  const { campaignKey, parentDomain } = input;

  logger.debug('Getting claims for campaign correction', {
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

  logger.debug('Claims retrieved for correction', {
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

  logger.debug('Sending free claims correction email', {
    userId,
    campaignKey,
    incorrectParentDomain,
    correctParentDomain,
    totalClaimsGranted,
  });

  try {
    // Get user email
    const user = await db.query.usersTable.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: {
        privyUserId: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    if (!user.privyUserId) {
      throw new Error(`User ${userId} missing privyUserId`);
    }
    const privyUser = await privyClient.getUserById(user.privyUserId);
    const userEmail = privyUser.email?.address;
    if (!userEmail) {
      throw new Error('User has no email');
    }
    const parsedMetadata = privyStorageToPrivyCustomMetadata.safeParse(
      privyUser.customMetadata,
    );

    let recipientName: string = userEmail.split('@')[0];
    if (parsedMetadata.success) {
      const metadata: PrivyCustomMetadata = parsedMetadata.data;
      if (metadata.fullName) {
        recipientName = metadata.fullName;
      }
    }

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
      bcc: ['customer-email-archive@d3serve.xyz', 'dev-team@d3serve.xyz'],
      subject: `[Namefi] Correction - You have ${totalClaimsGranted} free ${pluralize('claim', totalClaimsGranted, false)} for ${correctParentDomain}`,
      content: {
        html,
        plain: plainText,
      },
    });

    logger.debug('Free claims correction email sent successfully', {
      userId,
      email: userEmail,
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
