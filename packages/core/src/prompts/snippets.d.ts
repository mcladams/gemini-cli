/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HierarchicalMemory } from '../config/memory.js';
import type { ApprovalMode } from '../policy/types.js';
export interface SystemPromptOptions {
  preamble?: PreambleOptions;
  coreMandates?: CoreMandatesOptions;
  subAgents?: SubAgentOptions[];
  agentSkills?: AgentSkillOptions[];
  hookContext?: boolean;
  primaryWorkflows?: PrimaryWorkflowsOptions;
  planningWorkflow?: PlanningWorkflowOptions;
  taskTracker?: string;
  operationalGuidelines?: OperationalGuidelinesOptions;
  sandbox?: SandboxOptions;
  interactiveYoloMode?: boolean;
  gitRepo?: GitRepoOptions;
}
export interface PreambleOptions {
  interactive: boolean;
  approvalMode: ApprovalMode;
}
export interface CoreMandatesOptions {
  interactive: boolean;
  hasSkills: boolean;
  hasHierarchicalMemory: boolean;
  contextFilenames?: string[];
  topicUpdateNarration: boolean;
}
export interface PrimaryWorkflowsOptions {
  interactive: boolean;
  enableCodebaseInvestigator: boolean;
  enableWriteTodosTool: boolean;
  enableEnterPlanModeTool: boolean;
  enableGrep: boolean;
  enableGlob: boolean;
  approvedPlan?: {
    path: string;
  };
  taskTracker?: string;
  topicUpdateNarration: boolean;
}
export interface OperationalGuidelinesOptions {
  interactive: boolean;
  interactiveShellEnabled: boolean;
  topicUpdateNarration: boolean;
  memoryV2Enabled: boolean;
  /**
   * Absolute path to the user's per-project private memory index
   * (e.g. ~/.gemini/tmp/<project-hash>/memory/MEMORY.md). Surfaced to the
   * model when memoryV2Enabled is true so the prompt-driven memory flow
   * can route project-specific personal notes there instead of the committed
   * project GEMINI.md.
   */
  userProjectMemoryPath?: string;
  /**
   * Absolute path to the user's global personal memory file
   * (e.g. ~/.gemini/GEMINI.md). Surfaced to the model when memoryV2Enabled
   * is true so the prompt-driven memory flow can route cross-project personal
   * preferences (preferences that follow the user across all workspaces) there
   * instead of the project-scoped tiers. Config.isPathAllowed surgically
   * allowlists this exact file (only this file, not the rest of `~/.gemini/`)
   * so the agent can edit it directly.
   */
  globalMemoryPath?: string;
}
export type SandboxMode = 'macos-seatbelt' | 'generic' | 'outside';
export interface SandboxOptions {
  mode: SandboxMode;
  toolSandboxingEnabled: boolean;
}
export interface GitRepoOptions {
  interactive: boolean;
}
export interface PlanningWorkflowOptions {
  interactive: boolean;
  planModeToolsList: string;
  plansDir: string;
  approvedPlanPath?: string;
}
export interface AgentSkillOptions {
  name: string;
  description: string;
  location: string;
}
export interface SubAgentOptions {
  name: string;
  description: string;
}
/**
 * Composes the core system prompt from its constituent subsections.
 * Adheres to the minimal complexity principle by using simple interpolation of function calls.
 */
export declare function getCoreSystemPrompt(
  options: SystemPromptOptions,
): string;
/**
 * Wraps the base prompt with user memory and approval mode plans.
 */
export declare function renderFinalShell(
  basePrompt: string,
  userMemory?: string | HierarchicalMemory,
  contextFilenames?: string[],
): string;
export declare function renderPreamble(options?: PreambleOptions): string;
export declare function renderCoreMandates(
  options?: CoreMandatesOptions,
): string;
export declare function renderSubAgents(subAgents?: SubAgentOptions[]): string;
export declare function renderAgentSkills(skills?: AgentSkillOptions[]): string;
export declare function renderHookContext(enabled?: boolean): string;
export declare function renderPrimaryWorkflows(
  options?: PrimaryWorkflowsOptions,
): string;
export declare function renderOperationalGuidelines(
  options?: OperationalGuidelinesOptions,
): string;
export declare function renderSandbox(options?: SandboxOptions): string;
export declare function renderInteractiveYoloMode(enabled?: boolean): string;
export declare function renderGitRepo(options?: GitRepoOptions): string;
export declare function renderUserMemory(
  memory?: string | HierarchicalMemory,
  contextFilenames?: string[],
): string;
export declare function renderTaskTracker(trackerDir: string): string;
export declare function renderPlanningWorkflow(
  options?: PlanningWorkflowOptions,
): string;
/**
 * Provides the system prompt for history compression.
 */
export declare function getCompressionPrompt(approvedPlanPath?: string): string;
