import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';

const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const usersTable = pgTable('users_table', {
  id: serial('id').primaryKey(),
  primaryEmail: text('primary_email').unique(),
  ...timestamps,
});

export const postsTable = pgTable('posts_table', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const userInsertSchema = createInsertSchema(usersTable);
export const userSelectSchema = createSelectSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export const postInsertSchema = createInsertSchema(postsTable);
export const postSelectSchema = createSelectSchema(postsTable);
export const postUpdateSchema = createUpdateSchema(postsTable);
