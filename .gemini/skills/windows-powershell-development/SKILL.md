---
name: powershell-windows
description: "PowerShell Windows patterns. Critical pitfalls, operator syntax, error handling."
risk: unknown
source: community
date_added: "2026-02-27"
---

# PowerShell Windows Patterns

> Critical patterns and pitfalls for Windows PowerShell.

---

## 0. STANDARDS

# PowerShell Engineering Standards

When writing, modifying, or refactoring PowerShell code in this repository, strictly adhere to the following:

- **Target Engine:** Assume Microsoft PowerShell 7.5+ (`pwsh.exe`) for all new code. Fallback logic for Windows PowerShell 5.1 (`powershell.exe`) must be explicitly scoped using `$PSVersionTable`.
- **Pathing:** Never hardcode absolute paths like `C:\Users\Mike`. Always use `$HOME` or `$env:USERPROFILE`. Rely on `$PSScriptRoot` for relative execution within the repository.
- **Information Density:** Write clean, Google-standard code. Use concise, targeted comments. Comment only to explain *why* a non-obvious engineering decision was made (e.g., bypassing a specific Windows API limit), never *what* the code is doing.
- **CLI Exclusivity:** Never use GUI popups (`Out-GridView`, `MsgBox`). All inputs and outputs must be standard streams (`Write-Output`, `Write-Warning`, `Write-Error`).
- **Modularity:** Scripts in `psprofile.d/` must contain *only* function definitions, aliases, and environment variables. They must not execute state-changing actions upon dot-sourcing.
- **Execution:** Do not use `Write-Host` for data pipelines. Use strict typing (`[string]`, `[int]`, `[switch]`) for all function parameters. Prefer `Get-CimInstance` over deprecated `Get-WmiObject`.


---

## 1. Operator Syntax Rules

### CRITICAL: Parentheses Required

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `if (Test-Path "a" -or Test-Path "b")` | `if ((Test-Path "a") -or (Test-Path "b"))` |
| `if (Get-Item $x -and $y -eq 5)` | `if ((Get-Item $x) -and ($y -eq 5))` |

**Rule:** Each cmdlet call MUST be in parentheses when using logical operators.

---

## 2. Unicode/Emoji Restriction

### CRITICAL: No Unicode in Scripts

| Purpose | ❌ Don't Use | ✅ Use |
|---------|-------------|--------|
| Success | ✅ ✓ | [OK] [+] |
| Error | ❌ ✗ 🔴 | [!] [X] |
| Warning | ⚠️ 🟡 | [*] [WARN] |
| Info | ℹ️ 🔵 | [i] [INFO] |
| Progress | ⏳ | [...] |

**Rule:** Use ASCII characters only in PowerShell scripts.

---

## 3. Null Check Patterns

### Always Check Before Access

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `$array.Count -gt 0` | `$array -and $array.Count -gt 0` |
| `$text.Length` | `if ($text) { $text.Length }` |

---

## 4. String Interpolation

### Complex Expressions

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `"Value: $($obj.prop.sub)"` | Store in variable first |

**Pattern:**
```
$value = $obj.prop.sub
Write-Output "Value: $value"
```

---

## 5. Error Handling

### ErrorActionPreference

| Value | Use |
|-------|-----|
| Stop | Development (fail fast) |
| Continue | Production scripts |
| SilentlyContinue | When errors expected |

### Try/Catch Pattern

- Don't return inside try block
- Use finally for cleanup
- Return after try/catch

---

## 6. File Paths

### Windows Path Rules

| Pattern | Use |
|---------|-----|
| Literal path | `C:\Users\User\file.txt` |
| Variable path | `Join-Path $env:USERPROFILE "file.txt"` |
| Relative | `Join-Path $ScriptDir "data"` |

**Rule:** Use Join-Path for cross-platform safety.

---

## 7. Array Operations

### Correct Patterns

| Operation | Syntax |
|-----------|--------|
| Empty array | `$array = @()` |
| Add item | `$array += $item` |
| ArrayList add | `$list.Add($item) | Out-Null` |

---

## 8. JSON Operations

### CRITICAL: Depth Parameter

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `ConvertTo-Json` | `ConvertTo-Json -Depth 10` |

**Rule:** Always specify `-Depth` for nested objects.

### File Operations

| Operation | Pattern |
|-----------|---------|
| Read | `Get-Content "file.json" -Raw | ConvertFrom-Json` |
| Write | `$data | ConvertTo-Json -Depth 10 | Out-File "file.json" -Encoding UTF8` |

---

## 9. Common Errors

| Error Message | Cause | Fix |
|---------------|-------|-----|
| "parameter 'or'" | Missing parentheses | Wrap cmdlets in () |
| "Unexpected token" | Unicode character | Use ASCII only |
| "Cannot find property" | Null object | Check null first |
| "Cannot convert" | Type mismatch | Use .ToString() |

---

## 10. Script Template

```powershell
# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Main
try {
    # Logic here
    Write-Output "[OK] Done"
    exit 0
}
catch {
    Write-Warning "Error: $_"
    exit 1
}
```

---

> **Remember:** PowerShell has unique syntax rules. Parentheses, ASCII-only, and null checks are non-negotiable.

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
