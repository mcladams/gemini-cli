/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export declare function readLastLines(
  filePath: string,
  count: number,
): Promise<string>;
interface LogsArgs {
  lines?: number;
  follow?: boolean;
}
export declare const logsCommand: CommandModule<object, LogsArgs>;
export {};
