/**
 * Standalone MongoDB to PostgreSQL migration utility
 *
 * This is a simple, direct migration script that doesn't use Temporal workflows.
 * Use this if you want to run the migration outside of the Temporal system.
 *
 * For the full-featured Temporal workflow approach, use:
 * bun run command:migrate-mongo-ai-data
 */

import mongoose from 'mongoose';
import { db, domainAiAnalysisTable } from '@namefi-astra/db';
import { secrets } from '#lib/env';
import { sql } from 'drizzle-orm';
import type { DomainAiAnalysisInsert } from '@namefi-astra/db/types';
import { nftIdFromDomainName } from '#lib/nft-hash';
import type { ObjectId } from 'mongoose';
import { aiAppraisalDataSchema } from '@namefi-astra/db/schema';
import { fileURLToPath } from 'node:url';

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
const innerAppraisalSchema = new mongoose.Schema(
  {
    value_upper_range: { type: Number, required: false },
    value_lower_range: { type: Number, required: false },
    report: { type: String, required: false },
  },
  { _id: false },
);
const appraisalSchema = new mongoose.Schema(
  {
    ldh: { type: String, required: true },
    unicode: { type: String, required: false },
    appraisal: { type: innerAppraisalSchema, required: false },
  },
  { _id: false },
);

// Define mongoose schema
const namefiSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: false },
    ldh: { type: String, required: true },
    unicode: { type: String, required: false },
    explain: { type: String, required: false },
    appraisal: { type: appraisalSchema, required: false },
    namefi_gpt_version: { type: String, required: false },
    currentOwner: { type: String, required: false },
    expiration: { type: Date, required: false },
    chainName: { type: String, required: false },
    dirty: { type: Boolean, required: false },
  },
  { collection: 'namefi-ai-collection' },
);

/**
 * Resolve domain names to token IDs using the NFT view
 */
async function resolveDomainsToTokenIds(
  domainNames: string[],
): Promise<Map<string, bigint>> {
  console.log(`Resolving ${domainNames.length} domain names to token IDs...`);

  const domainMap = new Map<string, bigint>(
    domainNames.map((domain) => [domain, nftIdFromDomainName(domain)]),
  );

  return domainMap;
}

/**
 * Migrate all data from MongoDB to PostgreSQL
 */
