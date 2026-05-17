import { consent, consentPurpose, db, domain, subject } from '@namefi-astra/db';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';

const DEFAULT_IDENTITY_PROVIDER = 'namefi';
const DEFAULT_PURPOSE_CODE = 'measurement';

export type UserCookieConsentState = 'granted' | 'denied' | 'unknown';

type ConsentLookupOptions = {
  userId: string;
  purposeCode?: string;
  identityProvider?: string;
  domainName: string;
};

function hasPurposeId(purposeIds: unknown, purposeId: string) {
  return Array.isArray(purposeIds) && purposeIds.includes(purposeId);
}

/**
 * Resolve the latest active c15t consent state for a user/domain/purpose.
 *
 * `unknown` means no user/domain consent row exists yet. `denied` means c15t has
 * a current active consent record for this user/domain, but the target purpose is
 * not included in that record.
 */
export async function getUserCookieConsentState({
  userId,
  purposeCode = DEFAULT_PURPOSE_CODE,
  identityProvider = DEFAULT_IDENTITY_PROVIDER,
  domainName,
}: ConsentLookupOptions): Promise<UserCookieConsentState> {
  if (!domainName) {
    return 'unknown';
  }

  const purpose = await db.query.consentPurpose.findFirst({
    columns: { id: true },
    where: and(
      eq(consentPurpose.code, purposeCode),
      eq(consentPurpose.isActive, true),
    ),
  });

  if (!purpose) {
    return 'unknown';
  }

  const subjectRow = await db.query.subject.findFirst({
    columns: { id: true },
    where: and(
      eq(subject.externalId, userId),
      eq(subject.identityProvider, identityProvider),
    ),
  });

  if (!subjectRow) {
    return 'unknown';
  }

  const domainRow = await db.query.domain.findFirst({
    columns: { id: true },
    where: and(eq(domain.name, domainName), eq(domain.isActive, true)),
  });

  if (!domainRow) {
    return 'unknown';
  }

  const now = new Date();
  const conditions = [
    eq(consent.subjectId, subjectRow.id),
    eq(consent.isActive, true),
    eq(consent.status, 'active'),
    or(isNull(consent.validUntil), gt(consent.validUntil, now)),
    eq(consent.domainId, domainRow.id),
  ];

  const consentRow = await db.query.consent.findFirst({
    columns: { id: true, purposeIds: true },
    where: and(...conditions),
    orderBy: [desc(consent.givenAt)],
  });

  if (!consentRow) {
    return 'unknown';
  }

  return hasPurposeId(consentRow.purposeIds, purpose.id) ? 'granted' : 'denied';
}

/**
 * Check whether a user has an active consent for a given consent purpose.
 */
export async function hasUserCookieConsent(
  options: ConsentLookupOptions,
): Promise<boolean> {
  return (await getUserCookieConsentState(options)) === 'granted';
}
