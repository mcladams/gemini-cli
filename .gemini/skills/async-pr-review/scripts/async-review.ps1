# Requires -Version 7.5

<#
.SYNOPSIS
    Async PR Review Script for PowerShell.
    
.DESCRIPTION
    Launches background tasks to build, lint, test, and review a Pull Request.
    Provides live status updates and a final assessment.

.PARAMETER PRNumber
    The Pull Request number to review.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [int]$PRNumber
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Send-Notification {
    param (
        [string]$Title,
        [string]$Message,
        [int]$PR
    )
    # Terminal escape sequence
    Write-Host "`e]9;$Title | PR #$PR | $Message`a" -NoNewline
    
    # Windows Notification (Toast)
    # Note: Requires BurntToast module or direct PowerShell API calls. 
    # For simplicity, we'll just use the terminal sequence.
}

$BaseDir = git rev-parse --show-toplevel 2>$null
if (-not $BaseDir) {
    Write-Error "❌ Must be run from within a git repository."
    exit 1
}

# Use the repository's local .gemini/tmp directory for ephemeral worktrees and logs
$PrDir = Join-Path $BaseDir (Join-Path ".gemini" (Join-Path "tmp" (Join-Path "async-reviews" "pr-$PRNumber")))
$TargetDir = Join-Path $PrDir "worktree"
$LogDir = Join-Path $PrDir "logs"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$SetupLog = Join-Path $LogDir "setup.log"
$SetupExit = Join-Path $LogDir "setup.exit"

Write-Host "🧹 Cleaning up previous worktree if it exists..." | Tee-Object -FilePath $SetupLog -Append
try {
    git worktree remove -f "$TargetDir" 2>&1 | Out-File -FilePath $SetupLog -Append
    git branch -D "gemini-async-pr-$PRNumber" 2>&1 | Out-File -FilePath $SetupLog -Append
    git worktree prune 2>&1 | Out-File -FilePath $SetupLog -Append
}
catch {
    # Ignore errors during cleanup
}

Write-Host "📡 Fetching PR #$PRNumber..." | Tee-Object -FilePath $SetupLog -Append
try {
    git fetch origin -f "pull/$PRNumber/head:gemini-async-pr-$PRNumber" 2>&1 | Out-File -FilePath $SetupLog -Append
}
catch {
    "1" | Out-File -FilePath $SetupExit
    Write-Error "❌ Fetch failed. Check $SetupLog"
    Send-Notification -Title "Async Review Failed" -Message "Fetch failed." -PR $PRNumber
    exit 1
}

if (-not (Test-Path $TargetDir)) {
    Write-Host "🧹 Pruning missing worktrees..." | Tee-Object -FilePath $SetupLog -Append
    git worktree prune 2>&1 | Out-File -FilePath $SetupLog -Append
    Write-Host "🌿 Creating worktree in $TargetDir..." | Tee-Object -FilePath $SetupLog -Append
    try {
        git worktree add "$TargetDir" "gemini-async-pr-$PRNumber" 2>&1 | Out-File -FilePath $SetupLog -Append
    }
    catch {
        "1" | Out-File -FilePath $SetupExit
        Write-Error "❌ Worktree creation failed. Check $SetupLog"
        Send-Notification -Title "Async Review Failed" -Message "Worktree creation failed." -PR $PRNumber
        exit 1
    }
}
else {
    Write-Host "🌿 Worktree already exists." | Tee-Object -FilePath $SetupLog -Append
}

"0" | Out-File -FilePath $SetupExit

Set-Location $TargetDir

Write-Host "🚀 Launching background tasks. Logs saving to: $LogDir"

# Background Job Helpers
$Jobs = @{}

# 1. Grabbing PR diff
Write-Host "  ↳ [1/5] Grabbing PR diff..."
$Jobs["pr-diff"] = Start-Job -Name "pr-diff" -ScriptBlock {
    param($PR, $Log)
    gh pr diff $PR > (Join-Path $Log "pr-diff.diff") 2>&1
    return $LASTEXITCODE
} -ArgumentList $PRNumber, $LogDir

# 2. Starting build and lint
Write-Host "  ↳ [2/5] Starting build and lint..."
$Jobs["build-and-lint"] = Start-Job -Name "build-and-lint" -ScriptBlock {
    param($Log)
    $LogFile = Join-Path $Log "build-and-lint.log"
    # Run sequential tasks
    npm run clean > $LogFile 2>&1
    if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    npm ci >> $LogFile 2>&1
    if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    npm run format >> $LogFile 2>&1
    if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    npm run build >> $LogFile 2>&1
    if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    npm run lint:ci >> $LogFile 2>&1
    if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    npm run typecheck >> $LogFile 2>&1
    return $LASTEXITCODE
} -ArgumentList $LogDir