export async function migrateFromMongoDB() {
  console.log('Starting migration from MongoDB to PostgreSQL...');

  const uri = secrets.LEGACY_DB_URL;
  const connection = await mongoose.createConnection(uri, {
    dbName: 'namefi-ai-db',
  });

  try {
    console.log('Connected to MongoDB');

    // Create the model using the connection
    const NamefiModel = connection.model<MongoNamefiDocument>(
      'NamefiAI',
      namefiSchema,
    );
    console.log('Starting cursor-based migration...');

    // Process in batches using cursor
    const batchSize = 300;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const domainTokenMapCache = new Map<string, bigint>();

    // Use simple batch processing with skip/limit to avoid cursor issues
    let hasMoreDocuments = true;
    let lastId: ObjectId | null = null;

    while (hasMoreDocuments) {
      // Fetch batch using skip/limit
      const findQuery: any = lastId ? { _id: { $gt: lastId } } : {};
      const batch = await NamefiModel.find(findQuery)
        .sort({ _id: 'asc' })
        .limit(batchSize)
        .lean();

      if (batch.length === 0) {
        hasMoreDocuments = false;
        break;
      }

      lastId = batch[batch.length - 1]._id;

      // Collect unique domain names for token ID resolution
      const uniqueDomainNames = Array.from(
        new Set(
          batch
            .filter((doc) => doc.ldh && !doc.tokenId) // Only domains without tokenId
            .map((doc) => doc.ldh),
        ),
      );

      // Resolve token IDs for domains not in cache
      const newDomainNames = uniqueDomainNames.filter(
        (domain) => !domainTokenMapCache.has(domain),
      );

      if (newDomainNames.length > 0) {
        const newDomainTokenMap =
          await resolveDomainsToTokenIds(newDomainNames);

        // Add to cache
        for (const [domain, tokenId] of newDomainTokenMap.entries()) {
          domainTokenMapCache.set(domain, tokenId);
        }
      }

      // Convert to PostgreSQL format
      const pgData: DomainAiAnalysisInsert[] = [];

      for (const doc of batch) {
        try {
          let tokenId: bigint;

          if (doc.tokenId) {
            // Use existing tokenId if available
            tokenId = BigInt(doc.tokenId);
          } else {
            // Look up tokenId from domain name map
            const mappedTokenId = domainTokenMapCache.get(doc.ldh);
            if (!mappedTokenId) {
              console.warn(`Could not find tokenId for domain: ${doc.ldh}`);
              failed++;
              continue;
            }
            tokenId = mappedTokenId;
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
                appraisalData = {
                  valueUpperRange: Number.parseFloat(
                    appraisalData.value_upper_range
                      ?.toString()
                      .replace(/\$/g, '')
                      .replace(/,/g, ''),
                  ),
                  valueLowerRange: Number.parseFloat(
                    appraisalData.value_lower_range
                      ?.toString()
                      .replace(/\$/g, '')
                      .replace(/,/g, ''),
                  ),
                  report: appraisalData.report,
                };
              } catch {
                // If it's not JSON, this might be legacy string data - skip for now
                appraisalData = null;
              }
            } else {
              // Already an object - check if it's the full response or just the appraisal
              const _appraisalData =
                (doc.appraisal as any)?.appraisal || doc.appraisal;
              appraisalData = {
                valueUpperRange: Number.parseFloat(
                  _appraisalData.value_upper_range
                    ?.toString()
                    .replace(/\$/g, '')
                    .replace(/,/g, ''),
                ),
                valueLowerRange: Number.parseFloat(
                  _appraisalData.value_lower_range
                    ?.toString()
                    .replace(/\$/g, '')
                    .replace(/,/g, ''),
                ),
                report: _appraisalData.report,
              };
            }
            const { success, data } =
              aiAppraisalDataSchema.safeParse(appraisalData);
            if (success) {
              appraisalData = data;
            } else {
              console.error('Invalid appraisal data:', doc.appraisal);
              appraisalData = null;
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
          console.error(
            `Error processing document with ldh ${doc.ldh}:`,
            error,
          );
          failed++;
        }
      }

      // Bulk insert to PostgreSQL using atomic transaction
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

          successful += pgData.length;
          processed += batch.length;
          console.log(
            `Migrated ${processed} documents (batch of ${batch.length})`,
          );
        } catch (error) {
          console.error('Batch PostgreSQL insertion failed:', error);
          failed += pgData.length;
          processed += batch.length;
        }
      } else {
        processed += batch.length;
        console.log(
          `Processed ${processed} documents (batch of ${batch.length})`,
        );
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total Processed: ${processed}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(
      `Success Rate: ${processed > 0 ? ((successful / processed) * 100).toFixed(1) : 0}%`,
    );
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.close();
    console.log('MongoDB connection closed');
  }
}

/**
 * Verify migration by comparing counts
 */
export async function verifyMigration() {
  console.log('\n=== Verifying Migration ===');

  const uri = secrets.LEGACY_DB_URL;
  const connection = await mongoose.createConnection(uri, {
    dbName: 'namefi-ai-db',
  });

  try {
    // Create the model using the connection
    const NamefiModel = connection.model<MongoNamefiDocument>(
      'NamefiAI',
      namefiSchema,
    );

    // Try to get MongoDB count using a simple approach
    let mongoCount = 0;
    try {
      mongoCount = await NamefiModel.estimatedDocumentCount();
      console.log(`MongoDB documents (estimated): ${mongoCount}`);
    } catch {
      // If that fails, try manual counting
      mongoCount = await NamefiModel.countDocuments();
      console.log(`MongoDB documents (manual count): ${mongoCount}`);
    }

    // Count PostgreSQL documents
    const pgResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(domainAiAnalysisTable);

    const pgCount = pgResult[0]?.count || 0;
    console.log(`PostgreSQL documents: ${pgCount}`);

    if (mongoCount.toString() === pgCount.toString()) {
      console.log('✅ Migration verification successful - counts match');
    } else {
      console.log(
        `⚠️  Migration verification warning - counts don't match (MongoDB: ${mongoCount}, PostgreSQL: ${pgCount})`,
      );
    }

    return { mongoCount, pgCount, success: mongoCount === pgCount };
  } finally {
    await connection.close();
  }
}

const main = async () => {
  // Run migration if this file is executed directly
  migrateFromMongoDB()
    .then(() => verifyMigration())
    .then((result) => {
      console.log('Migration and verification completed');
      if (result.success) {
        process.exit(0);
      } else {
        console.log('Migration completed but verification failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
};
// Run if this is the main module
const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  main();
}
