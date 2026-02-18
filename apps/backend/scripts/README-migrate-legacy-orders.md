# Legacy Orders Migration Script

This script migrates orders from the legacy MongoDB database to the new PostgreSQL schema, covering the past 2 months of orders.

## Prerequisites

1. **User Migration**: Run the user migration script first to ensure user mappings exist in the new database.
2. **Environment**: Ensure `LEGACY_DB_URL` is configured in your environment/secrets.
3. **Database Access**: Both MongoDB (legacy) and PostgreSQL (new) databases must be accessible.

## What the Script Does

1. **Fetches Legacy Orders**: Gets all orders from the past 2 months (excluding test orders)
2. **Retrieves Order Items**: Collects all items associated with each order
3. **Maps Users**: Maps legacy wallet addresses to new user IDs using the migrated users
4. **Creates Payment Records**: Creates corresponding payment records in the new system
5. **Migrates Orders**: Creates order and order item records in the new schema
6. **Handles Duplicates**: Skips orders that have already been migrated

## Usage

### Run the Script

```bash
# Navigate to the backend directory
cd apps/backend

# Run the migration script
bun tsx scripts/migrate-legacy-orders.ts

# Run in dry run mode (recommended first)
bun tsx scripts/migrate-legacy-orders.ts --dry-run
```

### Script Output

The script provides detailed logging including:

- Connection status
- Number of orders found
- User mapping results
- Migration progress (every 10 orders)
- Final statistics with success rate
- Error details for failed migrations

### Dry Run Mode

Before running the actual migration, it's recommended to run in dry run mode:

```bash
bun tsx scripts/migrate-legacy-orders.ts --dry-run
```

Dry run mode will:

- Connect to the legacy database and analyze the data
- Show how many orders would be migrated
- Display sample migration data structure
- Show user mapping statistics
- **Not perform any actual database writes**

This allows you to verify the migration setup and data before committing to the actual migration.

## Data Mapping

### Order Status Mapping
- `CREATED` → `CREATED`
- `SUBMITTED`, `PROCESSING` → `PROCESSING`
- `SUCCESS` → `SUCCEEDED`
- `FAILURE` → `FAILED`
- `CANCELED` → `CANCELLED`
- `PARTIAL_FULFILLMENT` → `PARTIALLY_COMPLETED`

### Item Type Mapping
- `DOMAIN_REGISTRATION` → `REGISTER`
- `DOMAIN_IMPORT` → `IMPORT`
- `DOMAIN_RENEW` → `RENEW`
- `NFSC_PURCHASE` → `REGISTER`

### Payment Provider Mapping
- If `useNfscBalance` is true → `NFSC_ETHEREUM`
- Otherwise → `STRIPE`

## Important Notes

1. **User Dependency**: This script depends on users already being migrated. If no user mappings are found, the script will exit early.

2. **Idempotent**: The script can be run multiple times safely. It checks for existing orders using the legacy order ID stored in metadata.

3. **Payment Simplification**: For this migration, payment records are created as simplified placeholders. A separate payment intent migration might be needed for complete payment history.

4. **Domain Names**: Only order items with valid domain names (`domainNameLdh`) are migrated.

5. **Metadata Preservation**: Legacy order and item IDs are preserved in the metadata field for reference and debugging. All migrated records include `source: 'legacy'` in metadata for easy identification.

## Error Handling

- **Missing Users**: Orders for users that haven't been migrated will fail with a clear error message
- **Invalid Data**: Items without domain names are skipped with warnings
- **Database Errors**: Connection and query errors are logged with full context
- **Partial Failures**: The script continues processing even if individual orders fail

## Verification

After migration, you can verify the results by:

1. Checking the final statistics in the logs
2. Querying the new database for migrated orders:
   ```sql
   SELECT COUNT(*) FROM orders WHERE metadata->>'legacyOrderId' IS NOT NULL;
   SELECT COUNT(*) FROM orders WHERE metadata->>'source' = 'legacy';
   ```
3. Comparing order counts between legacy and new systems
4. Checking for any error logs that indicate failed migrations

## Troubleshooting

### "No user mappings found"
- Ensure the user migration script has been run first
- Check that users exist in the new database
- Verify the wallet address matching logic

### "MongoDB connection failed"
- Check `LEGACY_DB_URL` environment variable
- Ensure MongoDB is accessible from your environment
- Verify credentials and network connectivity

### "PostgreSQL connection failed"
- Check new database connection settings
- Ensure the new database schema is up to date
- Verify database permissions

## Schema References

The script migrates data to these tables in the new schema:
- `orders`: Main order records
- `order_items`: Individual items within orders  
- `payments`: Payment transaction records
- `users`: User relationships (must exist beforehand)

Legacy data comes from:
- `checkout-orders`: Legacy order records
- `checkout-order-items`: Legacy order item records

## Command Line Options

- `--dry-run`: Run in dry run mode (no database writes, analysis only)
- No flags: Run the actual migration

## Migration Metadata

All migrated records include the following metadata for tracking:
- `source: 'legacy'` - Identifies records as migrated from legacy system
- `legacyOrderId` - Original order ID from legacy system
- `legacyItemId` - Original item ID from legacy system (for order items)
- `migratedAt` - ISO timestamp when migration occurred
- Additional legacy-specific fields preserved for reference