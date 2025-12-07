# Cloud Run Deployment Guide

This guide explains how to build and deploy the Gemini Chess application to Google Cloud Run.

## Prerequisites

1.  Google Cloud SDK (`gcloud`) installed and authorized.
2.  A Google Cloud Project with billing enabled.
3.  Artifact Registry API and Cloud Run API enabled.

## 1. Setup Environment Variables

Replace these values with your actual project details:

```bash
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1" # or your preferred region
export SERVICE_NAME="gemini-chess"
# Your actual Gemini API Key
export GEMINI_API_KEY="AIza..." 
```

## 2. Build and Submit the Image

Use Cloud Build to build the container image and store it in the Container Registry (or Artifact Registry).

```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
```

*Note: If you are using Artifact Registry, the tag format will be different (e.g., `us-central1-docker.pkg.dev/$PROJECT_ID/repo-name/$SERVICE_NAME`).*

## 3. Deploy to Cloud Run

Deploy the service, injecting your API Key as an environment variable.

```bash
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```

## 4. Automation (Optional)

You can save these commands in a `deploy.sh` script for easier updates.

```bash
#!/bin/bash
PROJECT_ID="your-project-id"
SERVICE_NAME="gemini-chess"
REGION="asia-northeast1"

echo "Building image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```
