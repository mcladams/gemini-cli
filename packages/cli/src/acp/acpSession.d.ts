/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type ConversationRecord,
  type AgentLoopContext,
  type GeminiChat,
} from '@google/gemini-cli-core';
import * as acp from '@agentclientprotocol/sdk';
import type { LoadedSettings } from '../config/settings.js';
export declare class Session {
  #private;
  private readonly id;
  private readonly chat;
  private readonly context;
  private readonly connection;
  private readonly settings;
  private pendingPrompt;
  private commandHandler;
  private callIdCounter;
  private generateCallId;
  constructor(
    id: string,
    chat: GeminiChat,
    context: AgentLoopContext,
    connection: acp.AgentSideConnection,
    settings: LoadedSettings,
  );
  private handleApprovalModeChanged;
  dispose(): void;
  cancelPendingPrompt(): Promise<void>;
  setMode(modeId: acp.SessionModeId): acp.SetSessionModeResponse;
  private getAvailableCommands;
  sendAvailableCommands(): Promise<void>;
  setModel(modelId: acp.ModelId): acp.SetSessionModelResponse;
  streamHistory(messages: ConversationRecord['messages']): Promise<void>;
  prompt(params: acp.PromptRequest): Promise<acp.PromptResponse>;
  private handleCommand;
  private sendUpdate;
  private runTool;
  debug(msg: string): void;
}
