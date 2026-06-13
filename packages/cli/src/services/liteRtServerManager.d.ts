/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GemmaModelRouterSettings } from '@google/gemini-cli-core';
export declare class LiteRtServerManager {
  static ensureRunning(
    gemmaSettings: GemmaModelRouterSettings | undefined,
  ): Promise<void>;
}
