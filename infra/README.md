# Infrastructure

Infrastructure configuration for HSAFX WORLD APP.

## Directory Structure

```
infra/
├── docker/     # Dockerfiles and docker-compose configs
├── k8s/        # Kubernetes manifests (if applicable)
└── scripts/    # Deployment and maintenance scripts
```

## Environments

- **Development**: Local Docker compose
- **Staging**: Preview deployments
- **Production**: Vercel (web/admin) + Cloud Run (FastAPI)
