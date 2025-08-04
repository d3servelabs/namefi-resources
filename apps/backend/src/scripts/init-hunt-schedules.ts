#!/usr/bin/env tsx

/**
 * Script to initialize Hunt-System schedules
 *
 * Usage:
 *   bun run ./apps/backend/src/scripts/init-hunt-schedules.ts
 */

import { submitScheduleForCampaignStatus } from '../temporal/schedules/hunt/campaign-status';
import { submitScheduleForCampaignAward } from '../temporal/schedules/hunt/campaign-award';
import { submitAllPeriodAwardSchedules } from '../temporal/schedules/hunt/period-award';

export async function initHuntSchedules() {
  console.log('Initializing Hunt-System schedules...');

  try {
    await submitScheduleForCampaignStatus();
    console.log('✅ Campaign status schedule initialized');

    await submitScheduleForCampaignAward();
    console.log('✅ Campaign award schedule initialized');

    await submitAllPeriodAwardSchedules();
    console.log('✅ Period award schedules initialized');

    console.log('🎉 All Hunt-System schedules initialized successfully');
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: print error
    console.error('❌ Failed to initialize Hunt-System schedules:', error);
    throw error;
  }
}

if (require.main === module) {
  initHuntSchedules()
    .then(() => {
      console.log('Hunt-System schedules initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: print error
      console.error('Hunt-System schedules initialization failed:', error);
      process.exit(1);
    });
}
