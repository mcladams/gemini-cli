/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ConcreteNode } from './types.js';
import type { Content } from '@google/genai';
import type { HistoryEvent } from '../../core/agentChatHistory.js';
export declare class ContextGraphMapper {
  private readonly nodeIdentityMap;
  private readonly builder;
  constructor();
  applyEvent(event: HistoryEvent): ConcreteNode[];
  fromGraph(nodes: readonly ConcreteNode[]): Content[];
}
