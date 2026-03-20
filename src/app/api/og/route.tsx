/**
 * API Route: /api/og
 *
 * Generates dynamic Open Graph images for social media previews.
 * Renders terminal with syntax highlighting using embedded fonts.
 *
 * Usage:
 *   /api/og?c=<base64-content>&ti=My Title&th=dracula&lg=javascript
 *
 * The generated image will be 1200x630 (standard OG image size).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

// Theme configurations
interface ThemeColors {
  background: string;
  foreground: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  operator: string;
  punctuation: string;
}

const THEMES: Record<string, ThemeColors> = {
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    function: '#50fa7b',
    operator: '#ff79c6',
    punctuation: '#f8f8f2',
  },
  monokai: {
    background: '#272822',
    foreground: '#f8f8f2',
    comment: '#75715e',
    keyword: '#f92672',
    string: '#e6db74',
    number: '#ae81ff',
    function: '#a6e22e',
    operator: '#f92672',
    punctuation: '#f8f8f2',
  },
  'one-dark': {
    background: '#282c34',
    foreground: '#abb2bf',
    comment: '#5c6370',
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    function: '#61afef',
    operator: '#56b6c2',
    punctuation: '#abb2bf',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    comment: '#616e88',
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    function: '#88c0d0',
    operator: '#81a1c1',
    punctuation: '#eceff4',
  },
  'tokyo-night': {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    comment: '#565f89',
    keyword: '#bb9af7',
    string: '#9ece6a',
    number: '#ff9e64',
    function: '#7aa2f7',
    operator: '#89ddff',
    punctuation: '#a9b1d6',
  },
  gruvbox: {
    background: '#282828',
    foreground: '#ebdbb2',
    comment: '#928374',
    keyword: '#fb4934',
    string: '#b8bb26',
    number: '#d3869b',
    function: '#fabd2f',
    operator: '#fe8019',
    punctuation: '#ebdbb2',
  },
  default: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    function: '#dcdcaa',
    operator: '#d4d4d4',
    punctuation: '#d4d4d4',
  },
};

function getTheme(theme: string): ThemeColors {
  return THEMES[theme] || THEMES.default;
}

// Token types for syntax highlighting
type TokenType = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'operator' | 'punctuation' | 'text';

interface Token {
  type: TokenType;
  value: string;
}

// Simple tokenizer for syntax highlighting
function tokenizeLine(line: string): Token[] {
  if (!line) return [{ type: 'text', value: ' ' }];

  const tokens: Token[] = [];
  let remaining = line;

  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'extends', 'new', 'this', 'import', 'export', 'from', 'default',
    'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
    'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum',
    'def', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not',
    'fn', 'pub', 'mod', 'use', 'struct', 'impl', 'trait', 'match', 'self',
    'func', 'package', 'go', 'chan', 'defer', 'range', 'map',
  ]);

  const patterns: Array<{ regex: RegExp; type: TokenType }> = [
    { regex: /^(\/\/.*|#.*|\/\*[\s\S]*?\*\/)/, type: 'comment' },
    { regex: /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/, type: 'string' },
    { regex: /^(0x[0-9a-fA-F]+|0b[01]+|\d+\.?\d*(?:e[+-]?\d+)?)/i, type: 'number' },
    { regex: /^([a-zA-Z_]\w*)\s*(?=\()/, type: 'function' },
    { regex: /^(===|!==|==|!=|<=|>=|=>|->|\+\+|--|&&|\|\||[+\-*/%=<>!&|^~?:]+)/, type: 'operator' },
    { regex: /^([{}[\]();,.<>])/, type: 'punctuation' },
    { regex: /^([a-zA-Z_]\w*)/, type: 'text' },
    { regex: /^(\s+)/, type: 'text' },
    { regex: /^(.)/, type: 'text' },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { regex, type } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        let tokenType = type;
        const value = match[1] || match[0];
        if (type === 'text' && keywords.has(value)) {
          tokenType = 'keyword';
        }
        tokens.push({ type: tokenType, value });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: 'text', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

// Load monospace font from static file
async function loadMonoFont(): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), 'public', 'fonts', 'JetBrainsMono-Regular.ttf');
  const fontBuffer = await readFile(fontPath);
  return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const encodedContent = searchParams.get('c');
  const title = searchParams.get('ti') || '';
  const theme = searchParams.get('th') || 'dracula';
  // language param reserved for future use with language-specific tokenization

  const content = encodedContent ? decodeBase64(encodedContent) : '';

  // Default branded OG image when no content
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
            <svg width="140" height="140" viewBox="0 0 32 32">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '64px', fontWeight: 700, color: '#ffffff', letterSpacing: '-1px' }}>
                Shellfied
              </span>
              <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Create and share beautiful code
              </span>
            </div>
          </div>
        </div>
      ),
      { width: OG_WIDTH, height: OG_HEIGHT }
    );
  }

  try {
    // Load monospace font for code
    const monoFont = await loadMonoFont();

    const themeColors = getTheme(theme);

    // Prepare code lines (limit for OG preview)
    const lines = content.split('\n').slice(0, 15);
    const truncatedLines = lines.map(line =>
      line.length > 70 ? line.slice(0, 67) + '...' : line
    );
    const hasMore = content.split('\n').length > 15;

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
          {/* Terminal Window */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '1000px',
              width: '100%',
              backgroundColor: themeColors.background,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Title Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              </div>
              {title && (
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {title}
                </div>
              )}
              <div style={{ width: '52px' }} />
            </div>

            {/* Code Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 24px',
                fontFamily: 'JetBrains Mono',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {truncatedLines.map((line, lineIndex) => (
                <div key={lineIndex} style={{ display: 'flex', minHeight: '22px' }}>
                  {tokenizeLine(line).map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      style={{
                        color: token.type === 'text' ? themeColors.foreground :
                               token.type === 'keyword' ? themeColors.keyword :
                               token.type === 'string' ? themeColors.string :
                               token.type === 'number' ? themeColors.number :
                               token.type === 'comment' ? themeColors.comment :
                               token.type === 'function' ? themeColors.function :
                               token.type === 'operator' ? themeColors.operator :
                               themeColors.punctuation,
                        whiteSpace: 'pre',
                      }}
                    >
                      {token.value}
                    </span>
                  ))}
                </div>
              ))}
              {hasMore && (
                <div style={{ display: 'flex', color: 'rgba(255, 255, 255, 0.3)', marginTop: '4px' }}>
                  ...
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
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Created with
            </span>
            <svg width="24" height="24" viewBox="0 0 32 32">
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
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
              Shellfied
            </span>
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
          {
            name: 'JetBrains Mono',
            data: monoFont,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

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
          }}
        >
          Shellfied
        </div>
      ),
      { width: OG_WIDTH, height: OG_HEIGHT }
    );
  }
}

export const runtime = 'nodejs';
