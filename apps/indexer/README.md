# Namefi NFT Indexer

A Ponder.sh-based indexer for the Namefi NFT contract that tracks domain ownership and transfers across Ethereum mainnet and Base networks.

## Overview

This indexer monitors the Namefi NFT contract (`0x0000000000cf80e7cf8fa4480907f692177f8e06`) and maintains timestamped database schemas for zero-downtime deployments. It tracks:

- NFT transfers and ownership changes
- Domain name to token ID mappings
- Owner statistics and activity
- Token metadata and expiration updates

## Schema Management & Zero-Downtime Deployments

The indexer uses **timestamped schemas** (`${BASE_SCHEMA}_YYYYMMDDHHMM`) for each deployment, enabling zero-downtime updates:

### Timestamped Schema Examples
- `indexer_202501041530` (January 4, 2025 at 15:30)
- `indexer_202501041600` (January 4, 2025 at 16:00)

### Migration Process
1. **New deployment** creates fresh timestamped schema
2. **Indexer syncs** data in isolation  
3. **Views automatically migrate** once indexer is ready
4. **Zero downtime** - old schema remains until migration complete

### API Endpoints
- **`/ready`** - Health check for migration scripts
- **`/readyz`** - Alternative health check (Kubernetes-style)
- **`/schema`** - Returns current schema info with fallback logic

## Architecture

### Database Schema

The indexer uses timestamped schemas (e.g., `indexer_202501041530`) in the same PostgreSQL database as the main application, with a single simplified table:

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
BASE_SCHEMA=indexer  # Optional: defaults to "indexer"
DATABASE_SCHEMA=indexer_202501041530  # Auto-generated timestamped schema
```

### Schema Generation

The indexer automatically generates timestamped schemas on startup:

```bash
# Generate schema before startup
npm run generate-schema

# Start with automatic schema generation  
npm run start:with-schema
```

### Networks

The indexer is configured to work with:

- **Ethereum Mainnet** (Chain ID: 1)
- **Base** (Chain ID: 8453)

## Development

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Production

1. Start with timestamped schema generation:
```bash
npm run start:with-schema
```

2. Run schema migration (separate process):
```bash
npm run migrate-schema
```

### Migration Scripts

```bash
# Run schema migration after indexer is ready
npm run migrate-schema

# Dry-run migration (preview changes)
npm run migrate-schema:dry-run

# Generate timestamped schema manually
npm run generate-schema
```

## Data Access

The indexed data is stored in timestamped schemas and accessed through stable views that automatically point to the latest schema:

### GraphQL API
```bash
# Access GraphQL playground
npm run serve
# Navigate to http://localhost:42069/graphql
```

### Database Views
- **`namefi_nft_view`** - Complete NFT data with expiration dates
- **`namefi_nft_owners_view`** - Simplified ownership data

Views automatically migrate to new schemas during deployments for zero-downtime access.

## Key Features

- **Zero-Downtime Deployments**: Timestamped schemas with automatic view migration
- **Real-time Indexing**: Processes events as they occur on-chain
- **Multi-chain Support**: Indexes both Ethereum and Base networks
- **Domain Resolution**: Automatically fetches domain names from token IDs
- **Owner Analytics**: Tracks ownership statistics and activity
- **Burn Handling**: Properly handles token burning and ownership removal
- **Error Resilience**: Graceful handling of contract call failures
- **Health Monitoring**: Built-in health checks and schema endpoints

## Integration with Main App

This indexer operates independently from the main application's existing NFT indexing system in the backend. It provides:

- A separate, more detailed view of NFT data
- Real-time updates without relying on scheduled workflows
- GraphQL API for querying indexed data
- Potential for future analytics and reporting features

## Deployment

### Docker Deployment with Migration

The indexer supports zero-downtime deployments using Docker Compose with separate migration containers:

```yaml
services:
  app:
    image: ${APP_IMAGE}
    restart: always
    command: ["./scripts/start-with-schema.sh"]
    
  # Migration job - runs once and exits
  migration:
    image: ${APP_IMAGE}
    restart: "no"  # Don't restart after completion
    command: ["infisical", "run", "--", "npm", "run", "migrate-schema"]
    depends_on:
      - app
