/**
 * API Route: /api/og
 *
 * Generates dynamic Open Graph images for social media previews.
 * Uses the actual terminal SVG artifact, converted to PNG via sharp.
 *
 * Usage:
 *   /api/og?c=<base64-content>&ti=My Title&th=dracula&lg=javascript
 *
 * The generated image will be 1200x630 (standard OG image size).
 */

import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
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
    const widthMatch = terminalSvg.match(/width="([^"]+)"/);
    const heightMatch = terminalSvg.match(/height="([^"]+)"/);
    const terminalWidth = widthMatch ? parseFloat(widthMatch[1]) : 800;
    const terminalHeight = heightMatch ? parseFloat(heightMatch[1]) : 400;

    // Footer dimensions
    const footerHeight = 60;
    const footerPadding = 20;

    // Calculate scaling to fit within OG image (with padding for branding footer)
    const maxTerminalWidth = OG_WIDTH - 80; // 40px padding on each side
    const maxTerminalHeight = OG_HEIGHT - footerHeight - footerPadding - 60; // Room for footer and padding
    const scale = Math.min(
      maxTerminalWidth / terminalWidth,
      maxTerminalHeight / terminalHeight,
      1.5 // Allow slight upscale for small terminals
    );

    const scaledWidth = Math.round(terminalWidth * scale);
    const scaledHeight = Math.round(terminalHeight * scale);

    // Convert terminal SVG to PNG using sharp
    const terminalPng = await sharp(Buffer.from(terminalSvg))
      .resize(scaledWidth, scaledHeight, { fit: 'inside' })
      .png()
      .toBuffer();

    // Create the footer with branding (logo + text)
    const footerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${footerHeight}">
      <text x="${OG_WIDTH / 2 - 90}" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="rgba(255, 255, 255, 0.5)">Created with</text>
      <g transform="translate(${OG_WIDTH / 2 + 2}, 20)">
        ${LOGO_SVG}
      </g>
      <text x="${OG_WIDTH / 2 + 34}" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#ffffff">Shellfied</text>
    </svg>`;

    const footerPng = await sharp(Buffer.from(footerSvg))
      .png()
      .toBuffer();

    // Calculate terminal position (centered horizontally, positioned above footer)
    const terminalX = Math.round((OG_WIDTH - scaledWidth) / 2);
    const terminalY = Math.round((OG_HEIGHT - footerHeight - footerPadding - scaledHeight) / 2);

    // Composite everything together
    const finalImage = await sharp({
      create: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        channels: 4,
        background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a
      },
    })
      .composite([
        {
          input: terminalPng,
          left: terminalX,
          top: terminalY,
        },
        {
          input: footerPng,
          left: 0,
          top: OG_HEIGHT - footerHeight - footerPadding,
        },
      ])
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(finalImage), {
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
