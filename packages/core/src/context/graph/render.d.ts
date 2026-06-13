/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { ConcreteNode } from './types.js';
import type { ContextTracer } from '../tracer.js';
import type { ContextProfile } from '../config/profiles.js';
import type { PipelineOrchestrator } from '../pipeline/orchestrator.js';
import type { ContextEnvironment } from '../pipeline/environment.js';
/**
 * Maps the Episodic Context Graph back into a raw Gemini Content[] array for transmission.
 * It applies synchronous context management (GC backstop) if the budget is exceeded.
 */
export declare function render(
  nodes: readonly ConcreteNode[],
  orchestrator: PipelineOrchestrator,
  sidecar: ContextProfile,
  tracer: ContextTracer,
  env: ContextEnvironment,
  protectionReasons?: Map<string, string>,
  headerTokens?: number,
): Promise<{
  history: Content[];
  didApplyManagement: boolean;
}>;
