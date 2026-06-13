/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { AgentChatHistory } from '../core/agentChatHistory.js';
import { type ConcreteNode } from './graph/types.js';
import type { ContextTracer } from './tracer.js';
import type { ContextEnvironment } from './pipeline/environment.js';
import type { ContextProfile } from './config/profiles.js';
import type { PipelineOrchestrator } from './pipeline/orchestrator.js';
export declare class ContextManager {
  private readonly sidecar;
  private readonly env;
  private readonly tracer;
  private readonly headerProvider?;
  private buffer;
  private readonly eventBus;
  private readonly orchestrator;
  private readonly historyObserver;
  private lastRenderCache?;
  constructor(
    sidecar: ContextProfile,
    env: ContextEnvironment,
    tracer: ContextTracer,
    orchestrator: PipelineOrchestrator,
    chatHistory: AgentChatHistory,
    headerProvider?: (() => Promise<Content | undefined>) | undefined,
  );
  /**
   * Returns a promise that resolves when all currently executing async pipelines have finished.
   */
  waitForPipelines(): Promise<void>;
  /**
   * Safely stops background async pipelines and clears event listeners.
   */
  shutdown(): void;
  /**
   * Evaluates if the current working buffer exceeds configured budget thresholds,
   * firing consolidation events if necessary.
   */
  private evaluateTriggers;
  /**
   * Identifies 'pinned' nodes that should not be truncated.
   * This includes:
   * 1. The entire last turn (Recent context).
   * 2. Active tool calls (calls without responses in the graph).
   */
  private getProtectedNodeIds;
  /**
   * Retrieves the raw, uncompressed Episodic Context Graph graph.
   * Useful for internal tool rendering (like the trace viewer).
   * Note: This is an expensive, deep clone operation.
   */
  getPristineGraph(): readonly ConcreteNode[];
  /**
   * Generates a virtual view of the pristine graph, substituting in variants
   * up to the configured token budget.
   * This is the view that will eventually be projected back to the LLM.
   */
  getNodes(): readonly ConcreteNode[];
  /**
   * Executes the final 'gc_backstop' pipeline if necessary, enforcing the token budget,
   * and maps the Episodic Context Graph back into a raw Gemini Content[] array for transmission.
   * This is the primary method called by the agent framework before sending a request.
   */
  renderHistory(
    pendingRequest?: Content,
    activeTaskIds?: Set<string>,
  ): Promise<{
    history: Content[];
    didApplyManagement: boolean;
  }>;
}
