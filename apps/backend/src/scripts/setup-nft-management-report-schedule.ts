/**
 * Script to set up the NFT Management Daily Report schedule
 *
 * This script creates the Temporal schedule for the daily NFT management report
 * that runs at 14:00 UTC every day.
 *
 * Usage: bun tsx src/scripts/setup-nft-management-report-schedule.ts
 */

import { logger } from '#lib/logger';
import {
  submitScheduleForNftManagementDailyReport,
  getNftManagementDailyReportScheduleStatus,
  triggerNftManagementDailyReport,
} from '../temporal/schedules/nft-management-daily-report';

const LOGGER = logger;

async function main() {
  try {
    LOGGER.info('Setting up NFT Management Daily Report schedule');

    // Check if schedule already exists
    try {
      const existingStatus = await getNftManagementDailyReportScheduleStatus();
      LOGGER.info('Schedule already exists', {
        scheduleId: existingStatus.scheduleId,
        paused: existingStatus.paused,
        cronExpressions: existingStatus.cronExpressions,
        nextActionTimes: existingStatus.nextActionTimes,
      });

      console.log('✅ Schedule already exists and is configured');
      console.log(`   Schedule ID: ${existingStatus.scheduleId}`);
      console.log(`   Status: ${existingStatus.paused ? 'PAUSED' : 'ACTIVE'}`);
      console.log(`   Cron: ${existingStatus.cronExpressions?.join(', ')}`);
      console.log(
        `   Next run: ${existingStatus.nextActionTimes?.map((t: Date) => t.toISOString()).join(', ')}`,
      );

      return;
    } catch (error) {
      // Schedule doesn't exist, we'll create it
      LOGGER.info('Schedule does not exist, creating new one');
    }

    // Create the schedule
    await submitScheduleForNftManagementDailyReport();

    // Verify it was created successfully
    const status = await getNftManagementDailyReportScheduleStatus();

    console.log(
      '✅ NFT Management Daily Report schedule created successfully!',
    );
    console.log(`   Schedule ID: ${status.scheduleId}`);
    console.log(`   Status: ${status.paused ? 'PAUSED' : 'ACTIVE'}`);
    console.log('   Runs daily at: 14:00 UTC (2:00 PM UTC)');
    console.log(
      `   Next run: ${status.nextActionTimes?.map((t: Date) => t.toISOString()).join(', ')}`,
    );
    console.log('');
    console.log('📊 The report will include:');
    console.log('   • Total NFT statistics');
    console.log('   • Critical issues overview');
    console.log('   • Active workflows status');
    console.log('   • Registrar and chain breakdowns');
    console.log('   • Health score and recommendations');
    console.log('');
    console.log('🔧 Management commands:');
    console.log(
      '   • Trigger now: bun tsx src/scripts/trigger-nft-management-report.ts',
    );
    console.log(
      '   • Check status: Call getNftManagementDailyReportScheduleStatus()',
    );
    console.log('   • Pause: Call pauseNftManagementDailyReportSchedule()');

    LOGGER.info(
      'NFT Management Daily Report schedule setup completed successfully',
    );
  } catch (error) {
    LOGGER.error('Failed to set up NFT Management Daily Report schedule', {
      error,
    });
    console.error('❌ Failed to set up schedule:', error);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  LOGGER.error('Unhandled promise rejection in schedule setup script', {
    error,
  });
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script if called directly
if (require.main === module) {
  main().catch((error) => {
    LOGGER.error('Schedule setup script failed', { error });
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
