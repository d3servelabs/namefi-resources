# Listmonk Email Platform

This directory contains the customized Listmonk email platform deployment for Namefi Astra.

## Overview

Listmonk is an open-source newsletter and mailing list manager. This setup includes:
- Custom email templates and static assets
- Automated deployment to Google Cloud Run
- GCS bucket integration for static file hosting

## Directory Structure

```
apps/listmonk/
├── static/              # Custom templates, assets, and static files
├── Dockerfile           # Docker configuration
├── startup.sh           # Container startup script
├── sync-static-to-gcs.sh # Script to sync static files to GCS
└── package.json         # Package metadata
```

## Static Files

The `/static` directory is mounted as a volume from Google Cloud Storage bucket `namefi-listmonk/static`. This allows for:
- Hot-reloading of templates without redeploying the container
- Centralized asset management
- Easy updates to email templates and branding

## Deployment

### Automated Deployment (CI/CD)

The deployment is automated via GitHub Actions (`.github/workflows/deploy-listmonk.yml`). The workflow:

1. **Triggers on:**
   - Push to `main` branch (when files in `apps/listmonk/` change)
   - Manual workflow dispatch

2. **Build Process:**
   - Builds Docker image with GitHub commit SHA as tag
   - Pushes to Artifact Registry: `us-central1-docker.pkg.dev/d3serve-labs/apps/listmonk:$GITHUB_SHA`

3. **Static Files Sync:**
   - Automatically detects changes in `apps/listmonk/static/` directory
   - If changes detected, syncs files to GCS bucket `namefi-listmonk/static`
   - Can be forced via workflow dispatch

4. **Deployment:**
   - Deploys new revision to Cloud Run service `namefi-listmonk`
   - Service automatically uses mounted GCS bucket for static files

### Manual Deployment

#### Sync Static Files Only

To manually sync static files to GCS bucket:

```bash
cd apps/listmonk
./sync-static-to-gcs.sh
```

**Prerequisites:**
- Authenticated with GCP (`gcloud auth login`)
- Appropriate permissions for the `namefi-listmonk` bucket

#### Build and Push Docker Image

```bash
cd apps/listmonk
docker build -t us-central1-docker.pkg.dev/d3serve-labs/apps/listmonk:latest .
docker push us-central1-docker.pkg.dev/d3serve-labs/apps/listmonk:latest
```

## Configuration

### Environment Variables

The container expects the following environment variables (configured in Cloud Run):

- `LISTMONK__app__static_dir`: Path to static files directory (set to GCS mount point)
- Database configuration (PostgreSQL connection)
- SMTP settings for email delivery

### Startup Process

The `startup.sh` script handles:
1. Initial installation (idempotent)
2. Database upgrades
3. Starting Listmonk with custom static directory

## Customization

### Email Templates

Email templates are located in `static/email-templates/`. To customize:

1. Edit template files (e.g., `base.html`)
2. Test changes locally if possible
3. Commit and push changes
4. GitHub Actions will automatically sync to GCS and deploy

### Static Assets

Custom CSS, images, and other assets in `static/` will be automatically synced to GCS when changed.

## Monitoring

- **Service URL:** Available in Cloud Run console
- **Logs:** View in GCP Cloud Logging
- **Metrics:** Available in Cloud Run metrics dashboard

## Troubleshooting

### Static files not updating
1. Check if sync-static job ran successfully in GitHub Actions
2. Verify GCS bucket permissions
3. Manually run sync script: `./sync-static-to-gcs.sh`

### Deployment fails
1. Check GitHub Actions logs
2. Verify Workload Identity Federation is configured
3. Ensure Cloud Run service `namefi-listmonk` exists in GCP project

## Development

For local development and testing:

```bash
# Pull the base listmonk image
docker pull listmonk/listmonk:latest

# Build with local changes
docker build -t listmonk-dev .

# Run locally (requires PostgreSQL)
docker run -p 9000:9000 \
  -e LISTMONK__db__host=host.docker.internal \
  -e LISTMONK__db__database=listmonk \
  listmonk-dev
```

## Resources

- [Listmonk Documentation](https://listmonk.app/docs/)
- [Listmonk GitHub](https://github.com/knadh/listmonk)

