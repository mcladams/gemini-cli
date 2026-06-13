/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ResumedSessionData } from '@google/gemini-cli-core';
import type { LoadedSettings } from './config/settings.js';
interface RunNonInteractiveParams {
  config: Config;
  settings: LoadedSettings;
  input: string;
  prompt_id: string;
  resumedSessionData?: ResumedSessionData;
}
/**
 * Runs the non-interactive CLI loop.
 *
 * Programmatic output formats (JSON, STREAM_JSON) use lenient sanitization
 * by stripping ANSI escape sequences from messages to ensure clean,
 * parseable output for downstream consumers.
 */
export declare function runNonInteractive(
  params: RunNonInteractiveParams,
): Promise<void>;
export {};
