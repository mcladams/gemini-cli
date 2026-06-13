/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeminiCliSession } from './session.js';
import type { GeminiCliAgentOptions } from './types.js';
/**
 * The main entry point for the Gemini CLI SDK.
 *
 * An agent encapsulates configuration (instructions, tools, skills, model)
 * and can create new sessions or resume existing ones.
 *
 * @example
 * ```typescript
 * const agent = new GeminiCliAgent({
 *   instructions: 'You are a helpful coding assistant.',
 *   tools: [myTool],
 * });
 *
 * const session = agent.session();
 * await session.initialize();
 *
 * for await (const event of session.sendStream('Hello!')) {
 *   console.log(event);
 * }
 * ```
 */
export declare class GeminiCliAgent {
  private options;
  constructor(options: GeminiCliAgentOptions);
  /**
   * Create a new conversation session.
   *
   * @param options - Optional session configuration. Pass `{ sessionId }` to
   *   use a specific session ID; otherwise a new one is generated.
   * @returns A new {@link GeminiCliSession} instance.
   */
  session(options?: { sessionId?: string }): GeminiCliSession;
  /**
   * Resume a previously created session by its ID.
   *
   * Looks up the session's conversation history from storage and replays it
   * so the agent can continue the conversation.
   *
   * @param sessionId - The ID of the session to resume.
   * @returns A {@link GeminiCliSession} with the prior conversation loaded.
   * @throws {Error} If no sessions exist or the specified ID is not found.
   */
  resumeSession(sessionId: string): Promise<GeminiCliSession>;
}
