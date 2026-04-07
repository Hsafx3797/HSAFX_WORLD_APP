<#
.SYNOPSIS
  HSAFX World App - Dependency Check Script

.DESCRIPTION
  Verifies every dependency from system-level binaries to build-level packages.
  Does NOT install anything - only reports status.

  Levels checked:
    1. System binaries  (node, pnpm, python, rust, ffmpeg, etc.)
    2. Python venv      (existence, pip packages vs requirements.txt)
    3. Node packages    (pnpm install status, workspace packages)
    4. Rust / WASM      (cargo, wasm-pack, wasm target)
    5. Environment      (.env files, critical env vars)
    6. Database         (drizzle schema generation, migration status)
    7. Build artifacts  (turbo build, TypeScript compilation)

.PARAMETER Fix
  Attempt to auto-fix missing dependencies where possible (pnpm install, pip install, etc.)

.PARAMETER Quick
  Skip slow checks (build artifacts, database connectivity).

.EXAMPLE
  .\scripts\check-deps.ps1
  .\scripts\check-deps.ps1 -Fix
  .\scripts\check-deps.ps1 -Quick
#>
param(
  [switch]$Fix,
  [switch]$Quick
)

$ErrorActionPreference = 'Continue'

Push-Location (Join-Path $PSScriptRoot '..')
$ProjectRoot = Get-Location

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0
$script:SkipCount = 0

function Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green;  $script:PassCount++ }
function Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:WarnCount++ }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red;    $script:FailCount++ }
function Skip($msg) { Write-Host "  [SKIP] $msg" -ForegroundColor DarkGray; $script:SkipCount++ }
function Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Cyan }
function Section($title) {
  Write-Host ""
  Write-Host "--- $title ---" -ForegroundColor White
}

Write-Host ""
Write-Host "  +===================================================+" -ForegroundColor Cyan
Write-Host "  |   HSAFX WORLD APP - Dependency Check               |" -ForegroundColor Cyan
Write-Host "  |   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                          |" -ForegroundColor Cyan
Write-Host "  +===================================================+" -ForegroundColor Cyan

# ==============================================================
# 1. SYSTEM-LEVEL BINARIES
# ==============================================================
Section "1. System-Level Binaries"

# -- Node.js 20+ --
try {
  $nodeVer = (node -v 2>$null) -replace '^v', ''
  $nodeMajor = [int]($nodeVer.Split('.')[0])
  if ($nodeMajor -ge 20) { Pass "Node.js $nodeVer" }
  else { Fail "Node.js $nodeVer (need 20+)" }
} catch {
  Fail "Node.js not found - install from https://nodejs.org/"
}

# -- pnpm 9+ --
try {
  $pnpmVer = pnpm -v 2>$null
  $pnpmMajor = [int]($pnpmVer.Split('.')[0])
  if ($pnpmMajor -ge 9) { Pass "pnpm $pnpmVer" }
  else { Fail "pnpm $pnpmVer (need 9+)" }
} catch {
  Fail "pnpm not found - npm install -g pnpm@9"
}

# -- Python 3.11+ --
$pyCmd = $null
try {
  $pyVerStr = (python --version 2>&1) -replace 'Python\s+', ''
  $pyParts = $pyVerStr.Split('.')
  $pyMajor = [int]$pyParts[0]
  $pyMinor = [int]$pyParts[1]
  if ($pyMajor -ge 3 -and $pyMinor -ge 11) {
    Pass "Python $pyVerStr"
    $pyCmd = "python"
  } else {
    Warn "Python $pyVerStr (recommend 3.11+)"
    $pyCmd = "python"
  }
} catch {
  Fail "Python not found - install from https://python.org/"
}

# -- Rust compiler --
try {
  $rustVer = (rustc --version 2>$null) -replace 'rustc\s+(\S+).*', '$1'
  Pass "Rust $rustVer"
} catch {
  Warn "Rust not found - WASM builds require rustup.rs"
}

