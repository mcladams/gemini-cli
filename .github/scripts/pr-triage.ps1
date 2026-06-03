# Requires -Version 7.5

<#
.SYNOPSIS
    PR Triage Script for GitHub Actions in PowerShell.
    
.DESCRIPTION
    Synchronizes labels between Pull Requests and their linked issues.
    Ensures 'status/need-issue' label is correctly managed.

.PARAMETER PRNumber
    Optional PR number to process. If omitted, all open PRs are processed.
#>

[CmdletBinding()]
param (
    [int]$PRNumber
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_REPOSITORY) {
    Write-Error "‼️ Missing GITHUB_REPOSITORY - this must be run from GitHub Actions"
    exit 1
}

$Repo = $env:GITHUB_REPOSITORY
$PrsNeedingComment = @()
$IssueLabelsCache = @{}

function Get-IssueLabels {
    param ([string]$IssueNum)

    if ([string]::IsNullOrWhiteSpace($IssueNum) -or $IssueNum -eq "null") {
        return @()
    }

    if ($IssueLabelsCache.ContainsKey($IssueNum)) {
        return $IssueLabelsCache[$IssueNum]
    }

    Write-Host "   📥 Fetching labels from issue #$IssueNum" -ForegroundColor Cyan
    try {
        $GhOutput = gh issue view $IssueNum --repo $Repo --json labels --jq '.labels[].name'
        # Filter labels based on regex: (area|priority)/.*|help wanted|🔒 maintainer only
        $FilteredLabels = $GhOutput | Where-Object { $_ -match '^(area|priority)/.*|^help wanted$|^🔒 maintainer only$' }
        $IssueLabelsCache[$IssueNum] = $FilteredLabels
        return $FilteredLabels
    }
    catch {
        Write-Warning "      ⚠️ Could not fetch issue #$IssueNum"
        $IssueLabelsCache[$IssueNum] = @()
        return @()
    }
}

function Process-PROptimized {
    param (
        [int]$Number,
        [bool]$IsDraft,
        [string]$IssueNum,
        [string[]]$CurrentLabels
    )

    Write-Host "🔄 Processing PR #$Number" -ForegroundColor Yellow

    $LabelsToAdd = New-Object System.Collections.Generic.List[string]
    $LabelsToRemove = New-Object System.Collections.Generic.List[string]

    if ([string]::IsNullOrWhiteSpace($IssueNum) -or $IssueNum -eq "null") {
        if ($IsDraft) {
            Write-Host "   📝 PR #$Number is a draft and has no linked issue"
            if ($CurrentLabels -contains "status/need-issue") {
                Write-Host "      ➖ Removing status/need-issue label"
                $LabelsToRemove.Add("status/need-issue")
            }
        }
        else {
            Write-Host "   ⚠️  No linked issue found for PR #$Number" -ForegroundColor Red
            if ($CurrentLabels -notcontains "status/need-issue") {
                Write-Host "      ➕ Adding status/need-issue label"
                $LabelsToAdd.Add("status/need-issue")
            }
            
            $script:PrsNeedingComment += $Number
        }
    }
    else {
        Write-Host "   🔗 Found linked issue #$IssueNum"

        if ($CurrentLabels -contains "status/need-issue") {
            Write-Host "      ➖ Removing status/need-issue label"
            $LabelsToRemove.Add("status/need-issue")
        }

        $IssueLabels = Get-IssueLabels $IssueNum

        foreach ($Label in $IssueLabels) {
            if ($CurrentLabels -notcontains $Label) {
                Write-Host "      ➕ Syncing label to add: $Label"
                $LabelsToAdd.Add($Label)
            }
        }

        if ($LabelsToAdd.Count -eq 0 -and $LabelsToRemove.Count -eq 0) {
            Write-Host "   ✅ Labels already synchronized" -ForegroundColor Green
        }
    }

    if ($LabelsToAdd.Count -gt 0 -or $LabelsToRemove.Count -gt 0) {
        $EditArgs = @("pr", "edit", "$Number", "--repo", $Repo)
        if ($LabelsToAdd.Count -gt 0) {
            $EditArgs += @("--add-label", ($LabelsToAdd -join ","))
        }
        if ($LabelsToRemove.Count -gt 0) {
            $EditArgs += @("--remove-label", ($LabelsToRemove -join ","))
        }
        
        try {
            gh $EditArgs | Out-Null
        }
        catch {
            Write-Warning "      ❌ Failed to edit labels for PR #$Number"
        }
    }
}

# JQ extraction equivalent using PowerShell objects
if ($PRNumber) {
    Write-Host "🔄 Processing single PR #$PRNumber"
    try {
        $PrData = gh pr view $PRNumber --repo $Repo --json number,closingIssuesReferences,isDraft,body,labels | ConvertFrom-Json
        $IssueNum = if ($PrData.closingIssuesReferences.Count -gt 0) { $PrData.closingIssuesReferences[0].number } else {
            # Try to extract from body using regex
            if ($PrData.body -match '(?<!issue\s|issues\/|pull\/|#)#(\d+)') { $Matches[1] } else { "null" }
        }
        $Labels = $PrData.labels.name
        Process-PROptimized -Number $PrData.number -IsDraft $PrData.isDraft -IssueNum $IssueNum -CurrentLabels $Labels
    }
    catch {
        Write-Error "❌ Failed to fetch data for PR #$PRNumber"
        exit 1
    }
}
else {
    Write-Host "📥 Getting all open pull requests..."
    try {
        $PrsDataAll = gh pr list --repo $Repo --state open --limit 1000 --json number,closingIssuesReferences,isDraft,body,labels | ConvertFrom-Json
    }
    catch {
        Write-Error "❌ Failed to fetch PR list"
        exit 1
    }

    Write-Host "📊 Found $($PrsDataAll.Count) open PRs to process"

    foreach ($PrData in $PrsDataAll) {
        $IssueNum = if ($PrData.closingIssuesReferences.Count -gt 0) { $PrData.closingIssuesReferences[0].number } else {
            if ($PrData.body -match '(?<!issue\s|issues\/|pull\/|#)#(\d+)') { $Matches[1] } else { "null" }
        }
        $Labels = $PrData.labels.name
        Process-PROptimized -Number $PrData.number -IsDraft $PrData.isDraft -IssueNum $IssueNum -CurrentLabels $Labels
    }
}

if ($env:GITHUB_OUTPUT) {
    if ($PrsNeedingComment.Count -eq 0) {
        "prs_needing_comment=[]" | Add-Content $env:GITHUB_OUTPUT
    }
    else {
        "prs_needing_comment=[$($PrsNeedingComment -join ",")]" | Add-Content $env:GITHUB_OUTPUT
    }
}

Write-Host "✅ PR triage completed" -ForegroundColor Green
