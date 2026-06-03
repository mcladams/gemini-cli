# Requires -Version 7.5

<#
.SYNOPSIS
    Batch triage script for GitHub issues in PowerShell.
    
.DESCRIPTION
    Searches for open issues that need triage (missing 'area/' label) and
    triggers an automated triage workflow for each.

.PARAMETER Repository
    The GitHub repository (e.g., google-gemini/gemini-cli).

.EXAMPLE
    .\scripts\batch_triage.ps1 -Repository google-gemini/gemini-cli
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$Repository = "google-gemini/gemini-cli"
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Workflow = "gemini-automated-issue-triage.yml"

Write-Host "🔍 Searching for open issues in '$Repository' that need triage (missing 'area/' label)..."

# Fetch open issues with number, title, and labels
# Up to 1000 issues.
$IssuesJson = gh issue list --repo "$Repository" --state open --limit 1000 --json number,title,labels | ConvertFrom-Json

if ($null -eq $IssuesJson) {
    Write-Host "✅ No issues found in '$Repository'."
    exit 0
}

# Filter issues that DO NOT have a label starting with 'area/'
$TargetIssues = $IssuesJson | Where-Object {
    $HasAreaLabel = $_.labels | Where-Object { $_.name -like "area/*" }
    -not $HasAreaLabel
}

$Count = ($TargetIssues | Measure-Object).Count

if ($Count -eq 0) {
    Write-Host "✅ No issues found needing triage in '$Repository'."
    exit 0
}

Write-Host "🚀 Found $Count issues to triage."

# Loop through and trigger workflow
foreach ($Issue in $TargetIssues) {
    $Number = $Issue.number
    $Title = $Issue.title
    Write-Host "▶️  Triggering triage for #$Number: $Title"
    
    # Trigger the workflow dispatch event
    gh workflow run "$Workflow" --repo "$Repository" -f "issue_number=$Number"
    
    # Sleep briefly to be nice to the API
    Start-Sleep -Seconds 1
}

Write-Host "🎉 All triage workflows triggered!"
