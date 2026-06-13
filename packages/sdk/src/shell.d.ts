/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config as CoreConfig } from '@google/gemini-cli-core';
import type {
  AgentShell,
  AgentShellResult,
  AgentShellOptions,
} from './types.js';
/**
 * SDK implementation of {@link AgentShell} that executes commands via the
 * core ShellExecutionService, subject to the agent's security policies.
 *
 * Commands that require interactive confirmation will be rejected since
 * no interactive session is available in headless SDK mode.
 *
 * @remarks In this implementation, stderr is combined into stdout by the
 * underlying ShellExecutionService. As a result, the stderr field of the
 * returned {@link AgentShellResult} will be empty, and both output and
 * stdout will contain the combined output.
 */
export declare class SdkAgentShell implements AgentShell {
  private readonly config;
  constructor(config: CoreConfig);
  exec(command: string, options?: AgentShellOptions): Promise<AgentShellResult>;
}
