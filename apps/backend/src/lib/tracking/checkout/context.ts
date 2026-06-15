import { getUserCookieConsentState } from '#lib/consent';
import { logger } from '#lib/logger';
import { getDefaultKeyv } from '#lib/keyv';
import { db, usersTable } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import type { C15tMeasurementConsentState } from '@namefi-astra/common/google-analytics';
import { eq, ilike } from 'drizzle-orm';
import { z } from 'zod';

export const GA_EVENT_TRACKING_REASON_LITERALS = [
  'DEFAULT',
  'BACKFILL',
  'TEST',
  'PRIVACY',
  'EXPERIMENT',
  'INCIDENT_MITIGATION',
  'INTERNAL',
  'API',
  'OTHER',
] as const;

export const gaEventTrackingReasonLiteralSchema = z.enum(
  GA_EVENT_TRACKING_REASON_LITERALS,
);

export type GaEventTrackingReasonLiteral =
  (typeof GA_EVENT_TRACKING_REASON_LITERALS)[number];

export const gaEventTrackingReasonSchema = z
  .string()
  .trim()
  .min(1, 'GA event tracking reason is required')
  .max(200, 'GA event tracking reason must be at most 200 characters');

export const checkoutTrackingIdentitySchema = z.object({
  clientId: z.string().optional(),
  sessionId: z.number().int().positive().optional(),
  eventSource: z.literal('api').optional(),
});

export const checkoutTrackingContextSchema = z.object({
  trackGaEvents: z.boolean(),
  reason: gaEventTrackingReasonSchema.optional(),
  identity: checkoutTrackingIdentitySchema.optional(),
});

export const gaEventTrackingSchema = z.object({
  trackGaEvents: z.boolean(),
  reason: gaEventTrackingReasonSchema.optional(),
  clientId: z.string().optional(),
  sessionId: z.number().int().positive().optional(),
  eventSource: z.literal('api').optional(),
});

export type CheckoutTrackingIdentity = z.infer<
  typeof checkoutTrackingIdentitySchema
>;
export type CheckoutTrackingContext = z.infer<
  typeof checkoutTrackingContextSchema
>;
export type GaEventTracking = z.infer<typeof gaEventTrackingSchema>;

let teamMembersPromise: Promise<string[] | null> | null = null;

async function getTeamMembersIds(): Promise<string[] | null> {
  try {
    const cached = await getDefaultKeyv().get<string[]>('namefi-team-members');
    if (cached) return cached;

    if (teamMembersPromise) return await teamMembersPromise;

    teamMembersPromise = (async () => {
      try {
        const users = await db
          .select({ userId: usersTable.id })
          .from(privyUsersTableSchema)
          .leftJoin(
            usersTable,
            eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
          )
          .where(ilike(privyUsersTableSchema.email, '%@d3serve.xyz'));
        const usersIds = users
          .map(({ userId }) => userId)
          .filter((userId): userId is string => Boolean(userId));
        await getDefaultKeyv().set<string[]>('namefi-team-members', usersIds);
        return usersIds;
      } finally {
        teamMembersPromise = null;
      }
    })();

    return await teamMembersPromise;
  } catch (error) {
    teamMembersPromise = null;
    logger.warn({ error }, 'getTeamMembersIds failed');
  }
  return null;
}

export async function resolveCheckoutTrackingForUser(
  userId: string,
): Promise<CheckoutTrackingContext> {
  const namefiTeamMembersIds = await getTeamMembersIds();

  if (namefiTeamMembersIds?.includes(userId)) {
    return {
      trackGaEvents: false,
      reason: 'INTERNAL',
    };
  }

  return {
    trackGaEvents: true,
  };
}

function createWebCheckoutTrackingIdentity({
  clientId,
  sessionId,
}: {
  clientId: string;
  sessionId?: number | null;
}): CheckoutTrackingContext {
  return {
    trackGaEvents: true,
    identity: {
      clientId,
      ...(sessionId ? { sessionId } : {}),
    },
  };
}

