# Kubernetes Manifests

> **Status:** Placeholder — K8s deployment manifests will be added when we move beyond Vercel/Railway to a self-hosted cluster.

## Planned Structure

```
k8s/
├── base/
│   ├── web-deployment.yaml
│   ├── admin-deployment.yaml
│   ├── fastapi-deployment.yaml
│   ├── services.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── staging/
│   └── production/
└── README.md
```

## Requirements

- PostgreSQL 15+ (via managed DB or StatefulSet)
- Redis 7+ (for rate limiting and caching)
- Ingress controller (nginx or traefik)
- cert-manager for TLS
- Sealed Secrets or External Secrets for secret management
