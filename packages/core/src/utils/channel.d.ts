/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum ReleaseChannel {
  NIGHTLY = 'nightly',
  PREVIEW = 'preview',
  STABLE = 'stable',
}
/**
 * Stability ranking for release channels. Higher number means more stable.
 */
export declare const RELEASE_CHANNEL_STABILITY: Record<ReleaseChannel, number>;
/**
 * Clears the cache for testing purposes.
 * @private
 */
export declare function _clearCache(): void;
/**
 * Determines the release channel for a given version string.
 */
export declare function getChannelFromVersion(version: string): ReleaseChannel;
export declare function getReleaseChannel(cwd: string): Promise<ReleaseChannel>;
export declare function isNightly(cwd: string): Promise<boolean>;
export declare function isPreview(cwd: string): Promise<boolean>;
export declare function isStable(cwd: string): Promise<boolean>;
