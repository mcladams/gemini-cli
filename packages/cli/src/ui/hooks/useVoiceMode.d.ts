/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@google/gemini-cli-core';
import type { TextBuffer } from '../components/shared/text-buffer.js';
import type { MergedSettings } from '../../config/settingsSchema.js';
import type { Key } from './useKeypress.js';
import { Command } from '../key/keyMatchers.js';
interface UseVoiceModeProps {
  buffer: TextBuffer;
  config: Config;
  settings: MergedSettings;
  setQueueErrorMessage: (message: string | null) => void;
  isVoiceModeEnabled: boolean;
  setVoiceModeEnabled: (enabled: boolean) => void;
  keyMatchers: Record<Command, (key: Key) => boolean>;
}
export declare function useVoiceMode({
  buffer,
  config,
  settings,
  setQueueErrorMessage,
  isVoiceModeEnabled,
  setVoiceModeEnabled,
  keyMatchers,
}: UseVoiceModeProps): {
  isRecording: boolean;
  isConnecting: boolean;
  startVoiceRecording: () => void;
  stopVoiceRecording: () => void;
  handleVoiceInput: (key: Key) => boolean;
  resetTurnBaseline: () => void;
};
export {};
