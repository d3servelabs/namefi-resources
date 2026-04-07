import * as workflow from '@temporalio/workflow';
import { criticalAlertWithTicket } from '../../shared/workflow-helpers/critical-alert-with-ticket';
import { catchAndEscalateLocally } from '../../shared/workflow-helpers/catch-and-escalate-locally';

export interface TestIncidentEscalationWorkflowInput {
  /** Title for the test incident ticket */
  title?: string;
  /** Whether to also test catchAndEscalateLocally by throwing inside it */
  testCatchWrapper?: boolean;
}

export interface TestIncidentEscalationWorkflowOutput {
  directTicket: { taskId: string; taskUrl: string } | null;
  catchWrapperTicketCreated: boolean;
  summary: string;
}

/**
 * Test workflow that intentionally creates a ClickUp incident ticket and starts
 * the monitoring/escalation workflow. Use this to verify the full incident pipeline:
 *   1. ClickUp ticket creation
 *   2. Slack critical alert
 *   3. Monitoring child workflow (polls ticket + re-alerts)
 *
 * Run via Temporal UI or CLI:
 *   temporal workflow start --type testIncidentEscalationWorkflow \
 *     --task-queue default_task_queue \
 *     --input '{"title": "Test Incident"}'
 */
export async function testIncidentEscalationWorkflow(
  input: TestIncidentEscalationWorkflowInput = {},
): Promise<TestIncidentEscalationWorkflowOutput> {
  const title = input.title ?? 'Test Incident Escalation';

  // Step 1: Directly create an incident ticket via criticalAlertWithTicket
  workflow.log.info(`Creating test incident: ${title}`);

  const directTicket = await criticalAlertWithTicket({
    title,
    message:
      'This is a test incident created intentionally to verify the ClickUp ticket creation and escalation monitoring pipeline.',
    extraData: {
      triggeredBy: 'testIncidentEscalationWorkflow',
      environment: 'test',
      timestamp: new Date().toISOString(),
    },
    priority: 2, // High (not Urgent) to distinguish test tickets
  });

  if (directTicket) {
    workflow.log.info(
      `Test incident ticket created: ${directTicket.taskId} (${directTicket.taskUrl})`,
    );
  } else {
    workflow.log.warn(
      'No ticket created (ClickUp may not be configured). Slack alert was still sent.',
    );
  }

  // Step 2: Optionally test catchAndEscalateLocally with a deliberate failure
  let catchWrapperTicketCreated = false;
  if (input.testCatchWrapper) {
    workflow.log.info('Testing catchAndEscalateLocally with intentional error');

    await catchAndEscalateLocally(
      async () => {
        throw new Error(
          'Intentional test failure to verify catchAndEscalateLocally pipeline',
        );
      },
      {
        message: `[TEST] catchAndEscalateLocally verification — ${title}`,
        details: {
          triggeredBy: 'testIncidentEscalationWorkflow',
          phase: 'catchAndEscalateLocally test',
        },
        priority: 3, // Normal priority for catch-wrapper test
      },
    );

    catchWrapperTicketCreated = true;
    workflow.log.info('catchAndEscalateLocally test completed');
  }

  const summary = [
    `Direct ticket: ${directTicket ? `created (${directTicket.taskId})` : 'skipped (ClickUp not configured)'}`,
    `Catch wrapper test: ${input.testCatchWrapper ? 'executed' : 'skipped'}`,
    `Monitoring workflow: ${directTicket ? 'started (will poll every 2h)' : 'not started'}`,
  ].join('. ');

  workflow.log.info(summary);

  return {
    directTicket,
    catchWrapperTicketCreated,
    summary,
  };
}
