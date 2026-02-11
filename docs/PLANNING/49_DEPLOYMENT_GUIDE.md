# 49 — Deployment Guide

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED

> **Purpose:**  
> Reference guide for AI agent to understand deployment architecture, environment variables, and service configuration. User executes deployment manually. This document helps AI generate correct configuration files and understand production requirements.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Environment Variables](#3-environment-variables)
4. [Vercel Deployment (Next.js)](#4-vercel-deployment-nextjs)
5. [Fly.io Deployment (FastAPI)](#5-flyio-deployment-fastapi)
6. [Database Setup (Neon)](#6-database-setup-neon)
7. [Redis Setup (Upstash)](#7-redis-setup-upstash)
8. [Storage Setup (Cloudflare R2)](#8-storage-setup-cloudflare-r2)
9. [Stripe Configuration](#9-stripe-configuration)
10. [DNS & Domain Setup](#10-dns--domain-setup)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Post-Deployment Checklist](#12-post-deployment-checklist)

---

## 1. Overview

### 1.1 Deployment Philosophy

**AI Builds, Human Deploys:**
- AI agent generates all deployment configuration files
- AI provides step-by-step deployment instructions
- Human user executes deployment commands manually
- AI does not have direct access to production systems

### 1.2 Deployment Services

| Service | Purpose | Provider | CLI Required |
|---------|---------|----------|--------------|
| **Frontend** | Next.js app | Vercel | Vercel CLI |
| **Backend API** | FastAPI service | Fly.io | Fly CLI |
| **Database** | PostgreSQL | Neon | None (Web UI) |
| **Redis** | Cache & Queue | Upstash | None (Web UI) |
| **Storage** | File storage | Cloudflare R2 | Wrangler CLI |
| **Payments** | Billing | Stripe | Stripe CLI (for webhooks) |

---

## 2. Deployment Architecture

### 2.1 Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE DNS                          │
│                     (hsafx-world.com)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐             ┌─────────────────┐
│  VERCEL       │             │  FLY.IO         │
│  Next.js App  │◄────────────┤  FastAPI        │
│  (Frontend)   │             │  (Backend)      │
└───────┬───────┘             └────────┬────────┘
        │                              │
        │                              │
        ▼                              ▼
┌───────────────────────────────────────────────┐
│              NEON POSTGRESQL                   │
│           (User data, tools, billing)         │
└───────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────┐
│              UPSTASH REDIS                     │
│       (Cache, rate limiting, job queue)       │
└───────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────┐
│           CLOUDFLARE R2                        │
│         (Temporary file storage)              │
└───────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────┐
│              STRIPE                            │
│          (Payment processing)                 │
└───────────────────────────────────────────────┘
```

---

## 3. Environment Variables

### 3.1 Development (.env.local)

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/hsafx_world

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ============================================
# PAYMENTS (STRIPE)
# ============================================
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ============================================
# FILE UPLOADS (UPLOADTHING)
# ============================================
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=xxxxx

# ============================================
# STORAGE (CLOUDFLARE R2)
# ============================================
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=hsafx-world

# ============================================
# REDIS & JOB QUEUE (UPSTASH)
# ============================================
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# ============================================
# FASTAPI BACKEND
# ============================================
FASTAPI_URL=http://localhost:8000

# ============================================
# INTERNAL
# ============================================
CRON_SECRET=your-cron-secret-here
NODE_ENV=development
```

---

### 3.2 Production (.env.production)

**Changes from Development:**
```bash
# Use production database
DATABASE_URL=postgresql://user:password@production.neon.tech/hsafx_world

# Use production domain
NEXTAUTH_URL=https://hsafx-world.com

# Generate secure secret
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Use production FastAPI URL
FASTAPI_URL=https://api.hsafx-world.com

# Set production environment
NODE_ENV=production
```

---

### 3.3 FastAPI Environment (.env for Python)

**File:** `fastapi/.env`
```bash
# Database (same as Next.js)
DATABASE_URL=postgresql://user:password@production.neon.tech/hsafx_world

# Redis (same as Next.js)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# Cloudflare R2 (same as Next.js)
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=hsafx-world

# FastAPI specific
SECRET_KEY=<generate-with-python-secrets-token-hex-32>
ALLOWED_ORIGINS=https://hsafx-world.com
PORT=8000
```

---

## 4. Vercel Deployment (Next.js)

### 4.1 Prerequisites

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Login:**
```bash
vercel login
```

---

### 4.2 Configuration File

**File:** `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "UPSTASH_REDIS_URL": "@upstash-redis-url"
  },
  "crons": [
    {
      "path": "/api/cron/cleanup-uploads",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

### 4.3 Deployment Steps

**1. Set Environment Variables:**
```bash
# In Vercel Dashboard: Settings > Environment Variables
# Add all variables from .env.production
```

**2. Deploy:**
```bash
# Development deployment
vercel

# Production deployment
vercel --prod
```

**3. Set Custom Domain:**
```bash
# In Vercel Dashboard: Settings > Domains
# Add: hsafx-world.com
# Add: www.hsafx-world.com (redirect to apex)
```

**4. Configure DNS:**
```
A record:  @  →  76.76.21.21 (Vercel IP)
CNAME:     www  →  cname.vercel-dns.com
```

---

## 5. Fly.io Deployment (FastAPI)

### 5.1 Prerequisites

**Install Fly CLI:**
```bash
# macOS
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

**Login:**
```bash
fly auth login
```

---

### 5.2 Configuration File

**File:** `fastapi/fly.toml`
```toml
app = "hsafx-world-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 250
    soft_limit = 200
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "10s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

---

### 5.3 Dockerfile

**File:** `fastapi/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libvips \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI with Gunicorn
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

---

### 5.4 Deployment Steps

**1. Create App:**
```bash
cd fastapi
fly launch --no-deploy
```

**2. Set Environment Variables:**
```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set UPSTASH_REDIS_URL="https://..."
fly secrets set UPSTASH_REDIS_TOKEN="..."
fly secrets set R2_ACCOUNT_ID="..."
fly secrets set R2_ACCESS_KEY_ID="..."
fly secrets set R2_SECRET_ACCESS_KEY="..."
fly secrets set SECRET_KEY="..."
```

**3. Deploy:**
```bash
fly deploy
```

**4. Set Custom Domain:**
```bash
fly certs add api.hsafx-world.com
```

**5. Configure DNS:**
```
CNAME:  api  →  hsafx-world-api.fly.dev
```

---

## 6. Database Setup (Neon)

### 6.1 Create Database

**Steps:**
1. Go to [neon.tech](https://neon.tech)
2. Create new project: `hsafx-world`
3. Select region: `US East (Ohio)` (same as Vercel/Fly.io)
4. Copy connection string

**Connection String Format:**
```
postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### 6.2 Run Migrations

**Install Drizzle Kit:**
```bash
npm install -g drizzle-kit
```

**Run Migrations:**
```bash
# Generate migrations from schema
drizzle-kit generate:pg

# Push to database
drizzle-kit push:pg
```

**Alternatively (Direct Schema Push):**
```bash
npm run db:push
```

---

### 6.3 Seed Initial Data

**Script:** `scripts/seed-database.ts`
```bash
npm run db:seed
```

**Seeds:**
- Subscription plans (Free, Pro, Advance, Basic, Enterprise)
- Plan limits
- Plan permissions
- Tool metadata (446 tools)
- System settings

---

## 7. Redis Setup (Upstash)

### 7.1 Create Database

**Steps:**
1. Go to [upstash.com](https://upstash.com)
2. Create new Redis database: `hsafx-world-redis`
3. Select region: `US-East-1` (same as Vercel/Fly.io)
4. Enable TLS
5. Copy REST URL and token

---

### 7.2 Configure

**Max Memory Policy:** `allkeys-lru` (automatically evict least-recently-used keys)

**Eviction Policy:** Automatic (Redis manages memory)

---

## 8. Storage Setup (Cloudflare R2)

### 8.1 Create Bucket

**Install Wrangler CLI:**
```bash
npm install -g wrangler
```

**Login:**
```bash
wrangler login
```

**Create Bucket:**
```bash
wrangler r2 bucket create hsafx-world
```

---

### 8.2 Configure Lifecycle Rule

**Via Cloudflare Dashboard:**
1. Go to R2 > Buckets > `hsafx-world`
2. Settings > Lifecycle Rules > Add Rule
3. Rule name: `auto-cleanup`
4. Action: Delete objects
5. Days after upload: `1`
6. Save

**Purpose:** Auto-delete files after 24 hours (matches Redis TTL)

---

### 8.3 Generate API Token

**Steps:**
1. R2 > API Tokens > Create API Token
2. Permissions: Read & Write
3. Scopes: Select `hsafx-world` bucket
4. Copy Access Key ID and Secret Access Key

---

## 9. Stripe Configuration

### 9.1 Create Products

**In Stripe Dashboard:**

**B2C Plans:**
1. Product: "Pro Subscription"
   - Price: $10/month (monthly) or $96/year ($8/month)
   - Billing: Recurring
   - Monthly Coin Grant: 150 coins
   - Product ID: `prod_pro_monthly` / `prod_pro_yearly`

2. Product: "Advance Subscription"
   - Price: $20/month (monthly) or $180/year ($15/month)
   - Billing: Recurring
   - Monthly Coin Grant: 250 coins
   - Product ID: `prod_advance_monthly` / `prod_advance_yearly`

**B2B Plans:**
1. Product: "Basic Subscription"
   - Price: $10/month (monthly) or $96/year ($8/month)
   - Billing: Recurring
   - Tool Suite Limit: 5000 operations/month
   - Product ID: `prod_basic_monthly` / `prod_basic_yearly`

2. Product: "Enterprise Subscription"
   - Price: $20/month (monthly) or $180/year ($15/month)
   - Billing: Recurring
   - Tool Suite Limit: 10000 operations/month
   - Product ID: `prod_enterprise_monthly` / `prod_enterprise_yearly`

**Coin Packages:**
1. Product: "50 Coins"
   - Price: $2
   - Billing: One-time
   - Requirement: Requires Pro or Advance subscription
   - Product ID: `prod_coins_50`

2. Product: "150 Coins"
   - Price: $5
   - Billing: One-time
   - Requirement: Requires Pro or Advance subscription
   - Product ID: `prod_coins_150`

---

### 9.2 Configure Webhook

**Steps:**
1. Stripe Dashboard > Developers > Webhooks > Add Endpoint
2. Endpoint URL: `https://hsafx-world.com/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret

---

### 9.3 Test Webhooks Locally

**Install Stripe CLI:**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe
```

**Forward Webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Trigger Test Events:**
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

---

## 10. DNS & Domain Setup

### 10.1 Domain Registrar

**Purchase Domain:** `hsafx-world.com`

**Recommended Registrars:**
- Cloudflare Registrar (cheapest, $8-12/year)
- Namecheap
- GoDaddy

---

### 10.2 DNS Records

**Configure in Cloudflare DNS:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 (Vercel) | Auto |
| CNAME | www | cname.vercel-dns.com | Auto |
| CNAME | api | hsafx-world-api.fly.dev | Auto |
| TXT | @ | Vercel verification | Auto |

---

### 10.3 SSL Certificates

**Vercel:** Auto-generated (Let's Encrypt)  
**Fly.io:** Auto-generated (Let's Encrypt)

**No manual configuration needed.**

---

## 11. CI/CD Pipeline

### 11.1 GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./fastapi
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

### 11.2 GitHub Secrets

**Add in GitHub Repository Settings > Secrets:**
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `FLY_API_TOKEN`: Fly.io API token

---

## 12. Post-Deployment Checklist

### 12.1 Verify Deployments

**Frontend (Next.js):**
```bash
curl https://hsafx-world.com
# Should return HTML
```

**Backend (FastAPI):**
```bash
curl https://api.hsafx-world.com/health
# Should return {"status": "ok"}
```

**Database:**
```bash
# Connect via psql
psql "postgresql://username:password@production.neon.tech/neondb?sslmode=require"

# Run query
SELECT COUNT(*) FROM users;
```

**Redis:**
```bash
# Test connection
curl -X POST https://xxxxx.upstash.io/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_TOKEN"
```

---

### 12.2 Test Core Flows

**1. Authentication:**
- Sign up with email
- Sign up with Google OAuth
- Sign up with GitHub OAuth
- Log in
- Log out

**2. Tool Execution:**
- Execute uppercase tool (WASM)
- Execute JSON formatter (Node.js)
- Execute image resize (FastAPI)

**3. Billing:**
- Purchase Pro subscription (Stripe test mode)
- Verify webhook received
- Verify subscription in database
- Purchase 100 coins
- Verify coins added

**4. Rate Limiting:**
- Make 3 API requests rapidly
- Verify 3rd request blocked with 429

---

### 12.3 Configure Monitoring

**Vercel Analytics:**
- Enable in Vercel Dashboard > Analytics

**Fly.io Metrics:**
- View in Fly.io Dashboard > Metrics

**Neon Monitoring:**
- View in Neon Dashboard > Monitoring

**Upstash Monitoring:**
- View in Upstash Dashboard > Metrics

---

### 12.4 Enable Backups

**Database Backups (Neon):**
- Automatic daily backups (free tier: 7 days retention)
- Upgrade to Pro for point-in-time recovery

**Redis Backups (Upstash):**
- Automatic daily backups (free tier: 1 day retention)

---

## 13. Rollback Procedure

### 13.1 Rollback Frontend (Vercel)

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**Via Dashboard:**
1. Go to Vercel Dashboard > Deployments
2. Find previous working deployment
3. Click "..." > Promote to Production

---

### 13.2 Rollback Backend (Fly.io)

**Via CLI:**
```bash
# List releases
fly releases

# Rollback to previous release
fly releases rollback <version>
```

---

### 13.3 Rollback Database Migrations

**Revert Last Migration:**
```bash
drizzle-kit drop
```

**Restore from Backup:**
1. Go to Neon Dashboard > Backups
2. Select backup point
3. Click "Restore"

---

## 14. Notes for AI Agent

**When Generating Deployment Files:**
- Include all required environment variables
- Use correct service names (Vercel, Fly.io, Neon, Upstash)
- Generate secure secrets with proper algorithms
- Document exact steps in comments
- Provide verification commands
- Include rollback procedures

**Configuration Checklist:**
- ✅ All environment variables defined
- ✅ Database migrations prepared
- ✅ Seed data script ready
- ✅ Dockerfile optimized
- ✅ CI/CD pipeline configured
- ✅ DNS records documented
- ✅ SSL certificates auto-enabled
- ✅ Monitoring enabled

**User Responsibilities:**
- Execute deployment commands
- Configure external services (Stripe, OAuth)
- Set up DNS records
- Monitor production system
- Handle incidents

---

**Total Pages:** 13  
**Status:** ✅ Production-Ready Reference
