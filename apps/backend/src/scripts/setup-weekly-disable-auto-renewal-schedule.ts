#!/usr/bin/env tsx

/**
 * Script to setup the weekly auto-renewal disabling schedule
 *
 * This script provides easy management of the weekly schedule that disables
 * auto-renewal for all SLD domains at the registrar level.
 *
 * Usage:
 *   # Create the main production schedule
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create
 *
 *   # Create a dry-run testing schedule
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create --dry-run
 *
 *   # Create a schedule for specific registrar only
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create --registrar=dynadot
 *
 *   # Trigger the schedule manually
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts trigger
 *
 *   # Check schedule status
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts status
 *
 *   # Delete the schedule
 *   tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts delete
 */

import { logger } from '#lib/logger';
import {
  createWeeklyDisableAutoRenewalSchedule,
  createDryRunSchedule,
  createRoute53Schedule,
  createDynadotGdgSchedule,
  createDynadotRegularSchedule,
  createRegistrarSpecificSchedule,
} from '../temporal/schedules/weekly-disable-auto-renewal';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';

interface ScriptOptions {
  action: 'create' | 'trigger' | 'status' | 'delete' | 'pause' | 'unpause';
  dryRun: boolean;
  registrar?: Registrars;
  scheduleId?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    action: 'create',
    dryRun: false,
  };

  // First argument is the action
  if (args.length > 0) {
    const action = args[0];
    if (
      !['create', 'trigger', 'status', 'delete', 'pause', 'unpause'].includes(
        action,
      )
    ) {
      throw new Error(
        `Invalid action: ${action}. Must be one of: create, trigger, status, delete, pause, unpause`,
      );
    }
    options.action = action as ScriptOptions['action'];
  }

  // Parse remaining arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--registrar=')) {
      const registrar = arg.split('=')[1] as Registrars;
      const validRegistrars = Object.values(Registrars);
      if (!validRegistrars.includes(registrar)) {
        throw new Error(
          `Invalid registrar: ${registrar}. Must be one of: ${validRegistrars.join(', ')}`,
        );
      }
      options.registrar = registrar;
    } else if (arg.startsWith('--schedule-id=')) {
      options.scheduleId = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts <action> [options]

Actions:
  create              Create the schedule
  trigger             Trigger the schedule manually
  status              Check schedule status
  delete              Delete the schedule
  pause               Pause the schedule
  unpause             Unpause the schedule

Options:
  --dry-run                Create a dry-run version that doesn't make changes
  --registrar=<name>       Create schedule for specific registrar (${Object.values(Registrars).join('|')})
  --schedule-id=<id>       Use specific schedule ID (for status, trigger, delete, pause, unpause actions)
  --help, -h               Show this help message

Examples:
  tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create
  tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create --dry-run
  tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts create --registrar=${Registrars.DynadotGdg}
  tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts trigger
  tsx apps/backend/src/scripts/setup-weekly-disable-auto-renewal-schedule.ts status --schedule-id=weekly-disable-auto-renewal-dry-run
      `);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

/**
 * Create the appropriate schedule based on options
 */
function createSchedule(options: ScriptOptions) {
  if (options.dryRun && options.registrar) {
    return createRegistrarSpecificSchedule(options.registrar, true);
  }
  if (options.dryRun) {
    return createDryRunSchedule();
  }
  if (options.registrar === Registrars.DynadotGdg) {
    return createDynadotGdgSchedule();
  }
  if (options.registrar === Registrars.DynadotRegular) {
    return createDynadotRegularSchedule();
  }
  if (options.registrar === Registrars.Route53) {
    return createRoute53Schedule();
  }
  if (options.registrar) {
    // For any other registrar, create a generic registrar-specific schedule
    return createRegistrarSpecificSchedule(options.registrar, false);
  }
  return createWeeklyDisableAutoRenewalSchedule();
}

/**
 * Get schedule by ID or create default schedule
 */
function getSchedule(options: ScriptOptions) {
  if (options.scheduleId) {
    // Create a generic schedule instance with the specified ID for management operations
    return createRegistrarSpecificSchedule(Registrars.Route53, false); // Use a dummy schedule for management
  }

  return createSchedule(options);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();

    logger.info(`Executing ${options.action} action`, {
      dryRun: options.dryRun,
      registrar: options.registrar,
      scheduleId: options.scheduleId,
    });

    const schedule = getSchedule(options);

    switch (options.action) {
      case 'create': {
        logger.info(`Creating schedule: ${schedule.config.scheduleId}`);
        logger.info('Schedule configuration:', {
          name: schedule.config.name,
          description: schedule.config.description,
          cronExpressions: schedule.config.cronExpressions,
          taskQueue: schedule.config.taskQueue,
          overlapPolicy: schedule.config.overlapPolicy,
          args: schedule.config.args,
        });

        await schedule.submit();

        logger.info(
          `✅ Successfully created schedule: ${schedule.config.scheduleId}`,
        );

        console.log('\n' + '='.repeat(60));
        console.log('SCHEDULE CREATED SUCCESSFULLY');
        console.log('='.repeat(60));
        console.log(`Schedule ID: ${schedule.config.scheduleId}`);
        console.log(`Name: ${schedule.config.name}`);
        console.log(`Description: ${schedule.config.description}`);
        console.log(`Cron: ${schedule.config.cronExpressions.join(', ')}`);
        console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
        console.log(`Registrar: ${options.registrar || 'All'}`);
        console.log('='.repeat(60));
        break;
      }

      case 'trigger': {
        logger.info(`Triggering schedule: ${schedule.config.scheduleId}`);
        await schedule.trigger();
        logger.info(
          `✅ Successfully triggered schedule: ${schedule.config.scheduleId}`,
        );
        break;
      }

      case 'status': {
        logger.info(
          `Getting status for schedule: ${schedule.config.scheduleId}`,
        );
        const status = await schedule.getStatus();

        console.log('\n' + '='.repeat(60));
        console.log('SCHEDULE STATUS');
        console.log('='.repeat(60));
        console.log(`Schedule ID: ${status.scheduleId}`);
        console.log(`Name: ${status.name}`);
        console.log(`Description: ${status.description}`);
        console.log(`Paused: ${status.paused ? 'Yes' : 'No'}`);
        console.log(`Cron: ${status.cronExpressions.join(', ')}`);
        console.log(`Category: ${status.category}`);
        console.log(`Owner: ${status.owner}`);
        console.log(
          `Next Actions: ${status.nextActionTimes.map((t) => t.toISOString()).join(', ') || 'None'}`,
        );
        console.log(`Recent Actions: ${status.recentActions.length}`);

        if (status.recentActions.length > 0) {
          console.log('\nRecent Actions:');
          status.recentActions.slice(0, 3).forEach((action, index) => {
            console.log(
              `  ${index + 1}. Scheduled: ${action.scheduledAt.toISOString()}`,
            );
            console.log(
              `     Taken: ${action.takenAt?.toISOString() || 'Not taken'}`,
            );
            console.log(`     Workflow ID: ${action.workflow.workflowId}`);
          });
        }
        console.log('='.repeat(60));
        break;
      }

      case 'pause': {
        logger.info(`Pausing schedule: ${schedule.config.scheduleId}`);
        await schedule.pause('Paused via setup script');
        logger.info(
          `✅ Successfully paused schedule: ${schedule.config.scheduleId}`,
        );
        break;
      }

      case 'unpause': {
        logger.info(`Unpausing schedule: ${schedule.config.scheduleId}`);
        await schedule.unpause('Unpaused via setup script');
        logger.info(
          `✅ Successfully unpaused schedule: ${schedule.config.scheduleId}`,
        );
        break;
      }

      case 'delete': {
        logger.info(`Deleting schedule: ${schedule.config.scheduleId}`);

        // Confirm deletion for production schedules
        if (!options.dryRun && !options.scheduleId) {
          console.log(
            '\n⚠️  WARNING: You are about to delete a production schedule!',
          );
          console.log(`Schedule ID: ${schedule.config.scheduleId}`);
          console.log('This action cannot be undone.');
          console.log(
            '\nTo proceed, re-run with: --schedule-id=' +
              schedule.config.scheduleId,
          );
          process.exit(1);
        }

        await schedule.delete();
        logger.info(
          `✅ Successfully deleted schedule: ${schedule.config.scheduleId}`,
        );
        break;
      }
    }
  } catch (error) {
    logger.error('Script execution failed:', error);
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Execute the script if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
  });
}

export { main, parseArgs };
