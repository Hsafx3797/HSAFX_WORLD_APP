# Kubernetes Manifests

> **Status:** Base manifests + overlays created. Uses Kustomize for environment-specific configuration.

## Structure

```
k8s/
├── base/
│   ├── kustomization.yaml       # Base kustomization
│   ├── namespace.yaml           # hsafx namespace
│   ├── web-deployment.yaml      # Next.js web app (2 replicas)
│   ├── admin-deployment.yaml    # Next.js admin panel (1 replica)
│   ├── fastapi-deployment.yaml  # Python compute backend (2 replicas)
│   └── services.yaml            # ClusterIP services for all apps
└── overlays/
    ├── staging/
    │   └── kustomization.yaml   # 1 replica, lower resources, staging URLs
    └── production/
        ├── kustomization.yaml   # Production URLs, configmaps
        └── ingress.yaml         # TLS ingress for hsafx.world + admin.hsafx.world
```

## Usage

```bash
# Preview manifests
kubectl kustomize infra/k8s/overlays/staging/
kubectl kustomize infra/k8s/overlays/production/

# Apply
kubectl apply -k infra/k8s/overlays/staging/
kubectl apply -k infra/k8s/overlays/production/
```

## Prerequisites

- PostgreSQL 16+ (managed DB — Neon or self-hosted)
- Redis 7+ (Upstash or self-hosted)
- nginx ingress controller
- cert-manager for TLS (Let's Encrypt)
- Sealed Secrets or External Secrets for secret management

## Secrets

Create the required secret before deploying:

```bash
kubectl create secret generic hsafx-secrets -n hsafx \
  --from-literal=database-url='postgresql://...' \
  --from-literal=better-auth-secret='...' \
  --from-literal=redis-url='redis://...' \
  --from-literal=fastapi-secret-key='...' \
  --from-literal=internal-secret='...'
```
