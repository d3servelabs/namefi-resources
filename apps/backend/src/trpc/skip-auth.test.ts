import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockUser = {
  id: 'real-user-id-from-db',
  privyUserId: 'real-privy-user-id',
  primaryEmail: 'tester+alice@d3serve.xyz',
  stripeCustomerId: null,
  subscribeToEmails: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastSignInAt: new Date('2024-01-01'),
  lastAccessedSessionAt: new Date('2024-01-01'),
};

let mockFindFirst = vi.fn().mockResolvedValue(mockUser);
let mockLoggerWarn = vi.fn();

// Mock the database module
vi.mock('@namefi-astra/db', () => ({
  db: {
    query: {
      usersTable: {
        get findFirst() {
          return mockFindFirst;
        },
      },
    },
  },
  usersTable: {
    primaryEmail: 'primary_email',
  },
}));

// Mock the config module
vi.mock('#lib/env', () => ({
  config: {
    SKIP_AUTH_USER_EMAIL: 'tester+alice@d3serve.xyz',
  },
}));

// Mock the logger module
vi.mock('#lib/logger', () => ({
  logger: {
    get warn() {
      return mockLoggerWarn;
    },
  },
}));

// Mock drizzle-orm eq function
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value })),
}));

// Import after mocks are set up
const { getSkipAuthTestUser } = await import('./skip-auth');

describe('Skip Auth Environment Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst = vi.fn().mockResolvedValue(mockUser);
    mockLoggerWarn = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Production environment (should NEVER allow skip auth)', () => {
    it('should return null when X-Skip-Auth header is "1" in production', async () => {
      const result = await getSkipAuthTestUser('1', 'production');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is absent in production', async () => {
      const result = await getSkipAuthTestUser(undefined, 'production');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is "0" in production', async () => {
      const result = await getSkipAuthTestUser('0', 'production');
      expect(result).toBeNull();
    });
  });

  describe('Local environment (should allow skip auth)', () => {
    it('should return user from database when X-Skip-Auth header is "1" in local', async () => {
      const result = await getSkipAuthTestUser('1', 'local');
      expect(result).not.toBeNull();
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
      expect(result?.id).toBe('real-user-id-from-db');
      expect(result?.privyUserId).toBe('real-privy-user-id');
    });

    it('should return null when X-Skip-Auth header is absent in local', async () => {
      const result = await getSkipAuthTestUser(undefined, 'local');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is "0" in local', async () => {
      const result = await getSkipAuthTestUser('0', 'local');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is any other value in local', async () => {
      const result = await getSkipAuthTestUser('true', 'local');
      expect(result).toBeNull();
    });
  });

  describe('Development environment (should allow skip auth)', () => {
    it('should return user from database when X-Skip-Auth header is "1" in development', async () => {
      const result = await getSkipAuthTestUser('1', 'development');
      expect(result).not.toBeNull();
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
    });

    it('should return null when X-Skip-Auth header is absent in development', async () => {
      const result = await getSkipAuthTestUser(undefined, 'development');
      expect(result).toBeNull();
    });
  });

  describe('Preview environment (should NOT allow skip auth - security)', () => {
    it('should return null when X-Skip-Auth header is "1" in preview', async () => {
      const result = await getSkipAuthTestUser('1', 'preview');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is absent in preview', async () => {
      const result = await getSkipAuthTestUser(undefined, 'preview');
      expect(result).toBeNull();
    });
  });

  describe('Undefined/unknown environment (should NOT allow skip auth)', () => {
    it('should return null when environment is undefined', async () => {
      const result = await getSkipAuthTestUser('1', undefined);
      expect(result).toBeNull();
    });

    it('should return null when environment is empty string', async () => {
      const result = await getSkipAuthTestUser('1', '');
      expect(result).toBeNull();
    });

    it('should return null when environment is unknown value', async () => {
      const result = await getSkipAuthTestUser('1', 'staging');
      expect(result).toBeNull();
    });

    it('should return null when environment is "prod" (not "production")', async () => {
      const result = await getSkipAuthTestUser('1', 'prod');
      expect(result).toBeNull();
    });
  });

  describe('User from database properties', () => {
    it('should have all required UserSelect fields', async () => {
      const result = await getSkipAuthTestUser('1', 'local');
      expect(result).not.toBeNull();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('privyUserId');
      expect(result).toHaveProperty('primaryEmail');
      expect(result).toHaveProperty('stripeCustomerId');
      expect(result).toHaveProperty('subscribeToEmails');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('lastSignInAt');
      expect(result).toHaveProperty('lastAccessedSessionAt');
    });

    it('should use the correct test email address', async () => {
      const result = await getSkipAuthTestUser('1', 'local');
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
    });
  });

  describe('User not found in database', () => {
    it('should return null and log warning when user is not found', async () => {
      mockFindFirst = vi.fn().mockResolvedValue(undefined);

      const result = await getSkipAuthTestUser('1', 'local');
      expect(result).toBeNull();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        { skipAuthUserEmail: 'tester+alice@d3serve.xyz' },
        'Skip auth user not found in database. Please ensure the user exists.',
      );
    });
  });
});
