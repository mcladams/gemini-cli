/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MemoryBaseline } from './memory-baselines.js';
import type { TestRig } from './test-rig.js';
/**
 * A single memory snapshot at a point in time.
 */
export interface MemorySnapshot {
  timestamp: number;
  label: string;
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}
/**
 * Result from running a memory test scenario.
 */
export interface MemoryTestResult {
  scenarioName: string;
  snapshots: MemorySnapshot[];
  peakHeapUsed: number;
  peakRss: number;
  peakExternal: number;
  finalHeapUsed: number;
  finalRss: number;
  finalExternal: number;
  baseline: MemoryBaseline | undefined;
  withinTolerance: boolean;
  deltaPercent: number;
}
/**
 * Options for the MemoryTestHarness.
 */
export interface MemoryTestHarnessOptions {
  /** Path to the baselines JSON file */
  baselinesPath: string;
  /** Default tolerance percentage (0-100). Default: 10 */
  defaultTolerancePercent?: number;
  /** Number of GC cycles to run before each snapshot. Default: 3 */
  gcCycles?: number;
  /** Delay in ms between GC cycles. Default: 100 */
  gcDelayMs?: number;
  /** Number of samples to take for median calculation. Default: 3 */
  sampleCount?: number;
}
/**
 * MemoryTestHarness provides infrastructure for running memory usage tests.
 *
 * It handles:
 * - Extracting memory metrics from CLI process telemetry
 * - Comparing against baselines with configurable tolerance
 * - Generating ASCII chart reports of memory trends
 */
export declare class MemoryTestHarness {
  private baselines;
  private readonly baselinesPath;
  private readonly defaultTolerancePercent;
  private allResults;
  constructor(options: MemoryTestHarnessOptions);
  /**
   * Extract memory snapshot from TestRig telemetry.
   */
  takeSnapshot(
    rig: TestRig,
    label?: string,
    strategy?: 'peak' | 'last',
  ): Promise<MemorySnapshot>;
  /**
   * Run a memory test scenario.
   *
   * @param rig - The TestRig instance running the CLI
   * @param name - Scenario name (must match baseline key)
   * @param fn - Async function that executes the scenario. Receives a
   *   `recordSnapshot` callback for recording intermediate snapshots.
   * @param tolerancePercent - Override default tolerance for this scenario
   */
  runScenario(
    rig: TestRig,
    name: string,
    fn: (
      recordSnapshot: (label: string) => Promise<MemorySnapshot>,
    ) => Promise<void>,
    tolerancePercent?: number,
  ): Promise<MemoryTestResult>;
  /**
   * Assert that a scenario result is within the baseline tolerance.
   * Throws an assertion error with details if it exceeds the threshold.
   */
  assertWithinBaseline(
    result: MemoryTestResult,
    tolerancePercent?: number,
  ): void;
  /**
   * Update the baseline for a scenario with the current measured values.
   */
  updateScenarioBaseline(result: MemoryTestResult): void;
  /**
   * Analyze snapshots to detect sustained leaks.
   * A leak is flagged if growth is observed in both phases.
   */
  analyzeSnapshots(
    snapshots: MemorySnapshot[],
    thresholdBytes?: number,
  ): {
    leaked: boolean;
    message: string;
  };
  /**
   * Assert that memory returns to a baseline level after a peak.
   * Useful for verifying that large tool outputs or history are not retained.
   */
  assertMemoryReturnsToBaseline(
    snapshots: MemorySnapshot[],
    tolerancePercent?: number,
  ): void;
  /**
   * Generate a report with ASCII charts and summary table.
   * Uses the `asciichart` library for terminal visualization.
   */
  generateReport(results?: MemoryTestResult[]): Promise<string>;
}
