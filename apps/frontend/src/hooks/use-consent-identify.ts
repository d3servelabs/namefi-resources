import { useEffect } from 'react';
import { useConsentManager } from '@c15t/nextjs';
import { useReadLocalStorage } from 'usehooks-ts';
import {
  canUseStoredConsentSubjectForUser,
  type StoredConsentInfo,
} from './use-consent-identify-utils';

const identifiedConsentUserIds = new Set<string>();

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
  const currentConsentSubjectId = consentInfo?.subjectId ?? null;
  const isConsentIdentified =
    consentInfo?.externalId === userId &&
    consentInfo?.identityProvider === 'namefi';
  const storedConsentInfo = storedConsent?.consentInfo;
  const storedConsentSubjectId = storedConsentInfo?.subjectId ?? null;
  const canIdentifyStoredConsentSubject = canUseStoredConsentSubjectForUser(
    storedConsentInfo,
    userId,
  );

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!userId) return;
    if (!hasUserConsented || !currentConsentSubjectId || isConsentIdentified) {
      return;
    }

    const identifyKey = `${userId}:${currentConsentSubjectId}`;
    if (identifiedConsentUserIds.has(identifyKey)) return;
    identifiedConsentUserIds.add(identifyKey);
    void identifyUser({ id: userId, identityProvider: 'namefi' }).catch(() => {
      identifiedConsentUserIds.delete(identifyKey);
    });
  }, [
    authenticated,
    currentConsentSubjectId,
    hasUserConsented,
    identifyUser,
    isConsentIdentified,
    ready,
    userId,
  ]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!userId) return;
    if (
      !hasUserConsented ||
      !storedConsentSubjectId ||
      !canIdentifyStoredConsentSubject ||
      currentConsentSubjectId ||
      !manager
    ) {
      return;
    }

    const identifyKey = `${userId}:${storedConsentSubjectId}`;
    if (identifiedConsentUserIds.has(identifyKey)) return;
    identifiedConsentUserIds.add(identifyKey);
    void manager
      .identifyUser({
        body: {
          subjectId: storedConsentSubjectId,
          externalId: userId,
          identityProvider: 'namefi',
        },
      })
      .catch(() => {
        identifiedConsentUserIds.delete(identifyKey);
      });
  }, [
    authenticated,
    canIdentifyStoredConsentSubject,
    currentConsentSubjectId,
    hasUserConsented,
    manager,
    ready,
    storedConsentSubjectId,
    userId,
  ]);
}
