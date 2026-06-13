/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StructuredPatch } from 'diff';
import type { Config } from '../config/config.js';
export declare function getAllowedSkillPatchRoots(config: Config): string[];
export declare function resolveAllowedSkillPatchTarget(
  targetPath: string,
  config: Config,
): Promise<string | undefined>;
export declare function isAllowedSkillPatchTarget(
  targetPath: string,
  config: Config,
): Promise<boolean>;
interface ValidatedSkillPatchHeader {
  targetPath: string;
  isNewFile: boolean;
}
type ValidateParsedSkillPatchHeadersResult =
  | {
      success: true;
      patches: ValidatedSkillPatchHeader[];
    }
  | {
      success: false;
      reason: 'missingTargetPath' | 'invalidPatchHeaders';
      targetPath?: string;
    };
export declare function validateParsedSkillPatchHeaders(
  parsedPatches: StructuredPatch[],
): ValidateParsedSkillPatchHeadersResult;
export declare function isProjectSkillPatchTarget(
  targetPath: string,
  config: Config,
): Promise<boolean>;
export declare function hasParsedPatchHunks(
  parsedPatches: StructuredPatch[],
): boolean;
export interface AppliedSkillPatchTarget {
  targetPath: string;
  original: string;
  patched: string;
  isNewFile: boolean;
}
export type ApplyParsedSkillPatchesResult =
  | {
      success: true;
      results: AppliedSkillPatchTarget[];
    }
  | {
      success: false;
      reason:
        | 'missingTargetPath'
        | 'invalidPatchHeaders'
        | 'outsideAllowedRoots'
        | 'newFileAlreadyExists'
        | 'targetNotFound'
        | 'doesNotApply';
      targetPath?: string;
      isNewFile?: boolean;
    };
export declare function applyParsedSkillPatches(
  parsedPatches: StructuredPatch[],
  config: Config,
): Promise<ApplyParsedSkillPatchesResult>;
/**
 * Applies parsed unified diff patches against any caller-supplied set of
 * allowed root directories. This is the kind-agnostic core used by both the
 * skill patch flow and the memory patch flow.
 *
 * The patch headers must reference absolute paths inside one of the allowed
 * roots (after canonical resolution). Update patches must reference an
 * existing target; creation patches (`/dev/null` source) must reference a path
 * that does not yet exist.
 *
 * Returns the per-target before/after content so callers can stage commits
 * and roll back on failure.
 */
export declare function applyParsedPatchesWithAllowedRoots(
  parsedPatches: StructuredPatch[],
  allowedRoots: string[],
): Promise<ApplyParsedSkillPatchesResult>;
/**
 * Canonicalizes a caller-supplied allowed root list once so callers can pass
 * raw `Storage` paths without each call doing realpath traversal.
 */
export declare function canonicalizeAllowedPatchRoots(
  roots: string[],
): Promise<string[]>;
/**
 * Returns the canonical target path if it falls inside (or exactly equals)
 * one of the supplied allowed roots, otherwise `undefined`. Allowed roots may
 * be either directories (subtree allowlist) or single file paths
 * (single-file allowlist) — `isSubpath(file, file)` returns true for the
 * same-path case.
 *
 * Exported so that `listInboxMemoryPatches` can pre-filter patches whose
 * headers escape the kind's allowed root, instead of surfacing them in the
 * UI just to fail at Apply time.
 */
export declare function resolveTargetWithinAllowedRoots(
  targetPath: string,
  allowedRoots: string[],
): Promise<string | undefined>;
export {};
