/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Standard error messages for the plan approval workflow.
 * Shared between backend tools and CLI UI for consistency.
 */
export declare const PlanErrorMessages: {
  readonly PATH_ACCESS_DENIED: (planPath: string, plansDir: string) => string;
  readonly FILE_NOT_FOUND: (path: string) => string;
  readonly FILE_EMPTY: 'Plan file is empty. You must write content to the plan file before requesting approval.';
  readonly READ_FAILURE: (detail: string) => string;
};
/**
 * Resolves a plan file path and strictly validates it against the plans directory boundary.
 * Useful for tools that need to write or read plans.
 * @param planPath The untrusted file path provided by the model.
 * @param plansDir The authorized project plans directory.
 * @returns The safely resolved path string.
 * @throws Error if the path is empty, malicious, or escapes boundaries.
 */
export declare function resolveAndValidatePlanPath(
  planPath: string,
  plansDir: string,
  projectRoot: string,
): string;
/**
 * Validates a plan file path for safety (traversal) and existence.
 * @param planPath The untrusted path to the plan file.
 * @param plansDir The authorized project plans directory.
 * @param projectRoot The root directory of the project.
 * @returns An error message if validation fails, or null if successful.
 */
export declare function validatePlanPath(
  planPath: string,
  plansDir: string,
  projectRoot: string,
): Promise<string | null>;
/**
 * Validates that a plan file has non-empty content.
 * @param planPath The path to the plan file.
 * @returns An error message if the file is empty or unreadable, or null if successful.
 */
export declare function validatePlanContent(
  planPath: string,
): Promise<string | null>;
