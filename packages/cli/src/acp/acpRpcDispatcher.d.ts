/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentLoopContext } from '@google/gemini-cli-core';
import * as acp from '@agentclientprotocol/sdk';
import { type LoadedSettings } from '../config/settings.js';
import type { CliArgs } from '../config/config.js';
export declare class GeminiAgent {
  private context;
  private settings;
  private apiKey;
  private baseUrl;
  private customHeaders;
  private sessionManager;
  constructor(
    context: AgentLoopContext,
    settings: LoadedSettings,
    argv: CliArgs,
    connection: acp.AgentSideConnection,
  );
  dispose(): void;
  initialize(args: acp.InitializeRequest): Promise<acp.InitializeResponse>;
  authenticate(req: acp.AuthenticateRequest): Promise<void>;
  private getAuthDetails;
  newSession(params: acp.NewSessionRequest): Promise<acp.NewSessionResponse>;
  loadSession(params: acp.LoadSessionRequest): Promise<acp.LoadSessionResponse>;
  cancel(params: acp.CancelNotification): Promise<void>;
  prompt(params: acp.PromptRequest): Promise<acp.PromptResponse>;
  setSessionMode(
    params: acp.SetSessionModeRequest,
  ): Promise<acp.SetSessionModeResponse>;
  unstable_setSessionModel(
    params: acp.SetSessionModelRequest,
  ): Promise<acp.SetSessionModelResponse>;
}
