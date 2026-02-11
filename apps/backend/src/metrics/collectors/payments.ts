import { Gauge } from 'prom-client';
import { paymentsTable } from '@namefi-astra/db';
import { and, gte, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_payments_total';

const paymentsGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Payment attempts grouped by status and method in the last 24 hours',
  labelNames: ['status', 'method'],
  registers: [register],
});

const PAYMENT_STATUSES = ['success', 'failed'] as const;
const PAYMENT_METHODS = ['credit_card', 'nfc'] as const;

export async function collectPaymentsByStatusAndMethod(
  ctx: MetricsContext,
): Promise<void> {
  const lifecycleEventAtExpr = sql<Date>`COALESCE(${paymentsTable.finishedAt}, ${paymentsTable.startedAt})`;

  const statusExpr = sql<string>`
    CASE
      WHEN ${paymentsTable.status} = 'SUCCEEDED' THEN 'success'
      WHEN ${paymentsTable.status} IN ('FAILED', 'CANCELLED') THEN 'failed'
      ELSE NULL
    END
  `;

  const methodExpr = sql<string>`
    CASE
      WHEN ${paymentsTable.paymentProvider} = 'STRIPE' THEN 'credit_card'
      ELSE 'nfc'
    END
  `;

  const rows = await ctx.db
    .select({
      status: statusExpr,
      method: methodExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(paymentsTable)
    .where(
      and(
        gte(lifecycleEventAtExpr, sql`NOW() - interval '24 hours'`),
        sql`${statusExpr} IS NOT NULL`,
      ),
    )
    .groupBy(statusExpr, methodExpr);

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.status || !row.method) {
      continue;
    }
    counts.set(`${row.status}:${row.method}`, Number(row.count ?? 0));
  }

  paymentsGauge.reset();
  for (const status of PAYMENT_STATUSES) {
    for (const method of PAYMENT_METHODS) {
      paymentsGauge.set(
        { status, method },
        counts.get(`${status}:${method}`) ?? 0,
      );
    }
  }
}
