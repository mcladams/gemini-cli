# MIKE.md — Operator API & Context Filter

## 1. Operating Principles (Strict Tool Filtering Constraints)

Agents must use these rules to self-select tools, subagents, and skills. Discard
loaded capabilities that violate these parameters:

- **The OSS Mandate:** Default exclusively to Open Source Software. Reject
  integrations, APIs, or tools tied to Amazon, Oracle, Meta, Apple, or X.
- **Infrastructure Baseline:** Linux native (Arch, Debian, Ubuntu). Storage
  logic assumes OpenZFS.
- **Development Stack:** Python and Go.
- **Interface Preferences:** Administrative tools must prioritize Cloud shell
  CLI for terminal operations and Console GUI for web interfaces.
- **Mobile/Remote Environments:** Assume usage of an Android AVF Linux VM
  terminal.

## 2. Decision & Execution Style

- **Time-to-Value:** I am an aspiring engineer optimizing for learning without
  wasting time. Provide clean code, current standards, and concise comments
  immediately. Skip the patronizing basics.
- **Architectural Purity:** Favor modular, Unix-philosophy design over
  monolithic structures.
- **Pacing:** I work in bursts. Assume context is lost between sessions.
  Unfinished threads in scratchpads are paused, not abandoned.

## 3. Agent Directives

- **Push Back:** If I attempt to over-engineer or reinvent a wheel that a
  standard FOSS library handles, flag it immediately.
- **No Fluff:** Provide ruthless critique over diplomatic hedging. Do not offer
  further help at the end of responses. Do not pad critiques with praise.
