/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@google/gemini-cli-core';
import * as acp from '@agentclientprotocol/sdk';
import { type LoadedSettings } from '../config/settings.js';
import { Session } from './acpSession.js';
import { type CliArgs } from '../config/config.js';
export interface AuthDetails {
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}
export declare class AcpSessionManager {
  private settings;
  private argv;
  private connection;
  private sessions;
  private clientCapabilities;
  constructor(
    settings: LoadedSettings,
    argv: CliArgs,
    connection: acp.AgentSideConnection,
  );
  setClientCapabilities(capabilities: acp.ClientCapabilities): void;
  getSession(sessionId: string): Session | undefined;
  dispose(): void;
  newSession(
    { cwd, mcpServers }: acp.NewSessionRequest,
    authDetails: AuthDetails,
  ): Promise<acp.NewSessionResponse>;
  loadSession(
    { sessionId, cwd, mcpServers }: acp.LoadSessionRequest,
    authDetails: AuthDetails,
  ): Promise<acp.LoadSessionResponse>;
  private initializeSessionConfig;
  newSessionConfig(
    sessionId: string,
    cwd: string,
    mcpServers: acp.McpServer[],
    loadedSettings?: LoadedSettings,
  ): Promise<Config>;
}
