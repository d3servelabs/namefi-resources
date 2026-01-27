import { useEffect } from 'react';
import { useConsentManager } from '@c15t/nextjs';
import { useReadLocalStorage } from 'usehooks-ts';

const identifiedConsentUserIds = new Set<string>();

type StoredConsentInfo = {
  id?: string;
  identified?: boolean;
};

type StoredConsentSnapshot = {
  consentInfo?: StoredConsentInfo;
};

type UseConsentIdentifyOptions = {
  ready: boolean;
  authenticated: boolean;
  userId?: string | null;
};

export function useConsentIdentify({
  ready,
  authenticated,
  userId,
}: UseConsentIdentifyOptions) {
  const { consentInfo, hasConsented, identifyUser, manager } =
    useConsentManager();
  const storedConsent = useReadLocalStorage<StoredConsentSnapshot>('c15t');

  const hasUserConsented = hasConsented();
  const consentId = consentInfo?.id ?? null;
  const isConsentIdentified = consentInfo?.identified ?? false;
  const storedConsentId = storedConsent?.consentInfo?.id ?? null;

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!userId) return;
    if (!hasUserConsented || !consentId || isConsentIdentified) return;

    const identifyKey = `${userId}:${consentId}`;
    if (identifiedConsentUserIds.has(identifyKey)) return;
    identifiedConsentUserIds.add(identifyKey);
    void identifyUser({ id: userId, identityProvider: 'namefi' }).catch(() => {
      identifiedConsentUserIds.delete(identifyKey);
    });
  }, [
    authenticated,
    consentId,
    hasUserConsented,
    identifyUser,
    isConsentIdentified,
    ready,
    userId,
  ]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!userId) return;
    if (!hasUserConsented || !storedConsentId || consentId || !manager) return;

    const identifyKey = `${userId}:${storedConsentId}`;
    if (identifiedConsentUserIds.has(identifyKey)) return;
    identifiedConsentUserIds.add(identifyKey);
    void manager
      .identifyUser({
        body: {
          consentId: storedConsentId,
          externalId: userId,
          identityProvider: 'namefi',
        },
      })
      .catch(() => {
        identifiedConsentUserIds.delete(identifyKey);
      });
  }, [
    authenticated,
    consentId,
    hasUserConsented,
    manager,
    ready,
    storedConsentId,
    userId,
  ]);
}
