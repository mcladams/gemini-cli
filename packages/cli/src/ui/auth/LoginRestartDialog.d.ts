/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@google/gemini-cli-core';
interface LoginRestartDialogProps {
  onDismiss: () => void;
  config: Config;
  message?: string;
}
export declare const LoginRestartDialog: ({
  onDismiss,
  config,
  message,
}: LoginRestartDialogProps) => import('react/jsx-runtime').JSX.Element;
export {};
