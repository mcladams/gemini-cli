/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Command,
  CommandContext,
  CommandExecutionResponse,
} from './types.js';
export declare class InitCommand implements Command {
  name: string;
  description: string;
  requiresWorkspace: boolean;
  execute(
    context: CommandContext,
    _args?: string[],
  ): Promise<CommandExecutionResponse>;
}
