import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { UserNotFoundError } from './errors';

// Note: This is just created as an example for devs to follow
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

export async function getUserStripeCustomerId(userId: string) {
  const user = await db.query.usersTable.findFirst({
    columns: { stripeCustomerId: true, id: true },
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return user;
}
