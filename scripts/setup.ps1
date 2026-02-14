<#
.SYNOPSIS
  HSAFX World App — Full Project Setup Script (Windows PowerShell)

.DESCRIPTION
  Bootstraps the entire project: checks prerequisites, installs dependencies,
  sets up Python venv, copies env files, runs DB migrations, and optionally
  seeds the database and builds WASM tools.

.PARAMETER NoDb
  Skip database migration step.

.PARAMETER WithSeed
  Run database seed after migration.

.PARAMETER WithWasm
  Build Rust/WASM text-tools package.

.PARAMETER All
  Enable both seed and WASM build.

.EXAMPLE
  .\scripts\setup.ps1
  .\scripts\setup.ps1 -WithSeed
  .\scripts\setup.ps1 -All
  .\scripts\setup.ps1 -NoDb
#>
param(
  [switch]$NoDb,
  [switch]$WithSeed,
  [switch]$WithWasm,
  [switch]$All
)

$ErrorActionPreference = 'Stop'

if ($All) {
  $WithSeed = $true
  $WithWasm = $true
}

# ── Navigate to project root ──────────────────────────────────
Push-Location (Join-Path $PSScriptRoot '..')
$ProjectRoot = Get-Location

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║    HSAFX WORLD APP — Project Setup            ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$Errors = @()
$Warnings = @()

# ══════════════════════════════════════════════════════════════
# STEP 1: Check prerequisites
# ══════════════════════════════════════════════════════════════
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor White

# Node.js 20+
try {
  $nodeVersion = (node -v) -replace '^v', ''
  $nodeMajor = [int]($nodeVersion.Split('.')[0])
  if ($nodeMajor -ge 20) {
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
  } else {
    $Errors += "Node.js 20+ required (found $nodeVersion)"
    Write-Host "  ✗ Node.js $nodeVersion (need 20+)" -ForegroundColor Red
  }
} catch {
  $Errors += "Node.js not found. Install from https://nodejs.org/"
  Write-Host "  ✗ Node.js not found" -ForegroundColor Red
}

# pnpm 9+
try {
  $pnpmVersion = pnpm -v
  $pnpmMajor = [int]($pnpmVersion.Split('.')[0])
  if ($pnpmMajor -ge 9) {
    Write-Host "  ✓ pnpm $pnpmVersion" -ForegroundColor Green
  } else {
    $Errors += "pnpm 9+ required (found $pnpmVersion)"
    Write-Host "  ✗ pnpm $pnpmVersion (need 9+)" -ForegroundColor Red
  }
} catch {
  $Errors += "pnpm not found. Install: npm install -g pnpm@9"
  Write-Host "  ✗ pnpm not found" -ForegroundColor Red
}

# Python 3.11+
$pyCmd = $null
try {
  $pyVersion = (python --version 2>&1) -replace 'Python\s+', ''
  $pyParts = $pyVersion.Split('.')
  $pyMajor = [int]$pyParts[0]
  $pyMinor = [int]$pyParts[1]
  if ($pyMajor -ge 3 -and $pyMinor -ge 11) {
    Write-Host "  ✓ Python $pyVersion" -ForegroundColor Green
    $pyCmd = "python"
  } else {
    $Warnings += "Python 3.11+ recommended (found $pyVersion). FastAPI backend may not work."
    Write-Host "  ⚠ Python $pyVersion (recommend 3.11+)" -ForegroundColor Yellow
    $pyCmd = "python"
  }
} catch {
  $Warnings += "Python not found. FastAPI backend will not be set up."
  Write-Host "  ⚠ Python not found (FastAPI backend skipped)" -ForegroundColor Yellow
}

