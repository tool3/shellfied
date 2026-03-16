/**
 * URL Shortener Service
 * Provides high-level API for creating and resolving shortened URLs
 */

import { getStorageAdapter, type ShortUrlData } from './storage';

export interface CreateShortUrlResult {
  success: true;
  id: string;
  shortUrl: string;
  svgUrl: string;
}

export interface CreateShortUrlError {
  success: false;
  error: string;
}

export type CreateShortUrlResponse = CreateShortUrlResult | CreateShortUrlError;

export interface ResolveShortUrlResult {
  success: true;
  data: string; // LZ-compressed state
  format?: string;
  createdAt: number;
}

export interface ResolveShortUrlError {
  success: false;
  error: string;
}

export type ResolveShortUrlResponse = ResolveShortUrlResult | ResolveShortUrlError;

/**
 * Create a shortened URL
 * @param data LZ-compressed state data
 * @param baseUrl Base URL of the application (e.g., https://shellfied.vercel.app)
 * @param format Optional default export format
 */
export async function createShortUrl(
  data: string,
  baseUrl: string,
  format?: string
): Promise<CreateShortUrlResponse> {
  try {
    const adapter = getStorageAdapter();
    const result = await adapter.create({ data, format });

    return {
      success: true,
      id: result.id,
      shortUrl: `${baseUrl}/s/${result.id}`,
      svgUrl: `${baseUrl}/s/${result.id}.svg`,
    };
  } catch (error) {
    console.error('Error creating short URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create short URL',
    };
  }
}

/**
 * Resolve a shortened URL by ID
 * @param id The 7-character short ID
 */
export async function resolveShortUrl(id: string): Promise<ResolveShortUrlResponse> {
  try {
    // Validate ID format (7 alphanumeric characters)
    if (!/^[a-zA-Z0-9]{7}$/.test(id)) {
      return {
        success: false,
        error: 'Invalid short URL ID format',
      };
    }

    const adapter = getStorageAdapter();
    const result = await adapter.get(id);

    if (!result) {
      return {
        success: false,
        error: 'Short URL not found',
      };
    }

    return {
      success: true,
      data: result.data,
      format: result.format,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve short URL',
    };
  }
}

/**
 * Check if a short URL exists
 * @param id The 7-character short ID
 */
export async function shortUrlExists(id: string): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    return await adapter.exists(id);
  } catch {
    return false;
  }
}
