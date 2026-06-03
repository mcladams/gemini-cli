# Requires -Version 7.5

<#
.SYNOPSIS
    Script to create a 'gemini' alias for PowerShell.
    
.DESCRIPTION
    Adds a 'gemini' function to your PowerShell profile that points to the
    Gemini CLI start script.

.EXAMPLE
    .\scripts\create_alias.ps1
#>

[CmdletBinding()]
param ()

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Determine the project directory
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptDir
$StartScript = Join-Path $ProjectRoot (Join-Path "scripts" "start.js")

$AliasFunction = @"

function gemini {
    node "$StartScript" @args
}
"@

$ProfileFile = $PROFILE.CurrentUserAllHosts
if (-not $ProfileFile) {
    # Fallback to CurrentUserCurrentHost if AllHosts is not set (unlikely)
    $ProfileFile = $PROFILE
}

Write-Host "This script will add the following function to your PowerShell profile ($ProfileFile):"
Write-Host "$AliasFunction"
Write-Host ""

# Check if the function already exists in the profile
if (Test-Path $ProfileFile) {
    $Content = Get-Content $ProfileFile -Raw
    if ($Content -match "function gemini \{") {
        Write-Host "A 'gemini' function already exists in $ProfileFile. No changes were made."
        exit 0
    }
}
else {
    # Create profile directory if it doesn't exist
    $ProfileDir = Split-Path -Parent $ProfileFile
    if (-not (Test-Path $ProfileDir)) {
        New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
    }
    # Create empty profile file
    New-Item -ItemType File -Path $ProfileFile -Force | Out-Null
}

$Confirm = Read-Host "Do you want to proceed? (y/n)"
if ($Confirm -eq 'y') {
    Add-Content -Path $ProfileFile -Value $AliasFunction
    Write-Host ""
    Write-Host "Function added to $ProfileFile."
    Write-Host "Please restart your PowerShell session or run '. `$PROFILE' to use the 'gemini' command."
}
else {
    Write-Host "Aborted. No changes were made."
}
