/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { GeminiChat } from '../core/geminiChat.js';
import { ContextManager } from './contextManager.js';
export declare function initializeContextManager(
  config: Config,
  chat: GeminiChat,
  lastPromptId: string,
): Promise<ContextManager | undefined>;
