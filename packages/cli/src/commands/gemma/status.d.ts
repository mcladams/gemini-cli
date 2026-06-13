/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export interface GemmaStatusResult {
  binaryInstalled: boolean;
  binaryPath: string | null;
  modelDownloaded: boolean;
  serverRunning: boolean;
  serverPid: number | null;
  settingsEnabled: boolean;
  port: number;
  allPassing: boolean;
}
export declare function checkGemmaStatus(
  port?: number,
): Promise<GemmaStatusResult>;
export declare function formatGemmaStatus(status: GemmaStatusResult): string;
export declare const statusCommand: CommandModule;