# -- wasm-pack --
try {
  $wpVer = (wasm-pack --version 2>$null) -replace 'wasm-pack\s+', ''
  Pass "wasm-pack $wpVer"
} catch {
  Warn "wasm-pack not found - cargo install wasm-pack"
}

# -- Cargo wasm32 target --
try {
  $targets = rustup target list --installed 2>$null
  if ($targets -match 'wasm32-unknown-unknown') {
    Pass "Rust wasm32-unknown-unknown target installed"
  } else {
    Warn "wasm32-unknown-unknown target missing - rustup target add wasm32-unknown-unknown"
  }
} catch {
  Skip "Could not check Rust targets (rustup not found)"
}

# -- FFmpeg --
$ffmpegPath = $env:FFMPEG_PATH
if (-not $ffmpegPath) { $ffmpegPath = "ffmpeg" }
try {
  $ffVer = & $ffmpegPath -version 2>$null | Select-Object -First 1
  if ($ffVer) {
    $trimLen = [Math]::Min(60, $ffVer.Length)
    Pass "FFmpeg: $($ffVer.Substring(0, $trimLen))"
  } else {
    Fail "FFmpeg not responding"
  }
} catch {
  Fail "FFmpeg not found - needed for audio/video tools (winget install ffmpeg)"
}

# -- Ghostscript (gs / gswin64c) --
$gsFound = $false
foreach ($gsName in @("gswin64c", "gs")) {
  $gsPath = Get-Command $gsName -ErrorAction SilentlyContinue
  if ($gsPath) {
    Pass "Ghostscript ($gsName) found at $($gsPath.Source)"
    $gsFound = $true
    break
  }
}
if (-not $gsFound) {
  Warn "Ghostscript not found - PDF compression tools will fail"
}

# -- wkhtmltopdf --
$wk = Get-Command "wkhtmltopdf" -ErrorAction SilentlyContinue
if ($wk) { Pass "wkhtmltopdf found at $($wk.Source)" }
else { Warn "wkhtmltopdf not found - HTML-to-PDF tools will fail" }

# -- Tesseract OCR --
$tess = Get-Command "tesseract" -ErrorAction SilentlyContinue
if ($tess) {
  $tessVer = (tesseract --version 2>&1 | Select-Object -First 1)
  Pass "Tesseract $tessVer"
} else {
  Warn "Tesseract not found - OCR tools will fail"
}

# -- Poppler (pdftotext) --
$pdftotext = Get-Command "pdftotext" -ErrorAction SilentlyContinue
if ($pdftotext) { Pass "Poppler (pdftotext) found" }
else { Warn "Poppler (pdftotext) not found - PDF text extraction will fail" }

# -- 7-Zip --
$_7z = Get-Command "7z" -ErrorAction SilentlyContinue
if (-not $_7z) { $_7z = Get-Command "7za" -ErrorAction SilentlyContinue }
if ($_7z) { Pass "7-Zip found at $($_7z.Source)" }
else { Warn "7-Zip not found - 7z archive tools will fail" }

# -- UnRAR --
$unrar = Get-Command "unrar" -ErrorAction SilentlyContinue
if ($unrar) { Pass "UnRAR found at $($unrar.Source)" }
else { Warn "UnRAR not found - RAR extraction will fail" }

# -- qpdf --
$qpdf = Get-Command "qpdf" -ErrorAction SilentlyContinue
if ($qpdf) { Pass "qpdf found at $($qpdf.Source)" }
else { Warn "qpdf not found - PDF linearization/optimization will fail" }

# -- libvips (pyvips) --
$vips = Get-Command "vips" -ErrorAction SilentlyContinue
if ($vips) { Pass "libvips found at $($vips.Source)" }
else { Warn "libvips (vips) not found - advanced image processing may fail" }

# -- Git --
try {
  $gitVer = (git --version 2>$null) -replace 'git version\s+', ''
  Pass "Git $gitVer"
} catch {
  Fail "Git not found"
}