```

### Deployment Process

1. **Main indexer starts** with new timestamped schema
2. **Migration container starts** after main indexer  
3. **Migration waits** for `/ready` endpoint to return "OK"
4. **Views migrate** automatically to new schema
5. **Migration container exits** cleanly
6. **Zero downtime** achieved

### Manual Deployment

```bash
# 1. Deploy new indexer
docker run -d indexer:latest npm run start:with-schema

# 2. Wait for ready status  
curl http://indexer:8080/ready  # Wait for "OK"

# 3. Run migration
docker run --rm indexer:latest npm run migrate-schema
```

### Migration Documentation

For detailed information about the schema migration system, see [SCHEMA_MIGRATION.md](./SCHEMA_MIGRATION.md):

- Environment variables and configuration
- API endpoint details (`/ready`, `/readyz`, `/schema`)
- Migration script usage and troubleshooting
- Database view management
- Deployment workflow examples

# 🛠️ GCP Docker Deployment with Caddy HTTPS & Datadog

This package automates deployment of a containerized app on a GCP Compute Engine VM with:

- 🐳 Docker & Docker Compose  
- 🐶 Datadog Agent for metrics  
- 🔐 Caddy reverse proxy with automatic, auto-renewing Let's Encrypt HTTPS  
- ✅ GitHub Actions + Makefile automation

---

## 📁 Directory Structure

```
.github/workflows/
    └── deploy-ponder.yml             # GitHub Actions CI trigger
apps/indexer/
    ├── Makefile                      # Local CLI interface
    ├── README.md
    └── scripts/
       ├── deploy.sh                  # Main deployment script (create/update)
       ├── local-test.sh              # Simulate startup locally
       └── startup/
           ├── header.sh              # Pre-install, env loading
           ├── docker-compose.yml     # All services (app, caddy, datadog)
           ├── Caddyfile              # HTTPS reverse proxy (auto Let's Encrypt)
           └── footer.sh              # Launch the stack
```

---

## 🚀 Deployment Instructions

### ▶️ Option 1: Manual CLI

```bash
# Create instance for the first time:
make deploy MODE=create

# Update instance with new changes:
make deploy MODE=update

# Destroy instance:
make clean
```

> Make sure you have Docker and GCP SDK (`gcloud`) installed and configured.

---

### ▶️ Option 2: GitHub Actions

1. Commit this folder to your repo  
2. Set the following GitHub secrets:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (JSON service account key)
   - `DD_API_KEY`
3. Trigger the workflow manually from the GitHub UI → Actions → Deploy to GCP

---

## 🌐 Required Metadata (Injected by deploy.sh)

These values are passed as instance metadata:

| Key         | Example                                | Description                      |
|-------------|----------------------------------------|----------------------------------|
| `DD_API_KEY`| `abc123...`                            | Your Datadog API key             |
| `APP_IMAGE` | `ghcr.io/org/app:latest`               | Your Docker image to deploy      |
| `DOMAIN`    | `yourdomain.com`                       | Domain Caddy serves over HTTPS  |
| `EMAIL`     | `you@example.com`                      | Email for Let's Encrypt          |

---

## 🧪 Local Testing

To test the startup scripts **locally** (e.g. before deploying):

```bash
chmod +x local-test.sh
./local-test.sh
```

This simulates what the GCP VM does on first boot.

---

## ✅ What This Stack Gives You

| Feature            | Description                                                       |
|--------------------|-------------------------------------------------------------------|
| Docker App         | Runs your app using Docker Compose                                |
| Caddy Gateway      | HTTPS gateway with automatic, auto-renewing Let's Encrypt certs   |
| Datadog Metrics    | Container monitoring and Prometheus scraping                      |
| GitHub Deploy      | GitHub Actions workflow to deploy from Git                        |

---

## 🧩 Tips

- Make sure your domain has DNS pointed to the GCP VM before first boot, so Caddy can issue the certificate.
- If you're behind Cloudflare or using CDN, use DNS-only (grey-cloud) for the indexer host so Caddy's ACME challenge can complete.

---

Let me know if you want:
- Terraform version
- DNS-01 challenge for wildcard certs
- Systemd version instead of Docker Compose
