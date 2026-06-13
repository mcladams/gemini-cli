# Session State: kali-gemini-cli / core

**Date:** 2026-06-12 **Last Focus:** Repository health and capabilities audit
via antigravity-ide agent.

## Critical Technical Debt & Security Actions

1.  **[HIGH PRIORITY - SECURITY] Fix CSWSH in DevTools WebSocket Server**
    - **File:** `packages/devtools/src/index.ts`
    - **Context:** WebSocket server intercepts upgrades without validating the
      `Origin` header, exposing terminal data to malicious web pages.
    - **Action:** Implement the `verifyClient` hook in the `WebSocketServer`
      constructor to explicitly enforce `127.0.0.1` origins.
2.  **[MEDIUM] Clean Dead Code in CoderAgentExecutor**
    - **File:** `packages/a2a-server/src/agent/executor.ts`
    - **Context:** Redundant early-return logic makes the `!isPrimaryExecution`
      block unreachable. Strip it out.
3.  **[LOW] Refactor MCP Authentication Header Extraction**
    - **File:** `packages/core/src/tools/mcp-client.ts`
    - **Context:** Brittle regex matching on raw error strings. Convert to a
      structured headers fetch approach
      (`response.headers.get('www-authenticate')`).
4.  **[LOW] Fix Blocking Sleep Loops in MCP Discovery**
    - **File:** `packages/core/src/tools/mcp-client.ts`
    - **Context:** Hardcoded 500ms sleep ignores the task's `AbortSignal`. Bind
      the timer to `abortController.signal` to handle abrupt user cancellations
      cleanly.

## Next Immediate Steps

- Apply the `verifyClient` security patch first before initializing further
  automated testing.
