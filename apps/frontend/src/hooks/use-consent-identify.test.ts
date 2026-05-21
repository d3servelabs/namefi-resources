import { describe, expect, it } from 'vitest';
import { canUseStoredConsentSubjectForUser } from './use-consent-identify-utils';

describe('canUseStoredConsentSubjectForUser', () => {
  it('allows unlinked stored consent subjects for the current user', () => {
    expect(
      canUseStoredConsentSubjectForUser({ subjectId: 'subject-1' }, 'user-1'),
    ).toBe(true);
  });

  it('allows stored consent subjects already linked to the current Namefi user', () => {
    expect(
      canUseStoredConsentSubjectForUser(
        {
          subjectId: 'subject-1',
          externalId: 'user-1',
          identityProvider: 'namefi',
        },
        'user-1',
      ),
    ).toBe(true);
  });

  it('rejects stored consent subjects linked to a different user', () => {
    expect(
      canUseStoredConsentSubjectForUser(
        {
          subjectId: 'subject-1',
          externalId: 'user-2',
          identityProvider: 'namefi',
        },
        'user-1',
      ),
    ).toBe(false);
  });

  it('rejects partial stored identity metadata', () => {
    expect(
      canUseStoredConsentSubjectForUser(
        { subjectId: 'subject-1', externalId: 'user-1' },
        'user-1',
      ),
    ).toBe(false);
    expect(
      canUseStoredConsentSubjectForUser(
        { subjectId: 'subject-1', identityProvider: 'namefi' },
        'user-1',
      ),
    ).toBe(false);
  });
});
