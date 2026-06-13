/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export declare function startServer(
  binaryPath: string,
  port: number,
): Promise<boolean>;
export declare const startCommand: CommandModule;
