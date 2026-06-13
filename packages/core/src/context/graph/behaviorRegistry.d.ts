/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part } from '@google/genai';
import type { ConcreteNode, NodeType } from './types.js';
export interface NodeBehavior<T extends ConcreteNode = ConcreteNode> {
  readonly type: NodeType;
  /**
   * Generates a structural representation of the node for the purpose
   * of estimating its token cost.
   */
  getEstimatableParts(node: T): Part[];
}
export declare class NodeBehaviorRegistry {
  private readonly behaviors;
  register<T extends ConcreteNode>(behavior: NodeBehavior<T>): void;
  get(type: NodeType): NodeBehavior<ConcreteNode>;
}
