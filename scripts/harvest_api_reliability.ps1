# Requires -Version 7.5

<#
.SYNOPSIS
    Gemini API Reliability Harvester for PowerShell.
    
.DESCRIPTION
    This script gathers data about API errors encountered during evaluation runs
    from GitHub Actions. It is used to analyze developer friction caused 
    by transient API failures.

.PARAMETER Since
    Gather runs since this date (YYYY-MM-DD) or duration (e.g., "7d", "14d").
    Defaults to "7d".

.PARAMETER Limit
    Maximum number of runs to fetch. Defaults to 300.

.PARAMETER Branch
    Filter by branch name. Defaults to all branches.

.EXAMPLE
    .\scripts\harvest_api_reliability.ps1 -Since "14d" -Limit 500
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$Since = "7d",

    [Parameter(Mandatory = $false, Position = 1)]
    [int]$Limit = 300,

    [Parameter(Mandatory = $false, Position = 2)]
    [string]$Branch = ""
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Date Handling
$SinceDate = $null
if ($Since -match '^(\d+)d$') {
    $Days = [int]$Matches[1]
    $SinceDate = (Get-Date).AddDays(-$Days).ToString("yyyy-MM-dd")
}
elseif ($Since -match '^\d{4}-\d{2}-\d{2}$') {
    $SinceDate = $Since
}
else {
    $SinceDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
}

$Workflows = "Testing: E2E (Chained)", "Evals: Nightly"
$DestDir = Join-Path $env:TEMP "gemini-reliability-$((New-Guid).Guid.Substring(0,8))"
New-Item -ItemType Directory -Path $DestDir | Out-Null
$MergedFile = "api-reliability-summary.jsonl"

# Cleanup on exit
# In PowerShell, we can't easily trap exit in the same way, but we'll try to clean up at the end.

# Check Prerequisites
try {
    gh --version | Out-Null
}
catch {
    Write-Error "❌ Error: GitHub CLI (gh) is not installed."
    exit 1
}

# Clean start
if (Test-Path $MergedFile) {
    Remove-Item $MergedFile
}

$CreatedQuery = ">=$SinceDate"

foreach ($Workflow in $Workflows) {
    Write-Host "🔍 Fetching runs for '$Workflow' created since $SinceDate (max $Limit runs, branch: $(if ($Branch) { $Branch } else { "all" }))..."

    # Construct arguments for gh run list
    $GhArgs = @("run", "list", "--workflow", $Workflow, "--created", $CreatedQuery, "--limit", "$Limit", "--json", "databaseId", "--jq", ".[].databaseId")
    if ($Branch) {
        $GhArgs += @("--branch", $Branch)
    }

    try {
        $RunIds = gh $GhArgs
    }
    catch {
        Write-Warning "❌ Failed to fetch runs for '$Workflow'. Please check 'gh auth status' and permissions."
        continue
    }

    if ($null -eq $RunIds -or $RunIds.Length -eq 0) {
        Write-Host "📭 No runs found for workflow '$Workflow' since $SinceDate."
        continue
    }

    foreach ($Id in $RunIds) {
        if (-not $Id) { continue }
        
        $RunDestDir = Join-Path $DestDir $Id
        # Download artifacts named 'eval-logs-*'
        # Many older runs won't have artifacts, so we ignore errors
        try {
            gh run download "$Id" -p "eval-logs-*" -D "$RunDestDir" 2>$null | Out-Null
            
            # Find api-reliability.jsonl and append to master log
            if (Test-Path $RunDestDir) {
                $ReliabilityFiles = Get-ChildItem -Path $RunDestDir -Filter "api-reliability.jsonl" -Recurse
                foreach ($File in $ReliabilityFiles) {
                    Get-Content $File.FullName | Add-Content $MergedFile
                }
            }
        }
        catch {
            # Skip failures
        }
    }
}

if (-not (Test-Path $MergedFile)) {
    Write-Host "📭 No reliability data found in the retrieved logs."
    exit 0
}

Write-Host "`n✅ Harvest Complete! Data merged into: $MergedFile"
Write-Host "------------------------------------------------"
Write-Host "📊 Gemini API Reliability Summary (Since $SinceDate)"
Write-Host "------------------------------------------------"

# Process JSONL and summarize using PowerShell's native capabilities
$Events = Get-Content $MergedFile | ForEach-Object { $_ | ConvertFrom-Json }

$Summary = $Events | Group-Object model | ForEach-Object {
    $Group = $_.Group
    [PSCustomObject]@{
        model   = $_.Name
        "500s"  = ($Group | Where-Object { $_.errorCode -eq "500" } | Measure-Object).Count
        "503s"  = ($Group | Where-Object { $_.errorCode -eq "503" } | Measure-Object).Count
        retries = ($Group | Where-Object { $_.status -eq "RETRY" } | Measure-Object).Count
        skips   = ($Group | Where-Object { $_.status -eq "SKIP" } | Measure-Object).Count
    }
}

$Summary | Format-Table

Write-Host "`n💡 Total events captured: $($Events.Count)"

# Cleanup
Remove-Item -Path $DestDir -Recurse -Force -ErrorAction SilentlyContinue
