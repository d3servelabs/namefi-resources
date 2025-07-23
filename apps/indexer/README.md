# Namefi NFT Indexer

A Ponder.sh-based indexer for the Namefi NFT contract that tracks domain ownership and transfers across Ethereum mainnet and Base networks.

## Overview

This indexer monitors the Namefi NFT contract (`0x0000000000cf80e7cf8fa4480907f692177f8e06`) and maintains a separate database schema (`indexer`) to track:

- NFT transfers and ownership changes
- Domain name to token ID mappings
- Owner statistics and activity
- Token metadata and expiration updates

## Architecture

### Database Schema

The indexer uses a separate `indexer` schema in the same PostgreSQL database as the main application, with a single simplified table:

- **NftDomain**: Contains all essential domain information:
  - `tokenId`: The NFT token ID
  - `domainName`: The normalized domain name
  - `expirationDate`: Domain expiration timestamp
  - `isLocked`: Domain lock status (true/false)
  - `ownerAddress`: Current owner wallet address
  - `chainId`: Network chain ID (1 for Ethereum, 8453 for Base)
  - `lastUpdatedBlock`: Block number of last update
  - `lastUpdatedTimestamp`: Timestamp of last update

### Event Handlers

The indexer uses a DRY approach with optimized event handling:

- **`Transfer`**: Main event handler that captures ALL ownership changes including:
  - Minting (from 0x0 address) - creates new domain record
  - Burning (to 0x0 address) - deletes domain record
  - Regular transfers between addresses - updates owner
  - All `*ByName` function calls (automatically emit Transfer events)

- **`setExpiration`**: Updates domain expiration timestamp

- **`lock`/`unlock`**: Updates domain lock status (isLocked field)

**Note**: The following function calls are NOT handled separately because they automatically emit the above events that Ponder captures:
- `safeMintByNameNoCharge`, `safeMintByNameWithCharge` → emit Transfer events
- `burnByName` → emits Transfer event  
- `safeTransferFromByName` → emits Transfer event
- `lockByName`, `unlockByName` → call `lock`/`unlock` internally

## Configuration

### Environment Variables

Required environment variables:

```bash
ALCHEMY_API_KEY=your_alchemy_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### Networks

The indexer is configured to work with:

- **Ethereum Mainnet** (Chain ID: 1)
- **Base** (Chain ID: 8453)

## Development

### Setup

1. Install dependencies:
```bash
bun install
```

2. Start the development server:
```bash
bun run dev
```

### Production

1. Build the indexer:
```bash
bun run build
```

2. Start the production server:
```bash
bun run start
```

## Data Access

The indexed data is stored in the `indexer` schema and can be queried directly or through Ponder's built-in GraphQL API:

```bash
# Access GraphQL playground
bun run serve
# Navigate to http://localhost:42069/graphql
```

## Key Features

- **Real-time Indexing**: Processes events as they occur on-chain
- **Multi-chain Support**: Indexes both Ethereum and Base networks
- **Domain Resolution**: Automatically fetches domain names from token IDs
- **Owner Analytics**: Tracks ownership statistics and activity
- **Burn Handling**: Properly handles token burning and ownership removal
- **Error Resilience**: Graceful handling of contract call failures

## Integration with Main App

This indexer operates independently from the main application's existing NFT indexing system in the backend. It provides:

- A separate, more detailed view of NFT data
- Real-time updates without relying on scheduled workflows
- GraphQL API for querying indexed data
- Potential for future analytics and reporting features

## Deployment

The indexer can be deployed separately from the main application and configured to use the same database with its own schema for data isolation.