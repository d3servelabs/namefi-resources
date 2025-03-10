import { type UserInsert, db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';

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

export async function createUser(user: UserInsert) {
  const [newUser] = await db.insert(usersTable).values(user).returning();
  return newUser;
}
