/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TranscriptionProvider } from './transcriptionProvider.js';
export declare class TranscriptionFactory {
  static createProvider(
    voiceConfig:
      | {
          backend?: string;
          whisperModel?: string;
        }
      | undefined,
    apiKey: string,
  ): TranscriptionProvider;
}
