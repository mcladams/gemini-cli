/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type HeadlessModeOptions,
  type LoadedTrustedFolders,
} from '@google/gemini-cli-core';
import type { Settings } from './settings.js';
export {
  TrustLevel,
  isTrustLevel,
  resetTrustedFoldersForTesting,
  saveTrustedFolders,
} from '@google/gemini-cli-core';
export type {
  TrustRule,
  TrustedFoldersError,
  TrustedFoldersFile,
  TrustResult,
  LoadedTrustedFolders,
} from '@google/gemini-cli-core';
/** Is folder trust feature enabled per the current applied settings */
export declare function isFolderTrustEnabled(settings: Settings): boolean;
export declare function loadTrustedFolders(): LoadedTrustedFolders;
/**
 * Returns true or false if the workspace is considered "trusted".
 */
export declare function isWorkspaceTrusted(
  settings: Settings,
  workspaceDir?: string,
  headlessOptions?: HeadlessModeOptions,
): {
  isTrusted: boolean | undefined;
  source: 'ide' | 'file' | 'env' | undefined;
};
