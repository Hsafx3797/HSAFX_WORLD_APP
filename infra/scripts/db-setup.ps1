<#
.SYNOPSIS
  HSAFX World App — Database Setup Script (Windows)

.DESCRIPTION
  Runs Drizzle migrations and seed script against the target database.

.PARAMETER Mode
  'full' (default) = migrate + seed
  'migrate-only'   = only migrations
  'seed-only'      = only seed data

.EXAMPLE
  $env:DATABASE_URL = "postgresql://..."
  .\infra\scripts\db-setup.ps1
  .\infra\scripts\db-setup.ps1 -Mode seed-only
#>
param(
  [ValidateSet('full', 'migrate-only', 'seed-only')]
  [string]$Mode = 'full'
)

$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) {
  Write-Host "ERROR: DATABASE_URL environment variable is required" -ForegroundColor Red
  Write-Host 'Usage: $env:DATABASE_URL = "postgresql://..."; .\infra\scripts\db-setup.ps1'
  exit 1
}

Push-Location (Join-Path $PSScriptRoot '..\..')

Write-Host "`n=== HSAFX World App — Database Setup ===" -ForegroundColor Yellow
$displayUrl = $env:DATABASE_URL -replace '://([^:]+):[^@]+@', '://$1:****@'
Write-Host "  Target: $displayUrl`n" -ForegroundColor DarkGray

try {
  if ($Mode -ne 'seed-only') {
    Write-Host "▸ Running migrations..." -ForegroundColor Green
    pnpm --filter @hsafx/db push
    if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
    Write-Host "  ✓ Migrations complete`n" -ForegroundColor Green
  }

  if ($Mode -ne 'migrate-only') {
    Write-Host "▸ Running seed..." -ForegroundColor Green
    pnpm --filter @hsafx/db seed
    if ($LASTEXITCODE -ne 0) { throw "Seed failed" }
  }

  Write-Host "`n=== Database setup complete! ===" -ForegroundColor Green
}
catch {
  Write-Host "`nERROR: $_" -ForegroundColor Red
  exit 1
}
finally {
  Pop-Location
}
