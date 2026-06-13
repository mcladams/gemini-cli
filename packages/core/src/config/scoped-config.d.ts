/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { WorkspaceContext } from '../utils/workspaceContext.js';
/**
 * Returns the current workspace context override, if any.
 * Called by `Config.getWorkspaceContext()` to check for per-agent scoping.
 */
export declare function getWorkspaceContextOverride():
  | WorkspaceContext
  | undefined;
/**
 * Runs a function with a scoped workspace context override.
 * Any calls to `Config.getWorkspaceContext()` within `fn` will return
 * the scoped context instead of the default.
 *
 * @param scopedContext The workspace context to use within the scope.
 * @param fn The function to run.
 * @returns The result of the function.
 */
export declare function runWithScopedWorkspaceContext<T>(
  scopedContext: WorkspaceContext,
  fn: () => T,
): T;
/**
 * Returns true when the current async execution is allowed to access the
 * canonical auto-memory inbox patch files.
 */
export declare function hasScopedMemoryInboxAccess(): boolean;
/**
 * Runs a function with access to the canonical auto-memory inbox patch files.
 * This is intended for the background extraction agent only; the main agent
 * continues to have the inbox carved out of its normal temp-dir access.
 */
export declare function runWithScopedMemoryInboxAccess<T>(fn: () => T): T;
/**
 * Returns true when the current async execution is using the narrow
 * auto-memory extraction write allowlist.
 */
export declare function hasScopedAutoMemoryExtractionWriteAccess(): boolean;
/**
 * Runs a function with the auto-memory extraction write allowlist active.
 * This prevents the background extractor from writing active memory files
 * directly; it may only write extracted skills and canonical inbox patches.
 */
export declare function runWithScopedAutoMemoryExtractionWriteAccess<T>(
  fn: () => T,
): T;
/**
 * Creates a {@link WorkspaceContext} that extends a parent's directories
 * with additional ones.
 *
 * @param parentContext The parent workspace context.
 * @param additionalDirectories Extra directories to include.
 * @returns A new WorkspaceContext with the combined directories.
 */
export declare function createScopedWorkspaceContext(
  parentContext: WorkspaceContext,
  additionalDirectories: string[],
): WorkspaceContext;
