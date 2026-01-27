import * as workflow from '@temporalio/workflow';
import { shortRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export async function helloWorldWorkflow(name: string): Promise<string> {
  // Get reference to activities
  const { greet } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  // Execute the greeting activity
  await greet(name);

  await workflow.sleep('30 seconds');

  await greet(name);

  // Return a message
  return `Completed greeting workflow for ${name}`;
}

export async function testAlertWorkflow(name: string): Promise<string> {
  // Get reference to activities
  const { greet, criticalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  await criticalAlertNamefi({
    title: 'Test Alert',
    message: 'This is a test alert',
    extraData: {
      severity: 'CRITICAL',
      timestamp: Date.now(),
    },
  });

  // Return a message
  return `Completed greeting workflow for ${name}`;
}

export async function testEmailWorkflow(name: string): Promise<string> {
  const { sendStyledEmailNotification } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      ...shortRunningOpts,
    },
  });

  await sendStyledEmailNotification({
    title: 'Test Email',
    messageMarkdown: '##This is a test email\n\n [homepage](https://namefi.io)',
    showGoToDashboard: true,
    to: ['dev-team@namefi.io'],
    subject: 'Test Email',
  });

  // Return a message
  return `Completed greeting workflow for ${name}`;
}
