import { describe, expect, it } from 'vitest';

const runLiveEmailCampaignTests =
  process.env.RUN_LIVE_EMAIL_CAMPAIGN_TESTS === '1';

describe.skipIf(!runLiveEmailCampaignTests)(
  'live campaign email smoke tests',
  () => {
    it('sends winback and surge emails with mock data and real SMTP', async () => {
      const toEnv = process.env.LIVE_EMAIL_TO;
      expect(toEnv, 'LIVE_EMAIL_TO must be set').toBeTruthy();
      if (!toEnv) {
        throw new Error('LIVE_EMAIL_TO is required');
      }

      const to = toEnv
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      expect(to.length).toBeGreaterThan(0);

      const { runCampaignEmailSmokeTest } = await import(
        './test-email-campaigns'
      );

      const result = await runCampaignEmailSmokeTest({
        campaign: 'all',
        to,
        recipientName:
          process.env.LIVE_EMAIL_RECIPIENT_NAME ?? 'Campaign Live Tester',
        recipientEmail: process.env.LIVE_EMAIL_RECIPIENT_EMAIL ?? to[0],
        poweredByNamefiDomain: process.env.LIVE_EMAIL_POWERED_BY ?? '0x.city',
        subjectPrefix: process.env.LIVE_EMAIL_SUBJECT_PREFIX ?? '[Live Test]',
        dryRun: false,
      });

      expect(result.sentCampaigns).toEqual(['winback', 'surge']);
      expect(result.results).toHaveLength(2);

      for (const summary of result.results) {
        expect(summary.status).toBe('SENT');
        expect(summary.to).toEqual(to);
        expect(summary.messageId).toBeTruthy();
        expect(summary.rejected.length).toBe(0);
      }

      const winbackSummary = result.results.find(
        (summary) => summary.campaign === 'winback',
      );
      expect(winbackSummary).toBeDefined();
      expect(winbackSummary?.aiSuggestions).toBeDefined();
    }, 180_000);
  },
);
