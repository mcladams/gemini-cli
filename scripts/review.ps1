# Requires -Version 7.5

<#
.SYNOPSIS
    Gemini CLI PR Review Script for PowerShell.
    
.DESCRIPTION
    This script automates the process of reviewing a Pull Request by setting up
     a dedicated worktree, installing dependencies, and building the project.

.PARAMETER PRNumber
    The Pull Request number to review.

.PARAMETER Model
    The Gemini model ID (e.g., gemini-3.1-pro-preview).

.EXAMPLE
    .\scripts\review.ps1 -PRNumber 123
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [int]$PRNumber,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$Model = "gemini-3.1-pro-preview"
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Repo = "google-gemini/gemini-cli"
$ReviewDir = Join-Path $HOME (Join-Path "git" (Join-Path "review" "gemini-cli"))

if (-not (Test-Path $ReviewDir)) {
    Write-Error "ERROR: Directory $ReviewDir does not exist."
    Write-Host "`nPlease create a new gemini-cli clone at that directory to use for reviews."
    Write-Host "Instructions:"
    Write-Host "  mkdir -p ~/git/review"
    Write-Host "  cd ~/git/review"
    Write-Host "  git clone https://github.com/google-gemini/gemini-cli.git"
    exit 1
}

# 1. Check if the PR exists before doing anything else
Write-Host "review: Validating PR $PRNumber on $Repo..."
try {
    gh pr view $PRNumber -R $Repo | Out-Null
}
catch {
    Write-Error "ERROR: Could not find PR #$PRNumber in $Repo."
    Write-Host "Are you sure $PRNumber is a Pull Request number and not an Issue number?"
    exit 1
}

Write-Host "review: Opening PR $PRNumber in browser..."
Start-Process "https://github.com/$Repo/pull/$PRNumber"

Write-Host "review: Changing directory to $ReviewDir"
Set-Location $ReviewDir

# 2. Fetch latest main to ensure we have a clean starting point
Write-Host "review: Fetching latest from origin..."
git fetch origin main

# 3. Handle worktree creation
$WorktreePath = "pr_$PRNumber"
if (Test-Path $WorktreePath) {
    Write-Host "review: Worktree directory $WorktreePath already exists."
    # Check if it's actually a registered worktree
    $WorktreeList = git worktree list
    if ($WorktreeList -match [regex]::Escape($WorktreePath)) {
        Write-Host "review: Reusing existing worktree..."
    }
    else {
        Write-Host "review: Directory exists but is not a worktree. Cleaning up..."
        Remove-Item -Path $WorktreePath -Recurse -Force
    }
}

if (-not (Test-Path $WorktreePath)) {
    Write-Host "review: Adding new worktree at $WorktreePath..."
    # Create a detached worktree from origin/main
    git worktree add --detach $WorktreePath origin/main
}

Write-Host "review: Changing directory to $WorktreePath"
Set-Location $WorktreePath

# 4. Checkout the PR
Write-Host "review: Cleaning worktree and checking out PR $PRNumber..."
git reset --hard
git clean -fd
gh pr checkout $PRNumber --branch "review-$PRNumber" -f -R $Repo

# 5. Clean and Build
Write-Host "review: Clearing possibly stale node_modules..."
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages/core/dist/" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages/cli/node_modules/" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages/core/node_modules/" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "review: Installing npm dependencies..."
npm install

Write-Host "--- build ---"
$BuildLogFile = Join-Path $env:TEMP "npm_build_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

Write-Host "Running build. Output (with colors) will be shown below and saved to: $BuildLogFile"
Write-Host "Build command: npm run build"

# Run build and capture output
try {
    # Using Tee-Object to show output and save to file
    # We use -ErrorAction Stop to catch build failures
    npm run build 2>&1 | Tee-Object -FilePath $BuildLogFile
}
catch {
    Write-Error "ERROR: npm build failed."
    Write-Host "Review output above. Full log was in $BuildLogFile."
    exit 1
}

# Check for suspicious patterns in the log
$LogContent = Get-Content $BuildLogFile -Raw
if ($LogContent -match "\berror\b|\bfailed\b|ERR!|FATAL|critical") {
    Write-Error "ERROR: npm build completed, but suspicious error patterns were found in the build output."
    Write-Host "Review output above. Full log was in $BuildLogFile."
    exit 1
}

Write-Host "npm build completed successfully."
Remove-Item $BuildLogFile

Write-Host "-- running ---"
# Using npm start directly
npm start -- -m "$Model" -i="/review-frontend $PRNumber"
