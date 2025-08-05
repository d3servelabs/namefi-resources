# Schema Migration for Timestamped Deployments

This document explains the new timestamped schema functionality for zero-downtime deployments.

## Overview

The indexer now uses a timestamped schema suffix (`${BASE_SCHEMA}_YYYYMMDDHHMM`) for each deployment. After the indexer is ready, it automatically migrates database views to point to the new schema.

## Configuration

### Environment Variables

- `BASE_SCHEMA` (optional): Base schema name (default: "indexer")
- `DATABASE_SCHEMA` (auto-generated): Timestamped schema name
- `READY_ENDPOINT` (optional): Health check endpoint URL (default: "http://localhost:42069/ready")
- `DRY_RUN` (optional): Set to "true" for dry-run migrations

### Example Schema Names

- Base schema: `indexer`
- Timestamped schema: `indexer_202501041530`

## How It Works

1. **Schema Generation**: `generate-schema.ts` creates a timestamped schema name before startup
2. **Startup**: Ponder starts with the generated schema
3. **Indexing**: Ponder creates tables in the timestamped schema
4. **Health Check**: `/ready` endpoint returns "OK" when sync is complete
5. **Schema Discovery**: `/schema` endpoint provides current schema information
6. **Migration**: Views are automatically updated to point to the new schema

## API Endpoints

### Health Check: `/ready` and `/readyz`

Both endpoints return the indexer status:
- `OK`: Indexer is ready and has data
- `SYNCING`: Still synchronizing or no data yet

**Note:** Migration script uses `/ready` endpoint by default.

### Schema Info: `/schema`

Returns current schema information:
```json
{
  "currentSchema": "indexer_202501041530",
  "source": "database",
  "timestamp": "2025-01-04T15:30:00.000Z"
}
```

**Schema Resolution Logic:**
- If database returns the actual schema name → uses database value (`source: "database"`)
- If database returns `"public"` → falls back to `process.env.DATABASE_SCHEMA` (`source: "environment"`)
- Logs details when fallback occurs for debugging

## Scripts

### Schema Generation

```bash
# Generate timestamped schema
npm run generate-schema

# Start with schema generation
npm run start:with-schema
```

### Migration Script

```bash
# Run schema migration
npm run migrate-schema

# Run dry-run migration (shows what would be changed)
npm run migrate-schema:dry-run
```

### Manual Migration

```typescript
import { migrateSchema } from './src/migrate-schema';

await migrateSchema({
  oldSchema: 'indexer',
  newSchema: 'indexer_202501041530',
  readyEndpoint: 'http://localhost:42069/ready',
  isDryRun: false
});
```

## Database Views

The following views are automatically updated during migration:

- `namefi_nft_view`: Points to `${schema}."NamefiNft"`
- `namefi_nft_owners_view`: Derived from `namefi_nft_view`

## Deployment Process

1. **Deploy new version** with timestamped schema
2. **Ponder starts** and creates tables in new schema
3. **Wait for ready** status from `/ready` endpoint
4. **Migrate views** to point to new schema
5. **Old schema** can be cleaned up later

## Benefits

- **Zero-downtime deployments**: Views switch atomically
- **Rollback capability**: Old schemas remain available
- **Clean separation**: Each deployment has its own schema
- **Automatic migration**: No manual intervention required

## Troubleshooting

### Check Schema Status

```sql
-- See all schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'indexer%';

-- Check view definitions
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname LIKE '%namefi_nft%';
```

### Manual View Update

```sql
-- Update views manually if needed
CALL rewrite_views_with_new_schema('indexer', 'indexer_202501041530', false);
```