# -- Turbo --
try {
  $turboVer = (npx turbo --version 2>$null) | Select-Object -Last 1
  if ($turboVer -and $turboVer -match '^[\d\.]+$') {
    Pass "Turbo $turboVer"
  } else {
    Warn "Turbo CLI not responding cleanly"
  }
} catch {
  Warn "Turbo CLI not accessible"
}

# ==============================================================
# 2. PYTHON VIRTUAL ENVIRONMENT & PACKAGES
# ==============================================================
Section "2. Python Virtual Environment"

$fastapiDir = Join-Path $ProjectRoot "backend\fastapi"
$venvDir = Join-Path $fastapiDir ".venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
$venvPip = Join-Path $venvDir "Scripts\pip.exe"

if (Test-Path $venvDir) {
  Pass "Python venv exists at backend/fastapi/.venv"

  if (Test-Path $venvPython) {
    $venvPyVer = & $venvPython --version 2>&1
    Pass "Venv Python: $venvPyVer"

    # Check installed packages against requirements.txt
    $reqFile = Join-Path $fastapiDir "requirements.txt"
    if (Test-Path $reqFile) {
      $installedRaw = & $venvPip list --format=json 2>$null | ConvertFrom-Json
      $installed = @{}
      foreach ($pkg in $installedRaw) {
        $installed[$pkg.name.ToLower().Replace('-', '_').Replace('.', '_')] = $pkg.version
      }

      $reqLines = Get-Content $reqFile | Where-Object {
        $_ -match '^\s*[a-zA-Z]' -and $_ -notmatch '^\s*#'
      }

      $missingPkgs = @()
      foreach ($line in $reqLines) {
        $pkgName = ($line -replace '\[.*?\]', '' -replace '[><=!~].*', '' -replace '\s', '').ToLower().Replace('-', '_').Replace('.', '_')
        if (-not $installed.ContainsKey($pkgName)) {
          $missingPkgs += $line.Trim()
        }
      }

      if ($missingPkgs.Count -eq 0) {
        Pass "All $($reqLines.Count) Python packages installed"
      } else {
        Fail "Missing $($missingPkgs.Count) Python packages:"
        foreach ($mp in $missingPkgs) { Info "  - $mp" }
        if ($Fix) {
          Info "Attempting fix: pip install -r requirements.txt"
          & $venvPip install -r $reqFile --quiet
          if ($LASTEXITCODE -eq 0) { Pass "Python packages installed successfully" }
          else { Fail "pip install failed" }
        }
      }
    }
  } else {
    Fail "Venv python.exe not found at $venvPython"
  }
} else {
  Fail "Python venv missing at backend/fastapi/.venv"
  if ($Fix -and $pyCmd) {
    Info "Attempting fix: creating venv and installing packages..."
    Push-Location $fastapiDir
    & $pyCmd -m venv ".venv"
    & $venvPip install --quiet --upgrade pip
    & $venvPip install --quiet -r "requirements.txt"
    Pop-Location
    if ($LASTEXITCODE -eq 0) { Pass "Python venv created and packages installed" }
    else { Fail "Venv creation failed" }
  }
}

# ==============================================================
# 3. NODE.JS PACKAGES (pnpm workspace)
# ==============================================================
Section "3. Node.js Packages (pnpm workspace)"

if (Test-Path (Join-Path $ProjectRoot "node_modules")) {
  Pass "Root node_modules exists"
} else {
  Fail "Root node_modules missing"
  if ($Fix) {
    Info "Attempting fix: pnpm install"
    pnpm install
    if ($LASTEXITCODE -eq 0) { Pass "pnpm install completed" }
    else { Fail "pnpm install failed" }
  }
}

