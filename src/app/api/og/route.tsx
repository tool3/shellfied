/**
 * API Route: /api/og
 *
 * Generates dynamic Open Graph images for social media previews.
 * Uses the actual terminal SVG artifact, converted to PNG via resvg.
 *
 * Usage:
 *   /api/og?c=<base64-content>&ti=My Title&th=dracula&lg=javascript
 *
 * The generated image will be 1200x630 (standard OG image size).
 */

import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { Resvg } from '@resvg/resvg-js';
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

// Shellfied logo as SVG string
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24">
  <rect width="32" height="32" rx="4" fill="#18181c"/>
  <rect width="32" height="5" rx="4" fill="#242526"/>
  <rect y="3" width="32" height="3" fill="#242526"/>
  <circle cx="4" cy="3" r="1.3" fill="#ff5f57"/>
  <circle cx="8" cy="3" r="1.3" fill="#febc2e"/>
  <circle cx="12" cy="3" r="1.3" fill="#28c840"/>
  <rect x="4" y="11" width="20" height="3" rx="1" fill="#EC4899"/>
  <rect x="4" y="17" width="15" height="3" rx="1" fill="#8c50c5"/>
  <rect x="4" y="23" width="24" height="3" rx="1" fill="#d6345a"/>
</svg>`;

// Extract inner content from SVG (without the outer svg tag)
function extractSvgContent(svgString: string): string {
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : '';
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get parameters
  const encodedContent = searchParams.get('c');
  const title = searchParams.get('ti') || '';
  const theme = searchParams.get('th') || 'dracula';
  const language = searchParams.get('lg') || 'auto';

  // Decode content if provided
  const content = encodedContent ? decodeBase64(encodedContent) : '';

  // If no content, return a branded default OG image using ImageResponse
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

    // Get terminal SVG dimensions
    const { width: terminalWidth, height: terminalHeight } = getSvgDimensions(terminalSvg);

    // Footer dimensions
    const footerHeight = 50;
    const verticalPadding = 40;

    // Calculate scaling to fit within OG image
    const maxTerminalWidth = OG_WIDTH - 80;
    const maxTerminalHeight = OG_HEIGHT - footerHeight - verticalPadding * 2;
    const scale = Math.min(
      maxTerminalWidth / terminalWidth,
      maxTerminalHeight / terminalHeight,
      1.5
    );

    const scaledWidth = Math.round(terminalWidth * scale);
    const scaledHeight = Math.round(terminalHeight * scale);

    // Calculate positions
    const terminalX = Math.round((OG_WIDTH - scaledWidth) / 2);
    const terminalY = Math.round((OG_HEIGHT - footerHeight - scaledHeight) / 2);
    const footerY = OG_HEIGHT - footerHeight - 10;

    // Create a combined SVG with the terminal embedded and scaled
    const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
      <!-- Background -->
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#0a0a0a"/>

      <!-- Terminal (scaled and positioned) -->
      <g transform="translate(${terminalX}, ${terminalY}) scale(${scale})">
        ${extractSvgContent(terminalSvg)}
      </g>

      <!-- Footer branding -->
      <g transform="translate(0, ${footerY})">
        <text x="${OG_WIDTH / 2 - 90}" y="30" font-family="Arial, sans-serif" font-size="16" fill="rgba(255, 255, 255, 0.5)">Created with</text>
        <g transform="translate(${OG_WIDTH / 2 + 2}, 12)">
          ${extractSvgContent(LOGO_SVG)}
        </g>
        <text x="${OG_WIDTH / 2 + 34}" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#ffffff">Shellfied</text>
      </g>
    </svg>`;

    // Use resvg to render SVG to PNG with proper font support
    const resvg = new Resvg(combinedSvg, {
      fitTo: {
        mode: 'width',
        value: OG_WIDTH,
      },
      font: {
        // Use system fonts as fallback
        fontFiles: [],
        loadSystemFonts: true,
        defaultFontFamily: 'Arial',
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
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
