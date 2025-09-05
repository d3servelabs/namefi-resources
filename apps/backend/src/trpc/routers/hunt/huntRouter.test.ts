import {
  type UserSelect,
  db,
  huntEdgesTable,
  huntPinnedDomainsTable,
  huntAwardsTable,
  huntCampaignsTable,
  huntCampaignDomainsTable,
  usersTable,
} from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { config } from 'dotenv';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../../base';
import { huntRouter } from './huntRouter';
import { secrets } from '../../../lib/env';
import { getUserUpvoteStatus } from '../../../services/hunt/domain.service';

const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Random UUID
  privyUserId: 'test-privy-user-id-0',
} as UserSelect;

const otherUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  privyUserId: 'test-privy-user-id-1',
} as UserSelect;

type LocalTrpcContext = Omit<
  TrpcContext,
  'db' | 'req' | 'res' | 'sessionId' | 'honoVars'
>;

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
    // Clean up awards and campaigns first (using LIKE to match test domain patterns)
    await db
      .delete(huntAwardsTable)
      .where(sql`${huntAwardsTable.domainName} LIKE 'test.%'`);
    await db
      .delete(huntCampaignsTable)
      .where(
        sql`${huntCampaignsTable.campaignKey} LIKE 'test-%' OR ${huntCampaignsTable.campaignKey} LIKE 'TEST-%'`,
      );
    await db
      .delete(huntAwardsTable)
      .where(
        sql`${huntAwardsTable.campaignKey} LIKE 'test-%' OR ${huntAwardsTable.campaignKey} LIKE 'TEST-%'`,
      );
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
    // Clean up hunt edges created by NameFi_Team for test domains
    await db
      .delete(huntEdgesTable)
      .where(
        and(
          eq(huntEdgesTable.sourceId, 'NameFi_Team'),
          sql`${huntEdgesTable.targetId} LIKE 'test.%'`,
        ),
      );
    // Clean up campaign domains for test campaigns
    await db
      .delete(huntCampaignDomainsTable)
      .where(
        sql`${huntCampaignDomainsTable.campaignKey} LIKE 'test-%' OR ${huntCampaignDomainsTable.campaignKey} LIKE 'TEST-%'`,
      );
    // Then delete users
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [testUser.id, otherUser.id]));
  });

  const caller = huntRouter.createCaller({
    poweredByNamefiDomain: null,
    testUser,
  } satisfies LocalTrpcContext as TrpcContext);

  const otherCaller = huntRouter.createCaller({
    poweredByNamefiDomain: null,
    testUser: otherUser,
  } satisfies LocalTrpcContext as TrpcContext);

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
      const upvoteStatus = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.auto.upvote')],
        testUser.id,
      );
      expect(upvoteStatus['test.domain.auto.upvote']?.hasUpvoted).toBe(true);
      expect(upvoteStatus['test.domain.auto.upvote']?.upvotedAt).toBeTruthy();

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
      const upvoteStatus = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.shared')],
        otherUser.id,
      );
      expect(upvoteStatus['test.domain.shared']?.hasUpvoted).toBe(true);
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
      expect(result).toHaveProperty('userHasUpvoted', true);
      expect(result).toHaveProperty('userIsOwner', true);
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
      const status = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.for.votes')],
        testUser.id,
      );
      expect(status['test.domain.for.votes']?.hasUpvoted).toBe(true);
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
      const status = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.for.votes')],
        testUser.id,
      );
      expect(status['test.domain.for.votes']?.hasUpvoted).toBe(false);
    });

    it('should throw error when removing non-existent upvote', async () => {
      await expect(
        caller.unvote({ domainName: 'test.domain.for.votes' }),
      ).rejects.toThrow('Upvote not found');
    });

    it('should check upvote status correctly', async () => {
      // Initially no upvote
      let status = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.for.votes')],
        testUser.id,
      );
      expect(status['test.domain.for.votes']?.hasUpvoted).toBe(false);
      expect(status['test.domain.for.votes']?.upvotedAt).toBeNull();

      // After upvote
      await caller.upvote({ domainName: 'test.domain.for.votes' });
      status = await getUserUpvoteStatus(
        [namefiNormalizedDomainSchema.parse('test.domain.for.votes')],
        testUser.id,
      );
      expect(status['test.domain.for.votes']?.hasUpvoted).toBe(true);
      expect(status['test.domain.for.votes']?.upvotedAt).toBeTruthy();
    });
  });

  describe('Trending Domains', () => {
    describe('Trending Domains Basic', () => {
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
          expect(item).toHaveProperty('rank');
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

      it('should use proper period boundaries for time range filters', async () => {
        // Create domains with specific dates to test period boundaries
        const now = new Date();

        // Domain submitted yesterday (should not appear in TODAY)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0); // Noon yesterday

        await caller.submitDomain({ domainName: 'domain.yesterday' });
        await db
          .update(huntEdgesTable)
          .set({ createdAt: yesterday })
          .where(
            and(
              eq(huntEdgesTable.targetId, 'domain.yesterday'),
              eq(huntEdgesTable.action, 'SUBMIT'),
            ),
          );

        // Domain submitted last week (should not appear in THIS_WEEK)
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 8); // 8 days ago
        lastWeek.setHours(12, 0, 0, 0);

        await caller.submitDomain({ domainName: 'domain.lastweek' });
        await db
          .update(huntEdgesTable)
          .set({ createdAt: lastWeek })
          .where(
            and(
              eq(huntEdgesTable.targetId, 'domain.lastweek'),
              eq(huntEdgesTable.action, 'SUBMIT'),
            ),
          );

        // Domain submitted last month (should not appear in THIS_MONTH)
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setHours(12, 0, 0, 0);

        await caller.submitDomain({ domainName: 'domain.lastmonth' });
        await db
          .update(huntEdgesTable)
          .set({ createdAt: lastMonth })
          .where(
            and(
              eq(huntEdgesTable.targetId, 'domain.lastmonth'),
              eq(huntEdgesTable.action, 'SUBMIT'),
            ),
          );

        // Domain submitted last year (should not appear in THIS_YEAR)
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        lastYear.setHours(12, 0, 0, 0);

        await caller.submitDomain({ domainName: 'domain.lastyear' });
        await db
          .update(huntEdgesTable)
          .set({ createdAt: lastYear })
          .where(
            and(
              eq(huntEdgesTable.targetId, 'domain.lastyear'),
              eq(huntEdgesTable.action, 'SUBMIT'),
            ),
          );

        // Test TODAY filter - should not include yesterday's domain
        const todayResult = await caller.getTrendingDomains({
          limit: 50,
          offset: 0,
          timeRange: 'TODAY',
        });
        const todayDomainNames = todayResult.items.map(
          (item) => item.domainName,
        );
        expect(todayDomainNames).not.toContain('domain.yesterday');

        // Test THIS_WEEK filter - should not include last week's domain
        const thisWeekResult = await caller.getTrendingDomains({
          limit: 50,
          offset: 0,
          timeRange: 'THIS_WEEK',
        });
        const thisWeekDomainNames = thisWeekResult.items.map(
          (item) => item.domainName,
        );
        expect(thisWeekDomainNames).not.toContain('domain.lastweek');

        // Test THIS_MONTH filter - should not include last month's domain
        const thisMonthResult = await caller.getTrendingDomains({
          limit: 50,
          offset: 0,
          timeRange: 'THIS_MONTH',
        });
        const thisMonthDomainNames = thisMonthResult.items.map(
          (item) => item.domainName,
        );
        expect(thisMonthDomainNames).not.toContain('domain.lastmonth');

        // Test THIS_YEAR filter - should not include last year's domain
        const thisYearResult = await caller.getTrendingDomains({
          limit: 50,
          offset: 0,
          timeRange: 'THIS_YEAR',
        });
        const thisYearDomainNames = thisYearResult.items.map(
          (item) => item.domainName,
        );
        expect(thisYearDomainNames).not.toContain('domain.lastyear');

        // Test ANYTIME filter - should include all domains
        const anytimeResult = await caller.getTrendingDomains({
          limit: 50,
          offset: 0,
          timeRange: 'ANYTIME',
        });
        const anytimeDomainNames = anytimeResult.items.map(
          (item) => item.domainName,
        );
        expect(anytimeDomainNames).toContain('domain.yesterday');
        expect(anytimeDomainNames).toContain('domain.lastweek');
        expect(anytimeDomainNames).toContain('domain.lastmonth');
        expect(anytimeDomainNames).toContain('domain.lastyear');
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

    describe('Tied Rankings', () => {
      beforeEach(async () => {
        // Setup domains with specific vote counts to test tied rankings

        // Domain5: 2 votes (rank 5)
        await caller.submitDomain({ domainName: 'test.tied.domain5' });
        await caller.unvote({ domainName: 'test.tied.domain5' });

        // Domain4: 1 vote (rank 4, after the tie)
        await caller.submitDomain({ domainName: 'test.tied.domain4' });
        await caller.unvote({ domainName: 'test.tied.domain4' });

        // Domain2 and Domain3: 2 votes each (tied for rank 2)
        await caller.submitDomain({ domainName: 'test.tied.domain3' });
        await caller.submitDomain({ domainName: 'test.tied.domain2' });

        // Domain1: 3 votes (rank 1)
        await caller.submitDomain({ domainName: 'test.tied.domain1' });
        await otherCaller.upvote({ domainName: 'test.tied.domain1' });
      });

      it('should handle tied rankings correctly (1,2,2,4,5)', async () => {
        const result = await caller.getTrendingDomains({
          limit: 10,
          offset: 0,
          timeRange: 'TODAY',
        });

        // Filter to our test domains only
        const testDomains = result.items.filter((item) =>
          item.domainName.includes('test.tied.'),
        );

        expect(testDomains).toHaveLength(5);

        // Sort test domains by their position in the result to get relative ranking
        const sortedTestDomains = testDomains.sort((a, b) => a.rank - b.rank);

        // Check relative ranking and vote counts
        expect(sortedTestDomains[0].domainName).toBe('test.tied.domain1');
        expect(sortedTestDomains[0].upvoteCount).toBe(2);

        // Domain2 and Domain3 should be tied for the same rank (next highest after domain1)
        expect(sortedTestDomains[1].upvoteCount).toBe(1);
        expect(sortedTestDomains[2].upvoteCount).toBe(1);
        expect(sortedTestDomains[1].rank).toBe(sortedTestDomains[2].rank);

        // Domain4 should have 0 votes and rank after the tie
        expect(sortedTestDomains[3].domainName).toBe('test.tied.domain4');
        expect(sortedTestDomains[3].upvoteCount).toBe(0);
        expect(sortedTestDomains[3].rank).toBeGreaterThan(
          sortedTestDomains[2].rank,
        );

        // Domain5 should have 0 votes and same rank as domain4 (both have 0 votes)
        expect(sortedTestDomains[4].domainName).toBe('test.tied.domain5');
        expect(sortedTestDomains[4].upvoteCount).toBe(0);
        expect(sortedTestDomains[4].rank).toBe(sortedTestDomains[3].rank);

        // Verify ranking order: domain1 > (domain2 = domain3) > (domain4 = domain5)
        expect(sortedTestDomains[0].rank).toBeLessThan(
          sortedTestDomains[1].rank,
        );
        expect(sortedTestDomains[1].rank).toBeLessThan(
          sortedTestDomains[3].rank,
        );
      });

      it('should handle tied rankings correctly (1,2,2,4,5) for public endpoint', async () => {
        const result = await caller.getTrendingDomainsPublic({
          limit: 10,
          offset: 0,
          timeRange: 'TODAY',
        });

        // Filter to our test domains only
        const testDomains = result.items.filter((item) =>
          item.domainName.includes('test.tied.'),
        );

        expect(testDomains).toHaveLength(5);

        // Sort test domains by their position in the result to get relative ranking
        const sortedTestDomains = testDomains.sort((a, b) => a.rank - b.rank);

        // Check relative ranking and vote counts
        expect(sortedTestDomains[0].domainName).toBe('test.tied.domain1');
        expect(sortedTestDomains[0].upvoteCount).toBe(2);

        // Domain2 and Domain3 should be tied for the same rank (next highest after domain1)
        expect(sortedTestDomains[1].upvoteCount).toBe(1);
        expect(sortedTestDomains[2].upvoteCount).toBe(1);
        expect(sortedTestDomains[1].rank).toBe(sortedTestDomains[2].rank);

        // Domain4 should have 0 votes and rank after the tie
        expect(sortedTestDomains[3].domainName).toBe('test.tied.domain4');
        expect(sortedTestDomains[3].upvoteCount).toBe(0);
        expect(sortedTestDomains[3].rank).toBeGreaterThan(
          sortedTestDomains[2].rank,
        );

        // Domain5 should have 0 votes and same rank as domain4 (both have 0 votes)
        expect(sortedTestDomains[4].domainName).toBe('test.tied.domain5');
        expect(sortedTestDomains[4].upvoteCount).toBe(0);
        expect(sortedTestDomains[4].rank).toBe(sortedTestDomains[3].rank);

        // Verify ranking order: domain1 > (domain2 = domain3) > (domain4 = domain5)
        expect(sortedTestDomains[0].rank).toBeLessThan(
          sortedTestDomains[1].rank,
        );
        expect(sortedTestDomains[1].rank).toBeLessThan(
          sortedTestDomains[3].rank,
        );
      });

      it('should handle tied rankings across pagination boundaries', async () => {
        const page2 = await caller.getTrendingDomains({
          limit: 2,
          offset: 2,
          timeRange: 'TODAY',
        });

        expect(page2.items[0].rank).toBe(2);
      });

      it('should handle tied rankings across pagination boundaries for public endpoint', async () => {
        const page2 = await caller.getTrendingDomainsPublic({
          limit: 2,
          offset: 2,
          timeRange: 'TODAY',
        });

        expect(page2.items[0].rank).toBe(2);
      });
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
        poweredByNamefiDomain: null,
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
        expect(item).toHaveProperty('rank');
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
        poweredByNamefiDomain: null,
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
      expect(result).toHaveProperty('userIsOwner', false);
      expect(result).toHaveProperty('userSubmittedAt', null);
    });

    it('should handle non-existent domain in public getDomainDetail', async () => {
      const publicCaller = huntRouter.createCaller({
        poweredByNamefiDomain: null,
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
        poweredByNamefiDomain: null,
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
        expect(item).toHaveProperty('rank');
      }
    });

    it('should handle pagination correctly in public trending domains', async () => {
      const publicCaller = huntRouter.createCaller({
        poweredByNamefiDomain: null,
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
        {
          domainName: namefiNormalizedDomainSchema.parse('test.pinned.high'),
          weight: 100,
        },
        {
          domainName: namefiNormalizedDomainSchema.parse('test.pinned.low'),
          weight: 50,
        },
        {
          domainName: namefiNormalizedDomainSchema.parse('test.old.domain'),
          weight: 75,
        }, // Pin the old domain
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
      const pinnedHighIndex = domainNames.indexOf(
        namefiNormalizedDomainSchema.parse('test.pinned.high'),
      );
      const pinnedOldIndex = domainNames.indexOf(
        namefiNormalizedDomainSchema.parse('test.old.domain'),
      );
      const pinnedLowIndex = domainNames.indexOf(
        namefiNormalizedDomainSchema.parse('test.pinned.low'),
      );
      const regularIndex = domainNames.indexOf(
        namefiNormalizedDomainSchema.parse('test.regular.domain'),
      );

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
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.pinned.high'),
      );
      const regular = result.items.find(
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.regular.domain'),
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
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.pinned.high'),
      );
      const regularDomain = result.items.find(
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.regular.domain'),
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
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.old.domain'),
      );
      expect(oldDomain?.isPinned).toBe(true);
    });

    it('should show pinned domains without votes in public endpoint', async () => {
      // Create a domain that's pinned but never voted on
      await caller.submitDomain({ domainName: 'test.pinned.novotes' });

      // Remove the automatic upvote to test zero-vote scenario
      await caller.unvote({ domainName: 'test.pinned.novotes' });

      await db.insert(huntPinnedDomainsTable).values({
        domainName: namefiNormalizedDomainSchema.parse('test.pinned.novotes'),
        weight: 90,
      });

      const publicCaller = huntRouter.createCaller({
        poweredByNamefiDomain: null,
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
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.pinned.novotes'),
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
        domainName: namefiNormalizedDomainSchema.parse('test.pinned.medium'),
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
        if (
          prevDomain.domainName ===
          namefiNormalizedDomainSchema.parse('test.pinned.high')
        ) {
          expect(currDomain.domainName).not.toBe(
            namefiNormalizedDomainSchema.parse('test.pinned.high'),
          );
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
        (item) =>
          item.domainName ===
          namefiNormalizedDomainSchema.parse('test.regular.domain'),
      );
      expect(regularDomain).toBeDefined();
      expect(regularDomain?.upvoteCount).toBeGreaterThan(0);
    });
  });

  describe('Awards System', () => {
    describe('Period Awards', () => {
      beforeEach(async () => {
        // Create test awards for period-based rankings
        await db.insert(huntAwardsTable).values([
          {
            domainName:
              namefiNormalizedDomainSchema.parse('test.winner.weekly'),
            type: 'WEEKLY',
            periodKey: 'WEEKLY-2025-27',
            rank: 1,
            reason: 'July 3rd, 2025',
            upvoteCount: 100,
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.winner.weekly2',
            ),
            type: 'WEEKLY',
            periodKey: 'WEEKLY-2025-27', // Same period key as first award
            rank: 2,
            reason: 'July 8th, 2025',
            upvoteCount: 80,
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.winner.monthly',
            ),
            type: 'MONTHLY',
            periodKey: 'MONTHLY-2025-07',
            rank: 1,
            reason: 'July 8th, 2025',
            upvoteCount: 200,
          },
        ]);
      });

      it('should get period awards with correct ordering', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getPeriodAwards({
          type: 'WEEKLY',
          periodKey: 'WEEKLY-2025-27',
          offset: 0,
          limit: 10,
        });

        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('hasMore', false);
        expect(result.items).toHaveLength(2);

        // Check correct ordering by rank
        expect(result.items[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.winner.weekly'),
        );
        expect(result.items[0].rank).toBe(1);
        expect(result.items[0].upvoteCount).toBe(0);
        expect(result.items[0].reason).toBe('July 3rd, 2025');

        expect(result.items[1].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.winner.weekly2'),
        );
        expect(result.items[1].rank).toBe(2);
        expect(result.items[1].upvoteCount).toBe(0);

        // Check that all items have consistent fields
        for (const item of result.items) {
          expect(item).toHaveProperty('domainName');
          expect(item).toHaveProperty('rank');
          expect(item).toHaveProperty('upvoteCount');
          expect(item).toHaveProperty('reason');
          expect(item).toHaveProperty('awardedAt');
          expect(item).toHaveProperty('isPinned', false);
          expect(item).toHaveProperty('userHasUpvoted', false);
          expect(item).toHaveProperty('tags');
          expect(Array.isArray(item.tags)).toBe(true);
        }
      });

      it('should handle pagination for period awards', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const page1 = await publicCaller.getPeriodAwards({
          type: 'WEEKLY',
          periodKey: 'WEEKLY-2025-27',
          offset: 0,
          limit: 1,
        });

        expect(page1.items).toHaveLength(1);
        expect(page1.hasMore).toBe(true);
        expect(page1.items[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.winner.weekly'),
        );

        const page2 = await publicCaller.getPeriodAwards({
          type: 'WEEKLY',
          periodKey: 'WEEKLY-2025-27',
          offset: 1,
          limit: 1,
        });

        expect(page2.items).toHaveLength(1);
        expect(page2.hasMore).toBe(false);
        expect(page2.items[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.winner.weekly2'),
        );
      });

      it('should return empty results for non-existent period', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getPeriodAwards({
          type: 'WEEKLY',
          periodKey: 'WEEKLY-2025-99',
          offset: 0,
          limit: 10,
        });

        expect(result.items).toHaveLength(0);
        expect(result.hasMore).toBe(false);
      });
    });

    describe('Campaign Awards', () => {
      let activeCampaignKey: string;
      let finishedCampaignKey: string;

      beforeEach(async () => {
        // Generate unique campaign keys for each test run
        const timestamp = Date.now();
        activeCampaignKey = `TEST-CV-${timestamp}`;
        finishedCampaignKey = `TEST-CTA-${timestamp}`;

        // Create test campaign
        await db.insert(huntCampaignsTable).values([
          {
            campaignKey: activeCampaignKey,
            name: 'Test CV',
            title: 'Test CV',
            description: 'Test CV',
            logoUrl: 'https://test.cv.logo.url',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2025-07-31'),
            status: 'ACTIVE',
          },
          {
            campaignKey: finishedCampaignKey,
            name: 'Test CTA',
            title: 'Test CTA',
            description: 'Test CTA',
            logoUrl: 'https://test.cta.logo.url',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2025-07-31'),
            status: 'AWARDED',
          },
        ]);

        // Create campaign domains for active campaign
        await db.insert(huntCampaignDomainsTable).values([
          {
            campaignKey: activeCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse('test.cv.domain1'),
            description: 'Test CV domain 1',
          },
          {
            campaignKey: activeCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse('test.cv.domain2'),
            description: 'Test CV domain 2',
          },
        ]);

        // Create domains and votes for active campaign
        await caller.submitDomain({ domainName: 'test.cv.domain1' });
        await caller.submitDomain({ domainName: 'test.cv.domain2' });
        await otherCaller.upvote({ domainName: 'test.cv.domain1' });

        // Create finalized awards for finished campaign
        await db.insert(huntAwardsTable).values([
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.finished.winner',
            ),
            type: 'CAMPAIGN',
            campaignKey: finishedCampaignKey,
            rank: 1,
            reason: 'July 8th, 2025',
            upvoteCount: 150,
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.finished.runner',
            ),
            type: 'CAMPAIGN',
            campaignKey: finishedCampaignKey,
            rank: 2,
            reason: 'July 8th, 2025',
            upvoteCount: 100,
          },
        ]);
      });

      it('should get active campaign with live rankings', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getCampaignPublic({
          campaignKey: activeCampaignKey,
          offset: 0,
          limit: 10,
        });

        expect(result).toHaveProperty('campaign');
        expect(result).toHaveProperty('rankings');
        expect(result).toHaveProperty('hasMore', false);

        // Check campaign details
        expect(result.campaign.campaignKey).toBe(activeCampaignKey);
        expect(result.campaign.title).toBe('Test CV');
        expect(result.campaign.status).toBe('ACTIVE');

        // Check live rankings
        expect(result.rankings).toHaveLength(2);

        // Should be ordered by upvote count (domain1 has more votes)
        expect(result.rankings[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.cv.domain1'),
        );
        expect(result.rankings[0].rank).toBe(1);
        expect(result.rankings[0].upvoteCount).toBe(2); // submitter + otherUser

        expect(result.rankings[1].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.cv.domain2'),
        );
        expect(result.rankings[1].rank).toBe(2);
        expect(result.rankings[1].upvoteCount).toBe(1); // submitter only

        // Check that all items have consistent fields
        for (const item of result.rankings) {
          expect(item).toHaveProperty('domainName');
          expect(item).toHaveProperty('rank');
          expect(item).toHaveProperty('upvoteCount');
          expect(item).toHaveProperty('isPinned', false);
          expect(item).toHaveProperty('userHasUpvoted', false);
          expect(item).toHaveProperty('tags');
          expect(Array.isArray(item.tags)).toBe(true);
        }
      });

      it('should get finished campaign with finalized awards', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getCampaignPublic({
          campaignKey: finishedCampaignKey,
          offset: 0,
          limit: 10,
        });

        expect(result).toHaveProperty('campaign');
        expect(result).toHaveProperty('rankings');
        expect(result).toHaveProperty('hasMore', false);

        // Check campaign details
        expect(result.campaign.campaignKey).toBe(finishedCampaignKey);
        expect(result.campaign.title).toBe('Test CTA');
        expect(result.campaign.status).toBe('AWARDED');

        // Check finalized awards
        expect(result.rankings).toHaveLength(2);

        expect(result.rankings[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.finished.winner'),
        );
        expect(result.rankings[0].rank).toBe(1);
        expect(result.rankings[0].upvoteCount).toBe(0);
        expect(result.rankings[0].reason).toBe('July 8th, 2025');

        expect(result.rankings[1].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.finished.runner'),
        );
        expect(result.rankings[1].rank).toBe(2);
        expect(result.rankings[1].upvoteCount).toBe(0);
        expect(result.rankings[1].reason).toBe('July 8th, 2025');
      });

      it('should throw error for non-existent campaign', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        await expect(
          publicCaller.getCampaignPublic({
            campaignKey: 'non-existent-campaign',
            offset: 0,
            limit: 10,
          }),
        ).rejects.toThrow('Campaign not found');
      });

      it('should handle pagination for campaign rankings', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const page1 = await publicCaller.getCampaignPublic({
          campaignKey: finishedCampaignKey,
          offset: 0,
          limit: 1,
        });

        expect(page1.rankings).toHaveLength(1);
        expect(page1.hasMore).toBe(true);
        expect(page1.rankings[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.finished.winner'),
        );

        const page2 = await publicCaller.getCampaignPublic({
          campaignKey: finishedCampaignKey,
          offset: 1,
          limit: 1,
        });

        expect(page2.rankings).toHaveLength(1);
        expect(page2.hasMore).toBe(false);
        expect(page2.rankings[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.finished.runner'),
        );
      });

      it('should return all campaign domains even if they have no votes', async () => {
        // Generate unique campaign key
        const timestamp = Date.now();
        const testCampaignKey = `TEST-NO-VOTES-${timestamp}`;

        // Create test campaign
        await db.insert(huntCampaignsTable).values({
          campaignKey: testCampaignKey,
          name: 'Test No Votes Campaign',
          title: 'Test No Votes Campaign',
          description: 'Test campaign with domains that have no votes',
          logoUrl: 'https://test.novotes.logo.url',
          startDate: new Date('2025-07-01'),
          endDate: new Date('2025-07-31'),
          status: 'ACTIVE',
        });

        // Create campaign domains - some will have votes, some won't
        await db.insert(huntCampaignDomainsTable).values([
          {
            campaignKey: testCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse(
              'test.novotes.domain1',
            ),
            description: 'Test domain 1',
          },
          {
            campaignKey: testCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse(
              'test.novotes.domain2',
            ),
            description: 'Test domain 2',
          },
          {
            campaignKey: testCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse(
              'test.novotes.domain3',
            ),
            description: 'Test domain 3',
          },
        ]);

        // Only submit and vote for one domain
        await caller.submitDomain({ domainName: 'test.novotes.domain1' });
        await otherCaller.upvote({ domainName: 'test.novotes.domain1' });

        // The other two domains are not submitted or voted on at all
        // They should still appear in campaign results with 0 votes

        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getCampaignPublic({
          campaignKey: testCampaignKey,
          offset: 0,
          limit: 10,
        });

        expect(result).toHaveProperty('campaign');
        expect(result).toHaveProperty('rankings');
        expect(result).toHaveProperty('hasMore', false);

        // All 3 domains should be present in the results
        expect(result.rankings).toHaveLength(3);

        const domainNames = result.rankings.map((r) => r.domainName);
        expect(domainNames).toContain('test.novotes.domain1');
        expect(domainNames).toContain('test.novotes.domain2');
        expect(domainNames).toContain('test.novotes.domain3');

        // The voted domain should be first with 2 votes
        expect(result.rankings[0].domainName).toBe(
          namefiNormalizedDomainSchema.parse('test.novotes.domain1'),
        );
        expect(result.rankings[0].upvoteCount).toBe(2);
        expect(result.rankings[0].rank).toBe(1);

        // The other two domains should have 0 votes
        const domain2 = result.rankings.find(
          (r) =>
            r.domainName ===
            namefiNormalizedDomainSchema.parse('test.novotes.domain2'),
        );
        const domain3 = result.rankings.find(
          (r) =>
            r.domainName ===
            namefiNormalizedDomainSchema.parse('test.novotes.domain3'),
        );

        expect(domain2?.upvoteCount).toBe(0);
        expect(domain3?.upvoteCount).toBe(0);
        expect(domain2?.isPinned).toBe(false);
        expect(domain3?.isPinned).toBe(false);
        expect(domain2?.userHasUpvoted).toBe(false);
        expect(domain3?.userHasUpvoted).toBe(false);

        // Check that they have proper rank values
        expect(result.rankings[1].rank).toBe(2);
        expect(result.rankings[2].rank).toBe(2);
      });
    });

    describe('Domain Awards', () => {
      let domainCampaignKey1: string;
      let domainCampaignKey2: string;

      beforeEach(async () => {
        // Generate unique campaign keys for each test run
        const timestamp = Date.now();
        domainCampaignKey1 = `TEST-CV-DOMAIN-${timestamp}`;
        domainCampaignKey2 = `TEST-CTA-DOMAIN-${timestamp}`;

        // Create test campaigns
        await db.insert(huntCampaignsTable).values([
          {
            campaignKey: domainCampaignKey1,
            name: 'Test CV',
            title: 'Test CV',
            description: 'Test CV',
            logoUrl: 'https://test.cv.logo.url',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
            status: 'AWARDED',
          },
          {
            campaignKey: domainCampaignKey2,
            name: 'Test CTA',
            title: 'Test CTA',
            description: 'Test CTA',
            logoUrl: 'https://test.cta.logo.url',
            startDate: new Date('2025-02-01'),
            endDate: new Date('2025-02-28'),
            status: 'AWARDED',
          },
        ]);

        // Create multiple awards for a single domain
        await db.insert(huntAwardsTable).values([
          {
            domainName:
              namefiNormalizedDomainSchema.parse('test.winner.domain'),
            type: 'WEEKLY',
            periodKey: 'WEEKLY-2025-27',
            rank: 1,
            reason: 'July 3rd, 2025',
            upvoteCount: 100,
          },
          {
            domainName:
              namefiNormalizedDomainSchema.parse('test.winner.domain'),
            type: 'MONTHLY',
            periodKey: 'MONTHLY-2025-07',
            rank: 2,
            reason: 'July 8th, 2025',
            upvoteCount: 200,
          },
          {
            domainName:
              namefiNormalizedDomainSchema.parse('test.winner.domain'),
            type: 'CAMPAIGN',
            campaignKey: domainCampaignKey1,
            rank: 1,
            reason: 'July 8th, 2025',
            upvoteCount: 150,
          },
          {
            domainName:
              namefiNormalizedDomainSchema.parse('test.winner.domain'),
            type: 'CAMPAIGN',
            campaignKey: domainCampaignKey2,
            rank: 3,
            reason: 'July 8th, 2025',
            upvoteCount: 120,
          },
        ]);
      });

      it('should get all awards for a domain', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getDomainAwards({
          domainName: namefiNormalizedDomainSchema.parse('test.winner.domain'),
        });

        // Result should be an array of awards
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(4);

        // Check that awards are ordered by creation date (newest first)
        const awardTypes = result.map((award) => award.type);
        expect(awardTypes).toContain('WEEKLY');
        expect(awardTypes).toContain('MONTHLY');
        expect(awardTypes).toContain('CAMPAIGN');

        // Check campaign awards have campaign keys
        const campaignAwards = result.filter(
          (award) => award.type === 'CAMPAIGN',
        );
        expect(campaignAwards).toHaveLength(2);

        for (const award of campaignAwards) {
          expect(award).toHaveProperty('campaignKey');
          expect(award.campaignKey).toBeTruthy();
        }

        // Check period awards have period keys
        const periodAwards = result.filter(
          (award) => award.type !== 'CAMPAIGN',
        );
        for (const award of periodAwards) {
          expect(award).toHaveProperty('periodKey');
          expect(award.periodKey).toBeTruthy();
        }

        // Check all awards have required fields
        for (const award of result) {
          expect(award).toHaveProperty('id');
          expect(award).toHaveProperty('type');
          expect(award).toHaveProperty('rank');
          expect(award).toHaveProperty('reason');
          expect(award).toHaveProperty('upvoteCount');
          expect(award).toHaveProperty('awardedAt');
        }
      });

      it('should return empty results for domain with no awards', async () => {
        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getDomainAwards({
          domainName: namefiNormalizedDomainSchema.parse(
            'test.no.awards.domain',
          ),
        });

        // Result should be an empty array
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      it('should handle domain with only period awards', async () => {
        // Create a domain with only period-based awards
        await db.insert(huntAwardsTable).values([
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.period.only.domain',
            ),
            type: 'DAILY',
            periodKey: 'DAILY-2025-07-15',
            rank: 1,
            reason: 'July 15th, 2025',
            upvoteCount: 50,
          },
        ]);

        const publicCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
        } as any);

        const result = await publicCaller.getDomainAwards({
          domainName: namefiNormalizedDomainSchema.parse(
            'test.period.only.domain',
          ),
        });

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('DAILY');
        expect(result[0].periodKey).toBe('DAILY-2025-07-15');
        expect(result[0].campaignKey).toBeNull();
      });
    });
  });

  describe('Campaign Management', () => {
    describe('createCampaign', () => {
      it('should create a new campaign successfully', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.createCampaign({
          campaignKey: 'test-campaign',
          name: 'Test Campaign',
          title: 'Test Campaign Title',
          description: 'Test campaign description',
          logoUrl: 'https://test.campaign.logo.url',
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
        });

        expect(result).toMatchObject({
          campaignKey: 'test-campaign',
          title: 'Test Campaign Title',
          description: 'Test campaign description',
          logoUrl: 'https://test.campaign.logo.url',
          status: 'DRAFT',
          domainsAdded: 0,
        });
        expect(result.campaignKey).toBe('test-campaign');
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.createdAt).toBeInstanceOf(Date);
      });

      it('should create a campaign with domains and create SUBMIT edges', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domains = [
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.campaign.domain1',
            ),
            description: 'Test campaign domain 1 description',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.campaign.domain2',
            ),
            description: 'Test campaign domain 2 description',
          },
        ];

        const result = await apiCaller.createCampaign({
          campaignKey: 'test-campaign-with-domains',
          name: 'Test Campaign With Domains',
          title: 'Test Campaign With Domains Title',
          description: 'Test campaign with domains description',
          logoUrl: 'https://test.campaign.logo.url',
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
          domains,
        });

        expect(result).toMatchObject({
          name: 'Test Campaign With Domains',
          title: 'Test Campaign With Domains Title',
          description: 'Test campaign with domains description',
          logoUrl: 'https://test.campaign.logo.url',
          status: 'DRAFT',
          domainsAdded: 2,
        });

        // Check that campaign domains were created
        const campaignDomains = await db
          .select()
          .from(huntCampaignDomainsTable)
          .where(eq(huntCampaignDomainsTable.campaignKey, result.campaignKey));

        expect(campaignDomains).toHaveLength(2);
        expect(campaignDomains.map((d) => d.domainName)).toEqual(
          domains.map((d) => d.domainName),
        );

        // Check that SUBMIT edges were created with NameFi_Team as creator
        const submitEdges = await db
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, 'NameFi_Team'), // NameFi_Team user ID
              eq(huntEdgesTable.action, 'SUBMIT'),
              inArray(
                huntEdgesTable.targetId,
                domains.map((d) => d.domainName),
              ),
            ),
          );

        expect(submitEdges).toHaveLength(2);
        expect(submitEdges.map((e) => e.targetId)).toEqual(
          domains.map((d) => d.domainName),
        );
      });

      it('should create a campaign with domains and avoid duplicate SUBMIT edges', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domainName = namefiNormalizedDomainSchema.parse(
          'test.campaign.existing.edge',
        );

        // Create a SUBMIT edge for the domain first
        await db.insert(huntEdgesTable).values({
          sourceType: 'USER',
          sourceId: 'NameFi_Team',
          targetType: 'DOMAIN',
          targetId: domainName,
          action: 'SUBMIT',
        });

        const domains = [
          {
            domainName,
            description: 'Test campaign domain with existing edge',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.campaign.new.domain',
            ),
            description: 'Test campaign domain without existing edge',
          },
        ];

        const result = await apiCaller.createCampaign({
          campaignKey: 'test-campaign-with-existing-edges',
          name: 'Test Campaign With Existing Edges',
          title: 'Test Campaign With Existing Edges Title',
          description: 'Test campaign with existing edges description',
          logoUrl: 'https://test.campaign.logo.url',
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
          domains,
        });

        expect(result).toMatchObject({
          name: 'Test Campaign With Existing Edges',
          title: 'Test Campaign With Existing Edges Title',
          description: 'Test campaign with existing edges description',
          logoUrl: 'https://test.campaign.logo.url',
          status: 'DRAFT',
          domainsAdded: 2,
        });

        // Check that campaign domains were created
        const campaignDomains = await db
          .select()
          .from(huntCampaignDomainsTable)
          .where(eq(huntCampaignDomainsTable.campaignKey, result.campaignKey));

        expect(campaignDomains).toHaveLength(2);
        expect(campaignDomains.map((d) => d.domainName)).toEqual(
          domains.map((d) => d.domainName),
        );

        // Check that only one new SUBMIT edge was created (for the new domain)
        const submitEdges = await db
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, 'NameFi_Team'),
              eq(huntEdgesTable.action, 'SUBMIT'),
              inArray(
                huntEdgesTable.targetId,
                domains.map((d) => d.domainName),
              ),
            ),
          );

        // Should have 2 edges total: 1 existing + 1 new
        expect(submitEdges).toHaveLength(2);

        // Verify the edges are for the correct domains
        const edgeDomainNames = submitEdges.map((e) => e.targetId);
        expect(edgeDomainNames).toContain(domainName);
        expect(edgeDomainNames).toContain('test.campaign.new.domain');
      });

      it('should reject campaign with invalid dates', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await expect(
          apiCaller.createCampaign({
            campaignKey: 'test-campaign',
            name: 'Test Campaign',
            title: 'Test Campaign Title',
            description: 'Test campaign description',
            logoUrl: 'https://test.campaign.logo.url',
            startDate: '2025-01-31T23:59:59Z',
            endDate: '2025-01-01T00:00:00Z', // End date before start date
          }),
        ).rejects.toThrow('Start date must be before end date');
      });
    });

    describe('addDomainsToCampaign', () => {
      let testCampaignKey: string;

      beforeEach(async () => {
        // Create a test campaign
        const [campaign] = await db
          .insert(huntCampaignsTable)
          .values({
            campaignKey: 'test-add-domains-campaign',
            name: 'Test Add Domains Campaign',
            title: 'Test Add Domains Campaign Title',
            description: 'Test campaign for adding domains',
            logoUrl: 'https://test.campaign.logo.url',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
            status: 'DRAFT',
          })
          .returning();

        testCampaignKey = campaign.campaignKey;
      });

      it('should add domains to campaign successfully', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domains = [
          {
            domainName: namefiNormalizedDomainSchema.parse('test.add.domain1'),
            description: 'Test campaign domain 1 description',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse('test.add.domain2'),
            description: 'Test campaign domain 2 description',
          },
        ];

        const result = await apiCaller.addDomainsToCampaign({
          campaignKey: testCampaignKey,
          domains,
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          domains: domains,
          domainsAdded: 2,
          edgesCreated: 2,
        });

        // Check that campaign domains were created
        const campaignDomains = await db
          .select()
          .from(huntCampaignDomainsTable)
          .where(eq(huntCampaignDomainsTable.campaignKey, testCampaignKey));

        expect(campaignDomains).toHaveLength(2);
        expect(campaignDomains.map((d) => d.domainName)).toEqual(
          domains.map((d) => d.domainName),
        );

        // Check that SUBMIT edges were created with NameFi_Team as creator
        const submitEdges = await db
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, 'NameFi_Team'), // NameFi_Team user ID
              eq(huntEdgesTable.action, 'SUBMIT'),
              inArray(
                huntEdgesTable.targetId,
                domains.map((d) => d.domainName),
              ),
            ),
          );

        expect(submitEdges).toHaveLength(2);
        expect(submitEdges.map((e) => e.targetId)).toEqual(
          domains.map((d) => d.domainName),
        );
      });

      it('should add only new domains when some domains already exist in campaign', async () => {
        // Add a domain to the campaign first
        await db.insert(huntCampaignDomainsTable).values({
          campaignKey: testCampaignKey,
          domainName: namefiNormalizedDomainSchema.parse(
            'test.existing.domain',
          ),
          description: 'Test campaign description',
        });

        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domains = [
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.existing.domain',
            ), // Already exists
            description: 'Test campaign description',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse('test.new.domain'),
            description: 'Test campaign description',
          },
        ];

        const result = await apiCaller.addDomainsToCampaign({
          campaignKey: testCampaignKey,
          domains,
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          domains: [domains[1]], // Only the new domain
          domainsAdded: 1,
          edgesCreated: 1,
        });

        // Check that only the new domain was added to campaign
        const campaignDomains = await db
          .select()
          .from(huntCampaignDomainsTable)
          .where(eq(huntCampaignDomainsTable.campaignKey, testCampaignKey));

        expect(campaignDomains).toHaveLength(2); // 1 existing + 1 new
        expect(campaignDomains.map((d) => d.domainName)).toContain(
          'test.existing.domain',
        );
        expect(campaignDomains.map((d) => d.domainName)).toContain(
          'test.new.domain',
        );

        // Check that only one new SUBMIT edge was created
        const submitEdges = await db
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, 'NameFi_Team'),
              eq(huntEdgesTable.action, 'SUBMIT'),
              inArray(
                huntEdgesTable.targetId,
                domains.map((d) => d.domainName),
              ),
            ),
          );

        expect(submitEdges).toHaveLength(1);
        expect(submitEdges[0].targetId).toBe('test.new.domain');
      });

      it('should return success when all domains already exist in campaign', async () => {
        // Add domains to the campaign first
        await db.insert(huntCampaignDomainsTable).values([
          {
            campaignKey: testCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse(
              'test.existing.domain1',
            ),
            description: 'Test campaign description 1',
          },
          {
            campaignKey: testCampaignKey,
            domainName: namefiNormalizedDomainSchema.parse(
              'test.existing.domain2',
            ),
            description: 'Test campaign description 2',
          },
        ]);

        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domains = [
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.existing.domain1',
            ), // Already exists
            description: 'Test campaign description 1',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.existing.domain2',
            ), // Already exists
            description: 'Test campaign description 2',
          },
        ];

        const result = await apiCaller.addDomainsToCampaign({
          campaignKey: testCampaignKey,
          domains,
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          domains: [],
          domainsAdded: 0,
          message: 'All domains are already in this campaign',
        });
      });

      it('should add domains and avoid duplicate SUBMIT edges', async () => {
        const domainName = namefiNormalizedDomainSchema.parse(
          'test.add.existing.edge',
        );

        // Create a SUBMIT edge for the domain first
        await db.insert(huntEdgesTable).values({
          sourceType: 'USER',
          sourceId: 'NameFi_Team',
          targetType: 'DOMAIN',
          targetId: domainName,
          action: 'SUBMIT',
        });

        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const domains = [
          {
            domainName,
            description: 'Test campaign domain with existing edge',
          },
          {
            domainName: namefiNormalizedDomainSchema.parse(
              'test.add.new.domain',
            ),
            description: 'Test campaign domain without existing edge',
          },
        ];

        const result = await apiCaller.addDomainsToCampaign({
          campaignKey: testCampaignKey,
          domains,
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          domains: domains,
          domainsAdded: 2,
          edgesCreated: 1, // Only one new edge created
        });

        // Check that campaign domains were created
        const campaignDomains = await db
          .select()
          .from(huntCampaignDomainsTable)
          .where(eq(huntCampaignDomainsTable.campaignKey, testCampaignKey));

        expect(campaignDomains).toHaveLength(2);
        expect(campaignDomains.map((d) => d.domainName)).toEqual(
          domains.map((d) => d.domainName),
        );

        // Check that only one new SUBMIT edge was created
        const submitEdges = await db
          .select()
          .from(huntEdgesTable)
          .where(
            and(
              eq(huntEdgesTable.sourceType, 'USER'),
              eq(huntEdgesTable.sourceId, 'NameFi_Team'),
              eq(huntEdgesTable.action, 'SUBMIT'),
              inArray(
                huntEdgesTable.targetId,
                domains.map((d) => d.domainName),
              ),
            ),
          );

        // Should have 2 edges total: 1 existing + 1 new
        expect(submitEdges).toHaveLength(2);

        // Verify the edges are for the correct domains
        const edgeDomainNames = submitEdges.map((e) => e.targetId);
        expect(edgeDomainNames).toContain(domainName);
        expect(edgeDomainNames).toContain('test.add.new.domain');
      });
    });

    describe('updateCampaignStatus', () => {
      let testCampaignKey: string;

      beforeEach(async () => {
        // Create a test campaign
        const [campaign] = await db
          .insert(huntCampaignsTable)
          .values({
            campaignKey: 'test-update-status-campaign',
            name: 'Test Update Status Campaign',
            title: 'Test Update Status Campaign Title',
            description: 'Test campaign for updating status',
            logoUrl: 'https://test.campaign.logo.url',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
            status: 'DRAFT',
          })
          .returning();

        testCampaignKey = campaign.campaignKey;
      });

      it('should update campaign status from DRAFT to ACTIVE', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          name: 'Test Update Status Campaign',
          title: 'Test Update Status Campaign Title',
          description: 'Test campaign for updating status',
          logoUrl: 'https://test.campaign.logo.url',
          status: 'ACTIVE',
          previousStatus: 'DRAFT',
        });
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it('should update campaign status from DRAFT to CANCELLED', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
          previousStatus: 'DRAFT',
        });
      });

      it('should update campaign status from ACTIVE to DRAFT', async () => {
        // First update to ACTIVE
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
        });

        // Then update back to DRAFT
        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'DRAFT',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          status: 'DRAFT',
          previousStatus: 'ACTIVE',
        });
      });

      it('should update campaign status from ACTIVE to CANCELLED', async () => {
        // First update to ACTIVE
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
        });

        // Then update to CANCELLED
        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
          previousStatus: 'ACTIVE',
        });
      });

      it('should update campaign status from CANCELLED to DRAFT', async () => {
        // First update to CANCELLED
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
        });

        // Then update back to DRAFT
        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'DRAFT',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          status: 'DRAFT',
          previousStatus: 'CANCELLED',
        });
      });

      it('should update campaign status from CANCELLED to ACTIVE', async () => {
        // First update to CANCELLED
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
        });

        // Then update to ACTIVE
        const result = await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
          previousStatus: 'CANCELLED',
        });
      });

      it('should reject invalid status transitions', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        // Test that we can't transition from DRAFT to ACTIVE twice (should stay ACTIVE)
        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'ACTIVE',
        });

        // Try to update to ACTIVE again (should be rejected as invalid transition)
        await expect(
          apiCaller.updateCampaignStatus({
            campaignKey: testCampaignKey,
            status: 'ACTIVE',
          }),
        ).rejects.toThrow('Invalid status transition from ACTIVE to ACTIVE');

        // Update to CANCELLED
        await apiCaller.updateCampaignStatus({
          campaignKey: testCampaignKey,
          status: 'CANCELLED',
        });

        // Try to update to CANCELLED again (should be rejected as invalid transition)
        await expect(
          apiCaller.updateCampaignStatus({
            campaignKey: testCampaignKey,
            status: 'CANCELLED',
          }),
        ).rejects.toThrow(
          'Invalid status transition from CANCELLED to CANCELLED',
        );
      });

      it('should reject non-existent campaign', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await expect(
          apiCaller.updateCampaignStatus({
            campaignKey: 'non-existent-campaign',
            status: 'ACTIVE',
          }),
        ).rejects.toThrow('Campaign not found');
      });

      it('should reject invalid status values', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        // Try to update to an invalid status
        await expect(
          apiCaller.updateCampaignStatus({
            campaignKey: testCampaignKey,
            status: 'INVALID_STATUS' as any,
          }),
        ).rejects.toThrow();
      });
    });

    describe('updateCampaign', () => {
      let testCampaignKey: string;

      beforeEach(async () => {
        // Create a test campaign
        const [campaign] = await db
          .insert(huntCampaignsTable)
          .values({
            campaignKey: 'test-update-campaign',
            name: 'Test Update Campaign',
            title: 'Test Update Campaign Title',
            description: 'Test campaign for updating details',
            logoUrl: 'https://test.campaign.logo.url',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
            status: 'DRAFT',
          })
          .returning();

        testCampaignKey = campaign.campaignKey;
      });

      it('should update campaign name and title', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.updateCampaign({
          campaignKey: testCampaignKey,
          name: 'Updated Test Campaign',
          title: 'Updated Test Campaign Title',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          name: 'Updated Test Campaign',
          title: 'Updated Test Campaign Title',
          description: 'Test campaign for updating details',
          logoUrl: 'https://test.campaign.logo.url',
          status: 'DRAFT',
        });
        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it('should update campaign description and logoUrl', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.updateCampaign({
          campaignKey: testCampaignKey,
          description: 'Updated description',
          logoUrl: 'https://updated.logo.url',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          name: 'Test Update Campaign',
          title: 'Test Update Campaign Title',
          description: 'Updated description',
          logoUrl: 'https://updated.logo.url',
          status: 'DRAFT',
        });
      });

      it('should update campaign dates', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        const result = await apiCaller.updateCampaign({
          campaignKey: testCampaignKey,
          startDate: '2025-02-01T00:00:00.000Z',
          endDate: '2025-02-28T23:59:59.999Z',
        });

        expect(result).toMatchObject({
          campaignKey: testCampaignKey,
          name: 'Test Update Campaign',
          title: 'Test Update Campaign Title',
          status: 'DRAFT',
        });
        expect(result.startDate).toEqual(new Date('2025-02-01T00:00:00.000Z'));
        expect(result.endDate).toEqual(new Date('2025-02-28T23:59:59.999Z'));
      });

      it('should reject update with invalid dates', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        // Try to update with end date before start date
        await expect(
          apiCaller.updateCampaign({
            campaignKey: testCampaignKey,
            startDate: '2025-01-15T00:00:00.000Z',
            endDate: '2025-01-10T00:00:00.000Z',
          }),
        ).rejects.toThrow('Start date must be before end date');
      });

      it('should reject non-existent campaign', async () => {
        const apiCaller = huntRouter.createCaller({
          poweredByNamefiDomain: null,
          testUser: null,
          req: {
            header: (name: string) => {
              if (name === 'x-api-key') return secrets.API_AUTH_KEY;
              return null;
            },
          },
        } as any);

        await expect(
          apiCaller.updateCampaign({
            campaignKey: 'non-existent-campaign',
            name: 'Updated Name',
          }),
        ).rejects.toThrow('Campaign not found');
      });
    });
  });
});
