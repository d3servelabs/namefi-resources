#!/usr/bin/env bun

import { createGoogleCloudDnsClient } from '../src/lib/google-cloud/dns-client';
import { logger } from '../src/lib/logger';

async function runDnsTest() {
  const dnsClient = createGoogleCloudDnsClient();
  const testDomain = 'test.sami';
  const testTarget = 'example.com';
  const updateTarget = 'updated-target.com';
  const namefiDevZone = 'namefi-dev';
  const defaultTtl = 300;

  logger.debug('Starting real-life DNS test for Google Cloud DNS client...');

  try {
    // Step 1: Check if record already exists (cleanup from previous runs)
    logger.debug(
      { testDomain, zone: namefiDevZone },
      'Checking if test record already exists...',
    );
    const existsBefore = await dnsClient.recordExists(
      namefiDevZone,
      testDomain,
      'CNAME',
    );

    if (existsBefore) {
      logger.warn(
        { testDomain, zone: namefiDevZone },
        'Test record already exists, deleting it first...',
      );
      await dnsClient.deleteCnameRecord(
        namefiDevZone,
        testDomain,
        testTarget,
        defaultTtl,
      );
      logger.debug('Cleaned up existing test record');
    }

    // Step 2: Create CNAME record
    logger.debug(
      { testDomain, testTarget, zone: namefiDevZone },
      'Creating CNAME record...',
    );
    const createdRecord = await dnsClient.createCnameRecord(
      namefiDevZone,
      testDomain,
      testTarget,
      defaultTtl,
    );
    logger.debug(
      { record: createdRecord },
      'Successfully created CNAME record',
    );

    // Step 3: Validate record exists
    logger.debug(
      { testDomain, zone: namefiDevZone },
      'Validating record exists...',
    );
    const existsAfterCreate = await dnsClient.recordExists(
      namefiDevZone,
      testDomain,
      'CNAME',
    );

    if (!existsAfterCreate) {
      throw new Error('Record was not found after creation');
    }
    logger.debug('✓ Record validation passed - record exists');

    // Step 4: List records to see the created record
    logger.debug({ zone: namefiDevZone }, 'Listing CNAME records...');
    const cnameRecords = await dnsClient.listRecords(namefiDevZone, 'CNAME');
    const ourRecord = cnameRecords.find((r) => r.name.includes(testDomain));

    if (!ourRecord) {
      throw new Error('Could not find our test record in the list');
    }
    logger.debug(
      { record: ourRecord },
      '✓ Found our test record in CNAME list',
    );

    // Step 5: Update/Edit the record (by deleting and recreating with new target)
    logger.debug(
      { testDomain, updateTarget, zone: namefiDevZone },
      'Updating record with new target...',
    );

    // Delete old record
    await dnsClient.deleteCnameRecord(
      namefiDevZone,
      testDomain,
      testTarget,
      defaultTtl,
    );
    logger.debug('Deleted old record');

    // Create with new target
    const updatedRecord = await dnsClient.createCnameRecord(
      namefiDevZone,
      testDomain,
      updateTarget,
      defaultTtl,
    );
    logger.debug(
      { record: updatedRecord },
      'Successfully updated CNAME record',
    );

    // Step 6: Validate the update
    const recordsAfterUpdate = await dnsClient.listRecords(
      namefiDevZone,
      'CNAME',
    );
    const updatedRecordInList = recordsAfterUpdate.find((r) =>
      r.name.includes(testDomain),
    );

    if (!updatedRecordInList) {
      throw new Error('Could not find updated record in the list');
    }

    if (!updatedRecordInList.rrdatas.includes(`${updateTarget}.`)) {
      throw new Error(
        `Updated record does not point to new target. Expected: ${updateTarget}., Got: ${updatedRecordInList.rrdatas}`,
      );
    }
    logger.debug('✓ Record update validation passed');

    // Step 7: Final cleanup - delete the test record
    logger.debug(
      { testDomain, zone: namefiDevZone },
      'Cleaning up test record...',
    );
    await dnsClient.deleteCnameRecord(
      namefiDevZone,
      testDomain,
      updateTarget,
      defaultTtl,
    );
    logger.debug('Successfully deleted test record');

    // Step 8: Validate record is gone
    const existsAfterDelete = await dnsClient.recordExists(
      namefiDevZone,
      testDomain,
      'CNAME',
    );

    if (existsAfterDelete) {
      throw new Error('Record still exists after deletion');
    }
    logger.debug(
      '✓ Record deletion validation passed - record no longer exists',
    );

    // Success summary
    logger.debug('🎉 All DNS operations completed successfully!');
    logger.debug('Test summary:');
    logger.debug('  ✓ Created CNAME record');
    logger.debug('  ✓ Validated record creation');
    logger.debug('  ✓ Listed and found record');
    logger.debug('  ✓ Updated record with new target');
    logger.debug('  ✓ Validated record update');
    logger.debug('  ✓ Deleted record');
    logger.debug('  ✓ Validated record deletion');
  } catch (error) {
    logger.error({ error }, '❌ DNS test failed');

    // Try to cleanup on error
    try {
      logger.debug('Attempting cleanup after error...');
      const stillExists = await dnsClient.recordExists(
        namefiDevZone,
        testDomain,
        'CNAME',
      );
      if (stillExists) {
        await dnsClient.deleteCnameRecord(
          namefiDevZone,
          testDomain,
          testTarget,
          defaultTtl,
        );
        logger.debug('Cleanup completed');
      }
    } catch (cleanupError) {
      logger.error({ error: cleanupError }, 'Failed to cleanup after error');
    }

    throw error;
  }
}

// Run the test
runDnsTest()
  .then(() => {
    logger.debug('DNS integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, 'DNS integration test failed');
    process.exit(1);
  });
