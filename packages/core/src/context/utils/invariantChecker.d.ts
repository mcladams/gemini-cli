/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ConcreteNode } from '../graph/types.js';
/**
 * Validates structural and logical invariants of the Episodic Context Graph.
 * Primarily used in debug mode to identify "smelly" states before they reach the LLM.
 */
export declare function checkContextInvariants(
  nodes: readonly ConcreteNode[],
  context: string,
): void;
