/**
 * API Route: /api/og
 *
 * Generates dynamic Open Graph images for social media previews.
 * Uses Next.js ImageResponse for on-the-fly OG image generation.
 *
 * Usage:
 *   /api/og?c=<base64-content>&ti=My Title&th=dracula
 *
 * The generated image will be 1200x630 (standard OG image size).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// URL-safe Base64 decoding
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

// Theme background colors (subset of common themes)
const THEME_BACKGROUNDS: Record<string, string> = {
  dracula: '#282a36',
  monokai: '#272822',
  'one-dark': '#282c34',
  nord: '#2e3440',
  'solarized-dark': '#002b36',
  'material-dark': '#263238',
  'night-owl': '#011627',
  'tokyo-night': '#1a1b26',
  gruvbox: '#282828',
  cobalt2: '#193549',
  default: '#1e1e1e',
};

// Get theme background color
function getThemeBackground(theme: string): string {
  return THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.default;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get parameters
  const encodedContent = searchParams.get('c');
  const title = searchParams.get('ti') || 'Code Snippet';
  const theme = searchParams.get('th') || 'dracula';
  const language = searchParams.get('lg') || '';

  // Decode content if provided
  const content = encodedContent ? decodeBase64(encodedContent) : '';

  // Truncate content for preview (first 10 lines, max 50 chars per line)
  const previewLines = content
    .split('\n')
    .slice(0, 10)
    .map(line => line.length > 50 ? line.slice(0, 47) + '...' : line);

  const hasMore = content.split('\n').length > 10;

  const bgColor = getThemeBackground(theme);

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f0f0f',
            padding: '40px',
          }}
        >
          {/* Terminal Window */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              backgroundColor: bgColor,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Title Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Traffic lights */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ff5f56',
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ffbd2e',
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#27c93f',
                  }}
                />
              </div>
              {/* Title */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {title}
              </div>
              {/* Language badge */}
              {language && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {language}
                </div>
              )}
            </div>

            {/* Code Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '20px 24px',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#e0e0e0',
              }}
            >
              {previewLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    whiteSpace: 'pre',
                    opacity: i >= 8 ? 0.5 : 1,
                  }}
                >
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)', marginRight: '16px', minWidth: '24px', textAlign: 'right' }}>
                    {i + 1}
                  </span>
                  <span>{line || ' '}</span>
                </div>
              ))}
              {hasMore && (
                <div
                  style={{
                    display: 'flex',
                    color: 'rgba(255, 255, 255, 0.3)',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ marginRight: '16px', minWidth: '24px' }} />
                  <span>...</span>
                </div>
              )}
            </div>
          </div>

          {/* Branding Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '24px',
              gap: '12px',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34D399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Shellfied
            </span>
            <span
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Beautiful code screenshots
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    // Return a simple fallback image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0f0f',
            color: '#ffffff',
            fontSize: '48px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Shellfied
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

export const runtime = 'edge';
