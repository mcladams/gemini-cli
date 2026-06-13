/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ConcreteNode } from './graph/types.js';
export interface ProcessorResultEvent {
  processorId: string;
  targets: readonly ConcreteNode[];
  returnedNodes: readonly ConcreteNode[];
}
export interface PristineHistoryUpdatedEvent {
  nodes: readonly ConcreteNode[];
  newNodes: Set<string>;
}
export interface ContextConsolidationEvent {
  nodes: readonly ConcreteNode[];
  targetDeficit: number;
  targetNodeIds: Set<string>;
}
export interface ChunkReceivedEvent {
  nodes: readonly ConcreteNode[];
  targetNodeIds: Set<string>;
}
export declare class ContextEventBus extends EventEmitter {
  emitPristineHistoryUpdated(event: PristineHistoryUpdatedEvent): void;
  onPristineHistoryUpdated(
    listener: (event: PristineHistoryUpdatedEvent) => void,
  ): void;
  emitChunkReceived(event: ChunkReceivedEvent): void;
  onChunkReceived(listener: (event: ChunkReceivedEvent) => void): void;
  emitConsolidationNeeded(event: ContextConsolidationEvent): void;
  onConsolidationNeeded(
    listener: (event: ContextConsolidationEvent) => void,
  ): void;
  emitProcessorResult(event: ProcessorResultEvent): void;
  onProcessorResult(listener: (event: ProcessorResultEvent) => void): void;
}
