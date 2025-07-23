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

# 🛠️ GCP Docker Deployment with SSL, Datadog & Watchtower

This package automates deployment of a containerized app on a GCP Compute Engine VM with:

- 🐳 Docker & Docker Compose  
- 🐶 Datadog Agent for metrics  
- 🔐 NGINX reverse proxy + Certbot for SSL  
- 🔁 Watchtower for auto-updating images  
- ⏰ Cron-based SSL renewal  
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
           ├── docker-compose.yml     # All services (app, nginx, certbot, datadog, watchtower)
           ├── nginx.conf             # HTTPS + HTTP->HTTPS redirect
           ├── renew-cert.sh          # Daily SSL renewal logic
           └── footer.sh              # Launch stack & setup cron
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
| `DOMAIN`    | `yourdomain.com`                       | Domain name for NGINX + certbot  |
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
| NGINX Gateway      | HTTPS gateway to your app                                         |
| Certbot SSL        | Automatic Let's Encrypt setup                                     |
| Cron Renewal       | Daily SSL renewal via `certbot renew` + `docker restart nginx`   |
| Datadog Metrics    | Container monitoring and Prometheus scraping                      |
| Watchtower         | Automatically pulls/restarts containers with new image versions   |
| GitHub Deploy      | GitHub Actions workflow to deploy from Git                        |

---

## 🧩 Tips

- Make sure your domain has DNS pointed to the GCP VM before provisioning SSL.
- If you're behind Cloudflare or using CDN, temporarily disable proxy for certbot to work.
- Watchtower expects images to be tagged with `:latest` or updated digest.

---

Let me know if you want:
- Terraform version
- DNS-01 challenge for wildcard certs
- Systemd version instead of Docker Compose
