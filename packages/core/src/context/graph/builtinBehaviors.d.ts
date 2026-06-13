/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NodeBehavior, NodeBehaviorRegistry } from './behaviorRegistry.js';
import {
  type UserPrompt,
  type AgentThought,
  type ToolExecution,
  type MaskedTool,
  type AgentYield,
  type Snapshot,
  type RollingSummary,
  type SystemEvent,
} from './types.js';
export declare const UserPromptBehavior: NodeBehavior<UserPrompt>;
export declare const AgentThoughtBehavior: NodeBehavior<AgentThought>;
export declare const ToolExecutionBehavior: NodeBehavior<ToolExecution>;
export declare const MaskedToolBehavior: NodeBehavior<MaskedTool>;
export declare const AgentYieldBehavior: NodeBehavior<AgentYield>;
export declare const SystemEventBehavior: NodeBehavior<SystemEvent>;
export declare const SnapshotBehavior: NodeBehavior<Snapshot>;
export declare const RollingSummaryBehavior: NodeBehavior<RollingSummary>;
export declare function registerBuiltInBehaviors(
  registry: NodeBehaviorRegistry,
): void;
