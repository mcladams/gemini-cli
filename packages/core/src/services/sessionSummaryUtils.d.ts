/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
/**
 * Finds the most recently updated previous session that still needs workflow metadata.
 * Returns the path if it needs a scratchpad, null otherwise.
 */
export declare function getPreviousSession(
  config: Config,
): Promise<string | null>;
/**
 * Generates summary metadata for the previous session if it lacks a scratchpad.
 * This is designed to be called fire-and-forget on startup.
 */
export declare function generateSummary(config: Config): Promise<void>;
