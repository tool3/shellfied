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

// Theme configurations with syntax highlighting colors
interface ThemeColors {
  background: string;
  foreground: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  variable: string;
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
    variable: '#f8f8f2',
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
    variable: '#f8f8f2',
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
    variable: '#e06c75',
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
    variable: '#d8dee9',
    operator: '#81a1c1',
    punctuation: '#eceff4',
  },
  'solarized-dark': {
    background: '#002b36',
    foreground: '#839496',
    comment: '#586e75',
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    function: '#268bd2',
    variable: '#b58900',
    operator: '#859900',
    punctuation: '#839496',
  },
  'material-dark': {
    background: '#263238',
    foreground: '#eeffff',
    comment: '#546e7a',
    keyword: '#c792ea',
    string: '#c3e88d',
    number: '#f78c6c',
    function: '#82aaff',
    variable: '#eeffff',
    operator: '#89ddff',
    punctuation: '#89ddff',
  },
  'night-owl': {
    background: '#011627',
    foreground: '#d6deeb',
    comment: '#637777',
    keyword: '#c792ea',
    string: '#ecc48d',
    number: '#f78c6c',
    function: '#82aaff',
    variable: '#d6deeb',
    operator: '#c792ea',
    punctuation: '#d6deeb',
  },
  'tokyo-night': {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    comment: '#565f89',
    keyword: '#bb9af7',
    string: '#9ece6a',
    number: '#ff9e64',
    function: '#7aa2f7',
    variable: '#c0caf5',
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
    variable: '#83a598',
    operator: '#fe8019',
    punctuation: '#ebdbb2',
  },
  cobalt2: {
    background: '#193549',
    foreground: '#ffffff',
    comment: '#0088ff',
    keyword: '#ff9d00',
    string: '#a5ff90',
    number: '#ff628c',
    function: '#ffc600',
    variable: '#9effff',
    operator: '#ff9d00',
    punctuation: '#ffffff',
  },
  default: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    function: '#dcdcaa',
    variable: '#9cdcfe',
    operator: '#d4d4d4',
    punctuation: '#d4d4d4',
  },
};

function getTheme(theme: string): ThemeColors {
  return THEMES[theme] || THEMES.default;
}

interface Token {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'operator' | 'punctuation' | 'text';
  value: string;
}

// Strip ANSI escape codes from text
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// Simple regex-based tokenizer for common syntax patterns
function tokenizeLine(line: string, _language: string): Token[] {
  // Strip any ANSI codes first
  const cleanLine = stripAnsi(line);
  if (!cleanLine) return [{ type: 'text', value: ' ' }];

  const tokens: Token[] = [];
  let remaining = cleanLine;

  // Keywords for common languages
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'class', 'extends', 'new', 'this', 'super',
    'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined',
    'void', 'delete', 'yield', 'static', 'public', 'private', 'protected', 'interface',
    'type', 'enum', 'implements', 'abstract', 'readonly', 'as', 'is', 'keyof', 'never',
    'def', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not', 'with', 'assert',
    'pass', 'raise', 'except', 'global', 'nonlocal', 'elif', 'fn', 'pub', 'mod', 'use',
    'struct', 'impl', 'trait', 'where', 'match', 'self', 'Self', 'mut', 'ref', 'move',
    'func', 'package', 'go', 'chan', 'select', 'defer', 'range', 'map', 'make',
  ]);

  const patterns: Array<{ regex: RegExp; type: Token['type'] }> = [
    // Comments
    { regex: /^(\/\/.*|#.*|\/\*[\s\S]*?\*\/)/, type: 'comment' },
    // Strings (double, single, backtick)
    { regex: /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/, type: 'string' },
    // Numbers
    { regex: /^(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?)/i, type: 'number' },
    // Function calls
    { regex: /^([a-zA-Z_]\w*)\s*(?=\()/, type: 'function' },
    // Operators
    { regex: /^(===|!==|==|!=|<=|>=|=>|->|\+\+|--|&&|\|\||[+\-*/%=<>!&|^~?:]+)/, type: 'operator' },
    // Punctuation
    { regex: /^([{}[\]();,.<>])/, type: 'punctuation' },
    // Words (identifiers/keywords)
    { regex: /^([a-zA-Z_]\w*)/, type: 'text' },
    // Whitespace
    { regex: /^(\s+)/, type: 'text' },
    // Any other character
    { regex: /^(.)/, type: 'text' },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, type } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        let tokenType = type;
        const value = match[1] || match[0];

        // Check if text token is a keyword
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
      // Safety: consume one character to prevent infinite loop
      tokens.push({ type: 'text', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

// Render a line with syntax highlighting - returns array of JSX elements
function renderHighlightedLine(line: string, language: string, theme: ThemeColors) {
  const tokens = tokenizeLine(line, language);

  const colorMap: Record<Token['type'], string> = {
    keyword: theme.keyword,
    string: theme.string,
    number: theme.number,
    comment: theme.comment,
    function: theme.function,
    operator: theme.operator,
    punctuation: theme.punctuation,
    text: theme.foreground,
  };

  return tokens.map((token, i) => (
    <span key={i} style={{ color: colorMap[token.type] }}>
      {token.value}
    </span>
  ));
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
          {/* Logo and branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            {/* Large Shellfied Logo */}
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
            {/* Text */}
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
        width: 1200,
        height: 630,
      }
    );
  }

  // Truncate content for preview (first 12 lines, max 60 chars per line)
  const previewLines = content
    .split('\n')
    .slice(0, 12)
    .map(line => line.length > 60 ? line.slice(0, 57) + '...' : line);

  const hasMore = content.split('\n').length > 12;

  const themeColors = getTheme(theme);
  const bgColor = themeColors.background;

  // Calculate dimensions - terminal should be centered with room for footer
  const terminalMaxWidth = 900;
  const terminalMaxHeight = 480;
  const lineCount = previewLines.length + (hasMore ? 1 : 0);
  const lineHeight = 26;
  const titleBarHeight = 44;
  const paddingVertical = 40;
  const estimatedHeight = titleBarHeight + paddingVertical + (lineCount * lineHeight);
  const terminalHeight = Math.min(estimatedHeight, terminalMaxHeight);

  try {
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
          {/* Terminal Window - Centered */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: terminalMaxWidth,
              maxHeight: terminalHeight,
              backgroundColor: bgColor,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
                flexShrink: 0,
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
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {title}
              </div>
              {/* Spacer for symmetry */}
              <div style={{ width: '52px' }} />
            </div>

            {/* Code Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 24px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.8',
              }}
            >
              {previewLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                  }}
                >
                  {renderHighlightedLine(line, language, themeColors)}
                </div>
              ))}
              {hasMore && (
                <div
                  style={{
                    display: 'flex',
                    color: 'rgba(255, 255, 255, 0.3)',
                    marginTop: '4px',
                  }}
                >
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
              marginTop: '32px',
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
            {/* Shellfied Logo */}
            <svg
              width="28"
              height="28"
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
