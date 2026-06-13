/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { MessageActionReturn, ToolActionReturn } from './types.js';
export declare function showMemory(config: Config): MessageActionReturn;
export declare function addMemory(
  args?: string,
): MessageActionReturn | ToolActionReturn;
export declare function refreshMemory(
  config: Config,
): Promise<MessageActionReturn>;
export declare function listMemoryFiles(config: Config): MessageActionReturn;
/**
 * Represents a skill found in the extraction inbox.
 */
export interface InboxSkill {
  /** Directory name in the inbox. */
  dirName: string;
  /** Skill name from SKILL.md frontmatter. */
  name: string;
  /** Skill description from SKILL.md frontmatter. */
  description: string;
  /** Raw SKILL.md content for preview. */
  content: string;
  /** When the skill was extracted (ISO string), if known. */
  extractedAt?: string;
}
/**
 * Scans the skill extraction inbox and returns structured data
 * for each extracted skill.
 */
export declare function listInboxSkills(config: Config): Promise<InboxSkill[]>;
export type InboxSkillDestination = 'global' | 'project';
/**
 * Copies an inbox skill to the target skills directory.
 */
export declare function moveInboxSkill(
  config: Config,
  dirName: string,
  destination: InboxSkillDestination,
): Promise<{
  success: boolean;
  message: string;
}>;
/**
 * Removes a skill from the extraction inbox.
 */
export declare function dismissInboxSkill(
  config: Config,
  dirName: string,
): Promise<{
  success: boolean;
  message: string;
}>;
/**
 * A parsed patch entry from a unified diff, representing changes to a single file.
 */
export interface InboxPatchEntry {
  /** Absolute path to the target file (or '/dev/null' for new files). */
  targetPath: string;
  /** The unified diff text for this single file. */
  diffContent: string;
}
/**
 * Represents a .patch file found in the extraction inbox.
 */
export interface InboxPatch {
  /** The .patch filename (e.g. "update-docs-writer.patch"). */
  fileName: string;
  /** Display name (filename without .patch extension). */
  name: string;
  /** Per-file entries parsed from the patch. */
  entries: InboxPatchEntry[];
  /** When the patch was extracted (ISO string), if known. */
  extractedAt?: string;
}
export type InboxMemoryPatchKind = 'private' | 'global';
/**
 * One target file inside a memory patch (most patches will have a single entry).
 */
export interface InboxMemoryPatchEntry {
  /** Absolute path of the markdown file the patch will modify. */
  targetPath: string;
  /** Unified diff for this single file (used for UI preview). */
  diffContent: string;
  /** True when this entry creates a new file (`/dev/null` source). */
  isNewFile: boolean;
}
/**
 * Represents the AGGREGATED inbox state for one memory kind. Even when the
 * extraction agent has produced multiple `.patch` files under
 * `<memoryDir>/.inbox/<kind>/` (e.g. across several sessions), the inbox
 * surfaces them as ONE entry per kind. Apply runs each underlying patch in
 * sequence; Dismiss removes them all.
 */
export interface InboxMemoryPatch {
  /** Memory tier — one entry per kind in the inbox. */
  kind: InboxMemoryPatchKind;
  /**
   * Stable identifier for this consolidated entry. Set to the kind itself
   * (`"private"` or `"global"`); kept in the type for backwards-compat with
   * the per-file API the dialog passes through.
   */
  relativePath: string;
  /** Display name shown in the inbox row (e.g. `"Private memory"`). */
  name: string;
  /** All hunks from all underlying source patches, concatenated in order. */
  entries: InboxMemoryPatchEntry[];
  /** Basenames of the underlying `.patch` files being aggregated. */
  sourceFiles: string[];
  /** Most recent mtime across the source files (ISO string), if known. */
  extractedAt?: string;
}
/**
 * Returns the directory roots (or single-file allowlists) that a memory patch
 * of the given kind is allowed to modify. Memory patch headers must reference
 * paths inside / equal to one of these entries after canonical resolution.
 *
 * - `private` allows any markdown file inside the project memory directory.
 * - `global` is intentionally a single-file allowlist: the only writeable
 *   global file is the personal `~/.gemini/GEMINI.md`. Other files under
 *   `~/.gemini/` (settings, credentials, oauth, keybindings, etc.) are off-limits.
 */
export declare function getAllowedMemoryPatchRoots(
  config: Config,
  kind: InboxMemoryPatchKind,
): string[];
/**
 * Scans `<memoryDir>/.inbox/{private,global}/` and returns ONE consolidated
 * inbox entry per kind. Each entry aggregates all hunks from every valid
 * underlying `.patch` file. Patches that fail validation (unparseable, no
 * hunks, target outside allowed root) are silently skipped so they don't
 * pollute the inbox UI.
 */
export declare function listInboxMemoryPatches(
  config: Config,
): Promise<InboxMemoryPatch[]>;
/**
 * Applies an inbox memory patch atomically and removes the patch on success.
 *
 * Process:
 *   1. Parse + validate the patch headers (absolute paths only, no `a/`/`b/`).
 *   2. Dry-run the patch against the current target content (or empty for
 *      `/dev/null` creation patches).
 *   3. Stage the patched content to a temp file, then rename into place.
 *   4. On any failure, restore previous content from the staged snapshot and
 *      leave the inbox patch intact for retry.
 */
/**
 * Applies one inbox memory entry. Two modes:
 *   - Aggregate mode (`relativePath === kind`): walk every `.patch` file in
 *     the kind's inbox directory and apply each one in lexical order. Each
 *     file is its own atomic transaction; failures don't block subsequent
 *     successes. Returns an aggregated summary (e.g. "Applied 3 of 4 sub-
 *     patches; 1 failed: …").
 *   - Single-file mode (legacy): `relativePath` points at a specific
 *     `.patch` filename. Used by tests and direct callers.
 */
export declare function applyInboxMemoryPatch(
  config: Config,
  kind: InboxMemoryPatchKind,
  relativePath: string,
): Promise<{
  success: boolean;
  message: string;
}>;
/**
 * Removes inbox memory patch(es) without applying. Two modes:
 *   - Aggregate (`relativePath === kind`): unlink every `.patch` file in the
 *     kind's inbox directory. Used by the consolidated inbox UI's Dismiss.
 *   - Single-file (legacy): unlink one specific `.patch` file.
 */
export declare function dismissInboxMemoryPatch(
  config: Config,
  kind: InboxMemoryPatchKind,
  relativePath: string,
): Promise<{
  success: boolean;
  message: string;
}>;
/**
 * Scans the skill extraction inbox for .patch files and returns
 * structured data for each valid patch.
 */
export declare function listInboxPatches(config: Config): Promise<InboxPatch[]>;
/**
 * Applies a .patch file from the inbox by reading each target file,
 * applying the diff, and writing the result. Deletes the patch on success.
 */
export declare function applyInboxPatch(
  config: Config,
  fileName: string,
): Promise<{
  success: boolean;
  message: string;
}>;
/**
 * Removes a .patch file from the extraction inbox.
 */
export declare function dismissInboxPatch(
  config: Config,
  fileName: string,
): Promise<{
  success: boolean;
  message: string;
}>;
