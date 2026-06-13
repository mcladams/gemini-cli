/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface UseVoiceModelCommandReturn {
  isVoiceModelDialogOpen: boolean;
  openVoiceModelDialog: () => void;
  closeVoiceModelDialog: () => void;
}
export declare const useVoiceModelCommand: () => UseVoiceModelCommandReturn;
export {};
