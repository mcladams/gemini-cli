/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum TrustLevel {
  TRUST_FOLDER = 'TRUST_FOLDER',
  TRUST_PARENT = 'TRUST_PARENT',
  DO_NOT_TRUST = 'DO_NOT_TRUST',
}
export interface TrustResult {
  isTrusted: boolean | undefined;
  source: 'ide' | 'file' | 'env' | undefined;
}
export interface TrustOptions {
  path: string;
  isFolderTrustEnabled: boolean;
  isHeadless?: boolean;
}
export declare function isTrustLevel(value: unknown): value is TrustLevel;
/**
 * Checks if a path is trusted based on headless mode, folder trust settings,
 * IDE context, and local configuration file.
 */
export declare function checkPathTrust(options: TrustOptions): TrustResult;
export interface TrustRule {
  path: string;
  trustLevel: TrustLevel;
}
export interface TrustedFoldersError {
  message: string;
  path: string;
}
export interface TrustedFoldersFile {
  config: Record<string, TrustLevel>;
  path: string;
}
/**
 * FOR TESTING PURPOSES ONLY.
 * Clears the real path cache.
 */
export declare function clearRealPathCacheForTesting(): void;
export declare class LoadedTrustedFolders {
  readonly user: TrustedFoldersFile;
  readonly errors: TrustedFoldersError[];
  constructor(user: TrustedFoldersFile, errors: TrustedFoldersError[]);
  get rules(): TrustRule[];
  /**
   * Returns true or false if the path should be "trusted" based on the configuration.
   *
   * @param location path
   * @param config optional config override
   * @returns boolean if trusted/distrusted, undefined if no rule matches
   */
  isPathTrusted(
    location: string,
    config?: Record<string, TrustLevel>,
  ): boolean | undefined;
  setValue(folderPath: string, trustLevel: TrustLevel): Promise<void>;
}
/**
 * FOR TESTING PURPOSES ONLY.
 * Resets the in-memory cache of the trusted folders configuration.
 */
export declare function resetTrustedFoldersForTesting(): void;
export declare function loadTrustedFolders(): LoadedTrustedFolders;
export declare function saveTrustedFolders(
  trustedFoldersFile: TrustedFoldersFile,
): void;
