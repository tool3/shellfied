/**
 * Storage module exports
 * Easy to swap adapters by changing the default export
 */

export type { StorageAdapter, ShortUrlData, CreateShortUrlInput } from './types';
export { generateShortId } from './types';
export { GistStorageAdapter } from './gistAdapter';

// Default adapter - change this to switch storage backends
import { GistStorageAdapter } from './gistAdapter';

let _adapter: import('./types').StorageAdapter | null = null;

export function getStorageAdapter(): import('./types').StorageAdapter {
  if (!_adapter) {
    _adapter = new GistStorageAdapter();
  }
  return _adapter;
}

// For testing or custom adapters
export function setStorageAdapter(adapter: import('./types').StorageAdapter): void {
  _adapter = adapter;
}
