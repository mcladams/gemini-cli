/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const LITERT_RELEASE_VERSION = 'v0.9.0-alpha03';
export declare const LITERT_RELEASE_BASE_URL =
  'https://github.com/google-ai-edge/LiteRT-LM/releases/download';
export declare const GEMMA_MODEL_NAME = 'gemma3-1b-gpu-custom';
export declare const DEFAULT_PORT = 9379;
export declare const HEALTH_CHECK_TIMEOUT_MS = 5000;
export declare const LITERT_API_VERSION = 'v1beta';
export declare const SERVER_START_WAIT_MS = 3000;
export declare const PLATFORM_BINARY_MAP: Record<string, string>;
export declare const PLATFORM_BINARY_SHA256: Record<string, string>;
export declare function getLiteRtBinDir(): string;
export declare function getPidFilePath(): string;
export declare function getLogFilePath(): string;
