import { Gauge } from 'prom-client';
import { wishlistedDomainsTable } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_users_with_wishlist_total';

const usersWithWishlistGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Count of users who have at least one wishlist item',
  registers: [register],
});

export async function collectUsersWithWishlistItems(
  ctx: MetricsContext,
): Promise<void> {
  const [row] = await ctx.db
    .select({
      count: sql<number>`COUNT(DISTINCT ${wishlistedDomainsTable.userId})`,
    })
    .from(wishlistedDomainsTable);

  usersWithWishlistGauge.set(Number(row?.count ?? 0));
}
