/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
export declare const SYNTHETIC_THOUGHT_SIGNATURE =
  'skip_thought_signature_validator';
export interface HardeningOptions {
  sentinels?: {
    continuation?: string;
    lostToolResponse?: string;
  };
}
/**
 * Hardens a chat history to ensure it strictly adheres to Gemini API invariants.
 * This is a defensive post-processing pass that patches violations using
 * sentinel messages rather than failing.
 *
 * Invariants enforced:
 * 1. Role Alternation: user -> model -> user -> model
 * 2. Start Constraint: Must start with a 'user' turn.
 * 3. End Constraint: Must end with a 'user' turn (usually for follow-up prompts).
 * 4. Tool Pairing: Every model functionCall must be followed by a user functionResponse.
 * 5. Signatures: The first functionCall in a model turn must have a thoughtSignature.
 */
export declare function hardenHistory(
  history: Content[],
  options?: HardeningOptions,
): Content[];
/**
 * Deep-scrubs the history to remove any non-standard properties from Content and Part objects.
 * This ensures compatibility with strict APIs (like Vertex AI) that reject unknown fields.
 */
export declare function scrubHistory(history: Content[]): Content[];
