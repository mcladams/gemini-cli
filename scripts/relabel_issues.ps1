# Requires -Version 7.5

<#
.SYNOPSIS
    Script to relabel GitHub issues in PowerShell.
    
.DESCRIPTION
    Searches for open issues with a specific label and replaces it with a new one.

.PARAMETER OldLabel
    The label to remove.

.PARAMETER NewLabel
    The label to add.

.PARAMETER Repository
    The GitHub repository (e.g., google-gemini/gemini-cli).

.EXAMPLE
    .\scripts\relabel_issues.ps1 -OldLabel "area/models" -NewLabel "area/agent"
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$OldLabel,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$NewLabel,

    [Parameter(Mandatory = $false, Position = 2)]
    [string]$Repository = "google-gemini/gemini-cli"
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🔍 Searching for open issues in '$Repository' with label '$OldLabel'..."

# Fetch issues with the old label
$IssuesJson = gh issue list --repo "$Repository" --label "$OldLabel" --state open --limit 1000 --json number,title | ConvertFrom-Json

if ($null -eq $IssuesJson) {
    Write-Host "✅ No issues found with label '$OldLabel'."
    exit 0
}

$Count = ($IssuesJson | Measure-Object).Count

if ($Count -eq 0) {
    Write-Host "✅ No issues found with label '$OldLabel'."
    exit 0
}

Write-Host "found $Count issues to relabel."

# Iterate and update
foreach ($Issue in $IssuesJson) {
    $Number = $Issue.number
    $Title = $Issue.title
    Write-Host "🔄 Processing #$Number: $Title"
    Write-Host "   - Removing: $OldLabel"
    Write-Host "   + Adding:   $NewLabel"
    
    gh issue edit "$Number" --repo "$Repository" --add-label "$NewLabel" --remove-label "$OldLabel"
    
    Write-Host "   ✅ Done."
}

Write-Host "🎉 All issues relabeled!"
