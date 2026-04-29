# Infrastructure

Infrastructure configuration for HSAFX WORLD APP.

> **Decision D-01:** Self-hosted VPS. Single VPS initially, split later if needed.

## Directory Structure

```
infra/
├── docker/
│   ├── docker-compose.yml          # Local dev (postgres + redis + fastapi)
│   ├── docker-compose.prod.yml     # Production (all services + nginx)
│   ├── Dockerfile.fastapi           # FastAPI compute backend
│   ├── Dockerfile.web               # Next.js web app (standalone)
│   ├── Dockerfile.admin             # Next.js admin panel (standalone)
│   ├── nginx.conf                   # Reverse proxy config
│   ├── .env.example                 # Dev environment template
│   └── .env.prod.example            # Production environment template
├── k8s/
│   ├── base/                        # Kustomize base manifests
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── web-deployment.yaml
│   │   ├── admin-deployment.yaml
│   │   ├── fastapi-deployment.yaml
│   │   └── services.yaml
│   └── overlays/
│       ├── staging/                 # Staging (1 replica, lower resources)
│       └── production/              # Production (2 replicas, ingress, TLS)
└── scripts/
    ├── db-setup.sh                  # Database migration + seed
    ├── db-setup.ps1                 # PowerShell equivalent
    ├── zap-scan.ps1                 # OWASP ZAP security scanner
    ├── ZAP_SETUP.md                 # ZAP setup guide
    └── audit-tool-coverage.ts       # Tool implementation audit
```

## Local Development

```bash
# Start PostgreSQL + Redis + FastAPI (hot-reload)
cd infra/docker
cp .env.example .env
docker compose up -d

# Next.js apps run natively
pnpm dev:web    # http://localhost:3000
pnpm dev:admin  # http://localhost:3002
```

## Production Deployment (VPS)

```bash
# Build and start all services
cd infra/docker
cp .env.prod.example .env
# Fill in all required values in .env

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

## Kubernetes Deployment

```bash
# Staging
kubectl apply -k infra/k8s/overlays/staging/

# Production
kubectl apply -k infra/k8s/overlays/production/
```

Requires: nginx ingress controller, cert-manager for TLS, sealed-secrets for secret management.

## Services

| Service | Port | Technology |
|---------|------|------------|
| Web     | 3000 | Next.js 15 (standalone) |
| Admin   | 3002 | Next.js 15 (local dev) / 3001 internal in Docker |
| FastAPI | 8000 | Python 3.12, uvicorn |
| Postgres | 5432 | PostgreSQL 16 |
| Redis   | 6379 | Redis 7 |
| Nginx   | 80/443 | Reverse proxy + TLS |
