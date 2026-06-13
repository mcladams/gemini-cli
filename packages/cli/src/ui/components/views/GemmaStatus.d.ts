/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { HistoryItemGemmaStatus } from '../../types.js';
type GemmaStatusProps = Omit<HistoryItemGemmaStatus, 'id' | 'type'>;
export declare const GemmaStatus: React.FC<GemmaStatusProps>;
export {};
