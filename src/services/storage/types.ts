/**
 * Storage adapter types for URL shortener
 * Designed with adapter pattern for easy switching between storage backends
 */

export interface ShortUrlData {
  id: string; // 7-character unique ID
  data: string; // LZ-compressed state data
  createdAt: number; // Unix timestamp
  format?: string; // Optional: default export format (svg, png, etc.)
}

export interface CreateShortUrlInput {
  data: string; // LZ-compressed state data
  format?: string; // Optional: default export format
}

export interface StorageAdapter {
  /**
   * Store a new short URL
   * @returns The created ShortUrlData with generated ID
   */
  create(input: CreateShortUrlInput): Promise<ShortUrlData>;

  /**
   * Retrieve short URL data by ID
   * @returns The ShortUrlData or null if not found
   */
  get(id: string): Promise<ShortUrlData | null>;

  /**
   * Check if an ID already exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Delete a short URL (optional, for cleanup)
   */
  delete?(id: string): Promise<boolean>;
}

/**
 * Generate a random 7-character alphanumeric ID
 * Uses URL-safe characters: a-z, A-Z, 0-9
 */
export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
