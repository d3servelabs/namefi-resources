# Database Views Architecture

This document explains the database views architecture implemented to provide a stable interface to NFT data from the Ponder indexer, insulating the application from schema changes.

## Overview

We've implemented two database views to abstract the NFT data access layer:

1. **NamefiNftView** (`namefi_nft_view`) - Complete NFT data with dates and metadata
2. **NamefiNftOwnersView** (`namefi_nft_owners_view`) - Simplified view for ownership queries

## Problem Statement

The schema and tables for indexed NFTs are subject to frequent changes as the indexer evolves. This was causing constant code updates whenever the underlying ponder schema changed. To solve this, we've introduced database views that provide a stable interface.

## Architecture Decision

### Views vs Direct Table Access

**Previous Approach:**
- Direct queries to `namefiNftTable` (legacy table)  
- Direct queries to ponder's `NamefiNft` table
- Code scattered across the application breaking whenever schema changed

**New Approach:**
- Stable view interfaces that abstract the underlying table structure
- Views can be updated independently of application code
- Cleaner separation between data access and business logic

### View Definitions

#### NamefiNftView
**Purpose:** Complete NFT data access with dates and metadata for complex queries

**Source:** Maps from ponder's `NamefiNft` table (or `namefiNftTable` in local dev)

**Schema:**
```sql
CREATE VIEW namefi_nft_view AS 
SELECT 
  token_id,
  normalized_domain_name,
  expiration_date_in_seconds,
  is_locked,
  owner_address,
  chain_id,
  last_updated_block,
  last_updated_timestamp
FROM "NamefiNft"; -- Production with ponder
```

#### NamefiNftOwnersView  
**Purpose:** Simplified ownership data for most common queries

**Source:** Based on `namefiNftView` with only essential ownership columns

**Schema:**
```sql
CREATE VIEW namefi_nft_owners_view AS
SELECT 
  normalized_domain_name,
  chain_id,
  owner_address,
  as_of_block_number
FROM namefi_nft_view;
```

## Implementation Details

### Drizzle Integration

Views are defined in `/packages/db/src/schema.ts` using Drizzle's `pgView()`:

```typescript
export const namefiNftView = pgView('namefi_nft_view', {
  tokenId: bigint('token_id', { mode: 'bigint' }).notNull(),
  normalizedDomainName: text('normalized_domain_name').notNull().$type<NamefiNormalizedDomain>(),
  expirationDateInSeconds: bigint('expiration_date_in_seconds', { mode: 'bigint' }).notNull(),
  isLocked: boolean('is_locked').default(false),
  ownerAddress: text('owner_address').notNull(),
  chainId: integer('chain_id').notNull(),
  lastUpdatedBlock: bigint('last_updated_block', { mode: 'bigint' }).notNull(),
  lastUpdatedTimestamp: bigint('last_updated_timestamp', { mode: 'bigint' }).notNull(),
});

export const namefiNftOwnersView = pgView('namefi_nft_owners_view', {
  normalizedDomainName: text('normalized_domain_name').notNull().$type<NamefiNormalizedDomain>(),
  chainId: integer('chain_id').notNull(),
  ownerAddress: text('owner_address').notNull(),
  asOfBlockNumber: bigint('as_of_block_number', { mode: 'bigint' }).notNull(),
});
```

### Query Migration

All `db.query.namefiNftTable` calls have been migrated to use query builder syntax with the new views, as Drizzle's relational query API doesn't support views.

**Before:**
```typescript
const nft = await db.query.namefiNftTable.findFirst({
  where: (table, { eq }) => eq(table.normalizedDomainName, domain),
});
```

**After:**
```typescript
const nftResult = await db
  .select()
  .from(namefiNftOwnersView)
  .where(eq(namefiNftOwnersView.normalizedDomainName, domain))
  .limit(1);
const nft = nftResult[0];
```

## Local Development Strategy

### Challenge
In local development, developers won't be running the ponder indexer, so the `NamefiNft` table won't exist.

### Solution Options

#### Option 1: Conditional Migration (Recommended)
Create a migration that:
- Checks if the `NamefiNft` table exists (production with ponder)
- Creates views pointing to `NamefiNft` if it exists
- Falls back to creating views pointing to the legacy `namefiNftTable` for local development

#### Option 2: Environment-Based Views
- Use environment variables to determine which source table to use
- Create different view definitions based on `NODE_ENV`

#### Option 3: Stub Data Approach
- Create a mock `NamefiNft` table structure for local development
- Populate with sample data for testing

**Recommended Implementation:**
```sql
-- Migration: Create views conditionally
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'NamefiNft') THEN
    -- Production: Use ponder table
    CREATE OR REPLACE VIEW namefi_nft_view AS 
    SELECT * FROM "NamefiNft";
  ELSE
    -- Local dev: Use legacy table
    CREATE OR REPLACE VIEW namefi_nft_view AS 
    SELECT * FROM namefi_nft_table;
  END IF;
END $$;
```

## Migration Path

### Phase 1: ✅ Completed
- [x] Add view definitions to Drizzle schema
- [x] Convert all `db.query.namefiNftTable` calls to query builder syntax
- [x] Update imports to use new views
- [x] Exclude old-indexer files from migration

### Phase 2: Manual SQL Views (To Do)
- [ ] Create SQL migration with conditional view creation
- [ ] Test local development workflow
- [ ] Update documentation with migration commands

### Phase 3: Cleanup (Future)
- [ ] Remove legacy `namefiNftTable` references once stable
- [ ] Consider deprecating old indexer workflows

## Files Modified

### Schema Updates
- `packages/db/src/schema.ts` - Added view definitions

### Query Migrations
- `apps/backend/src/trpc/guards/assert-domain-owner.ts`  
- `apps/backend/src/trpc/routers/usersRouter.ts`
- `apps/backend/src/trpc/routers/adminRouter.ts`
- `apps/backend/src/lib/domains/domainPreferences.ts`
- `apps/backend/src/lib/namefi-registry.ts`
- `apps/backend/src/ns-json.ts`
- `apps/backend/src/temporal/activities/domain/index.ts`
- `apps/backend/src/temporal/activities/domain/renew.activities.ts`

### Excluded Files (Old Indexer)
- `apps/backend/src/temporal/activities/namefi-nft.ts`
- `apps/backend/src/temporal/workflows/update-nft-index.workflow.ts`

## Benefits

1. **Schema Isolation:** Application code is isolated from ponder schema changes
2. **Maintainability:** Single place to update data access patterns
3. **Development Flexibility:** Support for both local development and production environments
4. **Query Optimization:** Views can be optimized independently
5. **Migration Safety:** Gradual migration path with fallback options

## Testing Strategy

### Local Development
1. Ensure views work without ponder running
2. Test query performance with legacy table
3. Verify all existing functionality works

### Production  
1. Test views with actual ponder data
2. Monitor query performance
3. Validate data consistency between old and new approaches

## Future Considerations

1. **Indexing:** Consider adding indexes on view columns for performance
2. **Materialized Views:** For better performance with large datasets
3. **View Versioning:** Strategy for updating views without breaking changes
4. **Monitoring:** Track view usage and performance metrics

## Commands

### Development Setup
```bash
# Generate migration
bun run db:generate

# Apply migrations  
bun run db:migrate

# View database schema
bun run db:studio
```

### Manual View Creation (if needed)
```sql
-- Connect to your database and run:
-- This will be automated in a future migration
\i manual-view-creation.sql
```

---

This architecture provides a robust foundation for NFT data access that can evolve with the application's needs while maintaining stability and developer productivity.