/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type FileWatcherEvent = {
  eventType: 'add' | 'unlink' | 'addDir' | 'unlinkDir';
  relativePath: string;
};
export type FileWatcherCallback = (event: FileWatcherEvent) => void;
type FileWatcherOptions = {
  shouldIgnore?: (relativePath: string) => boolean;
  onError?: (error: unknown) => void;
};
export declare class FileWatcher {
  private readonly projectRoot;
  private readonly onEvent;
  private readonly options;
  private watcher;
  constructor(
    projectRoot: string,
    onEvent: FileWatcherCallback,
    options?: FileWatcherOptions,
  );
  private normalizeRelativePath;
  start(): void;
  close(): Promise<void>;
}
export {};
