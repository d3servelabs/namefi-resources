import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockUser = {
  id: '202832e8-304f-4f4a-81c9-df32fd1e5364',
  privyUserId: 'did:privy:cmceg96bx012bl40lr9tyhyod',
  primaryEmail: null,
  stripeCustomerId: 'cus_SZfPkid1y4kptX',
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
    id: 'id',
    primaryEmail: 'primary_email',
  },
}));

// Mock the config module - use user ID instead of email
vi.mock('#lib/env', () => ({
  config: {
    SKIP_AUTH_USER_ID: '202832e8-304f-4f4a-81c9-df32fd1e5364',
    SKIP_AUTH_USER_EMAIL: undefined,
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
      expect(result?.id).toBe('202832e8-304f-4f4a-81c9-df32fd1e5364');
      expect(result?.privyUserId).toBe('did:privy:cmceg96bx012bl40lr9tyhyod');
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
      expect(result?.id).toBe('202832e8-304f-4f4a-81c9-df32fd1e5364');
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

    it('should use the correct test user ID', async () => {
      const result = await getSkipAuthTestUser('1', 'local');
      expect(result?.id).toBe('202832e8-304f-4f4a-81c9-df32fd1e5364');
    });
  });

  describe('User not found in database', () => {
    it('should return null and log warning when user is not found by ID', async () => {
      mockFindFirst = vi.fn().mockResolvedValue(undefined);

      const result = await getSkipAuthTestUser('1', 'local');
      expect(result).toBeNull();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        { skipAuthUserId: '202832e8-304f-4f4a-81c9-df32fd1e5364' },
        'Skip auth user not found in database by ID. Please ensure the user exists.',
      );
    });
  });
});
