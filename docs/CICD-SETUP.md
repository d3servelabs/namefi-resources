# CI/CD Setup for GCP Deployment

This document describes how to set up the CI/CD pipeline for deploying the backend to Google Cloud Platform (GCP) using GitHub Actions and Workload Identity Federation (WIF).

## Prerequisites

1. A GCP project with the following APIs enabled:
   - Cloud Run API
   - Artifact Registry API
   - IAM Service Account Credentials API

2. GitHub repository with the code

## Setup Steps

### 1. Set up Artifact Registry

Create an Artifact Registry repository to store your Docker images:

```bash
# Replace with your preferred region and repository name
gcloud artifacts repositories create namefi-astra \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for namefi-astra"
```

### 2. Set up Workload Identity Federation

Create a Workload Identity Pool and Provider for GitHub:

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Get the Workload Identity Pool ID
POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" \
    --location="global" --format="value(name)")

# Create a Workload Identity Provider in the pool
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --display-name="GitHub provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3. Create Service Account for Deployment

Create a service account that the GitHub workflow will use:

```bash
# Create service account
gcloud iam service-accounts create "deployer-service-account" \
    --display-name="GitHub Actions Deployer"

# Grant necessary permissions to the service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:deployer-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:deployer-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:deployer-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### 4. Allow GitHub to Impersonate the Service Account

```bash
# Get your GitHub repository info
REPO="OWNER/REPO-NAME"  # e.g., "namefi/namefi-astra"

# Allow the GitHub provider to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "deployer-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${REPO}"
```

### 5. Configure GitHub Variables

Set up the following GitHub variables in your repository settings (Settings > Secrets and variables > Actions > Variables):

1. `GCP_PROJECT_ID`: Your GCP project ID
2. `GCP_REGION`: Your preferred GCP region (e.g., us-central1)
3. `REPOSITORY_NAME`: Your Artifact Registry repository name
4. `GCP_CLOUD_RUN_SERVICE`: Your production Cloud Run service name
5. `GCP_CLOUD_RUN_SERVICE_STAGING`: Your staging Cloud Run service name (optional)
6. `GCP_WIF_PROVIDER`: Your WIF provider ID (format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`)
7. `GCP_WIF_SERVICE_ACCOUNT`: Your GCP service account (format: `deployer-service-account@PROJECT_ID.iam.gserviceaccount.com`)

You can get the full Workload Identity Provider ID with:

```bash
gcloud iam workload-identity-pools providers describe github-provider \
    --location=global \
    --workload-identity-pool=github-pool \
    --format="value(name)"
```

## Usage

### Automated Deployments

The workflow will run automatically when changes are pushed to the `main` branch. It will use:
- The `GCP_CLOUD_RUN_SERVICE` for the service name

### Manual Deployments

You can manually trigger the workflow from the "Actions" tab in your GitHub repository with additional options:

1. **Environment Selection**: Choose between:
   - `staging`: Uses the `GCP_CLOUD_RUN_SERVICE_STAGING` service
   - `production`: Uses the `GCP_CLOUD_RUN_SERVICE` service

## Troubleshooting

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Verify that all required APIs are enabled in your GCP project
3. Ensure your service account has the necessary permissions
4. Confirm the Workload Identity Federation is set up correctly
5. Review the debug output in the workflow to confirm the environment variables are set correctly 