import { Gauge } from 'prom-client';
import { usersTable } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_users_wallets_total';

const usersByWalletsGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Users grouped by wallet count class',
  labelNames: ['wallets'],
  registers: [register],
});

const WALLET_LABELS = ['single', 'multi'] as const;

export async function collectUsersByWalletCountClass(
  ctx: MetricsContext,
): Promise<void> {
  const walletCountExpr = sql<number>`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`;
  const walletClassExpr = sql<string>`
    CASE WHEN ${walletCountExpr} > 1 THEN 'multi' ELSE 'single' END
  `;

  const rows = await ctx.db
    .select({
      walletClass: walletClassExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(usersTable)
    .leftJoin(
      privyUsersTableSchema,
      eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
    )
    .groupBy(walletClassExpr);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.walletClass, Number(row.count ?? 0));
  }

  usersByWalletsGauge.reset();
  for (const label of WALLET_LABELS) {
    usersByWalletsGauge.set({ wallets: label }, counts.get(label) ?? 0);
  }
}
