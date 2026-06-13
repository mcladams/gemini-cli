/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Exit code used to signal that the CLI should be relaunched.
 */
export declare const RELAUNCH_EXIT_CODE = 199;
/** @internal only for testing */
export declare function _resetRelaunchStateForTesting(): void;
export declare function relaunchApp(): Promise<void>;
export interface ProcessWithSea extends NodeJS.Process {
  isSea?: () => boolean;
}
/**
 * Determines whether the current process is a "standard" SEA (Single Executable Application)
 * where the user arguments start at index 1 instead of index 2.
 * A relaunched SEA child will have process.argv[0] === process.argv[1] (because we inject execPath),
 * so it will return false here and correctly slice from index 2.
 */
export declare function isStandardSea(): boolean;
/**
 * Extracts the user-provided script arguments from process.argv,
 * accounting for the differences in SEA execution modes.
 */
export declare function getScriptArgs(): string[];
/**
 * Determines if the current process is running in any SEA environment
 * (either the initial launch or a relaunched child).
 */
export declare function isSeaEnvironment(): boolean;
/**
 * Constructs the arguments and environment for spawning a child process during relaunch.
 * Handles differences between standard Node and SEA binary modes.
 */
export declare function getSpawnConfig(
  nodeArgs: string[],
  scriptArgs: string[],
): {
  spawnArgs: string[];
  env: NodeJS.ProcessEnv;
};
