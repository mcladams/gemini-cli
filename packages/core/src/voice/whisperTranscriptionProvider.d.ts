/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type {
  TranscriptionProvider,
  TranscriptionEvents,
} from './transcriptionProvider.js';
export interface WhisperProviderOptions {
  modelPath: string;
  threads?: number;
  step?: number;
  length?: number;
}
/**
 * Local transcription provider using `whisper-stream` from whisper.cpp.
 *
 * Uses the Sliding Window Mode with VAD (--step 0) for stable,
 * non-overlapping transcription blocks that can be appended directly.
 */
export declare class WhisperTranscriptionProvider
  extends EventEmitter<TranscriptionEvents>
  implements TranscriptionProvider
{
  private readonly options;
  private process;
  private currentTranscription;
  constructor(options: WhisperProviderOptions);
  /**
   * Checks if `whisper-stream` is available on the system.
   */
  static isAvailable(): Promise<boolean>;
  connect(): Promise<void>;
  private parseOutput;
  sendAudioChunk(_chunk: Buffer): void;
  getTranscription(): string;
  disconnect(): void;
}
