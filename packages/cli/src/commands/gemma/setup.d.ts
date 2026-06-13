/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export declare function computeFileSha256(filePath: string): Promise<string>;
export declare function verifyFileSha256(
  filePath: string,
  expectedHash: string,
): Promise<boolean>;
export declare const setupCommand: CommandModule;
