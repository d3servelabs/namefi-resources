/**
 * Migration activities to move data from MongoDB namefi-ai-collection to PostgreSQL
 * This follows the repo's patterns using Temporal activities and existing MongoDB patterns
 */

import mongoose from 'mongoose';
import {
  db,
  domainAiAnalysisTable,
  namefiNftWithAiAnalysisView,
} from '@namefi-astra/db';
import { createLogger } from '#lib/logger';
import { secrets } from '#lib/env';
import { sql } from 'drizzle-orm';
import type { DomainAiAnalysisInsert } from '@namefi-astra/db/types';
import { nftIdFromDomainName } from '#lib/nft-hash';

const logger = createLogger({ name: 'mongo-ai-migration-activities' });

interface MongoNamefiDocument {
  _id?: any;
  tokenId?: string;
  ldh: string; // normalized domain name
  unicode?: string;
  explain?: string;
  appraisal?: string;
  namefi_gpt_version?: string;
  currentOwner?: string;
  expiration?: Date;
  chainName?: string;
  dirty?: boolean;
}

/**
 * Temporal activity to validate migration prerequisites
 */
export async function validateAiMigrationPrerequisitesActivity(): Promise<{
  success: boolean;
  mongodbAvailable: boolean;
  postgresqlAvailable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let mongodbAvailable = false;
  let postgresqlAvailable = false;

  try {
    // Test MongoDB connection
    logger.info('Validating MongoDB connection for AI migration...');
    const uri = secrets.LEGACY_DB_URL;

    const connection = await mongoose.createConnection(uri, {
      dbName: 'namefi-ai-db',
    });
    await connection.close();
    mongodbAvailable = true;
    logger.info('MongoDB connection validated successfully');
  } catch (error) {
    const errorMsg = `MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // Test PostgreSQL connection by querying the AI analysis table
    logger.info('Validating PostgreSQL connection for AI migration...');
    await db.select().from(domainAiAnalysisTable).limit(1);
    postgresqlAvailable = true;
    logger.info('PostgreSQL connection validated successfully');
  } catch (error) {
    const errorMsg = `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
  }

  const success = mongodbAvailable && postgresqlAvailable;

  return {
    success,
    mongodbAvailable,
    postgresqlAvailable,
    errors,
  };
}

/**
 * Temporal activity to count MongoDB documents for planning
 */
export async function countMongoAiDocumentsActivity(): Promise<number> {
  const uri = secrets.LEGACY_DB_URL;

  const connection = await mongoose.createConnection(uri, {
    dbName: 'namefi-ai-db',
  });

  try {
    logger.info('Counting MongoDB AI documents...');
    const collection = connection.collection('namefi-ai-collection');

    const totalCount = await collection.countDocuments();
    logger.info({ totalCount }, 'MongoDB document count retrieved');

    return totalCount;
  } finally {
    await connection.close();
  }
}

/**
 * Temporal activity to get a batch of MongoDB documents for processing
 */
export async function getMongoAiDocumentBatchActivity(
  skip: number,
  batchSize = 100,
): Promise<MongoNamefiDocument[]> {
  const uri = secrets.LEGACY_DB_URL;

  const connection = await mongoose.createConnection(uri, {
    dbName: 'namefi-ai-db',
  });

  try {
    logger.info({ skip, batchSize }, 'Fetching MongoDB AI document batch');
    const collection = connection.collection('namefi-ai-collection');

    const documents = (await collection
      .find({})
      .skip(skip)
      .limit(batchSize)
      .toArray()) as MongoNamefiDocument[];

    logger.info(
      { count: documents.length },
      'MongoDB document batch retrieved',
    );

    return documents;
  } finally {
    await connection.close();
  }
}

/**
 * Temporal activity to resolve domain names to token IDs using the NFT view
 */
export async function resolveDomainsToTokenIdsActivity(
  domainNames: string[],
): Promise<Map<string, string>> {
  logger.info(
    { count: domainNames.length },
    'Resolving domain names to token IDs',
  );

  const domainMap = new Map<string, string>(
    domainNames.map((domain) => [
      domain,
      nftIdFromDomainName(domain).toString(),
    ]),
  );

  return domainMap;
}

/**
 * Temporal activity to migrate a batch of AI documents to PostgreSQL
 */