# Dynamically resolve gemini binary
$GeminiCmd = if (Get-Command gemini -ErrorAction SilentlyContinue) { "gemini" } else { Join-Path $HOME ".gcli" "nightly" "node_modules" ".bin" "gemini" }
$PolicyPath = Join-Path (Split-Path -Parent $PSScriptRoot) "policy.toml"

# 3. Starting Gemini code review
Write-Host "  ↳ [3/5] Starting Gemini code review..."
$Jobs["review"] = Start-Job -Name "review" -ScriptBlock {
    param($PR, $Log, $Cmd, $Policy)
    $ReviewFile = Join-Path $Log "review.md"
    & $Cmd --policy $Policy -p "/review-frontend $PR" > $ReviewFile 2>&1
    return $LASTEXITCODE
} -ArgumentList $PRNumber, $LogDir, $GeminiCmd, $PolicyPath

# 4. Starting automated tests (waits for build-and-lint internally in the polling loop logic if we were in bash, but here we can manage it)
# We'll dispatch it now and have it wait for the job to complete
Write-Host "  ↳ [4/5] Starting automated tests (waiting for build and lint)..."
$Jobs["npm-test"] = Start-Job -Name "npm-test" -ScriptBlock {
    param($PR, $Log, $BuildJobName)
    # Wait for build job to finish
    while ((Get-Job -Name $BuildJobName).State -eq 'Running') { Start-Sleep -Seconds 1 }
    $BuildResult = Receive-Job -Name $BuildJobName -Keep
    if ($BuildResult -ne 0) {
        "Skipped due to build-and-lint failure" | Out-File (Join-Path $Log "npm-test.log")
        return 1
    }

    $LogFile = Join-Path $Log "npm-test.log"
    gh pr checks $PR > (Join-Path $Log "ci-checks.log") 2>&1
    $CiStatus = $LASTEXITCODE
    
    if ($CiStatus -eq 0) {
        "CI checks passed. Skipping local npm tests." | Out-File $LogFile
        return 0
    }
    elseif ($CiStatus -eq 8) {
        "CI checks are still pending. Skipping local npm tests to avoid duplicate work." | Out-File $LogFile
        return 0
    }
    else {
        "CI checks failed. Failing checks:" | Out-File $LogFile
        gh pr checks $PR --json name,bucket -q '.[] | select(.bucket=="fail") | .name' >> $LogFile 2>&1
        
        # Branch/Run ID extraction
        $PrBranch = gh pr view $PR --json headRefName -q '.headRefName' 2>$null
        $RunId = gh run list --branch "$PrBranch" --workflow ci.yml --json databaseId -q '.[0].databaseId' 2>$null
        
        if ($RunId) {
            $FailedFiles = gh run view "$RunId" --log-failed 2>$null | Select-String -Pattern '(packages/[a-zA-Z0-9_-]+|integration-tests|evals)/[a-zA-Z0-9_/-]+\.test\.ts(x)?' -AllMatches | ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
            if ($FailedFiles) {
                "Found failing test files from CI:" | Add-Content $LogFile
                $FailedFiles | ForEach-Object { "  - $_" | Add-Content $LogFile }
                "Running ONLY failing tests locally..." | Add-Content $LogFile
                
                $ExitCode = 0
                foreach ($File in $FailedFiles) {
                    $WsDir = if ($File -match '^packages/([^/]+)/') { "packages/$($Matches[1])" } else { $File.Split('/')[0] }
                    $RelFile = $File.Replace("$WsDir/", "")
                    
                    "--- Running $RelFile in workspace $WsDir ---" | Add-Content $LogFile
                    npm run test:ci -w "$WsDir" -- "$RelFile" >> $LogFile 2>&1
                    if ($LASTEXITCODE -ne 0) { $ExitCode = 1 }
                }
                return $ExitCode
            }
        }
        "Could not extract specific failing files. Skipping full local test suite." | Add-Content $LogFile
        return 1
    }
} -ArgumentList $PRNumber, $LogDir, "build-and-lint"

