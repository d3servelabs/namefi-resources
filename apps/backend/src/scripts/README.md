# Scripts

This directory contains utility scripts for various tasks.

## sync-privy-users-to-listmonk.ts

Syncs all Privy users to Listmonk subscribers.

### Environment Variables Required

Add these to your Infisical secrets:

- `LISTMONK_BASE_URL` - Base URL of your Listmonk instance (e.g., `https://listmonk.example.com`)
- `LISTMONK_USERNAME` - Listmonk admin username
- `LISTMONK_PASSWORD` - Listmonk admin password

And this to your config:

- `LISTMONK_DEFAULT_LIST_ID` - Default list ID to add subscribers to (defaults to 1)

### Usage

```bash
# Run the sync script
bun tsx apps/backend/src/scripts/sync-privy-users-to-listmonk.ts
```

### Features

- Fetches all users from Privy
- Enriches Privy users with database user IDs from the users table
- Extracts email addresses and names from custom metadata using proper Zod schema validation
- Creates or updates subscribers in Listmonk
- Handles errors gracefully with detailed logging
- Includes both Privy user ID, database user ID, and parsed custom metadata as subscriber attributes
- Properly parses Privy custom metadata using `privyStorageToPrivyCustomMetadata` schema
- Includes address information from custom metadata when available