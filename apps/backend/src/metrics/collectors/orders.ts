import { Gauge } from 'prom-client';
import { orderItemsTable, ordersTable } from '@namefi-astra/db';
import { eq, gte, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_orders_total';

const ordersGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Orders created in the last 24 hours',
  labelNames: ['source'],
  registers: [register],
});

const ORDER_SOURCES = ['import', 'normal'] as const;

export async function collectOrdersTotal(ctx: MetricsContext): Promise<void> {
  const sourceExpr = sql<string>`
    CASE
      WHEN COALESCE(bool_or(${orderItemsTable.type} = 'IMPORT'), false)
      THEN 'import'
      ELSE 'normal'
    END
  `;

  const ordersWithSource = ctx.db
    .select({
      orderId: ordersTable.id,
      source: sourceExpr,
    })
    .from(ordersTable)
    .leftJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(gte(ordersTable.createdAt, sql`NOW() - interval '24 hours'`))
    .groupBy(ordersTable.id)
    .as('orders_with_source');

  const rows = await ctx.db
    .select({
      source: ordersWithSource.source,
      count: sql<number>`COUNT(*)`,
    })
    .from(ordersWithSource)
    .groupBy(ordersWithSource.source);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.source, Number(row.count ?? 0));
  }

  ordersGauge.reset();
  for (const source of ORDER_SOURCES) {
    ordersGauge.set({ source }, counts.get(source) ?? 0);
  }
}
