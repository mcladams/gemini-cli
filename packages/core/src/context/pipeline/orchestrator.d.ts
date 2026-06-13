/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ConcreteNode } from '../graph/types.js';
import type {
  AsyncPipelineDef,
  PipelineDef,
  PipelineTrigger,
} from '../config/types.js';
import type {
  ContextEnvironment,
  ContextEventBus,
  ContextTracer,
} from './environment.js';
export declare class PipelineOrchestrator {
  private readonly pipelines;
  private readonly asyncPipelines;
  private readonly env;
  private readonly eventBus;
  private readonly tracer;
  private activeTimers;
  private readonly pendingPipelines;
  private readonly pipelineMutex;
  private nodeProvider;
  constructor(
    pipelines: PipelineDef[],
    asyncPipelines: AsyncPipelineDef[],
    env: ContextEnvironment,
    eventBus: ContextEventBus,
    tracer: ContextTracer,
  );
  /**
   * Sets the provider for the latest live nodes.
   * This is used by sequential pipeline runs to ensure they operate on current state.
   */
  setNodeProvider(provider: () => readonly ConcreteNode[]): void;
  /**
   * Returns a promise that resolves when all currently executing async pipelines have finished.
   * This acts as a 'Pressure Barrier' for the ContextManager.
   */
  waitForPipelines(): Promise<void>;
  private isNodeAllowed;
  private setupTriggers;
  shutdown(): void;
  executeTriggerSync(
    trigger: PipelineTrigger,
    nodes: readonly ConcreteNode[],
    triggerTargets: ReadonlySet<string>,
    protectedTurnIds?: ReadonlySet<string>,
  ): Promise<readonly ConcreteNode[]>;
  private executePipelineAsync;
}
