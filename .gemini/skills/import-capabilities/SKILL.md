---
name: import-capabilities
description: 'Autonomous capability importer for Gemini CLI and Antigravity 2.0. Ingests Git repositories or local directories to detect, translate, and install agent capabilities (Skills, Rules, Workflows, etc.).'
user-invocable: true
disable-model-invocation: false
---

# Agent Capabilities Importer

This skill enables the autonomous ingestion and translation of agent-related capabilities from external sources into your Gemini CLI or Antigravity environment.

## Overview

The importer crawls source directories to identify:
- **Skills**: `SKILL.md` or equivalent specs.
- **Rules**: `GEMINI.md`, `AGENTS.md`.
- **Workflows**: Repeatable execution sequences.
- **MCP Servers**: Configurations in `mcp_config.json`.
- **Hooks**: Lifecycle handlers in `hooks.json`.

## Usage

Invoke the importer via the slash command:

```bash
/import-capabilities <source-url-or-path> [--global] [--local] [--plugin] [--workspace]
```

### Options

| Option | Description |
| :--- | :--- |
| `--local` | Install to the current gemini-cli workspace (`.gemini/skills/`). |
| `--workspace` | Install to the Antigravity workspace level (`.agents/`). |
| `--global` | Install to the user's global Antigravity config (`~/.gemini/config/`). |
| `--plugin` | Package as a namespaced plugin. |

## Safety

Before importing scripts, MCP configurations, or hooks, the tool will display a list of files to be written. Review these carefully to prevent arbitrary code execution.

## Implementation Details

The underlying tool is implemented in TypeScript and located at `tools/gemini-skill-importer/`. It uses `simple-git` for ingestion and `fdir` for rapid crawling.

---

*🤖 Crafted with precision by ✨Copilot following brilliant human instruction, then carefully refined by our team of discerning human reviewers.*
