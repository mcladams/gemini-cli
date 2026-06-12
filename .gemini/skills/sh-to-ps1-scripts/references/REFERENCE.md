# Bash-to-PowerShell Translation Reference

This document provides a technical mapping between common bash/sh constructs and their idiomatic PowerShell counterparts.

## 1. Core Logic & Control Flow

| Construct | Bash/Sh | PowerShell (7.5+) |
| :--- | :--- | :--- |
| **Strict Mode** | `set -euo pipefail` | `Set-StrictMode -Version Latest; $ErrorActionPreference = "Stop"` |
| **Variable** | `VAR="value"` | `$Var = "value"` |
| **Argument** | `$1`, `$2` | `$args[0]`, `$args[1]` (or `param()` block) |
| **If Statement** | `if [ "$X" = "Y" ]; then` | `if ($X -eq "Y") {` |
| **Loop** | `for i in {1..5}; do` | `foreach ($i in 1..5) {` |
| **Exit Code** | `exit 1` | `exit 1` |
| **Last Exit Code** | `$?` | `$LASTEXITCODE` (for native), `$?` (for cmdlets) |

## 2. File & Path Operations

| Action | Bash/Sh | PowerShell |
| :--- | :--- | :--- |
| **Current Dir** | `$(pwd)` | `$PWD` or `Get-Location` |
| **Script Dir** | `$(dirname "$0")` | `$PSScriptRoot` |
| **Join Paths** | `"$DIR/file"` | `Join-Path $Dir "file"` |
| **Check File** | `[ -f "$FILE" ]` | `Test-Path -LiteralPath $File` |
| **Check Dir** | `[ -d "$DIR" ]` | `Test-Path -LiteralPath $Dir` |
| **Read File** | `cat "$FILE"` | `Get-Content -LiteralPath $File` |
| **Remove Item** | `rm -rf "$PATH"` | `Remove-Item -LiteralPath $Path -Recurse -Force` |

## 3. Automation Patterns (The "Lessons Learned")

### Native Command Error Handling
Unlike bash, PowerShell's `try/catch` does not catch non-zero exit codes from native tools like `git` or `npm`.
```powershell
gh issue list
if ($LASTEXITCODE -ne 0) {
    Write-Error "GH CLI failed with code $LASTEXITCODE" -ErrorAction Stop
}
```

### Array Coercion
Always wrap potential list-returning commands in `@()` to ensure `.Count` works even for a single result.
```powershell
$Issues = @(gh issue list --json number)
Write-Host "Found $($Issues.Count) issues."
```

### Background Jobs
Use `Start-Job` with `-WorkingDirectory` or explicit `Set-Location` inside the block.
```powershell
Start-Job -ScriptBlock {
    param($Path)
    Set-Location -LiteralPath $Path
    # Logic
    return $LASTEXITCODE
} -ArgumentList $PWD.Path
```

### Null Guards in Strict Mode
Always check if a variable exists before calling methods on it.
```powershell
$Result = if ($Raw) { $Raw.Trim() } else { $null }
```

---

*🤖 Crafted with precision by ✨Copilot following brilliant human instruction, then carefully refined by our team of discerning human reviewers.*