$workspacePackages = @(
  @{ Name = "@hsafx/shared";           Dir = "packages/shared" },
  @{ Name = "@hsafx/schemas";          Dir = "packages/schemas" },
  @{ Name = "@hsafx/tools";            Dir = "packages/tools" },
  @{ Name = "@hsafx/api";              Dir = "packages/api" },
  @{ Name = "@hsafx/ui";               Dir = "packages/ui" },
  @{ Name = "@hsafx/theme";            Dir = "packages/theme" },
  @{ Name = "@hsafx/db";               Dir = "packages/db" },
  @{ Name = "@hsafx/web";              Dir = "apps/web" },
  @{ Name = "@hsafx/admin";            Dir = "apps/admin" }
)

foreach ($wp in $workspacePackages) {
  $wpDir = Join-Path $ProjectRoot $wp.Dir
  $wpPkg = Join-Path $wpDir "package.json"
  if (Test-Path $wpPkg) {
    $wpNm = Join-Path $wpDir "node_modules"
    if (Test-Path $wpNm) {
      Pass "$($wp.Name) - package.json + node_modules"
    } else {
      Pass "$($wp.Name) - package.json (hoisted)"
    }
  } else {
    Fail "$($wp.Name) - package.json missing at $($wp.Dir)"
  }
}

if (Test-Path (Join-Path $ProjectRoot "pnpm-lock.yaml")) {
  Pass "pnpm-lock.yaml exists"
} else {
  Fail "pnpm-lock.yaml missing - run pnpm install"
}

# ==============================================================
# 4. RUST / WASM BUILD
# ==============================================================
Section "4. Rust / WASM"

$rustTextTools = Join-Path $ProjectRoot "backend\rust\text-tools"
if (Test-Path (Join-Path $rustTextTools "Cargo.toml")) {
  Pass "text-tools Cargo.toml exists"

  $wasmPkg = Join-Path $rustTextTools "pkg"
  if (Test-Path $wasmPkg) {
    $wasmJs = Join-Path $wasmPkg "text_tools.js"
    if (Test-Path $wasmJs) {
      Pass "WASM pkg built (text_tools.js exists)"
    } else {
      Warn "WASM pkg directory exists but text_tools.js missing - rebuild with wasm-pack"
    }
  } else {
    Warn "WASM pkg not built - run: cd backend/rust/text-tools; wasm-pack build --target web --release"
  }
} else {
  Fail "text-tools Cargo.toml missing at backend/rust/text-tools"
}

# ==============================================================
# 5. ENVIRONMENT FILES
# ==============================================================
Section "5. Environment Files"

$envFiles = @(
  @{ Path = ".env";                      Required = $true  },
  @{ Path = "apps\web\.env";             Required = $true  },
  @{ Path = "apps\admin\.env";           Required = $true  },
  @{ Path = "backend\fastapi\.env";      Required = $true  },
  @{ Path = "infra\docker\.env";         Required = $false }
)

foreach ($ef in $envFiles) {
  $efPath = Join-Path $ProjectRoot $ef.Path
  if (Test-Path $efPath) {
    $content = Get-Content $efPath -Raw
    if ($content -and $content.Trim().Length -gt 0) {
      Pass "$($ef.Path) exists and has content"
    } else {
      Warn "$($ef.Path) exists but is empty"
    }
  } else {
    if ($ef.Required) { Fail "$($ef.Path) missing" }
    else { Warn "$($ef.Path) missing (optional)" }
  }
}

# Check critical env vars from root .env
$rootEnv = Join-Path $ProjectRoot ".env"
if (Test-Path $rootEnv) {
  $envContent = Get-Content $rootEnv -Raw
  $criticalVars = @("DATABASE_URL", "BETTER_AUTH_SECRET")
  foreach ($v in $criticalVars) {
    if ($envContent -match "(?m)^$v=.+") {
      if ($envContent -match "(?m)^$v=.*your_.*_here") {
        Warn "$v is set but contains placeholder value"
      } else {
        Pass "$v is configured"
      }
    } else {
      Fail "$v not found in .env"
    }
  }
}

# ==============================================================
# 6. DATABASE (skip if -Quick)
# ==============================================================
Section "6. Database"

