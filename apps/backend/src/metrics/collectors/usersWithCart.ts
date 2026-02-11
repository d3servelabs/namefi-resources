import { Gauge } from 'prom-client';
import { cartItemsTable } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_users_with_cart_total';

const usersWithCartGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Count of users who have at least one cart item',
  registers: [register],
});

export async function collectUsersWithCartItems(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .select({ count: sql<number>`COUNT(DISTINCT ${cartItemsTable.userId})` })
    .from(cartItemsTable);

  usersWithCartGauge.set(Number(row?.count ?? 0));
}
