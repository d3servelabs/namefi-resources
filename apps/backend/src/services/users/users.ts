import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { UserNotFoundError } from './errors';

// Note: This is just created as an example for devs to follow
// TODO: delete or remove 'export', not being used by trpc or temporal.
export async function getUserEmail(userId: string) {
  const user = await db.query.usersTable.findFirst({
    columns: { primaryEmail: true, id: true },
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return user;
}

export async function getUserStripeCustomerId({ userId }: { userId: string }) {
  const user = await db.query.usersTable.findFirst({
    columns: { stripeCustomerId: true },
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return { stripeCustomerId: user.stripeCustomerId };
}
