/**
 * GitHub Gist Storage Adapter
 * Uses GitHub Gists as a database for storing shortened URLs
 *
 * Each gist:
 * - Description contains the 7-char ID prefixed with "shellfied:"
 * - Content is a single file with the LZ-compressed data
 */

import type { StorageAdapter, ShortUrlData, CreateShortUrlInput } from './types';
import { generateShortId } from './types';

const GIST_PREFIX = 'shellfied:';
const GIST_FILENAME = 'data.txt';
const MAX_RETRIES = 3;

interface GistFile {
  filename: string;
  content: string;
}

interface GistResponse {
  id: string;
  description: string;
  files: Record<string, GistFile>;
  created_at: string;
}

interface GistSearchResult {
  id: string;
  description: string;
  files: Record<string, { filename: string }>;
  created_at: string;
}

export class GistStorageAdapter implements StorageAdapter {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token?: string) {
    const envToken = token || process.env.GITHUB_GIST_TOKEN;
    if (!envToken) {
      throw new Error('GitHub Gist token is required. Set GITHUB_GIST_TOKEN environment variable.');
    }
    this.token = envToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async create(input: CreateShortUrlInput): Promise<ShortUrlData> {
    let id: string;
    let attempts = 0;

    // Generate unique ID with collision checking
    do {
      id = generateShortId();
      attempts++;
      if (attempts > MAX_RETRIES) {
        throw new Error('Failed to generate unique ID after multiple attempts');
      }
    } while (await this.exists(id));

    const description = `${GIST_PREFIX}${id}${input.format ? `:${input.format}` : ''}`;
    const createdAt = Date.now();

    // Create the gist
    const gist = await this.request<GistResponse>('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description,
        public: false, // Secret gist (unlisted but accessible via URL)
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify({
              data: input.data,
              createdAt,
              format: input.format,
            }),
          },
        },
      }),
    });

    return {
      id,
      data: input.data,
      createdAt,
      format: input.format,
    };
  }

  async get(id: string): Promise<ShortUrlData | null> {
    try {
      // Search for gists with the matching description
      const gists = await this.request<GistSearchResult[]>('/gists');

      // Find gist with matching ID in description
      const matchingGist = gists.find((gist) => {
        const desc = gist.description || '';
        return desc.startsWith(`${GIST_PREFIX}${id}`);
      });

      if (!matchingGist) {
        return null;
      }

      // Fetch the full gist content
      const fullGist = await this.request<GistResponse>(`/gists/${matchingGist.id}`);
      const file = fullGist.files[GIST_FILENAME];

      if (!file) {
        return null;
      }

      const content = JSON.parse(file.content);

      // Extract format from description if present
      const desc = fullGist.description || '';
      const parts = desc.replace(GIST_PREFIX, '').split(':');
      const format = parts[1] || content.format;

      return {
        id,
        data: content.data,
        createdAt: content.createdAt || new Date(fullGist.created_at).getTime(),
        format,
      };
    } catch (error) {
      console.error('Error fetching gist:', error);
      return null;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const gists = await this.request<GistSearchResult[]>('/gists?per_page=100');
      return gists.some((gist) => {
        const desc = gist.description || '';
        return desc.startsWith(`${GIST_PREFIX}${id}`);
      });
    } catch {
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const gists = await this.request<GistSearchResult[]>('/gists');
      const matchingGist = gists.find((gist) => {
        const desc = gist.description || '';
        return desc.startsWith(`${GIST_PREFIX}${id}`);
      });

      if (!matchingGist) {
        return false;
      }

      await fetch(`${this.baseUrl}/gists/${matchingGist.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      return true;
    } catch {
      return false;
    }
  }
}
