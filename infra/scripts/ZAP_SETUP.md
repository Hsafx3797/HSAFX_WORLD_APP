# OWASP ZAP Security Scanning

## Overview

Automated DAST (Dynamic Application Security Testing) using OWASP ZAP against HSAFX World App local dev servers.

## Prerequisites

1. **OWASP ZAP 2.17.0+** installed and running
2. **ZAP API enabled**:
   - Open ZAP Desktop → Tools → Options → API
   - Check **"Enable the API"**
   - Note the **API Key** (or uncheck "Require API Key" for local-only use)
3. **Local dev servers** running (`pnpm dev`)

## Quick Start

```powershell
# From project root:

# Scan web app (port 3000)
.\infra\scripts\zap-scan.ps1 -Target "http://localhost:3000" -ApiKey "your-api-key"

# Scan admin app (port 3001)
.\infra\scripts\zap-scan.ps1 -Target "http://localhost:3001" -ApiKey "your-api-key"

# Spider-only scan (faster, discovery only)
.\infra\scripts\zap-scan.ps1 -Target "http://localhost:3000" -ScanType "spider" -ApiKey "key"

# Active scan only (assumes URLs already spidered)
.\infra\scripts\zap-scan.ps1 -Target "http://localhost:3000" -ScanType "active" -ApiKey "key"
```

## Headless Mode (CI/CD)

Start ZAP as a daemon (no GUI):

```powershell
# Windows
java -jar "C:\Program Files\ZAP\ZAP_2.17.0\zap-2.17.0.jar" -daemon -port 8080 -config api.key=ci-api-key

# Docker
docker run -d --name zap -p 8080:8080 ghcr.io/zaproxy/zaproxy:stable zap.sh -daemon -port 8080 -config api.key=ci-api-key -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true
```

Then run the scan:

```powershell
.\infra\scripts\zap-scan.ps1 -Target "http://host.docker.internal:3000" -ApiKey "ci-api-key"
```

## Reports

Reports are saved to `reports/security/<timestamp>/`:

| File | Description |
|------|-------------|
| `zap-report.html` | Full HTML report with findings, risk levels, and remediation |
| `zap-alerts.json` | Machine-readable JSON of all alerts |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No high/medium alerts |
| 1 | Medium severity alerts found |
| 2 | High severity alerts found |

## Scan Targets

| App | URL | Notes |
|-----|-----|-------|
| Web | `http://localhost:3000` | Public-facing app, 30+ routes |
| Admin | `http://localhost:3001` | Auth-protected, 38+ routes |
| FastAPI | `http://localhost:8000` | Backend API, tool execution |

## Authenticated Scanning

For scanning auth-protected routes (admin), you can configure ZAP authentication:

1. **Manual approach**: Log in through ZAP proxy, then run spider/active scan
2. **Script approach**: Use ZAP's authentication context API:

```powershell
# Set up authentication context (example)
$ctx = Invoke-RestMethod "$ZapHost/JSON/context/action/newContext/?apikey=$key&contextName=admin"
Invoke-RestMethod "$ZapHost/JSON/authentication/action/setAuthenticationMethod/?apikey=$key&contextId=$($ctx.contextId)&authMethodName=formBasedAuthentication&authMethodConfigParams=loginUrl=http://localhost:3001/login&loginRequestData=email={%username%}%26password={%password%}"
```

## GitHub Actions Integration

See `.github/workflows/ci.yml` for automated security scanning in CI. The workflow:
1. Starts ZAP in daemon mode via Docker
2. Builds and starts the app
3. Runs `zap-scan.ps1` against the app
4. Uploads reports as artifacts
5. Fails the build on high-severity findings