# Rust + wasm-pack (optional)
if ($WithWasm) {
  try {
    $rustVersion = (rustc --version) -replace 'rustc\s+(\S+).*', '$1'
    Write-Host "  ✓ Rust $rustVersion" -ForegroundColor Green
  } catch {
    $Warnings += "Rust not found. WASM build will be skipped. Install from https://rustup.rs/"
    Write-Host "  ⚠ Rust not found (WASM build skipped)" -ForegroundColor Yellow
    $WithWasm = $false
  }

  if ($WithWasm) {
    try {
      $wasmPackVersion = (wasm-pack --version) -replace 'wasm-pack\s+', ''
      Write-Host "  ✓ wasm-pack $wasmPackVersion" -ForegroundColor Green
    } catch {
      Write-Host "  ⚠ wasm-pack not found, installing..." -ForegroundColor Yellow
      try {
        cargo install wasm-pack
      } catch {
        $Warnings += "Failed to install wasm-pack. WASM build skipped."
        $WithWasm = $false
      }
    }
  }
}

# Abort on hard errors
if ($Errors.Count -gt 0) {
  Write-Host ""
  Write-Host "Setup cannot continue. Fix these issues:" -ForegroundColor Red
  foreach ($err in $Errors) {
    Write-Host "  • $err" -ForegroundColor Red
  }
  Pop-Location
  exit 1
}

Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 2: Install Node.js dependencies
# ══════════════════════════════════════════════════════════════
Write-Host "[2/7] Installing Node.js dependencies..." -ForegroundColor White
try {
  pnpm install --frozen-lockfile 2>$null
} catch {
  pnpm install
}
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
Write-Host "  ✓ Node.js dependencies installed" -ForegroundColor Green
Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 3: Set up Python virtual environment
# ══════════════════════════════════════════════════════════════
Write-Host "[3/7] Setting up Python environment..." -ForegroundColor White
if ($pyCmd) {
  $fastapiDir = Join-Path $ProjectRoot "backend\fastapi"
  $venvDir = Join-Path $fastapiDir ".venv"

  if (-not (Test-Path $venvDir)) {
    Write-Host "  Creating virtual environment..."
    & $pyCmd -m venv $venvDir
  }

  # Activate and install
  $venvPip = Join-Path $venvDir "Scripts\pip.exe"
  if (Test-Path $venvPip) {
    Write-Host "  Installing Python dependencies..."
    & $venvPip install --quiet --upgrade pip
    & $venvPip install --quiet -r (Join-Path $fastapiDir "requirements.txt")
    Write-Host "  ✓ Python venv created & dependencies installed" -ForegroundColor Green
  } else {
    # Unix-style venv on WSL
    $venvPip = Join-Path $venvDir "bin/pip"
    if (Test-Path $venvPip) {
      & $venvPip install --quiet --upgrade pip
      & $venvPip install --quiet -r (Join-Path $fastapiDir "requirements.txt")
      Write-Host "  ✓ Python venv created & dependencies installed" -ForegroundColor Green
    } else {
      $Warnings += "Could not find pip in venv. Try manually: cd backend/fastapi; python -m venv .venv"
      Write-Host "  ⚠ Could not locate pip in venv" -ForegroundColor Yellow
    }
  }
} else {
  Write-Host "  ⚠ Skipped (Python not available)" -ForegroundColor Yellow
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 4: Copy .env.example → .env (if not exists)
# ══════════════════════════════════════════════════════════════
Write-Host "[4/7] Setting up environment files..." -ForegroundColor White
$envFiles = @(
  @{ Src = ".env.example"; Dest = ".env" },
  @{ Src = "apps\web\.env.example"; Dest = "apps\web\.env" },
  @{ Src = "apps\admin\.env.example"; Dest = "apps\admin\.env" },
  @{ Src = "backend\fastapi\.env.example"; Dest = "backend\fastapi\.env" },
  @{ Src = "infra\docker\.env.example"; Dest = "infra\docker\.env" }
)

$envCopied = 0
foreach ($pair in $envFiles) {
  $srcPath = Join-Path $ProjectRoot $pair.Src
  $destPath = Join-Path $ProjectRoot $pair.Dest
  if ((Test-Path $srcPath) -and -not (Test-Path $destPath)) {
    Copy-Item $srcPath $destPath
    Write-Host "  ✓ Created $($pair.Dest) from $($pair.Src)" -ForegroundColor Green
    $envCopied++
  } elseif (Test-Path $destPath) {
    Write-Host "  — $($pair.Dest) already exists" -ForegroundColor Blue
  } else {
    Write-Host "  ⚠ $($pair.Src) not found, skipping" -ForegroundColor Yellow
  }
}

if ($envCopied -gt 0) {
  Write-Host ""
  Write-Host "  ⚠ Remember to edit your .env files with real credentials before running the app!" -ForegroundColor Yellow
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 5: Database migration
# ══════════════════════════════════════════════════════════════
Write-Host "[5/7] Database setup..." -ForegroundColor White
if ($NoDb) {
  Write-Host "  — Skipped (-NoDb flag)" -ForegroundColor Blue
} else {
  $dbUrl = $env:DATABASE_URL
  if (-not $dbUrl) {
    # Try loading from .env
    $envFile = Join-Path $ProjectRoot ".env"
    if (Test-Path $envFile) {
      $dbLine = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
      if ($dbLine -and $dbLine -notmatch 'your_password_here') {
        $dbUrl = $dbLine -replace '^DATABASE_URL=', ''
        $env:DATABASE_URL = $dbUrl
      }
    }
  }

  if ($dbUrl -and $dbUrl -notmatch 'your_password_here') {
    Write-Host "  Running migrations..."
    pnpm db:generate
    if ($LASTEXITCODE -ne 0) { throw "db:generate failed" }
    pnpm db:migrate
    if ($LASTEXITCODE -ne 0) { throw "db:migrate failed" }
    Write-Host "  ✓ Database migrations complete" -ForegroundColor Green
  } else {
    Write-Host "  ⚠ DATABASE_URL not configured yet — skipping migrations" -ForegroundColor Yellow
    Write-Host "    Edit .env with your database URL, then run: pnpm db:generate; pnpm db:migrate" -ForegroundColor Yellow
  }
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 6: Optional — Seed database
# ══════════════════════════════════════════════════════════════
Write-Host "[6/7] Database seed..." -ForegroundColor White
if ($WithSeed -and -not $NoDb) {
  if ($env:DATABASE_URL -and $env:DATABASE_URL -notmatch 'your_password_here') {
    Write-Host "  Seeding database..."
    try {
      pnpm --filter @hsafx/db seed
      if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database seeded" -ForegroundColor Green
      } else {
        Write-Host "  ⚠ Seed script not found or failed (non-fatal)" -ForegroundColor Yellow
      }
    } catch {
      Write-Host "  ⚠ Seed script not found or failed (non-fatal)" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  ⚠ Skipped — no DATABASE_URL" -ForegroundColor Yellow
  }
} else {
  Write-Host "  — Skipped (use -WithSeed or -All to enable)" -ForegroundColor Blue
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
# STEP 7: Optional — Build WASM tools
# ══════════════════════════════════════════════════════════════
Write-Host "[7/7] WASM tools build..." -ForegroundColor White
if ($WithWasm) {
  Write-Host "  Building text-tools WASM package..."
  Push-Location (Join-Path $ProjectRoot "backend\rust\text-tools")
  wasm-pack build --target web --release
  if ($LASTEXITCODE -ne 0) { throw "WASM build failed" }
  Pop-Location
  Write-Host "  ✓ WASM text-tools built" -ForegroundColor Green
} else {
  Write-Host "  — Skipped (use -WithWasm or -All to enable)" -ForegroundColor Blue
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✓ HSAFX World App — Setup Complete!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Quick start:" -ForegroundColor White
Write-Host "    pnpm dev           Start all dev servers" -ForegroundColor Green
Write-Host "    pnpm dev:web       Start web app only (port 3000)" -ForegroundColor Green
Write-Host "    pnpm dev:admin     Start admin panel only (port 3001)" -ForegroundColor Green
Write-Host "    pnpm build         Build all packages" -ForegroundColor Green
Write-Host "    pnpm test          Run all tests" -ForegroundColor Green
Write-Host ""

if ($Warnings.Count -gt 0) {
  Write-Host "  Warnings:" -ForegroundColor Yellow
  foreach ($warn in $Warnings) {
    Write-Host "    ⚠ $warn" -ForegroundColor Yellow
  }
  Write-Host ""
}

Write-Host "  Docs: See SETUP.md for detailed configuration instructions." -ForegroundColor Blue
Write-Host ""

Pop-Location
