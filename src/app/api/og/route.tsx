/**
 * API Route: /api/og
 *
 * Generates dynamic Open Graph images for social media previews.
 * Embeds the actual terminal SVG as a data URI image.
 *
 * Usage:
 *   /api/og?c=<base64-content>&ti=My Title&th=dracula&lg=javascript
 *
 * The generated image will be 1200x630 (standard OG image size).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { generateSvg } from '@/lib/generateSvg';

// OG image dimensions
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// URL-safe Base64 decoding
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Get SVG dimensions
function getSvgDimensions(svgContent: string): { width: number; height: number } {
  const widthMatch = svgContent.match(/width="([^"]+)"/);
  const heightMatch = svgContent.match(/height="([^"]+)"/);
  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : 800,
    height: heightMatch ? parseFloat(heightMatch[1]) : 400,
  };
}

// Convert SVG to data URI
function svgToDataUri(svg: string): string {
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get parameters
  const encodedContent = searchParams.get('c');
  const title = searchParams.get('ti') || '';
  const theme = searchParams.get('th') || 'dracula';
  const language = searchParams.get('lg') || 'auto';

  // Decode content if provided
  const content = encodedContent ? decodeBase64(encodedContent) : '';

  // If no content, return a branded default OG image
  if (!content.trim()) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            <svg
              width="140"
              height="140"
              viewBox="0 0 32 32"
              style={{ flexShrink: 0 }}
            >
              <rect width="32" height="32" rx="4" fill="#18181c" />
              <rect width="32" height="5" rx="4" fill="#242526" />
              <rect y="3" width="32" height="3" fill="#242526" />
              <circle cx="4" cy="3" r="1.3" fill="#ff5f57" />
              <circle cx="8" cy="3" r="1.3" fill="#febc2e" />
              <circle cx="12" cy="3" r="1.3" fill="#28c840" />
              <rect x="4" y="11" width="20" height="3" rx="1" fill="#EC4899" />
              <rect x="4" y="17" width="15" height="3" rx="1" fill="#8c50c5" />
              <rect x="4" y="23" width="24" height="3" rx="1" fill="#d6345a" />
            </svg>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '64px',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '-1px',
                }}
              >
                Shellfied
              </span>
              <span
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                Create and share beautiful code
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      }
    );
  }

  try {
    // Generate the actual terminal SVG using the same lib as the app
    const terminalSvg = generateSvg({
      content,
      language,
      terminalTheme: theme,
      title: title || undefined,
      template: 'macos',
      showControls: true,
      controlsPosition: 'left',
      borderRadius: 12,
      fontSize: 14,
      lineHeight: 1.5,
      padding: [20, 24, 20, 24],
    });

    if (!terminalSvg) {
      throw new Error('Failed to generate terminal SVG');
    }

    // Get terminal dimensions and calculate scaling
    const { width: terminalWidth, height: terminalHeight } = getSvgDimensions(terminalSvg);

    // Footer space
    const footerHeight = 60;
    const padding = 40;

    // Calculate scaling to fit
    const maxWidth = OG_WIDTH - padding * 2;
    const maxHeight = OG_HEIGHT - footerHeight - padding * 2;
    const scale = Math.min(maxWidth / terminalWidth, maxHeight / terminalHeight, 1.5);

    const scaledWidth = Math.round(terminalWidth * scale);
    const scaledHeight = Math.round(terminalHeight * scale);

    // Convert SVG to data URI for embedding
    const terminalDataUri = svgToDataUri(terminalSvg);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            padding: '40px',
          }}
        >
          {/* Terminal image */}
          <img
            src={terminalDataUri}
            width={scaledWidth}
            height={scaledHeight}
            style={{
              borderRadius: '12px',
              boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8)',
            }}
          />

          {/* Branding Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '24px',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Created with
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              style={{ flexShrink: 0 }}
            >
              <rect width="32" height="32" rx="4" fill="#18181c" />
              <rect width="32" height="5" rx="4" fill="#242526" />
              <rect y="3" width="32" height="3" fill="#242526" />
              <circle cx="4" cy="3" r="1.3" fill="#ff5f57" />
              <circle cx="8" cy="3" r="1.3" fill="#febc2e" />
              <circle cx="12" cy="3" r="1.3" fill="#28c840" />
              <rect x="4" y="11" width="20" height="3" rx="1" fill="#EC4899" />
              <rect x="4" y="17" width="15" height="3" rx="1" fill="#8c50c5" />
              <rect x="4" y="23" width="24" height="3" rx="1" fill="#d6345a" />
            </svg>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Shellfied
            </span>
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Fallback to simple branded image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
            fontSize: '48px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Shellfied
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      }
    );
  }
}

export const runtime = 'nodejs';
