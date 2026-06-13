/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@google/gemini-cli-core';
import type { LoadedSettings } from '../config/settings.js';
import type { CliArgs } from '../config/config.js';
export declare function runAcpClient(
  config: Config,
  settings: LoadedSettings,
  argv: CliArgs,
): Promise<void>;
