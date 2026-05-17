import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  query: {
    consentPurpose: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    domain: {
      findFirst: vi.fn(),
    },
    consent: {
      findFirst: vi.fn(),
    },
  },
};

vi.mock('@namefi-astra/db', () => ({
  db: mockDb,
  consentPurpose: {
    code: 'consentPurpose.code',
    isActive: 'consentPurpose.isActive',
  },
  subject: {
    externalId: 'subject.externalId',
    identityProvider: 'subject.identityProvider',
  },
  domain: {
    name: 'domain.name',
    isActive: 'domain.isActive',
  },
  consent: {
    id: 'consent.id',
    subjectId: 'consent.subjectId',
    isActive: 'consent.isActive',
    status: 'consent.status',
    validUntil: 'consent.validUntil',
    purposeIds: 'consent.purposeIds',
    domainId: 'consent.domainId',
    givenAt: 'consent.givenAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...conditions: unknown[]) => ({ op: 'and', conditions }),
  desc: (column: unknown) => ({ op: 'desc', column }),
  eq: (column: unknown, value: unknown) => ({ op: 'eq', column, value }),
  gt: (column: unknown, value: unknown) => ({ op: 'gt', column, value }),
  isNull: (column: unknown) => ({ op: 'isNull', column }),
  or: (...conditions: unknown[]) => ({ op: 'or', conditions }),
}));

const { getUserCookieConsentState, hasUserCookieConsent } = await import(
  './consent'
);

describe('hasUserCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unknown when domainName is missing', async () => {
    const resolveConsentState = getUserCookieConsentState as unknown as (args: {
      userId: string;
    }) => Promise<string>;

    await expect(resolveConsentState({ userId: 'user-1' })).resolves.toBe(
      'unknown',
    );
    await expect(
      hasUserCookieConsent({
        userId: 'user-1',
        domainName: '',
      }),
    ).resolves.toBe(false);

    expect(mockDb.query.consentPurpose.findFirst).not.toHaveBeenCalled();
    expect(mockDb.query.consent.findFirst).not.toHaveBeenCalled();
  });

  it('does not fall back to consent from another domain', async () => {
    mockDb.query.consentPurpose.findFirst.mockResolvedValue({
      id: 'purpose-1',
    });
    mockDb.query.subject.findFirst.mockResolvedValue({ id: 'subject-1' });
    mockDb.query.domain.findFirst.mockResolvedValue(null);

    await expect(
      getUserCookieConsentState({
        userId: 'user-1',
        domainName: 'missing.example',
      }),
    ).resolves.toBe('unknown');

    expect(mockDb.query.consent.findFirst).not.toHaveBeenCalled();
  });

  it('returns granted when the latest active consent includes the purpose', async () => {
    mockDb.query.consentPurpose.findFirst.mockResolvedValue({
      id: 'purpose-1',
    });
    mockDb.query.subject.findFirst.mockResolvedValue({ id: 'subject-1' });
    mockDb.query.domain.findFirst.mockResolvedValue({ id: 'domain-1' });
    mockDb.query.consent.findFirst.mockResolvedValue({
      id: 'consent-1',
      purposeIds: ['purpose-1'],
    });

    await expect(
      getUserCookieConsentState({
        userId: 'user-1',
        domainName: 'app.example',
      }),
    ).resolves.toBe('granted');
    await expect(
      hasUserCookieConsent({
        userId: 'user-1',
        domainName: 'app.example',
      }),
    ).resolves.toBe(true);

    expect(mockDb.query.domain.findFirst).toHaveBeenCalledWith({
      columns: { id: true },
      where: expect.objectContaining({
        op: 'and',
        conditions: expect.arrayContaining([
          { op: 'eq', column: 'domain.name', value: 'app.example' },
          { op: 'eq', column: 'domain.isActive', value: true },
        ]),
      }),
    });
    expect(mockDb.query.consent.findFirst).toHaveBeenCalledWith({
      columns: { id: true, purposeIds: true },
      where: expect.objectContaining({
        op: 'and',
        conditions: expect.arrayContaining([
          { op: 'eq', column: 'consent.domainId', value: 'domain-1' },
        ]),
      }),
      orderBy: [{ op: 'desc', column: 'consent.givenAt' }],
    });
  });

  it('returns denied when the latest active consent excludes the purpose', async () => {
    mockDb.query.consentPurpose.findFirst.mockResolvedValue({
      id: 'purpose-1',
    });
    mockDb.query.subject.findFirst.mockResolvedValue({ id: 'subject-1' });
    mockDb.query.domain.findFirst.mockResolvedValue({ id: 'domain-1' });
    mockDb.query.consent.findFirst.mockResolvedValue({
      id: 'consent-1',
      purposeIds: ['necessary-purpose'],
    });

    await expect(
      getUserCookieConsentState({
        userId: 'user-1',
        domainName: 'app.example',
      }),
    ).resolves.toBe('denied');
    await expect(
      hasUserCookieConsent({
        userId: 'user-1',
        domainName: 'app.example',
      }),
    ).resolves.toBe(false);
  });
});
