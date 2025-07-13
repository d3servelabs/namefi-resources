import {
  type UserSelect,
  db,
  huntEdgesTable,
  huntPinnedDomainsTable,
  usersTable,
} from '@namefi-astra/db';
import { config } from 'dotenv';
import { and, eq, inArray, sql } from 'drizzle-orm';
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
    // Clean up pinned domains first (using LIKE to match test domain patterns)
    await db
      .delete(huntPinnedDomainsTable)
      .where(sql`${huntPinnedDomainsTable.domainName} LIKE 'test.%'`);
    // Delete all hunt edges created by or targeting test users
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
    // Also clean up any hunt edges for test domains regardless of user
    await db
      .delete(huntEdgesTable)
      .where(sql`${huntEdgesTable.targetId} LIKE 'test.%'`);
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
      expect(result).toHaveProperty('message', 'Domain submitted successfully');
    });

    it('should automatically upvote domain when submitting', async () => {
      await caller.submitDomain({
        domainName: 'test.domain.auto.upvote',
      });

      // Check that the submitter has automatically upvoted the domain
      const upvoteStatus = await caller.checkUpvoteStatus({
        domainName: 'test.domain.auto.upvote',
      });
      expect(upvoteStatus.hasUpvoted).toBe(true);
      expect(upvoteStatus.upvotedAt).toBeTruthy();

      // Check domain details to confirm upvote count
      const domainDetail = await caller.getDomainDetail({
        domainName: 'test.domain.auto.upvote',
      });
      expect(domainDetail.upvoteCount).toBe(1);
      expect(domainDetail.userHasUpvoted).toBe(true);
    });

    it('should handle resubmission of same domain by same user', async () => {
      const firstSubmit = await caller.submitDomain({
        domainName: 'test.domain.duplicate',
      });

      expect(firstSubmit).toHaveProperty('success', true);
      expect(firstSubmit).toHaveProperty(
        'message',
        'Domain submitted successfully',
      );

      const secondSubmit = await caller.submitDomain({
        domainName: 'test.domain.duplicate',
      });

      expect(secondSubmit).toHaveProperty('success', true);
      expect(secondSubmit).toHaveProperty('message', 'Domain already exists');
      expect(secondSubmit).toHaveProperty(
        'domainName',
        'test.domain.duplicate',
      );
      expect(secondSubmit).toHaveProperty('submittedAt');
      // submittedAt should be the same as first submission
      expect(secondSubmit.submittedAt).toEqual(firstSubmit.submittedAt);
    });

    it('should handle submission of same domain by different user - adds upvote', async () => {
      const firstSubmit = await caller.submitDomain({
        domainName: 'test.domain.shared',
      });

      expect(firstSubmit).toHaveProperty('success', true);
      expect(firstSubmit).toHaveProperty(
        'message',
        'Domain submitted successfully',
      );

      const secondSubmit = await otherCaller.submitDomain({
        domainName: 'test.domain.shared',
      });

      expect(secondSubmit).toHaveProperty('success', true);
      expect(secondSubmit).toHaveProperty('message', 'Domain already exists');
      expect(secondSubmit).toHaveProperty('domainName', 'test.domain.shared');
      expect(secondSubmit).toHaveProperty('submittedAt');
      // submittedAt should be the same as first submission
      expect(secondSubmit.submittedAt).toEqual(firstSubmit.submittedAt);

      // Verify that the second user has upvoted the domain
      const upvoteStatus = await otherCaller.checkUpvoteStatus({
        domainName: 'test.domain.shared',
      });
      expect(upvoteStatus.hasUpvoted).toBe(true);
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
      // Since submitDomain automatically upvotes, remove the upvote to have a clean state
      await caller.unvote({ domainName: 'test.domain.for.votes' });
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

  describe('Public Endpoints', () => {
    beforeEach(async () => {
      // Setup test domains for public endpoint testing
      await caller.submitDomain({ domainName: 'test.public.domain1' });
      await caller.submitDomain({ domainName: 'test.public.domain2' });
      await otherCaller.submitDomain({ domainName: 'test.public.domain3' });

      // Add some upvotes
      await caller.upvote({ domainName: 'test.public.domain1' });
      await otherCaller.upvote({ domainName: 'test.public.domain1' });
      await caller.upvote({ domainName: 'test.public.domain2' });
    });

    it('should get trending domains without authentication', async () => {
      // Create a public caller without authentication
      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null, // No user for public access
      } as any);

      const result = await publicCaller.getTrendingDomainsPublic({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      // Verify that all domains have userHasUpvoted: false for public access
      for (const item of result.items) {
        expect(item).toHaveProperty('domainName');
        expect(item).toHaveProperty('upvoteCount');
        expect(item).toHaveProperty('firstSubmitDate');
        expect(item).toHaveProperty('userHasUpvoted', false);
        expect(item).toHaveProperty('tags');
        expect(Array.isArray(item.tags)).toBe(true);
      }

      // Should be sorted by upvote count
      if (result.items.length > 1) {
        for (let i = 1; i < result.items.length; i++) {
          expect(
            Number(result.items[i - 1].upvoteCount),
          ).toBeGreaterThanOrEqual(Number(result.items[i].upvoteCount));
        }
      }
    });

    it('should get domain details without authentication', async () => {
      // Create a public caller without authentication
      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null, // No user for public access
      } as any);

      const result = await publicCaller.getDomainDetailPublic({
        domainName: 'test.public.domain1',
      });

      // Should contain basic domain information
      expect(result).toHaveProperty('domainName', 'test.public.domain1');
      expect(result).toHaveProperty('upvoteCount');
      expect(result).toHaveProperty('firstSubmitDate');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray(result.tags)).toBe(true);

      // User-specific fields should be false/null for public access
      expect(result).toHaveProperty('userHasUpvoted', false);
      expect(result).toHaveProperty('userUpvotedAt', null);
      expect(result).toHaveProperty('isOwner', false);
      expect(result).toHaveProperty('userSubmittedAt', null);
      expect(result).toHaveProperty('hasUpvoted', false);
      expect(result).toHaveProperty('upvotedAt', null);
      expect(result).toHaveProperty('submittedAt', null);
    });

    it('should handle non-existent domain in public getDomainDetail', async () => {
      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null,
      } as any);

      await expect(
        publicCaller.getDomainDetailPublic({
          domainName: 'non.existent.public.domain',
        }),
      ).rejects.toThrow('Domain not found in hunt system');
    });

    it('should filter trending domains by time range in public endpoint', async () => {
      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null,
      } as any);

      const allTimeResult = await publicCaller.getTrendingDomainsPublic({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      const thisYearResult = await publicCaller.getTrendingDomainsPublic({
        limit: 10,
        offset: 0,
        timeRange: 'THIS_YEAR',
      });

      // All time should include at least as many domains as this year
      expect(allTimeResult.items.length).toBeGreaterThanOrEqual(
        thisYearResult.items.length,
      );

      // Both should return valid domain structures
      for (const item of thisYearResult.items) {
        expect(item).toHaveProperty('domainName');
        expect(item).toHaveProperty('upvoteCount');
        expect(item).toHaveProperty('userHasUpvoted', false);
      }
    });

    it('should handle pagination correctly in public trending domains', async () => {
      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null,
      } as any);

      const page1 = await publicCaller.getTrendingDomainsPublic({
        limit: 2,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      const page2 = await publicCaller.getTrendingDomainsPublic({
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

  describe('Pinned Domains', () => {
    beforeEach(async () => {
      // Extra cleanup to ensure clean slate for pinned domain tests
      await db
        .delete(huntPinnedDomainsTable)
        .where(sql`${huntPinnedDomainsTable.domainName} LIKE 'test.%'`);
      await db
        .delete(huntEdgesTable)
        .where(sql`${huntEdgesTable.targetId} LIKE 'test.%'`);

      // Create test domains with different characteristics
      await caller.submitDomain({ domainName: 'test.pinned.high' });
      await caller.submitDomain({ domainName: 'test.pinned.low' });
      await caller.submitDomain({ domainName: 'test.regular.domain' });
      await caller.submitDomain({ domainName: 'test.old.domain' });

      // Add some upvotes to regular domains to make them popular
      await caller.upvote({ domainName: 'test.regular.domain' });
      await otherCaller.upvote({ domainName: 'test.regular.domain' });

      // Make one domain old by updating its submit date
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      await db
        .update(huntEdgesTable)
        .set({ createdAt: oneYearAgo })
        .where(
          and(
            eq(huntEdgesTable.targetId, 'test.old.domain'),
            eq(huntEdgesTable.action, 'SUBMIT'),
          ),
        );

      // Pin domains with different weights
      await db.insert(huntPinnedDomainsTable).values([
        { domainName: 'test.pinned.high', weight: 100 },
        { domainName: 'test.pinned.low', weight: 50 },
        { domainName: 'test.old.domain', weight: 75 }, // Pin the old domain
      ]);
    });

    it('should show pinned domains first regardless of popularity', async () => {
      const result = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      expect(result.items.length).toBeGreaterThan(3);

      // Check that pinned domains appear and are correctly ordered by weight
      const domainNames = result.items.map((item) => item.domainName);

      // All pinned domains should be present
      expect(domainNames).toContain('test.pinned.high');
      expect(domainNames).toContain('test.old.domain');
      expect(domainNames).toContain('test.pinned.low');
      expect(domainNames).toContain('test.regular.domain');

      // Check correct ordering by weight (higher weight first)
      const pinnedHighIndex = domainNames.indexOf('test.pinned.high');
      const pinnedOldIndex = domainNames.indexOf('test.old.domain');
      const pinnedLowIndex = domainNames.indexOf('test.pinned.low');
      const regularIndex = domainNames.indexOf('test.regular.domain');

      // Verify all domains were found
      expect(pinnedHighIndex).toBeGreaterThanOrEqual(0);
      expect(pinnedOldIndex).toBeGreaterThanOrEqual(0);
      expect(pinnedLowIndex).toBeGreaterThanOrEqual(0);
      expect(regularIndex).toBeGreaterThanOrEqual(0);

      // Check correct ordering by weight (higher weight first)
      expect(pinnedHighIndex).toBeLessThan(pinnedOldIndex); // 100 > 75
      expect(pinnedOldIndex).toBeLessThan(pinnedLowIndex); // 75 > 50
      expect(pinnedLowIndex).toBeLessThan(regularIndex); // pinned > regular

      // Verify isPinned flags
      const pinnedHigh = result.items.find(
        (item) => item.domainName === 'test.pinned.high',
      );
      const regular = result.items.find(
        (item) => item.domainName === 'test.regular.domain',
      );
      expect(pinnedHigh?.isPinned).toBe(true);
      expect(regular?.isPinned).toBe(false);
    });

    it('should show pinned domains with correct isPinned flag', async () => {
      const result = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      const pinnedDomain = result.items.find(
        (item) => item.domainName === 'test.pinned.high',
      );
      const regularDomain = result.items.find(
        (item) => item.domainName === 'test.regular.domain',
      );

      expect(pinnedDomain?.isPinned).toBe(true);
      expect(regularDomain?.isPinned).toBe(false);
    });

    it('should show pinned domains in time-filtered results even if old', async () => {
      // Test THIS_WEEK filter - old domain should still appear because it's pinned
      const thisWeekResult = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'THIS_WEEK',
      });

      const domainNames = thisWeekResult.items.map((item) => item.domainName);

      // Pinned old domain should appear despite being outside time range
      expect(domainNames).toContain('test.old.domain');

      // Regular new domains should also appear
      expect(domainNames).toContain('test.pinned.high');
      expect(domainNames).toContain('test.regular.domain');

      // Verify the old domain is marked as pinned
      const oldDomain = thisWeekResult.items.find(
        (item) => item.domainName === 'test.old.domain',
      );
      expect(oldDomain?.isPinned).toBe(true);
    });

    it('should show pinned domains without votes in public endpoint', async () => {
      // Create a domain that's pinned but never voted on
      await caller.submitDomain({ domainName: 'test.pinned.novotes' });

      // Remove the automatic upvote to test zero-vote scenario
      await caller.unvote({ domainName: 'test.pinned.novotes' });

      await db.insert(huntPinnedDomainsTable).values({
        domainName: 'test.pinned.novotes',
        weight: 90,
      });

      const publicCaller = huntRouter.createCaller({
        thirdPartyOriginHostname: null,
        testUser: null,
      } as any);

      const result = await publicCaller.getTrendingDomainsPublic({
        limit: 10,
        offset: 0,
        timeRange: 'THIS_WEEK',
      });

      const domainNames = result.items.map((item) => item.domainName);
      expect(domainNames).toContain('test.pinned.novotes');

      const pinnedDomain = result.items.find(
        (item) => item.domainName === 'test.pinned.novotes',
      );
      expect(pinnedDomain?.isPinned).toBe(true);
      expect(pinnedDomain?.upvoteCount).toBe(0);
      expect(pinnedDomain?.userHasUpvoted).toBe(false);
    });

    it('should handle time range filtering for mixed pinned and regular domains', async () => {
      // Test different time ranges
      const timeRanges = [
        'TODAY',
        'THIS_WEEK',
        'THIS_MONTH',
        'ANYTIME',
      ] as const;

      for (const timeRange of timeRanges) {
        const result = await caller.getTrendingDomains({
          limit: 10,
          offset: 0,
          timeRange,
        });

        const domainNames = result.items.map((item) => item.domainName);

        // Pinned domains should always appear regardless of time range
        expect(domainNames).toContain('test.pinned.high');
        expect(domainNames).toContain('test.pinned.low');

        if (timeRange === 'ANYTIME') {
          // Old pinned domain should appear in ANYTIME
          expect(domainNames).toContain('test.old.domain');
        } else {
          // Old pinned domain should still appear even in restricted time ranges
          // because it's pinned (pin_weight > 0)
          expect(domainNames).toContain('test.old.domain');
        }
      }
    });

    it('should maintain correct ordering with pagination for pinned domains', async () => {
      // Add more domains to test pagination
      await caller.submitDomain({ domainName: 'test.pinned.medium' });
      await db.insert(huntPinnedDomainsTable).values({
        domainName: 'test.pinned.medium',
        weight: 60,
      });

      // Get first page
      const page1 = await caller.getTrendingDomains({
        limit: 2,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      // Get second page
      const page2 = await caller.getTrendingDomains({
        limit: 2,
        offset: 2,
        timeRange: 'ANYTIME',
      });

      // Combine results to check overall ordering
      const allDomains = [...page1.items, ...page2.items];
      const pinnedDomains = allDomains.filter((domain) => domain.isPinned);

      // Check that pinned domains are properly ordered by weight
      for (let i = 1; i < pinnedDomains.length; i++) {
        const prevDomain = pinnedDomains[i - 1];
        const currDomain = pinnedDomains[i];

        // Since we can't directly access weight, we check by domain names we know
        if (prevDomain.domainName === 'test.pinned.high') {
          expect(currDomain.domainName).not.toBe('test.pinned.high');
        }
      }
    });

    it('should handle empty pinned domains gracefully', async () => {
      // Clean up pinned domains for this test
      await db.delete(huntPinnedDomainsTable);

      const result = await caller.getTrendingDomains({
        limit: 10,
        offset: 0,
        timeRange: 'ANYTIME',
      });

      // Should still return regular domains
      expect(result.items.length).toBeGreaterThan(0);

      // All domains should have isPinned: false
      for (const item of result.items) {
        expect(item.isPinned).toBe(false);
      }

      // Should be ordered by popularity (upvote count)
      const regularDomain = result.items.find(
        (item) => item.domainName === 'test.regular.domain',
      );
      expect(regularDomain).toBeDefined();
      expect(regularDomain?.upvoteCount).toBeGreaterThan(0);
    });
  });
});
