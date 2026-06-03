# Requires -Version 7.5

<#
.SYNOPSIS
    Status check script for Async PR Reviews in PowerShell.
    
.DESCRIPTION
    Polls the log directory of an async PR review and reports the status of each task.

.PARAMETER PRNumber
    The Pull Request number to check.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [int]$PRNumber
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$BaseDir = git rev-parse --show-toplevel 2>$null
if (-not $BaseDir) {
    Write-Error "❌ Must be run from within a git repository."
    exit 1
}

$LogDir = Join-Path $BaseDir (Join-Path ".gemini" (Join-Path "tmp" (Join-Path "async-reviews" (Join-Path "pr-$PRNumber" "logs"))))

if (-not (Test-Path $LogDir)) {
    Write-Host "STATUS: NOT_FOUND"
    Write-Host "❌ No logs found for PR #$PRNumber in $LogDir"
    exit 0
}

$Tasks = @(
    @{ Name = "setup"; Log = "setup.log" }
    @{ Name = "pr-diff"; Log = "pr-diff.diff" }
    @{ Name = "build-and-lint"; Log = "build-and-lint.log" }
    @{ Name = "review"; Log = "review.md" }
    @{ Name = "npm-test"; Log = "npm-test.log" }
    @{ Name = "test-execution"; Log = "test-execution.log" }
    @{ Name = "final-assessment"; Log = "final-assessment.md" }
)

$AllDone = $true
Write-Host "STATUS: CHECKING"

foreach ($Task in $Tasks) {
    $Name = $Task.Name
    $LogFile = $Task.Log
    
    $FilePath = Join-Path $LogDir $LogFile
    $ExitFile = Join-Path $LogDir "$Name.exit"

    if (Test-Path $ExitFile) {
        $ExitCode = Get-Content $ExitFile -Raw
        $ExitCode = $ExitCode.Trim()
        if ($ExitCode -eq "0") {
            Write-Host "✅ $Name: SUCCESS" -ForegroundColor Green
        }
        else {
            Write-Host "❌ $Name: FAILED (exit code $ExitCode)" -ForegroundColor Red
            if (Test-Path $FilePath) {
                Write-Host "   Last lines of $LogFile:"
                Get-Content $FilePath -Tail 3 | ForEach-Object { Write-Host "      $_" }
            }
        }
    }
    elseif (Test-Path $FilePath) {
        Write-Host "⏳ $Name: RUNNING" -ForegroundColor Yellow
        $AllDone = $false
    }
    else {
        Write-Host "➖ $Name: NOT STARTED"
        $AllDone = $false
    }
}

if ($AllDone) {
    Write-Host "STATUS: COMPLETE"
    Write-Host "LOG_DIR: $LogDir"
}
else {
    Write-Host "STATUS: IN_PROGRESS"
}
