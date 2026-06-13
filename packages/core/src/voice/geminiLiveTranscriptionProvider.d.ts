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
/**
 * Connects to the Gemini Live API using raw WebSockets to support API Key authentication.
 */
export declare class GeminiLiveTranscriptionProvider
  extends EventEmitter<TranscriptionEvents>
  implements TranscriptionProvider
{
  private readonly apiKey;
  private ws;
  private currentTranscription;
  constructor(apiKey: string);
  connect(): Promise<void>;
  sendAudioChunk(chunk: Buffer): void;
  getTranscription(): string;
  disconnect(): void;
}
