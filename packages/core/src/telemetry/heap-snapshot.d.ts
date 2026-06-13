/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Utility to capture a V8 heap snapshot.
 * Snapshots are saved to a secure, uniquely named temporary directory.
 *
 * @returns The absolute path to the generated .heapsnapshot file, or null if it failed.
 */
export declare function captureHeapSnapshot(): string | null;