export async function resolveWebCheckoutTracking({
  userId,
  gaIdentity,
  consentDomainName,
  requestMeasurementConsentState = 'unknown',
  getMeasurementConsentAutoGranted,
}: {
  userId?: string | null;
  gaIdentity: {
    clientId?: string | null;
    sessionId?: number | null;
  };
  consentDomainName?: string | null;
  requestMeasurementConsentState?: C15tMeasurementConsentState;
  getMeasurementConsentAutoGranted?: () => Promise<boolean>;
}): Promise<CheckoutTrackingContext> {
  if (userId) {
    const baseTracking = await resolveCheckoutTrackingForUser(userId);
    if (!baseTracking.trackGaEvents) return baseTracking;
  }

  const resolvedClientId = gaIdentity.clientId?.trim();
  if (!resolvedClientId) {
    return {
      trackGaEvents: false,
      reason: 'PRIVACY',
    };
  }

  if (requestMeasurementConsentState === 'denied') {
    return {
      trackGaEvents: false,
      reason: 'PRIVACY',
    };
  }

  if (userId) {
    try {
      const measurementConsentState = await getUserCookieConsentState({
        userId,
        domainName: consentDomainName ?? '',
      });

      if (measurementConsentState === 'denied') {
        return {
          trackGaEvents: false,
          reason: 'PRIVACY',
        };
      }

      if (measurementConsentState === 'unknown') {
        if (requestMeasurementConsentState === 'granted') {
          return createWebCheckoutTrackingIdentity({
            clientId: resolvedClientId,
            sessionId: gaIdentity.sessionId,
          });
        }

        const isAutoGranted =
          (await getMeasurementConsentAutoGranted?.()) ?? false;
        if (!isAutoGranted) {
          return {
            trackGaEvents: false,
            reason: 'PRIVACY',
          };
        }
      }
    } catch (error) {
      logger.warn(
        { error, userId, consentDomainName },
        'Failed to verify measurement consent for GA checkout tracking',
      );
      return {
        trackGaEvents: false,
        reason: 'PRIVACY',
      };
    }
  } else {
    if (requestMeasurementConsentState === 'unknown') {
      const isAutoGranted =
        (await getMeasurementConsentAutoGranted?.()) ?? false;
      if (!isAutoGranted) {
        return {
          trackGaEvents: false,
          reason: 'PRIVACY',
        };
      }
    }
  }

  return createWebCheckoutTrackingIdentity({
    clientId: resolvedClientId,
    sessionId: gaIdentity.sessionId,
  });
}

export async function resolveApiCheckoutTracking({
  userId,
}: {
  userId: string;
}): Promise<CheckoutTrackingContext> {
  return markCheckoutTrackingAsApiSource(
    await resolveCheckoutTrackingForUser(userId),
  );
}

export function markCheckoutTrackingAsApiSource(
  tracking: CheckoutTrackingContext,
): CheckoutTrackingContext {
  const reason =
    tracking.reason ?? (tracking.trackGaEvents ? 'API' : undefined);

  return {
    ...tracking,
    reason,
    identity: {
      ...tracking.identity,
      eventSource: 'api',
    },
  };
}

export function toGaEventTracking(
  tracking: CheckoutTrackingContext,
): GaEventTracking {
  return {
    trackGaEvents: tracking.trackGaEvents,
    reason: tracking.reason,
    clientId: tracking.identity?.clientId,
    sessionId: tracking.identity?.sessionId,
    eventSource: tracking.identity?.eventSource,
  };
}

export function fromGaEventTracking(
  tracking?: GaEventTracking | null,
): CheckoutTrackingContext {
  return {
    trackGaEvents: tracking?.trackGaEvents ?? true,
    reason: tracking?.reason,
    identity:
      tracking?.clientId || tracking?.sessionId || tracking?.eventSource
        ? {
            clientId: tracking.clientId,
            sessionId: tracking.sessionId,
            eventSource: tracking.eventSource,
          }
        : undefined,
  };
}
