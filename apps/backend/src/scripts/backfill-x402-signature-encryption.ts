#!/usr/bin/env bun tsx

import { db, paymentsTable, x402PurchasesTable } from '@namefi-astra/db';
import type { PaymentPayload } from '@x402/hono';
import { eq } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import {
  decryptX402PaymentPayload,
  encryptX402PaymentPayloadSignature,
  hasEncryptedX402PaymentPayloadSignature,
  resolveX402PaymentPayloadEncryptionPrivateKey,
} from '#lib/x402/helpers';

type ScriptOptions = {
  write: boolean;
  limit?: number;
};

type MigrationStats = {
  scanned: number;
  updated: number;
  skipped: number;
  failed: number;
};

const logger = createLogger({ context: 'X402_SIGNATURE_BACKFILL' });

const DEFAULT_VERSION = 'v1' as const;

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);

  const options: ScriptOptions = {
    write: false,
  };

  for (const arg of args) {
    if (arg === '--write') {
      options.write = true;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      const parsed = Number.parseInt(arg.slice('--limit='.length), 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(
          'Invalid --limit value. It must be a positive integer.',
        );
      }
      options.limit = parsed;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx apps/backend/src/scripts/backfill-x402-signature-encryption.ts [options]

Options:
  --write          Apply DB updates (default is dry-run)
  --limit=<n>      Process at most n rows from each table
  --help, -h       Show this help message

Examples:
  tsx apps/backend/src/scripts/backfill-x402-signature-encryption.ts
  tsx apps/backend/src/scripts/backfill-x402-signature-encryption.ts --write
  tsx apps/backend/src/scripts/backfill-x402-signature-encryption.ts --write --limit=100
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizePaymentPayloadForMigration({
  paymentPayload,
  encryptedPaymentPayload,
  privateKey,
}: {
  paymentPayload?: PaymentPayload;
  encryptedPaymentPayload?: string;
  privateKey: string;
}): PaymentPayload {
  if (paymentPayload) {
    return paymentPayload;
  }

  if (!encryptedPaymentPayload) {
    throw new Error('Missing both paymentPayload and encryptedPaymentPayload');
  }

  return decryptX402PaymentPayload({
    encryptedPaymentPayload,
    privateKey,
  });
}

async function backfillPayments(
  options: ScriptOptions,
  privateKey: string,
): Promise<MigrationStats> {
  const payments = await db.query.paymentsTable.findMany({
    columns: {
      id: true,
      paymentProvider: true,
      x402PaymentDetails: true,
    },
    where: eq(paymentsTable.paymentProvider, 'X402'),
    limit: options.limit,
  });

  const stats: MigrationStats = {
    scanned: payments.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const payment of payments) {
    try {
      const details = payment.x402PaymentDetails;
      if (!details || !isRecord(details)) {
        throw new Error('Missing x402PaymentDetails');
      }

      const detailsRecord = details as Record<string, unknown>;
      const legacyEncryptedPaymentPayload =
        typeof detailsRecord.encryptedPaymentPayload === 'string'
          ? detailsRecord.encryptedPaymentPayload
          : undefined;

      const normalizedPaymentPayload = normalizePaymentPayloadForMigration({
        paymentPayload: details.paymentPayload,
        encryptedPaymentPayload: legacyEncryptedPaymentPayload,
        privateKey,
      });

      const hasEncryptedSignature = hasEncryptedX402PaymentPayloadSignature(
        normalizedPaymentPayload,
      );

      const shouldUpdate =
        !hasEncryptedSignature ||
        !!legacyEncryptedPaymentPayload ||
        details.paymentPayloadEncryptionVersion !== DEFAULT_VERSION;

      if (!shouldUpdate) {
        stats.skipped += 1;
        continue;
      }

      const {
        paymentPayload: encryptedSignaturePayload,
        paymentPayloadEncryptionVersion,
      } = encryptX402PaymentPayloadSignature({
        paymentPayload: normalizedPaymentPayload,
        privateKey,
      });

      const normalizedDetails: Record<string, unknown> = {
        ...details,
        paymentPayload: encryptedSignaturePayload,
        paymentPayloadEncryptionVersion,
      };
      delete normalizedDetails.encryptedPaymentPayload;

      if (options.write) {
        await db
          .update(paymentsTable)
          .set({
            x402PaymentDetails: normalizedDetails as any,
            updatedAt: new Date(),
          })
          .where(eq(paymentsTable.id, payment.id));
      }

      stats.updated += 1;
    } catch (error) {
      stats.failed += 1;
      logger.error(
        {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to backfill x402 payment row',
      );
    }
  }

  return stats;
}

async function backfillPurchases(
  options: ScriptOptions,
  privateKey: string,
): Promise<MigrationStats> {
  const purchases = await db.query.x402PurchasesTable.findMany({
    columns: {
      id: true,
      paymentPayload: true,
    },
    limit: options.limit,
  });

  const stats: MigrationStats = {
    scanned: purchases.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const purchase of purchases) {
    try {
      if (!purchase.paymentPayload) {
        throw new Error('Missing purchase paymentPayload');
      }

      if (hasEncryptedX402PaymentPayloadSignature(purchase.paymentPayload)) {
        stats.skipped += 1;
        continue;
      }

      const { paymentPayload: encryptedSignaturePayload } =
        encryptX402PaymentPayloadSignature({
          paymentPayload: purchase.paymentPayload,
          privateKey,
        });

      if (options.write) {
        await db
          .update(x402PurchasesTable)
          .set({
            paymentPayload: encryptedSignaturePayload,
            updatedAt: new Date(),
          })
          .where(eq(x402PurchasesTable.id, purchase.id));
      }

      stats.updated += 1;
    } catch (error) {
      stats.failed += 1;
      logger.error(
        {
          purchaseId: purchase.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to backfill x402 purchase row',
      );
    }
  }

  return stats;
}

function printStats(label: string, stats: MigrationStats): void {
  logger.info(
    {
      table: label,
      scanned: stats.scanned,
      updated: stats.updated,
      skipped: stats.skipped,
      failed: stats.failed,
    },
    'x402 signature encryption backfill result',
  );
}

async function main(): Promise<void> {
  const options = parseArgs();
  const privateKey = resolveX402PaymentPayloadEncryptionPrivateKey();

  logger.info(
    {
      mode: options.write ? 'write' : 'dry-run',
      limit: options.limit ?? 'all',
    },
    'Starting x402 signature encryption backfill',
  );

  const paymentStats = await backfillPayments(options, privateKey);
  const purchaseStats = await backfillPurchases(options, privateKey);

  printStats('payments', paymentStats);
  printStats('x402_purchases', purchaseStats);

  const totalFailed = paymentStats.failed + purchaseStats.failed;
  if (totalFailed > 0) {
    throw new Error(`Backfill completed with ${totalFailed} failed rows`);
  }

  logger.info('x402 signature encryption backfill completed successfully');
}

main().catch((error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'x402 signature encryption backfill failed',
  );
  process.exit(1);
});
