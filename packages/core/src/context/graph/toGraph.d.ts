/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import { type ConcreteNode } from './types.js';
/**
 * Generates a stable ID for an object reference using a WeakMap.
 * Falls back to content-based hashing for Part-like objects to ensure
 * stability across object re-creations (e.g. during history mapping).
 */
export declare function getStableId(
  obj: object,
  nodeIdentityMap: WeakMap<object, string>,
  turnSalt?: string,
  partIdx?: number,
): string;
/**
 * Builds a 1:1 Mirror Graph from Chat History.
 * Every Part in history is mapped to exactly one ConcreteNode.
 */
export declare class ContextGraphBuilder {
  private readonly nodeIdentityMap;
  constructor(nodeIdentityMap?: WeakMap<object, string>);
  processHistory(history: readonly Content[]): ConcreteNode[];
}
