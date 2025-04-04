import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { type SendMailInput, sendMail } from '../../mail/mail-client';

export async function getUserEmailOrThrow(userId: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      primaryEmail: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.primaryEmail) {
    // TODO: (sid) remove this after merging guest checkout
    throw new Error('User has no primary email');
  }

  return user.primaryEmail;
}

type SendEmailOrThrowInput = Pick<SendMailInput, 'to' | 'subject' | 'content'>;

export async function sendEmailOrThrow({
  to,
  subject,
  content,
}: SendEmailOrThrowInput) {
  await sendMail({
    to,
    subject,
    content,
  });
}

export type NotifyActivities = {
  sendEmailOrThrow: typeof sendEmailOrThrow;
  getUserEmailOrThrow: typeof getUserEmailOrThrow;
};
