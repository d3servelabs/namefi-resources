import {
  type UserSelect,
  db,
  huntEdgesTable,
  usersTable,
} from '@namefi-astra/db';
import { config } from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../base';
import { huntRouter } from './huntRouter';

const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Random UUID
  privyUserId: 'test-privy-user-id-0',
} as UserSelect;

const otherUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  privyUserId: 'test-privy-user-id-1',
} as UserSelect;

config({ path: '.env.test' });

describe('Hunt Router', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Ensure test users exist in database
    try {
      await db
        .insert(usersTable)
        .values([
          {
            id: testUser.id,
            privyUserId: testUser.privyUserId,
            primaryEmail: 'test@test.test',
          },
          {
            id: otherUser.id,
            privyUserId: otherUser.privyUserId,
            primaryEmail: 'test2@test.test',
          },
        ])
        .onConflictDoNothing();

      const users = await db
        .select()
        .from(usersTable)
        .where(inArray(usersTable.id, [testUser.id, otherUser.id]));

      if (users.length !== 2) {
        throw new Error('Failed to create test users');
      }
    } catch (error) {
      console.error('Failed to setup test users:', error);
      throw error;
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Clean up test data
    // First delete all hunt edges created by or targeting test users
    await db
      .delete(huntEdgesTable)
      .where(inArray(huntEdgesTable.sourceId, [testUser.id, otherUser.id]));
    await db
      .delete(huntEdgesTable)
      .where(
        and(
          eq(huntEdgesTable.targetType, 'USER'),
          inArray(huntEdgesTable.targetId, [testUser.id, otherUser.id]),
        ),
      );
    // Then delete users
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [testUser.id, otherUser.id]));
  });

  const caller = huntRouter.createCaller({
    thirdPartyOriginHostname: null,
    testUser,
  } satisfies Omit<TrpcContext, 'db' | 'req' | 'res'> as TrpcContext);

  const otherCaller = huntRouter.createCaller({
    thirdPartyOriginHostname: null,
    testUser: otherUser,
  } satisfies Omit<TrpcContext, 'db' | 'req' | 'res'> as TrpcContext);

  describe('Domain Submit Operations', () => {
    it('should submit a new domain', async () => {
      const result = await caller.submitDomain({
        domainName: 'test.domain',
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('domainName', 'test.domain');
      expect(result).toHaveProperty('submittedAt');
    });

    it('should not allow submitting the same domain twice by the same user', async () => {
      await caller.submitDomain({
        domainName: 'test.domain.duplicate',
      });

      await expect(
        caller.submitDomain({
          domainName: 'test.domain.duplicate',
        }),
      ).rejects.toThrow('This domain has already been submitted');
    });

    it('should not allow different users to submit the same domain', async () => {
      await caller.submitDomain({
        domainName: 'test.domain.shared',
      });

      await expect(
        otherCaller.submitDomain({
          domainName: 'test.domain.shared',
        }),
      ).rejects.toThrow('This domain has already been submitted');
    });

    it('should delete a domain', async () => {
      await caller.submitDomain({
        domainName: 'test.domain.to.delete',
      });

      const result = await caller.removeDomain({
        domainName: 'test.domain.to.delete',
      });

      expect(result).toEqual({ success: true });
    });

    it("should not allow deleting another user's domain", async () => {
      await otherCaller.submitDomain({
        domainName: 'test.domain.to.delete.other',
      });

      await expect(
        caller.removeDomain({
          domainName: 'test.domain.to.delete.other',
        }),
      ).rejects.toThrow(
        'Domain not found or you do not have permission to delete it',
      );
    });

    it('should get my submitted domains', async () => {
      await caller.submitDomain({ domainName: 'test.domain.1' });
      await caller.submitDomain({ domainName: 'test.domain.2' });
      await otherCaller.submitDomain({ domainName: 'test.domain.other' });

      const result = await caller.getMySubmittedDomains({
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(2);

      const domainNames = result.items.map((item) => item.domainName);
      expect(domainNames).toContain('test.domain.1');
      expect(domainNames).toContain('test.domain.2');
      expect(domainNames).not.toContain('test.domain.other');

      for (const item of result.items) {
        expect(item).toHaveProperty('domainName');
        expect(item).toHaveProperty('submittedAt');
        expect(item).toHaveProperty('upvoteCount');
        expect(item).toHaveProperty('userHasUpvoted');
        expect(item).toHaveProperty('tags');
        expect(Array.isArray(item.tags)).toBe(true);
      }
    });

    it('should get my upvoted domains', async () => {
      // Setup domains
      await caller.submitDomain({ domainName: 'test.domain.upvote1' });
      await otherCaller.submitDomain({ domainName: 'test.domain.upvote2' });
      await otherCaller.submitDomain({ domainName: 'test.domain.upvote3' });

      // Upvote some domains
      await caller.upvote({ domainName: 'test.domain.upvote1' });
      await caller.upvote({ domainName: 'test.domain.upvote2' });
      // Don't upvote the third domain

      const result = await caller.getMyUpvotedDomains({
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(2);

      const domainNames = result.items.map((item) => item.domainName);
      expect(domainNames).toContain('test.domain.upvote1');
      expect(domainNames).toContain('test.domain.upvote2');
      expect(domainNames).not.toContain('test.domain.upvote3');

      for (const item of result.items) {
        expect(item).toHaveProperty('domainName');
        expect(item).toHaveProperty('upvotedAt');
        expect(item).toHaveProperty('upvoteCount');
        expect(item).toHaveProperty('userHasUpvoted', true);
        expect(item).toHaveProperty('tags');
        expect(Array.isArray(item.tags)).toBe(true);
      }
    });

    it('should check domain ownership correctly', async () => {
      // Submit a domain
      await caller.submitDomain({ domainName: 'test.domain.ownership' });

      // Check ownership for submitter
      const ownerResult = await caller.checkDomainOwnership({
        domainName: 'test.domain.ownership',
      });
      expect(ownerResult.isOwner).toBe(true);
      expect(ownerResult.submittedAt).toBeTruthy();

      // Check ownership for non-submitter
      const nonOwnerResult = await otherCaller.checkDomainOwnership({
        domainName: 'test.domain.ownership',
      });
      expect(nonOwnerResult.isOwner).toBe(false);
      expect(nonOwnerResult.submittedAt).toBeNull();
    });

    it('should get comprehensive domain details in single query', async () => {
      // Submit and upvote a domain
      await caller.submitDomain({ domainName: 'test.domain.detail' });
      await caller.upvote({ domainName: 'test.domain.detail' });
      await otherCaller.upvote({ domainName: 'test.domain.detail' });

      const result = await caller.getDomainDetail({
        domainName: 'test.domain.detail',
      });

      // Should contain all necessary information
      expect(result).toHaveProperty('domainName', 'test.domain.detail');
      expect(result).toHaveProperty('upvoteCount', 2);
      expect(result).toHaveProperty('firstSubmitDate');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray(result.tags)).toBe(true);

      // User's interaction status
      expect(result).toHaveProperty('hasUpvoted', true);
      expect(result).toHaveProperty('isOwner', true);
      expect(result).toHaveProperty('upvotedAt');
      expect(result).toHaveProperty('submittedAt');

      // Backward compatibility
      expect(result).toHaveProperty('userHasUpvoted', true);
      expect(result).toHaveProperty('userUpvotedAt');
      expect(result).toHaveProperty('userSubmittedAt');
    });

    it('should handle non-existent domain in getDomainDetail', async () => {
      await expect(
        caller.getDomainDetail({ domainName: 'non.existent.domain' }),
      ).rejects.toThrow('Domain not found in hunt system');
    });
  });

  describe('Vote Operations', () => {
    beforeEach(async () => {
      // Submit a domain for voting tests
      await caller.submitDomain({ domainName: 'test.domain.for.votes' });
    });

    it('should upvote a domain', async () => {
      const result = await caller.upvote({
        domainName: 'test.domain.for.votes',
      });

      expect(result).toEqual({
        success: true,
        message: 'Upvoted successfully',
      });

      // Verify the upvote was recorded
      const status = await caller.checkUpvoteStatus({
        domainName: 'test.domain.for.votes',
      });
      expect(status.hasUpvoted).toBe(true);
    });

    it('should not create duplicate upvotes', async () => {
      await caller.upvote({ domainName: 'test.domain.for.votes' });

      const result = await caller.upvote({
        domainName: 'test.domain.for.votes',
      });

      expect(result).toEqual({
        success: true,
        message: 'Already upvoted',
      });
    });

    it('should remove upvote', async () => {
      // First upvote
      await caller.upvote({ domainName: 'test.domain.for.votes' });

      // Then remove upvote
      const result = await caller.unvote({
        domainName: 'test.domain.for.votes',
      });

      expect(result).toEqual({
        success: true,
        message: 'Upvote removed successfully',
      });

      // Verify the upvote was removed
      const status = await caller.checkUpvoteStatus({
        domainName: 'test.domain.for.votes',
      });
      expect(status.hasUpvoted).toBe(false);
    });

    it('should throw error when removing non-existent upvote', async () => {
      await expect(
        caller.unvote({ domainName: 'test.domain.for.votes' }),
      ).rejects.toThrow('Upvote not found');
    });

    it('should check upvote status correctly', async () => {
      // Initially no upvote
      let status = await caller.checkUpvoteStatus({
        domainName: 'test.domain.for.votes',
      });
      expect(status.hasUpvoted).toBe(false);
      expect(status.upvotedAt).toBeNull();

      // After upvote
      await caller.upvote({ domainName: 'test.domain.for.votes' });
      status = await caller.checkUpvoteStatus({
        domainName: 'test.domain.for.votes',
      });
      expect(status.hasUpvoted).toBe(true);
      expect(status.upvotedAt).toBeTruthy();
    });
  });

  describe('Trending Domains', () => {
    beforeEach(async () => {
      // Create test domains with different submit dates
      await caller.submitDomain({ domainName: 'domain.today' });
      await caller.submitDomain({ domainName: 'domain.thisweek' });
      await caller.submitDomain({ domainName: 'domain.thismonth' });

      // Add upvotes to create trending
      await caller.upvote({ domainName: 'domain.today' });
      await otherCaller.upvote({ domainName: 'domain.today' });
      await caller.upvote({ domainName: 'domain.thisweek' });
    });

    it('should get trending domains', async () => {
      const result = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.items)).toBe(true);

      for (const item of result.items) {
        expect(item).toHaveProperty('domainName');
        expect(item).toHaveProperty('upvoteCount');
        expect(item).toHaveProperty('firstSubmitDate');
        expect(item).toHaveProperty('userHasUpvoted');
        expect(item).toHaveProperty('tags');
        expect(Array.isArray(item.tags)).toBe(true);
      }

      // Should be sorted by upvote count (descending)
      if (result.items.length > 1) {
        for (let i = 1; i < result.items.length; i++) {
          expect(
            Number(result.items[i - 1].upvoteCount),
          ).toBeGreaterThanOrEqual(Number(result.items[i].upvoteCount));
        }
      }
    });

    it('should filter trending domains by time range', async () => {
      // Submit an old domain by manipulating the database directly
      await caller.submitDomain({ domainName: 'domain.old' });
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 1);

      await db
        .update(huntEdgesTable)
        .set({ createdAt: oldDate })
        .where(
          and(
            eq(huntEdgesTable.targetId, 'domain.old'),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      // Test different time ranges
      const allTimeResult = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      const thisYearResult = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'THIS_YEAR',
      });

      // All time should include more domains than this year
      expect(allTimeResult.items.length).toBeGreaterThanOrEqual(
        thisYearResult.items.length,
      );
    });

    it('should handle pagination correctly', async () => {
      const page1 = await caller.getTrendingDomains({
        limit: 2,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      const page2 = await caller.getTrendingDomains({
        limit: 2,
        offset: 2,
        timeRange: 'ANYTIME',
      });

      expect(page1.items.length).toBeLessThanOrEqual(2);
      expect(page2.items.length).toBeLessThanOrEqual(2);

      // Items should not overlap
      const page1Names = page1.items.map((item) => item.domainName);
      const page2Names = page2.items.map((item) => item.domainName);
      const overlap = page1Names.filter((name) => page2Names.includes(name));
      expect(overlap.length).toBe(0);
    });
  });
});
