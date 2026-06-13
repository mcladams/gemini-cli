---
name: sh-to-ps1-scripts
description: 'Guidelines and best practices for migrating legacy Linux bash/sh shell scripts into idiomatic, native Windows PowerShell (.ps1) scripts targeting PowerShell 7.5+ - Brought to you by microsoft/hve-core'
user-invocable: true
disable-model-invocation: false
compatibility: 'Requires PowerShell 7.5+'
---

# Shell to PowerShell Migration Skill

This skill provides comprehensive instructions, best practices, and translation mappings for converting legacy Linux shell scripts (`.sh`) into modern, idiomatic Windows PowerShell (`.ps1`) scripts.

## Overview

Migration from bash/sh to PowerShell requires more than just syntax replacement; it involves a shift from text-stream processing to object-oriented pipelines. This skill ensures that migrated scripts are performant, maintainable, and robust on the Windows platform.

## Prerequisites

- **Target Engine**: Microsoft PowerShell 7.5+ (`pwsh.exe`) is the default target.
- **Tools**: GitHub CLI (`gh`), Git, and standard build tools (npm, etc.) should be in your PATH.

## Quick Start

When asked to migrate a script:
1.  Analyze the source `.sh` script for core logic and dependencies.
2.  Reference [references/REFERENCE.md](references/REFERENCE.md) for bash-to-PowerShell translation rules.
3.  Apply the "Lessons Learned" patterns for robustness (e.g., `$LASTEXITCODE`, `-LiteralPath`).
4.  Verify against [examples/README.md](examples/README.md) for before/after patterns.

## Translation Guidelines

See [references/REFERENCE.md](references/REFERENCE.md) for detailed technical mappings.

## Troubleshooting

### Directive Syntax Error
Ensure you use lowercase `#requires -version 7.5` without a space after the `#`.

### Native Command Failures
Native executables (git, npm) do not throw PowerShell exceptions. Always check `$LASTEXITCODE`.

### Bracket Path Failures
Use `-LiteralPath` instead of `-Path` if filenames contain `[` or `]`.

---

*🤖 Crafted with precision by ✨Copilot following brilliant human instruction, then carefully refined by our team of discerning human reviewers.*
