/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type MemoryScratchpad } from './chatRecordingService.js';
interface SessionVersion {
  sessionId: string;
  lastUpdated: string;
}
interface IndexedSession extends SessionVersion {
  filePath: string;
  summary?: string;
  memoryScratchpad?: MemoryScratchpad;
  userMessageCount: number;
}
/**
 * Metadata for a single extraction run.
 */
export interface ExtractionRun {
  runAt: string;
  sessionIds: string[];
  candidateSessions?: SessionVersion[];
  processedSessions?: SessionVersion[];
  memoryCandidatesCreated?: string[];
  memoryFilesUpdated?: string[];
  skillsCreated: string[];
  turnCount?: number;
  durationMs?: number;
  terminateReason?: string;
}
/**
 * Tracks extraction history with per-run metadata.
 */
export interface ExtractionState {
  runs: ExtractionRun[];
}
/**
 * Returns all session IDs that have been processed across all runs.
 */
export declare function getProcessedSessionIds(
  state: ExtractionState,
): Set<string>;
/**
 * Attempts to acquire an exclusive lock file using O_CREAT | O_EXCL.
 * Returns true if the lock was acquired, false if another instance owns it.
 */
export declare function tryAcquireLock(
  lockPath: string,
  retries?: number,
): Promise<boolean>;
/**
 * Checks if a lock file is stale (owner PID is dead or lock is too old).
 */
export declare function isLockStale(lockPath: string): Promise<boolean>;
/**
 * Releases the lock file.
 */
export declare function releaseLock(lockPath: string): Promise<void>;
/**
 * Reads the extraction state file, or returns a default state.
 */
export declare function readExtractionState(
  statePath: string,
): Promise<ExtractionState>;
/**
 * Writes the extraction state atomically (temp file + rename).
 */
export declare function writeExtractionState(
  statePath: string,
  state: ExtractionState,
): Promise<void>;
/**
 * Builds a session index for the extraction agent: a compact listing of all
 * eligible sessions with their summary, file path, and new/previously-processed status.
 * The agent can use read_file on paths to inspect sessions that look promising.
 *
 * Returns the index text, the list of selected new (unprocessed) session IDs,
 * and the surfaced candidate sessions for this run.
 */
export declare function buildSessionIndex(
  chatsDir: string,
  state: ExtractionState,
): Promise<{
  sessionIndex: string;
  newSessionIds: string[];
  candidateSessions: IndexedSession[];
}>;
/**
 * Validates all .patch files in the skills directory using the `diff` library.
 * Parses each patch, reads the target file(s), and attempts a dry-run apply.
 * Removes patches that fail validation. Returns the filenames of valid patches.
 */
export declare function validatePatches(
  skillsDir: string,
  config: Config,
): Promise<string[]>;
/**
 * Main entry point for the skill extraction background task.
 * Designed to be called fire-and-forget on session startup.
 *
 * Coordinates across multiple CLI instances via a lock file,
 * scans past sessions for reusable patterns, and runs a sub-agent
 * to extract and write SKILL.md files.
 */
export declare function startMemoryService(config: Config): Promise<void>;
export {};
