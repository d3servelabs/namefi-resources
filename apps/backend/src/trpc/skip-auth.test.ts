import { describe, expect, it } from 'vitest';
import { getSkipAuthTestUser } from './skip-auth';

describe('Skip Auth Environment Gating', () => {
  describe('Production environment (should NEVER allow skip auth)', () => {
    it('should return null when X-Skip-Auth header is "1" in production', () => {
      const result = getSkipAuthTestUser('1', 'production');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is absent in production', () => {
      const result = getSkipAuthTestUser(undefined, 'production');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is "0" in production', () => {
      const result = getSkipAuthTestUser('0', 'production');
      expect(result).toBeNull();
    });
  });

  describe('Local environment (should allow skip auth)', () => {
    it('should return mock user when X-Skip-Auth header is "1" in local', () => {
      const result = getSkipAuthTestUser('1', 'local');
      expect(result).not.toBeNull();
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
      expect(result?.id).toBe('skip-auth-mock-user-id');
      expect(result?.privyUserId).toBe('skip-auth-mock-privy-user-id');
    });

    it('should return null when X-Skip-Auth header is absent in local', () => {
      const result = getSkipAuthTestUser(undefined, 'local');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is "0" in local', () => {
      const result = getSkipAuthTestUser('0', 'local');
      expect(result).toBeNull();
    });

    it('should return null when X-Skip-Auth header is any other value in local', () => {
      const result = getSkipAuthTestUser('true', 'local');
      expect(result).toBeNull();
    });
  });

  describe('Development environment (should allow skip auth)', () => {
    it('should return mock user when X-Skip-Auth header is "1" in development', () => {
      const result = getSkipAuthTestUser('1', 'development');
      expect(result).not.toBeNull();
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
    });

    it('should return null when X-Skip-Auth header is absent in development', () => {
      const result = getSkipAuthTestUser(undefined, 'development');
      expect(result).toBeNull();
    });
  });

  describe('Preview environment (should allow skip auth)', () => {
    it('should return mock user when X-Skip-Auth header is "1" in preview', () => {
      const result = getSkipAuthTestUser('1', 'preview');
      expect(result).not.toBeNull();
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
    });

    it('should return null when X-Skip-Auth header is absent in preview', () => {
      const result = getSkipAuthTestUser(undefined, 'preview');
      expect(result).toBeNull();
    });
  });

  describe('Undefined/unknown environment (should NOT allow skip auth)', () => {
    it('should return null when environment is undefined', () => {
      const result = getSkipAuthTestUser('1', undefined);
      expect(result).toBeNull();
    });

    it('should return null when environment is empty string', () => {
      const result = getSkipAuthTestUser('1', '');
      expect(result).toBeNull();
    });

    it('should return null when environment is unknown value', () => {
      const result = getSkipAuthTestUser('1', 'staging');
      expect(result).toBeNull();
    });

    it('should return null when environment is "prod" (not "production")', () => {
      const result = getSkipAuthTestUser('1', 'prod');
      expect(result).toBeNull();
    });
  });

  describe('Mock user properties', () => {
    it('should have all required UserSelect fields', () => {
      const result = getSkipAuthTestUser('1', 'local');
      expect(result).not.toBeNull();

      // Verify all required fields are present
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

    it('should have correct default values', () => {
      const result = getSkipAuthTestUser('1', 'local');
      expect(result).not.toBeNull();

      expect(result?.stripeCustomerId).toBeNull();
      expect(result?.subscribeToEmails).toBe(true);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.lastSignInAt).toBeInstanceOf(Date);
      expect(result?.lastAccessedSessionAt).toBeInstanceOf(Date);
    });

    it('should use the correct test email address', () => {
      const result = getSkipAuthTestUser('1', 'local');
      expect(result?.primaryEmail).toBe('tester+alice@d3serve.xyz');
    });
  });
});
