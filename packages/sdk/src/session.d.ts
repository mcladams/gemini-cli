/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type ServerGeminiStreamEvent,
  type ResumedSessionData,
} from '@google/gemini-cli-core';
import type { GeminiCliAgentOptions } from './types.js';
import type { GeminiCliAgent } from './agent.js';
/**
 * Represents an interactive conversation session with a Gemini CLI agent.
 *
 * A session manages the conversation lifecycle: initialization, sending messages
 * via streaming, handling tool calls, and maintaining conversation history.
 *
 * Create a session via {@link GeminiCliAgent.session} or resume one with
 * {@link GeminiCliAgent.resumeSession}.
 */
export declare class GeminiCliSession {
  private readonly sessionId;
  private readonly agent;
  private readonly resumedData?;
  private readonly config;
  private readonly tools;
  private readonly skillRefs;
  private readonly instructions;
  private client;
  private initialized;
  constructor(
    options: GeminiCliAgentOptions,
    sessionId: string,
    agent: GeminiCliAgent,
    resumedData?: ResumedSessionData | undefined,
  );
  /**
   * The unique identifier for this session.
   */
  get id(): string;
  /**
   * Initialize the session by setting up authentication, loading skills,
   * and registering tools. Must be called before {@link sendStream}.
   *
   * This method is idempotent — calling it multiple times has no effect
   * after the first successful initialization.
   */
  initialize(): Promise<void>;
  /**
   * Send a prompt to the model and yield streaming events as they arrive.
   *
   * Handles the full agentic loop: sends the user prompt, streams model
   * responses, executes any tool calls the model requests, and continues
   * the loop until the model produces a final response with no tool calls.
   *
   * @param prompt - The user message to send.
   * @param signal - Optional {@link AbortSignal} to cancel the stream.
   * @yields {@link ServerGeminiStreamEvent} events as they are received from
   *   the model.
   *
   * @example
   * ```typescript
   * for await (const event of session.sendStream('Explain this code')) {
   *   if (event.type === GeminiEventType.ModelResponse) {
   *     process.stdout.write(event.value);
   *   }
   * }
   * ```
   */
  sendStream(
    prompt: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ServerGeminiStreamEvent>;
}
