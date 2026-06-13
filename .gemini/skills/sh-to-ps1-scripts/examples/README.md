# Bash-to-PowerShell Conversion Examples

This document showcases common "Before (Bash)" and "After (PowerShell)" patterns to guide your migration.

## Example 1: Basic Utility with Error Handling

### Before (bash)
```bash
#!/bin/bash
set -e
REPO="google-gemini/gemini-cli"
gh issue list --repo "$REPO" --limit 5
```

### After (PowerShell)
```powershell
#requires -version 7.5
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Repo = "google-gemini/gemini-cli"
$Issues = @(gh issue list --repo "$Repo" --limit 5)

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch issues from $Repo"
}

$Issues | ForEach-Object { Write-Host "Issue: $_" }
```

## Example 2: Path Handling with Brackets

### Before (bash)
```bash
FILE="data[2026].json"
if [ -f "$FILE" ]; then
    rm "$FILE"
fi
```

### After (PowerShell)
```powershell
$File = "data[2026].json"
if (Test-Path -LiteralPath $File) {
    Remove-Item -LiteralPath $File -Force
}
```

## Example 3: Background Task Orchestration

### Before (bash)
```bash
(npm run build > build.log 2>&1) &
PID=$!
wait $PID
```

### After (PowerShell)
```powershell
$Job = Start-Job -ScriptBlock {
    param($Dir)
    Set-Location -LiteralPath $Dir
    npm run build > build.log 2>&1
    return $LASTEXITCODE
} -ArgumentList $PWD.Path

while ($Job.State -eq 'Running') {
    Start-Sleep -Seconds 1
}

$ExitCode = Receive-Job -Job $Job
if ($ExitCode -ne 0) {
    Write-Warning "Build job failed with exit code $ExitCode."
}
```

---

*🤖 Crafted with precision by ✨Copilot following brilliant human instruction, then carefully refined by our team of discerning human reviewers.*
