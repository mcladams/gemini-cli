/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  AsyncPipelineDef,
  ContextManagementConfig,
  PipelineDef,
} from './types.js';
import type { ContextEnvironment } from '../pipeline/environment.js';
export interface ContextProfile {
  name: string;
  config: ContextManagementConfig;
  buildPipelines: (
    env: ContextEnvironment,
    config?: ContextManagementConfig,
  ) => PipelineDef[];
  buildAsyncPipelines: (
    env: ContextEnvironment,
    config?: ContextManagementConfig,
  ) => AsyncPipelineDef[];
  sentinels?: {
    continuation?: string;
    lostToolResponse?: string;
  };
}
/**
 * The standard default context management profile.
 * Optimized for safety, precision, and reliable summarization.
 */
export declare const generalistProfile: ContextProfile;
/**
 * A highly aggressive profile designed exclusively for testing Context Management.
 * Lowers token limits dramatically to force garbage collection and distillation loops
 * within a few conversational turns.
 */
export declare const stressTestProfile: ContextProfile;
