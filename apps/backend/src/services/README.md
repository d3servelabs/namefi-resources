# Service Architecture Guide

This guide explains how to define and work with services in our application architecture.

## Service Structure

Services in our application follow a layered architecture:

1. **Service Implementation** - Contains business logic and database operations `apps/backend/src/services/<service-name>.ts`
2. **Service Export** - Makes services available throughout the application `apps/backend/src/services/index.ts`
3. **tRPC Router** - Exposes services through type-safe API endpoints `apps/backend/src/trpc/<router-name>.ts`

## Creating a New Service

### 1. Create the Service Implementation

Create a new file in the `apps/backend/src/services/` directory:

```typescript
// apps/backend/src/services/myService.ts
import { db, myTable } from '@namefi-astra/astra-db';
import { eq } from 'drizzle-orm';

// Define service functions that implement business logic
export async function getItem(itemId: string) {
  const item = await db.query.myTable.findFirst({
    where: eq(myTable.id, itemId),
  });

  if (!item) {
    throw new Error('Item not found');
  }

  return item;
}

export async function createItem(item: ItemInsert) {
  const [newItem] = await db.insert(myTable).values(item).returning();
  return newItem;
}
```

### 2. Export the Service

Add your service to the `apps/backend/src/services/index.ts` file:

```typescript
export * as usersService from './users';
export * as myService from './myService';
```

### 3. Create a tRPC Router

Create a new router file in the `apps/backend/src/trpc/routers/` directory:

```typescript
// apps/backend/src/trpc/routers/myRouter.ts
import { itemInsertSchema } from '@namefi-astra/astra-db';
import { z } from 'zod';
import { createItem, getItem } from '#services/myService';
import { publicProcedure, router } from '../context';

export const myRouter = router({
  getItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getItem(input.id)),

  createItem: publicProcedure
    .input(itemInsertSchema)
    .mutation(({ input }) => createItem(input)),
});
```

### 4. Register the Router

Add your router to the main application router:

```typescript
// apps/backend/src/trpc/router.ts
import { router } from './context';
import { usersRouter } from './routers/usersRouter';
import { myRouter } from './routers/myRouter';

export const appRouter = router({
  users: usersRouter,
  items: myRouter,
});
```

## Best Practices

1. **Service Separation**: Keep related functionality grouped together in a single service file.
2. **Strong Typing**: Use TypeScript types and Zod schemas for validation.
3. **Error Handling**: Provide meaningful error messages from service functions.
4. **Database Abstraction**: Use ORM methods to interact with the database, preferred over raw queries.
5. **Function Naming**: Use descriptive function names that indicate the action being performed.

## Example: Users Service

The users service demonstrates this pattern:

```typescript
// Service implementation in services/users.ts
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

// Export in services/index.ts
export * as usersService from './users';

// tRPC router in trpc/routers/usersRouter.ts
export const usersRouter = router({
  getUserEmail: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getUserEmail(input.id)),
});
```

## Conclusion

Following this architecture ensures that your application's business logic remains organized, testable, and easy to maintain as it grows.
