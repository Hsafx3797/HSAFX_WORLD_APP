<#
.SYNOPSIS
    OWASP ZAP automated security scan for HSAFX World App.
    
.DESCRIPTION
    Runs DAST (Dynamic Application Security Testing) against local dev servers
    using OWASP ZAP's REST API. Supports spider, active scan, and report generation.

.PREREQUISITES
    1. OWASP ZAP 2.17.0+ running (Desktop GUI or daemon mode)
    2. ZAP API must be enabled:
       - In ZAP GUI: Tools → Options → API
       - Check "Enable the API"
       - Copy the API Key (or disable key requirement for local use)
    3. Local dev servers running on the target ports

.PARAMETER Target
    The target URL to scan (default: http://localhost:3000)

.PARAMETER ZapHost
    ZAP API host (default: http://127.0.0.1:8080)

.PARAMETER ApiKey
    ZAP API key. Set to empty string if API key is disabled.

.PARAMETER ScanType
    Type of scan: "spider", "active", "full" (spider + active). Default: "full"

.PARAMETER OutputDir
    Directory for reports (default: ./reports/security)

.EXAMPLE
    # Scan web app
    .\zap-scan.ps1 -Target "http://localhost:3000" -ApiKey "your-api-key"
    
    # Scan admin app
    .\zap-scan.ps1 -Target "http://localhost:3001" -ApiKey "your-api-key"
    
    # Spider only
    .\zap-scan.ps1 -Target "http://localhost:3000" -ScanType "spider" -ApiKey "key"

    # Start ZAP in daemon mode (headless)
    # java -jar "C:\Program Files\ZAP\ZAP_2.17.0\zap-2.17.0.jar" -daemon -port 8080 -config api.key=your-api-key
#>

param(
    [string]$Target = "http://localhost:3000",
    [string]$ZapHost = "http://127.0.0.1:8080",
    [string]$ApiKey = "",
    [ValidateSet("spider", "active", "full")]
    [string]$ScanType = "full",
    [string]$OutputDir = "reports/security"
)

$ErrorActionPreference = "Stop"

# ─── Helpers ───────────────────────────────────────────────────────────
function Invoke-ZapApi {
    param([string]$Endpoint, [hashtable]$Params = @{})
    
    if ($ApiKey) { $Params["apikey"] = $ApiKey }
    
    $queryString = ($Params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    $url = "$ZapHost$Endpoint"
    if ($queryString) { $url += "?$queryString" }
    
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec 30
        return $response
    }
    catch {
        Write-Error "ZAP API call failed: $Endpoint - $($_.Exception.Message)"
        return $null
    }
}

function Wait-ZapScan {
    param([string]$Type, [string]$ScanId)
    
    $endpoint = if ($Type -eq "spider") { "/JSON/spider/view/status/" } else { "/JSON/ascan/view/status/" }
    
    do {
        Start-Sleep -Seconds 5
        $status = Invoke-ZapApi -Endpoint $endpoint -Params @{ scanId = $ScanId }
        $progress = if ($Type -eq "spider") { $status.status } else { $status.status }
        Write-Host "`r  [$Type] Progress: $progress%" -NoNewline
    } while ([int]$progress -lt 100)
    
    Write-Host "`r  [$Type] Complete!          "
}

# ─── Pre-flight checks ────────────────────────────────────────────────
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OWASP ZAP Security Scan" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target:    $Target"
Write-Host "ZAP Host:  $ZapHost"
Write-Host "Scan Type: $ScanType"
Write-Host ""

# Test ZAP API connection
Write-Host "[1/6] Testing ZAP API connection..." -ForegroundColor Yellow
$version = Invoke-ZapApi -Endpoint "/JSON/core/view/version/"
if (-not $version) {
    Write-Host ""
    Write-Host "ERROR: Cannot connect to ZAP API at $ZapHost" -ForegroundColor Red
    Write-Host ""
    Write-Host "Setup steps:" -ForegroundColor Yellow
    Write-Host "  1. Open OWASP ZAP Desktop"
    Write-Host "  2. Go to Tools -> Options -> API"
    Write-Host "  3. Check 'Enable the API'"
    Write-Host "  4. Copy the API Key"
    Write-Host "  5. Re-run: .\zap-scan.ps1 -ApiKey 'your-key-here'"
    Write-Host ""
    Write-Host "Or start ZAP in daemon mode:" -ForegroundColor Yellow
    Write-Host '  java -jar "path\to\zap.jar" -daemon -port 8080 -config api.key=mykey'
    exit 1
}
Write-Host "  ZAP version: $($version.version)" -ForegroundColor Green

# Test target reachability
Write-Host "[2/6] Checking target is reachable..." -ForegroundColor Yellow
try {
    $targetCheck = Invoke-WebRequest -Uri $Target -TimeoutSec 10 -UseBasicParsing
    Write-Host "  Target responded: HTTP $($targetCheck.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "  WARNING: Target may not be reachable: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host "  Continuing anyway (ZAP will handle retries)..."
}

# Create output directory
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$reportDir = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
Write-Host "[3/6] Reports will be saved to: $reportDir" -ForegroundColor Yellow

# ─── Spider Scan ───────────────────────────────────────────────────────
if ($ScanType -in @("spider", "full")) {
    Write-Host "[4/6] Starting spider scan..." -ForegroundColor Yellow
    
    $spiderResult = Invoke-ZapApi -Endpoint "/JSON/spider/action/scan/" -Params @{
        url       = $Target
        maxChildren = "10"
        recurse   = "true"
        subtreeOnly = "true"
    }
    
    if ($spiderResult) {
        $spiderId = $spiderResult.scan
        Write-Host "  Spider scan ID: $spiderId"
        Wait-ZapScan -Type "spider" -ScanId $spiderId
        
        # Get spider results
        $spiderUrls = Invoke-ZapApi -Endpoint "/JSON/spider/view/results/" -Params @{ scanId = $spiderId }
        $urlCount = if ($spiderUrls.results) { $spiderUrls.results.Count } else { 0 }
        Write-Host "  URLs discovered: $urlCount" -ForegroundColor Green
    }
    else {
        Write-Host "  Spider scan failed to start" -ForegroundColor Red
    }
}
else {
    Write-Host "[4/6] Skipping spider scan (scan type: $ScanType)" -ForegroundColor DarkGray
}

# ─── Active Scan ───────────────────────────────────────────────────────
if ($ScanType -in @("active", "full")) {
    Write-Host "[5/6] Starting active scan..." -ForegroundColor Yellow
    Write-Host "  (This may take several minutes)" -ForegroundColor DarkGray
    
    $activeScanResult = Invoke-ZapApi -Endpoint "/JSON/ascan/action/scan/" -Params @{
        url       = $Target
        recurse   = "true"
        inScopeOnly = "false"
        scanPolicyName = ""
        method    = ""
        postData  = ""
    }
    
    if ($activeScanResult) {
        $activeScanId = $activeScanResult.scan
        Write-Host "  Active scan ID: $activeScanId"
        Wait-ZapScan -Type "active" -ScanId $activeScanId
    }
    else {
        Write-Host "  Active scan failed to start" -ForegroundColor Red
    }
}
else {
    Write-Host "[5/6] Skipping active scan (scan type: $ScanType)" -ForegroundColor DarkGray
}

# ─── Generate Reports ─────────────────────────────────────────────────
Write-Host "[6/6] Generating reports..." -ForegroundColor Yellow

# Get alerts summary
$alertsSummary = Invoke-ZapApi -Endpoint "/JSON/alert/view/alertsSummary/" -Params @{ baseurl = $Target }

# HTML report
$htmlReport = Invoke-ZapApi -Endpoint "/OTHER/core/other/htmlreport/"
if ($htmlReport) {
    $htmlPath = Join-Path $reportDir "zap-report.html"
    $htmlReport | Out-File -FilePath $htmlPath -Encoding utf8
    Write-Host "  HTML report: $htmlPath" -ForegroundColor Green
}

# JSON report
$jsonAlerts = Invoke-ZapApi -Endpoint "/JSON/alert/view/alerts/" -Params @{
    baseurl = $Target
    start   = "0"
    count   = "500"
}
if ($jsonAlerts) {
    $jsonPath = Join-Path $reportDir "zap-alerts.json"
    $jsonAlerts | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding utf8
    Write-Host "  JSON report: $jsonPath" -ForegroundColor Green
}

# ─── Summary ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Scan Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($alertsSummary -and $alertsSummary.alertsSummary) {
    $summary = $alertsSummary.alertsSummary
    $high     = if ($summary.High)         { $summary.High }         else { 0 }
    $medium   = if ($summary.Medium)       { $summary.Medium }       else { 0 }
    $low      = if ($summary.Low)          { $summary.Low }          else { 0 }
    $info     = if ($summary.Informational){ $summary.Informational} else { 0 }
    
    Write-Host "  High:          $high" -ForegroundColor $(if ([int]$high -gt 0) { "Red" } else { "Green" })
    Write-Host "  Medium:        $medium" -ForegroundColor $(if ([int]$medium -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Low:           $low" -ForegroundColor $(if ([int]$low -gt 0) { "DarkYellow" } else { "Green" })
    Write-Host "  Informational: $info" -ForegroundColor Cyan
    
    # Exit code based on severity
    if ([int]$high -gt 0) {
        Write-Host ""
        Write-Host "FAIL: High severity alerts found!" -ForegroundColor Red
        exit 2
    }
    elseif ([int]$medium -gt 0) {
        Write-Host ""
        Write-Host "WARNING: Medium severity alerts found" -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host ""
        Write-Host "PASS: No high/medium severity alerts" -ForegroundColor Green
        exit 0
    }
}
else {
    Write-Host "  Could not retrieve alerts summary." -ForegroundColor DarkYellow
    Write-Host "  Check reports in: $reportDir"
    exit 0
}