# 5. Starting Gemini test execution
Write-Host "  ↳ [5/5] Starting Gemini test execution (waiting for build and lint)..."
$Jobs["test-execution"] = Start-Job -Name "test-execution" -ScriptBlock {
    param($PR, $Log, $Cmd, $Policy, $BuildJobName)
    while ((Get-Job -Name $BuildJobName).State -eq 'Running') { Start-Sleep -Seconds 1 }
    if ((Receive-Job -Name $BuildJobName -Keep) -ne 0) {
        "Skipped due to build-and-lint failure" | Out-File (Join-Path $Log "test-execution.log")
        return 1
    }

    $LogFile = Join-Path $Log "test-execution.log"
    & $Cmd --policy $Policy -p "Analyze the diff for PR $PR using 'gh pr diff $PR'. Instead of running the project's automated test suite, physically exercise the newly changed code in the terminal. Verify the feature's behavior works as expected. IMPORTANT: Do NOT modify any source code to fix errors. Just exercise the code and log the results, reporting any failures clearly. Do not ask for user confirmation." > $LogFile 2>&1
    return $LASTEXITCODE
} -ArgumentList $PRNumber, $LogDir, $GeminiCmd, $PolicyPath, "build-and-lint"

Write-Host "✅ All tasks dispatched!"
Write-Host "You can monitor progress with: Get-Job"
Write-Host "Read your review later at: $(Join-Path $LogDir "review.md")"

# Polling loop to wait for all background tasks to finish
$TaskNames = "pr-diff", "build-and-lint", "review", "npm-test", "test-execution"
$LogFiles = @{
    "pr-diff" = "pr-diff.diff"
    "build-and-lint" = "build-and-lint.log"
    "review" = "review.md"
    "npm-test" = "npm-test.log"
    "test-execution" = "test-execution.log"
}

while ($true) {
    Clear-Host
    Write-Host "=================================================="
    Write-Host "🚀 Async PR Review Status for PR #$PRNumber"
    Write-Host "=================================================="
    Write-Host ""
    
    $AllDone = $true
    foreach ($T in $TaskNames) {
        $Job = Get-Job -Name $T
        if ($Job.State -eq 'Completed') {
            $ExitCode = Receive-Job -Job $Job -Keep
            if ($ExitCode -eq 0) {
                Write-Host "  ✅ $T: SUCCESS" -ForegroundColor Green
            }
            else {
                Write-Host "  ❌ $T: FAILED (exit code $ExitCode)" -ForegroundColor Red
            }
            # Save exit code to file for check script
            $ExitCode | Out-File (Join-Path $LogDir "$T.exit")
        }
        elseif ($Job.State -eq 'Running') {
            Write-Host "  ⏳ $T: RUNNING" -ForegroundColor Yellow
            $AllDone = $false
        }
        else {
            Write-Host "  ➖ $T: $($Job.State)"
            $AllDone = $false
        }
    }
    
    Write-Host ""
    Write-Host "=================================================="
    Write-Host "📝 Live Logs (Last 5 lines of running tasks)"
    Write-Host "=================================================="
    
    foreach ($T in $TaskNames) {
        $Job = Get-Job -Name $T
        if ($Job.State -eq 'Running') {
            $LogFile = Join-Path $LogDir $LogFiles[$T]
            if (Test-Path $LogFile) {
                Write-Host ""
                Write-Host "--- $T ---" -ForegroundColor Cyan
                Get-Content $LogFile -Tail 5
            }
        }
    }
    
    if ($AllDone) { break }
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "⏳ Tasks complete! Synthesizing final assessment..."
$FinalAssessmentLog = Join-Path $LogDir "final-assessment.md"
$FinalAssessmentExit = Join-Path $LogDir "final-assessment.exit"

$SynthesisResult = & $GeminiCmd --policy $PolicyPath -p "Read the review at $(Join-Path $LogDir "review.md"), the automated test logs at $(Join-Path $LogDir "npm-test.log"), and the manual test execution logs at $(Join-Path $LogDir "test-execution.log"). Summarize the results, state whether the build and tests passed based on the background task results, and give a final recommendation for PR $PRNumber." 2>&1 | Tee-Object -FilePath $FinalAssessmentLog

if ($LASTEXITCODE -ne 0) {
    $LASTEXITCODE | Out-File $FinalAssessmentExit
    Write-Error "❌ Final assessment synthesis failed!"
    Send-Notification -Title "Async Review Failed" -Message "Final assessment synthesis failed." -PR $PRNumber
    exit 1
}

"0" | Out-File $FinalAssessmentExit
Write-Host "✅ Final assessment complete! Check $FinalAssessmentLog"
Send-Notification -Title "Async Review Complete" -Message "Review and test execution finished successfully." -PR $PRNumber
