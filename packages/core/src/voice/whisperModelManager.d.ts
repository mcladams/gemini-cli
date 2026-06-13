/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export interface WhisperModelProgress {
  modelName: string;
  transferred: number;
  total: number;
  percentage: number;
}
export interface WhisperModelManagerEvents {
  progress: [WhisperModelProgress];
}
/**
 * Manages Whisper models (checking existence, downloading).
 */
export declare class WhisperModelManager extends EventEmitter<WhisperModelManagerEvents> {
  private readonly modelsDir;
  constructor();
  isModelInstalled(modelName: string): boolean;
  getModelPath(modelName: string): string;
  downloadModel(modelName: string): Promise<void>;
  private validateModelName;
}