export async function migrateAiDocumentBatchActivity(
  mongoDocuments: MongoNamefiDocument[],
  domainTokenMap: Map<string, string>,
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  logger.info(
    { count: mongoDocuments.length },
    'Starting AI document batch migration',
  );

  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  // Convert MongoDB documents to PostgreSQL format
  const pgData: DomainAiAnalysisInsert[] = [];

  for (const doc of mongoDocuments) {
    try {
      let tokenId: bigint;

      if (doc.tokenId) {
        // Use existing tokenId if available
        tokenId = BigInt(doc.tokenId);
      } else {
        // Look up tokenId from domain name map
        const mappedTokenId = domainTokenMap.get(doc.ldh);
        if (!mappedTokenId) {
          logger.warn({ ldh: doc.ldh }, 'Could not find tokenId for domain');
          failed++;
          errors.push(`Could not find tokenId for domain: ${doc.ldh}`);
          continue;
        }
        tokenId = BigInt(mappedTokenId);
      }

      // Handle appraisal field - extract the inner appraisal object if it exists
      let appraisalData = null;
      if (doc.appraisal) {
        if (typeof doc.appraisal === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(doc.appraisal);
            // If it has the full response structure, extract the inner appraisal
            appraisalData = parsed.appraisal || parsed;
          } catch {
            // If it's not JSON, this might be legacy string data - skip for now
            appraisalData = null;
          }
        } else {
          // Already an object - check if it's the full response or just the appraisal
          appraisalData = (doc.appraisal as any)?.appraisal || doc.appraisal;
        }
      }

      pgData.push({
        tokenId: tokenId.toString(),
        normalizedDomainName: doc.ldh as any, // Type assertion for normalized domain name
        explain: doc.explain || null,
        appraisal: appraisalData,
        namefiGptVersion: doc.namefi_gpt_version || null,
      });
    } catch (error) {
      const errorMsg = `Error processing document with ldh ${doc.ldh}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error({ ldh: doc.ldh, error }, errorMsg);
      errors.push(errorMsg);
      failed++;
    }
  }

  // Bulk insert to PostgreSQL using upsert pattern
  if (pgData.length > 0) {
    try {
      await db.transaction(async (tx) => {
        // Use PostgreSQL's ON CONFLICT to handle duplicates
        await tx
          .insert(domainAiAnalysisTable)
          .values(pgData)
          .onConflictDoUpdate({
            target: domainAiAnalysisTable.tokenId,
            set: {
              explain: sql.raw('excluded.explain'),
              appraisal: sql.raw('excluded.appraisal'),
              namefiGptVersion: sql.raw('excluded.namefi_gpt_version'),
              updatedAt: sql.raw('NOW()'),
            },
          });
      });

      successful = pgData.length;
      logger.info({ successful }, 'Batch migration completed successfully');
    } catch (error) {
      const errorMsg = `Batch PostgreSQL insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error({ error }, errorMsg);
      errors.push(errorMsg);
      failed = pgData.length;
      successful = 0;
    }
  }

  return {
    processed: mongoDocuments.length,
    successful,
    failed,
    errors,
  };
}

/**
 * Temporal activity to verify migration by comparing counts
 */
export async function verifyAiMigrationActivity(): Promise<{
  mongoCount: number;
  postgresCount: number;
  success: boolean;
  message: string;
}> {
  logger.info('Verifying AI migration...');

  // Count MongoDB documents
  const uri = secrets.LEGACY_DB_URL;

  const connection = await mongoose.createConnection(uri, {
    dbName: 'namefi-ai-db',
  });
  let mongoCount = 0;

  try {
    const collection = connection.collection('namefi-ai-collection');
    mongoCount = await collection.countDocuments();
  } finally {
    await connection.close();
  }

  // Count PostgreSQL documents
  const pgResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(domainAiAnalysisTable);

  const postgresCount = pgResult[0]?.count || 0;

  const success = mongoCount === postgresCount;
  const message = success
    ? 'Migration verification successful - counts match'
    : `Migration verification warning - counts don't match (MongoDB: ${mongoCount}, PostgreSQL: ${postgresCount})`;

  logger.info({ mongoCount, postgresCount, success }, message);

  return {
    mongoCount,
    postgresCount,
    success,
    message,
  };
}

/**
 * Temporal activity to generate migration statistics report
 */
export async function generateAiMigrationReportActivity(
  totalProcessed: number,
  totalSuccessful: number,
  totalFailed: number,
  startTime: Date,
  endTime: Date,
): Promise<{
  timestamp: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  successRate: number;
  duration: string;
  documentsPerSecond: number;
}> {
  logger.info('Generating AI migration report...');

  const diffMs = endTime.getTime() - startTime.getTime();
  const durationMs = diffMs > 0 ? diffMs : 1;
  const durationSeconds = durationMs / 1000;
  const documentsPerSecond =
    totalProcessed > 0 ? Math.round(totalProcessed / durationSeconds) : 0;
  const successRate =
    totalProcessed > 0 ? (totalSuccessful / totalProcessed) * 100 : 0;

  const report = {
    timestamp: new Date().toISOString(),
    totalProcessed,
    successful: totalSuccessful,
    failed: totalFailed,
    successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    duration: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
    documentsPerSecond,
  };

  logger.info(report, 'AI migration report generated');
  return report;
}
