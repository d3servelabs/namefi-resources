/**
 * Temporal activities for PBN Issuance Reservations
 * Replaces gift-free-claims.activities.ts with unified reservation system
 */
import {
  db,
  $withTransaction,
  type PbnIssuanceReservationInsert,
  type FreeClaimInsert,
} from '@namefi-astra/db';
import {
  pbnIssuanceReservationsTable,
  freeClaimsTable,
  poweredbyNamefiDomainsTable,
  usersTable,
  type PbnIssuanceReservationSelect,
} from '@namefi-astra/db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import { sendMail } from '../../mail/mail-client';
import { render } from '@react-email/components';
import React from 'react';
import { GiftReservationNotification } from '../../mail/templates/gift-reservation-notification';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { z } from 'zod';
import { privyStorageToPrivyCustomMetadata } from '../../trpc/types';
import { privyClient } from '../../trpc/utils';
import { isNil, isNotNil } from 'ramda';

const logger = createLogger({
  context: 'pbn-issuance-reservations-activities',
});

// Input/Output Types
export interface CreateReservationInput {
  pbnDomain: NamefiNormalizedDomain;
  recipientEmail?: string; // required when issueFreeClaim = true
  exactDomainName?: NamefiNormalizedDomain;
  parentDomain?: NamefiNormalizedDomain;
  reason?: string;
  // behavior flags
  issueFreeClaim?: boolean; // default false
  reserveHold?: boolean; // default true
  // expirations
  reservationExpirationDate?: Date | null; // controls availability; nullable means never expires when reserveHold=true
  freeClaimExpirationDate?: Date | null; // applies only if issueFreeClaim=true
  // creator and messaging
  creatorId: string;
  personalMessage?: string;
  // notify
  sendEmail?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateReservationOutput {
  reservationId: string;
  emailSent: boolean;
}

export interface ProcessReservationsInput {
  userId: string;
  userEmail: string;
}

export interface ProcessReservationsOutput {
  reservationsProcessed: number;
  freeClaimsCreated: number;
}

export interface GetReservationsByCreatorInput {
  creatorId: string;
  status?: 'CREATED' | 'CANCELLED';
  issueFreeClaim?: boolean;
}

// Bulk create types
export interface BulkReservationItem {
  recipientEmail: string;
  exactDomainName?: NamefiNormalizedDomain;
  parentDomain?: NamefiNormalizedDomain;
  reason?: string;
  personalMessage?: string;
  issueFreeClaim?: boolean; // defaults to true for gifting
  reserveHold?: boolean; // default true for exact, false for parent
  reservationExpirationDate?: Date | null;
  freeClaimExpirationDate?: Date | null;
}

export interface CreateReservationsBulkInput {
  pbnDomain: NamefiNormalizedDomain;
  creatorId: string;
  items: BulkReservationItem[];
  sendEmail?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateReservationsBulkOutput {
  createdCount: number;
  emailSentCount: number;
  failed: Array<{ index: number; error: string }>;
}

/**
 * Creates a new reservation (gift or internal)
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationOutput> {
  const {
    pbnDomain,
    recipientEmail,
    exactDomainName,
    parentDomain,
    reason,
    issueFreeClaim = false,
    reserveHold = true,
    reservationExpirationDate = null,
    freeClaimExpirationDate = null,
    creatorId,
    personalMessage,
    sendEmail = true,
    metadata = {},
  } = input;

  logger.info(
    { pbnDomain, recipientEmail, issueFreeClaim, reserveHold },
    'Creating reservation',
  );

  if (!exactDomainName && !parentDomain) {
    throw new Error('Either exactDomainName or parentDomain is required.');
  }
  if (issueFreeClaim && !recipientEmail) {
    throw new Error('recipientEmail is required when issueFreeClaim = true');
  }
  if (reserveHold && (isNil(exactDomainName) || isNotNil(parentDomain))) {
    throw new Error(
      'reserveHold requires exactDomainName (parentDomain not allowed).',
    );
  }

  const normalizedRecipientEmail = recipientEmail
    ? z.string().email().parse(recipientEmail.trim().toLowerCase())
    : undefined;

  // Validate PBN domain ownership (by creator)
  if (creatorId) {
    const pbnOwnership = await db
      .select()
      .from(poweredbyNamefiDomainsTable)
      .where(
        and(
          eq(poweredbyNamefiDomainsTable.normalizedDomainName, pbnDomain),
          eq(poweredbyNamefiDomainsTable.ownerId, creatorId),
        ),
      )
      .limit(1);

    if (pbnOwnership.length === 0) {
      throw new Error(`User ${creatorId} does not own PBN domain ${pbnDomain}`);
    }
  }

  // Get creator info (for notifications)
  let creatorName = 'Namefi Team';
  if (creatorId) {
    const gifter = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, creatorId),
    });

    if (!gifter) {
      throw new Error(`Creator ${creatorId} not found`);
    }
    const privyUser = await privyClient.getUserById(gifter.privyUserId);
    if (!privyUser) {
      throw new Error(`Creator ${creatorId} not found`);
    }
    const privyUserCustomData = privyStorageToPrivyCustomMetadata.parse(
      privyUser.customMetadata,
    );
    creatorName = privyUserCustomData.fullName || 'A Namefi user';
  }

  // Check for existing active free-claim reservation for the same exactDomainName
  const existingReservation = exactDomainName
    ? await db
        .select()
        .from(pbnIssuanceReservationsTable)
        .where(
          and(
            eq(pbnIssuanceReservationsTable.exactDomainName, exactDomainName),
            eq(pbnIssuanceReservationsTable.status, 'CREATED'),
            sql`(${pbnIssuanceReservationsTable.freeClaimExpirationDate} IS NULL OR ${pbnIssuanceReservationsTable.freeClaimExpirationDate} > NOW())`,
          ),
        )
        .limit(1)
    : [];

  if (existingReservation.length > 0) {
    throw new Error(
      `Active reservation already exists for ${recipientEmail} and domain ${exactDomainName || parentDomain}`,
    );
  }

  // Create reservation
  const sourceVal: 'GIFT' | 'INTERNAL_RESERVATION' = issueFreeClaim
    ? 'GIFT'
    : 'INTERNAL_RESERVATION';
  const reservationMetadata = {
    ...metadata,
    sendEmail,
    source: sourceVal,
    createdBy: creatorId || 'system',
  };

  const [reservation] = await $withTransaction(async (tx) => {
    // Optional: pessimistic lock for conflicting holds on the same (pbnDomain, exactDomainName)
    if (reserveHold && isNotNil(exactDomainName)) {
      await tx.execute(
        sql`SELECT 1 FROM ${pbnIssuanceReservationsTable} WHERE ${pbnIssuanceReservationsTable.pbnDomain} = ${pbnDomain} AND ${pbnIssuanceReservationsTable.exactDomainName} = ${exactDomainName} FOR UPDATE`,
      );
    }

    const inserted = await tx
      .insert(pbnIssuanceReservationsTable)
      .values({
        pbnDomain: pbnDomain as NamefiNormalizedDomain,
        recipientEmail: normalizedRecipientEmail ?? null,
        exactDomainName,
        parentDomain,
        reason,
        issueFreeClaim,
        reserveHold,
        reservationExpirationDate: reservationExpirationDate
          ? new Date(reservationExpirationDate)
          : null,
        freeClaimExpirationDate: freeClaimExpirationDate
          ? new Date(freeClaimExpirationDate)
          : null,
        creatorId,
        personalMessage: issueFreeClaim ? personalMessage : null,
        metadata: reservationMetadata,
      } satisfies PbnIssuanceReservationInsert)
      .returning({ id: pbnIssuanceReservationsTable.id });

    return inserted;
  });

  // Send notification email if requested
  let emailSent = false;
  if (sendEmail && normalizedRecipientEmail) {
    try {
      const giftExpiration = issueFreeClaim ? freeClaimExpirationDate : null;
      const reservedExpiration =
        exactDomainName && reservationExpirationDate
          ? reservationExpirationDate
          : null;
      const emailTemplate = React.createElement(GiftReservationNotification, {
        recipientEmail: normalizedRecipientEmail,
        gifterName: creatorName,
        pbnDomain: pbnDomain as NamefiNormalizedDomain,
        exactDomainName: exactDomainName as NamefiNormalizedDomain,
        parentDomain: parentDomain as NamefiNormalizedDomain,
        reason,
        personalMessage: issueFreeClaim ? personalMessage : undefined,
        ...(giftExpiration
          ? { freeClaimExpirationDate: giftExpiration.toISOString() }
          : {}),
        ...(reservedExpiration
          ? { reservedExpirationDate: reservedExpiration.toISOString() }
          : {}),
        isGift: issueFreeClaim,
        poweredByNamefiDomain: pbnDomain,
      });

      const html = await render(emailTemplate);
      const text = await render(emailTemplate, { plainText: true });

      const subject = issueFreeClaim
        ? `[Namefi] ${creatorName} has gifted you a free domain claim!`
        : `[Namefi] A domain has been reserved for you on ${pbnDomain}`;

      await sendMail({
        from: 'support@namefi.io',
        to: [normalizedRecipientEmail],
        bcc: ['customer-email-archive@d3serve.xyz'],
        subject,
        content: {
          html,
          plain: text,
        },
      });

      emailSent = true;

      // Update metadata to track email sent
      await db
        .update(pbnIssuanceReservationsTable)
        .set({
          metadata: {
            ...reservationMetadata,
            emailSent: true,
            emailSentAt: new Date().toISOString(),
          },
        })
        .where(eq(pbnIssuanceReservationsTable.id, reservation.id));

      logger.info(
        {
          reservationId: reservation.id,
          recipientEmail: normalizedRecipientEmail,
        },
        'Notification email sent successfully',
      );
    } catch (error) {
      logger.error(
        { error, reservationId: reservation.id },
        'Failed to send notification email',
      );
      // Don't throw - reservation was created successfully
    }
  }

  logger.info(
    { reservationId: reservation.id, emailSent },
    'Reservation created successfully',
  );

  return {
    reservationId: reservation.id,
    emailSent,
  };
}

/**
 * Processes pending reservations for a user when they fetch their free claims
 */
export async function processReservationsForUser(
  input: ProcessReservationsInput,
): Promise<ProcessReservationsOutput> {
  const { userId, userEmail } = input;

  logger.info({ userId, userEmail }, 'Processing reservations for user');

  try {
    let freeClaimsCreated = 0;
    try {
      const newFreeClaims = await $withTransaction(async (tx) => {
        const pendingReservationsWithFreeClaim = await db
          .select()
          .from(pbnIssuanceReservationsTable)
          .where(
            and(
              eq(pbnIssuanceReservationsTable.recipientEmail, userEmail),
              eq(pbnIssuanceReservationsTable.status, 'CREATED'),
              isNull(pbnIssuanceReservationsTable.recipientUserId),
              eq(pbnIssuanceReservationsTable.issueFreeClaim, true),
              sql`(${pbnIssuanceReservationsTable.freeClaimExpirationDate} IS NULL OR ${pbnIssuanceReservationsTable.freeClaimExpirationDate} > NOW())`,
              isNull(pbnIssuanceReservationsTable.freeClaimId),
            ),
          )
          .for('update');

        if (pendingReservationsWithFreeClaim.length === 0) {
          return [];
        }

        logger.info(
          {
            userId,
            userEmail,
            reservationCount: pendingReservationsWithFreeClaim.length,
          },
          'Found pending reservations for user',
        );
        const reservation: FreeClaimInsert[] =
          pendingReservationsWithFreeClaim.map(
            (r) =>
              ({
                userId,
                groupOrCampaignKey: `gift-${r.pbnDomain}`,
                reason: r.reason || `Gift from ${r.pbnDomain}`,
                exactDomainName: r.exactDomainName,
                parentDomain: r.parentDomain,
                expirationDate: r.freeClaimExpirationDate,
                metadata: {
                  source: 'GIFT',
                  sourceId: r.id,
                  reservationId: r.id,
                  creatorId: r.creatorId,
                  personalMessage: r.personalMessage,
                  originalMetadata: r.metadata,
                } as any,
              }) satisfies FreeClaimInsert,
          );

        const inserted = await tx
          .insert(freeClaimsTable)
          .values(reservation)
          .returning({
            freeClaimId: freeClaimsTable.id,
            sourceId: sql<string>`${freeClaimsTable.metadata}->>'sourceId'`,
          });

        await tx.execute(
          sql.join(
            inserted.map(({ freeClaimId, sourceId }) => {
              return tx
                .update(pbnIssuanceReservationsTable)
                .set({
                  claimedAt: sql`NOW()`,
                  recipientUserId: userId,
                  freeClaimId,
                })
                .where(eq(pbnIssuanceReservationsTable.id, sourceId))
                .getSQL()
                .inlineParams();
            }),
            sql.raw(';'),
          ),
        );

        return inserted;
      });

      logger.info(
        { userId, freeClaimsCreated: newFreeClaims.length },
        'Successfully converted reservation to free claim',
      );
      freeClaimsCreated += newFreeClaims.length;
    } catch (error) {
      logger.error(
        { error, userId },
        'Failed to convert individual reservation to free claim',
      );
    }

    logger.info(
      {
        userId,
        userEmail,
        freeClaimsCreated,
      },
      'Successfully processed reservations for user',
    );

    return {
      reservationsProcessed: freeClaimsCreated,
      freeClaimsCreated,
    };
  } catch (error) {
    logger.error(
      { error, userId, userEmail },
      'Failed to process reservations for user',
    );
    return { reservationsProcessed: 0, freeClaimsCreated: 0 };
  }
}

// Note: Expiration is handled by filtering queries:
// - Active reservations: WHERE status = 'CREATED' AND expirationDate > NOW()
// - Expired reservations: WHERE status = 'CREATED' AND expirationDate < NOW()
// No background jobs needed - expiration is checked at query time

/**
 * Gets reservations created by a specific user (for PBN owners or admins)
 */
export async function getReservationsByCreator(
  input: GetReservationsByCreatorInput,
): Promise<PbnIssuanceReservationSelect[]> {
  const { creatorId, status, issueFreeClaim } = input;

  const conditions = [eq(pbnIssuanceReservationsTable.creatorId, creatorId)];

  if (status) {
    conditions.push(eq(pbnIssuanceReservationsTable.status, status));
  }

  if (issueFreeClaim !== undefined) {
    conditions.push(
      eq(pbnIssuanceReservationsTable.issueFreeClaim, issueFreeClaim),
    );
  }

  const reservations = await db
    .select()
    .from(pbnIssuanceReservationsTable)
    .where(and(...conditions))
    .orderBy(pbnIssuanceReservationsTable.createdAt);

  return reservations as PbnIssuanceReservationSelect[];
}

/**
 * Cancels a reservation
 */
export async function cancelReservation(
  reservationId: string,
  cancelledBy: string,
): Promise<void> {
  logger.info({ reservationId, cancelledBy }, 'Cancelling reservation');

  const existing = await db
    .select()
    .from(pbnIssuanceReservationsTable)
    .where(eq(pbnIssuanceReservationsTable.id, reservationId))
    .limit(1)
    .for('update');
  if (existing.length === 0) {
    throw new Error(`Reservation ${reservationId} not found`);
  }
  if (existing[0].status !== 'CREATED') {
    throw new Error(`Reservation ${reservationId} is not in CREATED status`);
  }
  if (existing[0].creatorId !== cancelledBy) {
    throw new Error(
      `Reservation ${reservationId} can only be cancelled by the creator`,
    );
  }
  const result = await db
    .update(pbnIssuanceReservationsTable)
    .set({
      status: 'CANCELLED',
      metadata: {
        ...(existing[0].metadata || {}),
        cancelledBy,
        cancelledAt: new Date().toISOString(),
      },
    })
    .where(
      and(
        eq(pbnIssuanceReservationsTable.id, reservationId),
        eq(pbnIssuanceReservationsTable.status, 'CREATED'),
      ),
    )
    .returning({ id: pbnIssuanceReservationsTable.id });

  if (result.length === 0) {
    throw new Error(
      `Reservation ${reservationId} not found or cannot be cancelled`,
    );
  }

  logger.info({ reservationId }, 'Reservation cancelled successfully');
}

/**
 * Bulk create reservations (gift-like or internal) with email sending
 * Inserts each reservation in its own transaction to avoid all-or-nothing failures
 */
export async function createReservationsBulk(
  input: CreateReservationsBulkInput,
): Promise<CreateReservationsBulkOutput> {
  const {
    pbnDomain,
    creatorId,
    items,
    sendEmail = true,
    metadata = {},
  } = input;

  // Validate PBN ownership once
  const pbnOwnership = await db
    .select()
    .from(poweredbyNamefiDomainsTable)
    .where(
      and(
        eq(poweredbyNamefiDomainsTable.normalizedDomainName, pbnDomain),
        eq(poweredbyNamefiDomainsTable.ownerId, creatorId),
      ),
    )
    .limit(1);
  if (pbnOwnership.length === 0) {
    throw new Error(`User ${creatorId} does not own PBN domain ${pbnDomain}`);
  }

  // Creator name for emails
  let creatorName = 'A Namefi user';
  try {
    const gifter = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, creatorId),
    });
    if (gifter) {
      const privyUser = await privyClient.getUserById(gifter.privyUserId);
      const privyUserCustomData = privyUser
        ? privyStorageToPrivyCustomMetadata.parse(privyUser.customMetadata)
        : undefined;
      creatorName = privyUserCustomData?.fullName || creatorName;
    }
  } catch {}

  const failed: Array<{ index: number; error: string }> = [];
  const createdReservations: Array<{
    id: string;
    recipientEmail: string | null;
    exactDomainName?: NamefiNormalizedDomain;
    parentDomain?: NamefiNormalizedDomain;
    issueFreeClaim: boolean;
    reservationExpirationDate: Date | null;
    freeClaimExpirationDate: Date | null;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const normalizedRecipientEmail = item.recipientEmail
        ? z.string().email().parse(item.recipientEmail.trim().toLowerCase())
        : undefined;

      const isExact = !!item.exactDomainName && !item.parentDomain;
      const isParent = !!item.parentDomain && !item.exactDomainName;
      if (!isExact && !isParent) {
        throw new Error('Either exactDomainName or parentDomain is required');
      }
      const issueFreeClaim = item.issueFreeClaim ?? true;
      const reserveHold = item.reserveHold ?? (isExact ? true : false);
      if (reserveHold && !isExact) {
        throw new Error('reserveHold requires an exactDomainName');
      }
      if (issueFreeClaim && !normalizedRecipientEmail) {
        throw new Error(
          'recipientEmail is required when issueFreeClaim = true',
        );
      }

      const sourceVal: 'GIFT' | 'INTERNAL_RESERVATION' = issueFreeClaim
        ? 'GIFT'
        : 'INTERNAL_RESERVATION';
      const reservationMetadata = {
        ...metadata,
        sendEmail,
        source: sourceVal,
        createdBy: creatorId || 'system',
      } as Record<string, any> & {
        source?: 'GIFT' | 'INTERNAL_RESERVATION' | 'ADMIN_GRANT';
      };

      const inserted = await $withTransaction(async (tx) => {
        const rows = await tx
          .insert(pbnIssuanceReservationsTable)
          .values({
            pbnDomain,
            recipientEmail: normalizedRecipientEmail ?? null,
            exactDomainName: item.exactDomainName,
            parentDomain: item.parentDomain,
            reason: item.reason,
            issueFreeClaim,
            reserveHold,
            reservationExpirationDate: item.reservationExpirationDate
              ? new Date(item.reservationExpirationDate)
              : null,
            freeClaimExpirationDate: item.freeClaimExpirationDate
              ? new Date(item.freeClaimExpirationDate)
              : null,
            creatorId,
            personalMessage: issueFreeClaim ? item.personalMessage : null,
            metadata: reservationMetadata,
          } satisfies PbnIssuanceReservationInsert)
          .returning({
            id: pbnIssuanceReservationsTable.id,
            reservationExpirationDate:
              pbnIssuanceReservationsTable.reservationExpirationDate,
            freeClaimExpirationDate:
              pbnIssuanceReservationsTable.freeClaimExpirationDate,
          });
        return rows[0];
      });

      createdReservations.push({
        id: inserted.id,
        recipientEmail: normalizedRecipientEmail ?? null,
        exactDomainName: item.exactDomainName,
        parentDomain: item.parentDomain,
        issueFreeClaim,
        reservationExpirationDate: inserted.reservationExpirationDate,
        freeClaimExpirationDate: inserted.freeClaimExpirationDate,
      });
    } catch (error: any) {
      failed.push({ index: i, error: String(error?.message || error) });
    }
  }

  // Send emails after inserts
  let emailSentCount = 0;
  for (const r of createdReservations) {
    if (!sendEmail || !r.recipientEmail) continue;
    try {
      const giftExpiration = r.issueFreeClaim
        ? r.freeClaimExpirationDate
        : null;
      const reservedExpiration =
        r.exactDomainName && r.reservationExpirationDate
          ? r.reservationExpirationDate
          : null;
      const emailTemplate = React.createElement(GiftReservationNotification, {
        recipientEmail: r.recipientEmail,
        gifterName: creatorName,
        pbnDomain,
        exactDomainName: r.exactDomainName,
        parentDomain: r.parentDomain,
        ...(giftExpiration
          ? { freeClaimExpirationDate: giftExpiration.toISOString() }
          : {}),
        ...(reservedExpiration
          ? { reservedExpirationDate: reservedExpiration.toISOString() }
          : {}),
        isGift: r.issueFreeClaim,
        poweredByNamefiDomain: pbnDomain,
      });

      const html = await render(emailTemplate);
      const text = await render(emailTemplate, { plainText: true });
      const subject = r.issueFreeClaim
        ? `[Namefi] ${creatorName} has gifted you a free name claim!`
        : `[Namefi] A domain has been reserved for you on ${pbnDomain}`;

      await sendMail({
        from: 'support@namefi.io',
        to: [r.recipientEmail],
        bcc: ['customer-email-archive@d3serve.xyz'],
        subject,
        content: { html, plain: text },
      });
      emailSentCount++;

      await db
        .update(pbnIssuanceReservationsTable)
        .set({
          metadata: sql`${pbnIssuanceReservationsTable.metadata} || ${JSON.stringify({ emailSent: true, emailSentAt: new Date().toISOString() })}`,
        })
        .where(eq(pbnIssuanceReservationsTable.id, r.id));
    } catch (error) {
      logger.error({ error, reservationId: r.id }, 'Failed to send bulk email');
    }
  }

  return {
    createdCount: createdReservations.length,
    emailSentCount,
    failed,
  };
}
