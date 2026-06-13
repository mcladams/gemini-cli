# Implementation Plan: Agentic Skill Importer for Antigravity

This plan outlines the design and development of an automated, agentic skill and
extension importer for Antigravity. It enables the seamless extraction,
translation, and global installation of third-party `SKILL.md` packages,
`AGENT.md` snippets, and other unstructured prompts (such as those from Claude
Code or older Gemini CLI ecosystems) into the Antigravity environment.

## User Review Required

> [!IMPORTANT]
>
> - The utility will write imported skills directly into the user's global
>   configuration directory: `C:\Users\Mike\.gemini\config\skills/` and plugins
>   directory: `C:\Users\Mike\.gemini\config\plugins/`.
> - Because third-party repositories might contain scripts or MCP
>   configurations, we will prompt or display a warning before executing/copying
>   scripts to maintain safety.
> - We will create a local development directory at
>   `C:\Users\Mike\.gemini\antigravity\scratch\skill-importer`. You should open
>   this subdirectory as your active workspace to review/test the source code.

## Proposed Architecture

We will implement this as a hybrid solution:

1. **Underlying CLI/Script Utility (`skill-importer`)**: A Node.js
   TypeScript/JavaScript script located in
   `C:\Users\Mike\.gemini\antigravity\scratch\skill-importer`. This utility
   clones git repos, scans for files, parses frontmatter, wraps loose
   instructions in a proper `SKILL.md` schema, and copies assets to the global
   directories.
2. **Global Antigravity Skill (`import-skill`)**: A skill manifest (`SKILL.md`)
   placed at `C:\Users\Mike\.gemini\config\skills\import-skill\SKILL.md` that
   teaches the Antigravity agent how to use the CLI utility. The agent can
   invoke this skill autonomously when you request to "install skills from
   github URL".
3. **Agentic Refactoring**: When unstructured or loose prompt files (like an
   `AGENT.md` or a general guide) are found, the agent will rewrite them into a
   structured `SKILL.md` format (including YAML frontmatter with `name`,
   `description`, `version`) before global installation.

---

## Proposed Changes

### Component 1: CLI Utility (`C:\Users\Mike\.gemini\antigravity\scratch\skill-importer`)

We will scaffold a Node.js project.

#### [NEW] [package.json](file:///C:/Users/Mike/.gemini/antigravity/scratch/skill-importer/package.json)

Configures dependencies (e.g., `js-yaml` for frontmatter parsing, `simple-git`
or shell execution for cloning, and path utils).

#### [NEW] [index.js](file:///C:/Users/Mike/.gemini/antigravity/scratch/skill-importer/index.js)

The main entry point for the importer. It supports:

- Cloning/copying from git repository or local path.
- Scanning recursively for `SKILL.md`, `*.skill.md`, `AGENT.md`, or general
  `.md` instruction files.
- Parsing YAML frontmatter.
- Creating the output structures in the global directories.

---

### Component 2: Global Skill Config (`C:\Users\Mike\.gemini\config`)

#### [NEW] [SKILL.md](file:///C:/Users/Mike/.gemini/config/skills/import-skill/SKILL.md)

The instruction file defining the skill. It describes:

- What the skill is for (importing other skills/extensions).
- The exact commands the agent should run to execute the importer script.
- How the agent should refactor loose markdown instructions into standard
  `SKILL.md` templates when importing.

---

## Verification Plan

### Automated/CLI Tests

1. Verify cloning and scanning a repository with existing `SKILL.md` files (e.g.
   standard skills repository).
2. Verify cloning and scanning a repository with missing manifests (e.g.,
   standard Claude Code or generic prompts repo) and showing how the tool
   recovers.
3. Run `agy inspect` or equivalent commands to verify that skills/plugins are
   successfully registered globally.

### Manual Verification

- Ask the user to run the import command for
  `https://github.com/mattpocock/skills` or another repository to demonstrate
  end-to-end functionality.
