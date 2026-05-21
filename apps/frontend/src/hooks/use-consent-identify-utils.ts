export type StoredConsentInfo = {
  subjectId?: string;
  externalId?: string;
  identityProvider?: string;
};

export function canUseStoredConsentSubjectForUser(
  storedConsentInfo: StoredConsentInfo | undefined,
  userId: string | null | undefined,
) {
  if (!userId || !storedConsentInfo?.subjectId) return false;

  const storedConsentExternalId = storedConsentInfo.externalId ?? null;
  const storedConsentIdentityProvider =
    storedConsentInfo.identityProvider ?? null;
  const hasStoredIdentityMetadata = Boolean(
    storedConsentExternalId || storedConsentIdentityProvider,
  );

  if (!hasStoredIdentityMetadata) return true;

  return (
    storedConsentExternalId === userId &&
    storedConsentIdentityProvider === 'namefi'
  );
}
