/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export interface AudioRecorderEvents {
  data: [Buffer];
  start: [];
  stop: [];
  error: [Error];
}
/**
 * Captures audio from the microphone using `sox` (`rec`).
 * Emits 16kHz, 16-bit, mono PCM chunks.
 */
export declare class AudioRecorder extends EventEmitter<AudioRecorderEvents> {
  private recProcess;
  private isRecordingInternal;
  get isRecording(): boolean;
  /**
   * Checks if `rec` (sox) is available on the system.
   */
  static isAvailable(): Promise<boolean>;
  start(): Promise<void>;
  stop(): void;
}
