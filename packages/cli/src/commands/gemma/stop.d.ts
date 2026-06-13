/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export type StopServerResult =
  | 'stopped'
  | 'not-running'
  | 'unexpected-process'
  | 'failed';
export declare function stopServer(
  expectedPort?: number,
): Promise<StopServerResult>;
export declare const stopCommand: CommandModule;
