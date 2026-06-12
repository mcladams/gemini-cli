/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface MetricOutput {
    metric: string;
    value: number | string;
    timestamp: string;
    details?: Record<string, unknown>;
}
export declare const GITHUB_OWNER = "google-gemini";
export declare const GITHUB_REPO = "gemini-cli";
