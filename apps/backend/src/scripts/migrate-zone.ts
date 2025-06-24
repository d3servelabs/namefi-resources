#!/usr/bin/env tsx

import { temporalClient } from '../temporal/client';
import { migrateZoneToNewNameserversWorkflow } from '../temporal/workflows';
import { TEMPORAL_QUEUES } from '../temporal/shared';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import readline from 'node:readline';

// Start the process
async function main(): Promise<void> {
  const domainName = toPunycodeDomainName(process.argv[2]);
  console.log(`Migrating zone "${domainName}" to new nameservers`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const input = await new Promise<string>((resolve) => {
    rl.question('Confirm? (y/n)  ', (answer) => {
      resolve(answer);
    });
  });
  rl.close();

  if (input.toLowerCase() !== 'y') {
    console.log('Exiting');
    process.exit(0);
  }
  console.log('Starting workflow');
  const result = await temporalClient.workflow.start(
    migrateZoneToNewNameserversWorkflow,
    {
      workflowId: `migrate-zone-to-new-nameservers-${domainName}`,
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      workflowIdConflictPolicy: 'USE_EXISTING',
      args: [{ zoneName: domainName }],
    },
  );
}

main()
  .then(() => console.log('Workflow started successfully'))
  .catch((err) => {
    const error = err as Error;
    console.error('Unhandled error:', error);
    process.exit(1);
  });
