/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { ConcreteNode } from './types.js';
/**
 * Reconstructs a valid Gemini Chat History from a list of Concrete Nodes.
 * This process is "role-alternation-aware" and uses turnId to
 * preserve original turn boundaries even if multiple turns have the same role.
 */
export declare function fromGraph(nodes: readonly ConcreteNode[]): Content[];
