/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface PlatformInfo {
  key: string;
  binaryName: string;
}
export interface GemmaConfigStatus {
  settingsEnabled: boolean;
  configuredPort: number;
  configuredBinaryPath?: string;
}
export interface LiteRtServerProcessInfo {
  pid: number;
  binaryPath?: string;
  port?: number;
}
export declare function resolveGemmaConfig(
  fallbackPort: number,
): GemmaConfigStatus;
export declare function detectPlatform(): PlatformInfo | null;
export declare function getBinaryPath(binaryName?: string): string | null;
export declare function getBinaryDownloadUrl(binaryName: string): string;
export declare function isBinaryInstalled(binaryPath?: string | null): boolean;
export declare function isModelDownloaded(binaryPath: string): boolean;
export declare function isServerRunning(port: number): Promise<boolean>;
export declare function readServerProcessInfo(): LiteRtServerProcessInfo | null;
export declare function writeServerProcessInfo(
  processInfo: LiteRtServerProcessInfo,
): void;
export declare function readServerPid(): number | null;
export declare function isExpectedLiteRtServerCommand(
  commandLine: string,
  options: {
    binaryPath?: string | null;
    port?: number;
  },
): boolean;
export declare function isExpectedLiteRtServerProcess(
  pid: number,
  options: {
    binaryPath?: string | null;
    port?: number;
  },
): boolean;
export declare function isProcessRunning(pid: number): boolean;