if ($Quick) {
  Skip "Database checks skipped (-Quick mode)"
} else {
  $drizzleDir = Join-Path $ProjectRoot "packages\db"
  $drizzleSchema = Join-Path $drizzleDir "src\schema"
  if (Test-Path $drizzleSchema) {
    $schemaFiles = Get-ChildItem $drizzleSchema -Filter "*.ts" -ErrorAction SilentlyContinue
    if ($schemaFiles.Count -gt 0) {
      Pass "Drizzle schema: $($schemaFiles.Count) schema files"
    } else {
      Fail "No schema .ts files in packages/db/src/schema"
    }
  } else {
    Fail "Drizzle schema directory missing: packages/db/src/schema"
  }

  $migrationsDir = Join-Path $drizzleDir "drizzle"
  if (Test-Path $migrationsDir) {
    $migFiles = Get-ChildItem $migrationsDir -Filter "*.sql" -ErrorAction SilentlyContinue
    Pass "Migrations: $($migFiles.Count) SQL files in packages/db/drizzle"
  } else {
    Warn "No migrations directory at packages/db/drizzle - run pnpm db:generate"
  }

  if ($env:DATABASE_URL -or ($envContent -and $envContent -match "(?m)^DATABASE_URL=(?!.*your_)")) {
    Info "Testing database connectivity..."
    try {
      $dbCheck = pnpm --filter @hsafx/db exec -- npx drizzle-kit check 2>&1
      if ($LASTEXITCODE -eq 0) { Pass "Database schema check passed" }
      else { Warn "drizzle-kit check returned non-zero (may need db:generate)" }
    } catch {
      Warn "Could not run drizzle-kit check"
    }
  } else {
    Skip "Database connectivity - no DATABASE_URL configured"
  }
}

# ==============================================================
# 7. BUILD ARTIFACTS (skip if -Quick)
# ==============================================================
Section "7. Build Artifacts"

if ($Quick) {
  Skip "Build checks skipped (-Quick mode)"
} else {
  Info "Running typecheck (this may take a moment)..."
  try {
    $tcOutput = pnpm typecheck 2>&1
    if ($LASTEXITCODE -eq 0) { Pass "TypeScript typecheck passed" }
    else {
      Fail "TypeScript errors detected"
      $errLines = ($tcOutput | Select-String "error TS" | Select-Object -First 5)
      foreach ($el in $errLines) { Info "  $($el.Line.Trim())" }
    }
  } catch {
    Warn "Could not run typecheck"
  }
}

# ==============================================================
# SUMMARY
# ==============================================================
Write-Host ""
Write-Host "--- Summary ---" -ForegroundColor White
Write-Host ""

$total = $script:PassCount + $script:WarnCount + $script:FailCount + $script:SkipCount
Write-Host "  Total checks: $total" -ForegroundColor White
Write-Host "  PASS: $($script:PassCount)" -ForegroundColor Green
Write-Host "  WARN: $($script:WarnCount)" -ForegroundColor Yellow
Write-Host "  FAIL: $($script:FailCount)" -ForegroundColor Red
Write-Host "  SKIP: $($script:SkipCount)" -ForegroundColor DarkGray
Write-Host ""

if ($script:FailCount -eq 0 -and $script:WarnCount -eq 0) {
  Write-Host "  All checks passed - project is in perfect order!" -ForegroundColor Green
} elseif ($script:FailCount -eq 0) {
  Write-Host "  No failures, but $($script:WarnCount) warning(s) - optional dependencies missing." -ForegroundColor Yellow
} else {
  Write-Host "  $($script:FailCount) failure(s) found - fix them before running the project." -ForegroundColor Red
  if (-not $Fix) {
    Write-Host "  Re-run with -Fix to attempt auto-repair: .\scripts\check-deps.ps1 -Fix" -ForegroundColor Yellow
  }
}

Write-Host ""
Pop-Location

if ($script:FailCount -gt 0) { exit 1 } else { exit 0 }
