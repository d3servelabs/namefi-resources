import { consent, consentPurpose, db, domain, subject } from '@namefi-astra/db';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';

const DEFAULT_IDENTITY_PROVIDER = 'namefi';
const DEFAULT_PURPOSE_CODE = 'measurement';

type ConsentLookupOptions = {
  userId: string;
  purposeCode?: string;
  identityProvider?: string;
  domainName: string;
};

/**
 * Check whether a user has an active consent for a given consent purpose.
 */
export async function hasUserCookieConsent({
  userId,
  purposeCode = DEFAULT_PURPOSE_CODE,
  identityProvider = DEFAULT_IDENTITY_PROVIDER,
  domainName,
}: ConsentLookupOptions): Promise<boolean> {
  if (!domainName) {
    return false;
  }

  const purpose = await db.query.consentPurpose.findFirst({
    columns: { id: true },
    where: and(
      eq(consentPurpose.code, purposeCode),
      eq(consentPurpose.isActive, true),
    ),
  });

  if (!purpose) {
    return false;
  }

  const subjectRow = await db.query.subject.findFirst({
    columns: { id: true },
    where: and(
      eq(subject.externalId, userId),
      eq(subject.identityProvider, identityProvider),
    ),
  });

  if (!subjectRow) {
    return false;
  }

  const domainRow = await db.query.domain.findFirst({
    columns: { id: true },
    where: and(eq(domain.name, domainName), eq(domain.isActive, true)),
  });

  if (!domainRow) {
    return false;
  }

  const now = new Date();
  const purposeMatch = sql<boolean>`exists (
    select 1
    from json_array_elements_text(${consent.purposeIds}) as purpose_id
    where purpose_id = ${purpose.id}
  )`;

  const conditions = [
    eq(consent.subjectId, subjectRow.id),
    eq(consent.isActive, true),
    eq(consent.status, 'active'),
    or(isNull(consent.validUntil), gt(consent.validUntil, now)),
    purposeMatch,
    eq(consent.domainId, domainRow.id),
  ];

  const consentRow = await db.query.consent.findFirst({
    columns: { id: true },
    where: and(...conditions),
  });

  return Boolean(consentRow);
}
