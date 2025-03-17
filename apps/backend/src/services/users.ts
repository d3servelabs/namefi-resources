import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';

// Note: This is just created as an example for devs to follow
export async function getUserEmail(userId: string) {
  const user = await db.query.usersTable.findFirst({
    columns: { primaryEmail: true, id: true },
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
