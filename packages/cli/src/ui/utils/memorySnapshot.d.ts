/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * RSS threshold at which `/bug` auto-captures a heap snapshot.
 */
export declare const MEMORY_SNAPSHOT_AUTO_THRESHOLD_BYTES: number;
/**
 * Capture a V8 heap snapshot from the current process and write it to disk.
 *
 * `v8.getHeapSnapshot()` returns a Readable stream whose producer is V8's
 * internal snapshot generator. Piping it through `node:stream/promises`'
 * `pipeline` propagates backpressure end-to-end, so even a multi-gigabyte
 * heap is written without buffering the serialized snapshot in memory.
 * Nothing is exposed over a debugger port.
 */
export declare function captureHeapSnapshot(filePath: string): Promise<void>;
