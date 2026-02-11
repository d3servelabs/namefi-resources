import { Gauge } from 'prom-client';
import { usersTable } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { eq, sql } from 'drizzle-orm';
import { register } from '../registry';
import type { MetricsContext } from '../types';

export const METRIC_NAME = 'namefi_users_email_total';

const usersByEmailGauge = new Gauge({
  name: METRIC_NAME,
  help: 'Users grouped by presence of email',
  labelNames: ['has_email'],
  registers: [register],
});

const EMAIL_LABELS = ['true', 'false'] as const;

export async function collectUsersByEmailPresence(
  ctx: MetricsContext,
): Promise<void> {
  const hasEmailExpr = sql<boolean>`
    COALESCE(NULLIF(${usersTable.primaryEmail}, ''), NULLIF(${privyUsersTableSchema.email}, '')) IS NOT NULL
  `;

  const rows = await ctx.db
    .select({
      hasEmail: hasEmailExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(usersTable)
    .leftJoin(
      privyUsersTableSchema,
      eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
    )
    .groupBy(hasEmailExpr);

  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row.hasEmail ? 'true' : 'false';
    counts.set(label, Number(row.count ?? 0));
  }

  usersByEmailGauge.reset();
  for (const label of EMAIL_LABELS) {
    usersByEmailGauge.set({ has_email: label }, counts.get(label) ?? 0);
  }
}
