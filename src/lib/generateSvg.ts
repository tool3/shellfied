/**
 * Server-side SVG generation utilities
 * Used by API routes for static image serving and OG image generation
 */

import shellfie, { templates, type Theme, createTheme } from 'shellfie';
import type { WatermarkStyle, WatermarkConfig as ShellfieWatermarkConfig } from 'shellfie';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Cache for embedded font data (loaded synchronously on first use)
// All 4 weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
interface FontCache {
  regular: string | null;    // 400
  medium: string | null;     // 500
  semibold: string | null;   // 600
  bold: string | null;       // 700
}
const fontDataCache: FontCache = { regular: null, medium: null, semibold: null, bold: null };
let fontLoadAttempted = false;

// Load JetBrains Mono fonts synchronously for embedding in SVG
// This ensures fonts work in serverless environments where system fonts aren't available
function loadEmbeddedFonts(): FontCache {
  if (fontLoadAttempted) return fontDataCache;
  fontLoadAttempted = true;

  const fontFiles: Array<{ key: keyof FontCache; filename: string }> = [
    { key: 'regular', filename: 'JetBrainsMono-Regular.ttf' },
    { key: 'medium', filename: 'JetBrainsMono-Medium.ttf' },
    { key: 'semibold', filename: 'JetBrainsMono-SemiBold.ttf' },
    { key: 'bold', filename: 'JetBrainsMono-Bold.ttf' },
  ];

  for (const { key, filename } of fontFiles) {
    try {
      const fontPath = join(process.cwd(), 'public', 'fonts', filename);
      if (existsSync(fontPath)) {
        const buffer = readFileSync(fontPath);
        fontDataCache[key] = buffer.toString('base64');
      }
    } catch (error) {
      console.warn(`Failed to load embedded ${key} font:`, error);
    }
  }

  return fontDataCache;
}

// Get embedded font data for a specific weight (returns regular font data for shellfie)
function getEmbeddedFontData(): { data: string; format: 'ttf' } | null {
  const fonts = loadEmbeddedFonts();
  if (fonts.regular) {
    return { data: fonts.regular, format: 'ttf' };
  }
  return null;
}
/**
 * Google Fonts supported for terminal use (monospace fonts)
 * Maps display name to Google Fonts URL-safe name
 */
const GOOGLE_FONT_NAMES: Record<string, string> = {
  'JetBrains Mono': 'JetBrains+Mono',
  'Fira Code': 'Fira+Code',
  'Source Code Pro': 'Source+Code+Pro',
  'IBM Plex Mono': 'IBM+Plex+Mono',
  'Roboto Mono': 'Roboto+Mono',
  'Ubuntu Mono': 'Ubuntu+Mono',
  'Space Mono': 'Space+Mono',
  // Label fonts (sans-serif, serif)
  'Inter': 'Inter',
  'Roboto': 'Roboto',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Open Sans': 'Open+Sans',
  'Lato': 'Lato',
  'Oswald': 'Oswald',
  'Raleway': 'Raleway',
  'Nunito': 'Nunito',
  'Ubuntu': 'Ubuntu',
  'Rubik': 'Rubik',
  'Work Sans': 'Work+Sans',
  'Quicksand': 'Quicksand',
  'Bebas Neue': 'Bebas+Neue',
  'Playfair Display': 'Playfair+Display',
  'Merriweather': 'Merriweather',
};

/**
 * Extract primary font family name from a CSS font-family string
 */
function extractPrimaryFontFamily(fontFamily: string): string {
  const primary = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  return primary;
}

// Cache for server-side fetched Google Fonts (keyed by "fontFamily-weight")
const serverFontCache: Map<string, { data: string; format: 'ttf' }> = new Map();

/**
 * Fetch a Google Font as base64 TTF for server-side embedding.
 * Server-side can set User-Agent to get full (non-subset) TTF files.
 * For JetBrains Mono, uses bundled files from /public/fonts/.
 */
export async function fetchServerFont(fontFamily: string, weight: number = 400): Promise<{ data: string; format: 'ttf' } | null> {
  const primaryFont = extractPrimaryFontFamily(fontFamily);
  const cacheKey = `${primaryFont}-${weight}`;

  // Check cache
  if (serverFontCache.has(cacheKey)) {
    return serverFontCache.get(cacheKey)!;
  }

  // For JetBrains Mono, use bundled files
  if (primaryFont === 'JetBrains Mono') {
    const data = getEmbeddedFontData();
    if (data) {
      serverFontCache.set(cacheKey, data);
      return data;
    }
  }

  // For other Google Fonts, fetch TTF from Google Fonts API
  const googleFontName = GOOGLE_FONT_NAMES[primaryFont];
  if (!googleFontName) {
    return null;
  }

  try {
    // Use a basic User-Agent to get full TTF (not woff2 subsets)
    const cssUrl = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@${weight}&display=swap`;
    const cssResponse = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/4.0' },
    });

    if (!cssResponse.ok) return null;
    const cssText = await cssResponse.text();

    // With TTF User-Agent, Google returns a single @font-face with full TTF
    const ttfMatch = cssText.match(/src:\s*url\(([^)]+)\)\s*format\(['"]truetype['"]\)/);
    if (!ttfMatch) return null;

    const fontResponse = await fetch(ttfMatch[1]);
    if (!fontResponse.ok) return null;

    const arrayBuffer = await fontResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const result = { data: base64, format: 'ttf' as const };
    serverFontCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Embed a font into an SVG as @font-face with correct format('truetype').
 * Server-side equivalent of the client's embedFontInSvg.
 */
function embedFontInSvgServer(svgContent: string, fontFamily: string, base64Data: string): string {
  const fontFaceRule = `@font-face { font-family: '${fontFamily}'; src: url('data:font/ttf;base64,${base64Data}') format('truetype'); font-weight: normal; }`;

  const hasDefsStyle = /<defs[^>]*>[\s\S]*?<style/i.test(svgContent);
  const hasDefs = /<defs[^>]*>/i.test(svgContent);

  if (hasDefsStyle) {
    return svgContent.replace(
      /(<style[^>]*><!\[CDATA\[)/i,
      `$1\n      ${fontFaceRule}\n`
    );
  } else if (hasDefs) {
    return svgContent.replace(
      /(<defs[^>]*>)/i,
      `$1\n    <style><![CDATA[\n      ${fontFaceRule}\n    ]]></style>`
    );
  } else {
    return svgContent.replace(
      /(<svg[^>]*>)/i,
      `$1\n  <defs>\n    <style><![CDATA[\n      ${fontFaceRule}\n    ]]></style>\n  </defs>`
    );
  }
}

import type {
  TemplateType,
  ControlsPosition,
  HeaderConfig,
  FooterConfig,
  WatermarkConfig,
  PaddingTuple,
  BackgroundConfig,
  BackgroundType,
  GradientDirection,
  ImageAspectRatio,
} from '@/types';

// Re-export custom themes from themes.ts
const nightOwl = createTheme({
  name: 'nightOwl',
  background: '#011627',
  foreground: '#d6deeb',
  black: '#011627',
  red: '#ef5350',
  green: '#22da6e',
  yellow: '#addb67',
  blue: '#82aaff',
  magenta: '#c792ea',
  cyan: '#21c7a8',
  white: '#ffffff',
  brightBlack: '#575656',
  brightRed: '#ef5350',
  brightGreen: '#22da6e',
  brightYellow: '#ffeb95',
  brightBlue: '#82aaff',
  brightMagenta: '#c792ea',
  brightCyan: '#7fdbca',
  brightWhite: '#ffffff',
  cursor: '#80a4c2',
  selection: '#1d3b53',
});

const cobalt2 = createTheme({
  name: 'cobalt2',
  background: '#193549',
  foreground: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#38de21',
  yellow: '#ffe50a',
  blue: '#1460d2',
  magenta: '#ff005d',
  cyan: '#00bbbb',
  white: '#bbbbbb',
  brightBlack: '#555555',
  brightRed: '#f40e17',
  brightGreen: '#3bd01d',
  brightYellow: '#edc809',
  brightBlue: '#5555ff',
  brightMagenta: '#ff55ff',
  brightCyan: '#6ae3fa',
  brightWhite: '#ffffff',
  cursor: '#ffc600',
  selection: '#0050a4',
});

const materialDark = createTheme({
  name: 'materialDark',
  background: '#263238',
  foreground: '#eeffff',
  black: '#000000',
  red: '#f07178',
  green: '#c3e88d',
  yellow: '#ffcb6b',
  blue: '#82aaff',
  magenta: '#c792ea',
  cyan: '#89ddff',
  white: '#eeffff',
  brightBlack: '#546e7a',
  brightRed: '#f07178',
  brightGreen: '#c3e88d',
  brightYellow: '#ffcb6b',
  brightBlue: '#82aaff',
  brightMagenta: '#c792ea',
  brightCyan: '#89ddff',
  brightWhite: '#ffffff',
  cursor: '#ffcc00',
  selection: '#80cbc4',
});

// Import shellfie themes and add custom ones
import { themes } from 'shellfie';
import { presetThemes } from '@/constants/presetThemes';
import { applyAspectRatio } from '@/lib/aspectRatio';
import type { BackgroundConfig as AppBackgroundConfig } from '@/types';

const GRADIENT_DIR_MAP: Record<string, string> = {
  'to-right': 'horizontal',
  'to-left': 'horizontal:reverse',
  'to-bottom': 'vertical',
  'to-top': 'vertical:reverse',
  'to-bottom-right': 'diagonal',
  'to-top-left': 'diagonal:reverse',
  'to-bottom-left': 'diagonal:swap',
  'to-top-right': 'diagonal:reverse:swap',
};

/** Convert shellfied BackgroundConfig to a shellfie-compatible color string.
 *  For radial gradients, returns the outer color (solid) since shellfie doesn't support radial natively.
 */
export function buildShellfieBackgroundColor(bg: AppBackgroundConfig): string | undefined {
  if (bg.type === 'none') return undefined;
  if (bg.type === 'gradient') {
    const isRadial = bg.gradientDirection === 'radial' || bg.gradientDirection === 'radial-reverse';
    if (isRadial) {
      // Return outer color as solid; radial overlay handled separately
      return bg.gradientDirection === 'radial-reverse' ? bg.gradientFrom : bg.gradientTo;
    }
    const mapping = GRADIENT_DIR_MAP[bg.gradientDirection] || 'diagonal';
    const needsSwap = mapping.includes(':swap');
    const dir = mapping.replace(':swap', '');
    const from = needsSwap ? bg.gradientTo : bg.gradientFrom;
    const to = needsSwap ? bg.gradientFrom : bg.gradientTo;
    return `gradient(${from}, ${to}:${dir})`;
  }
  return bg.color;
}

/** Build a radial gradient overlay function for shellfie, or undefined if not radial */
export function buildRadialOverlay(bg: AppBackgroundConfig): ((w: number, h: number) => string) | undefined {
  if (bg.type !== 'gradient') return undefined;
  const isRadial = bg.gradientDirection === 'radial' || bg.gradientDirection === 'radial-reverse';
  if (!isRadial) return undefined;

  const isReverse = bg.gradientDirection === 'radial-reverse';
  const innerColor = isReverse ? bg.gradientTo : bg.gradientFrom;
  const outerColor = isReverse ? bg.gradientFrom : bg.gradientTo;

  return (w: number, h: number) => {
    const r = Math.max(w, h);
    const cx = w / 2;
    const cy = h / 2;
    return `<defs><radialGradient id="shellfied-radial" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r / 2}" fx="${cx}" fy="${cy}"><stop offset="0%" stop-color="${innerColor}"/><stop offset="100%" stop-color="${outerColor}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#shellfied-radial)"/>`;
  };
}

const allThemes: Record<string, Theme> = {
  ...themes,
  nightOwl,
  cobalt2,
  materialDark,
  ...presetThemes,
};

// Get theme by name
export function getTheme(themeName: string): Theme | undefined {
  return allThemes[themeName];
}

// Named CSS colors to hex mapping (subset for server-side)
const CSS_COLORS: Record<string, string> = {
  black: '#000000', gray: '#808080', grey: '#808080',
  white: '#ffffff', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff',
  magenta: '#ff00ff', orange: '#ffa500',
};

// Convert color (hex or named) to ANSI 24-bit true color escape sequence
function colorToAnsi(color: string): string {
  const trimmed = color.trim().toLowerCase();
  const hex = CSS_COLORS[trimmed] || trimmed;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      const r = parseInt(short[1] + short[1], 16);
      const g = parseInt(short[2] + short[2], 16);
      const b = parseInt(short[3] + short[3], 16);
      return `\x1b[38;2;${r};${g};${b}m`;
    }
    return '';
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

// Parse CSS-like style string into WatermarkStyle
function parseStyleString(styleStr: string): { color?: string; style: WatermarkStyle } {
  const style: WatermarkStyle = {};
  let color: string | undefined;

  if (!styleStr) return { color, style };

  const declarations = styleStr.split(/[;\n]/).filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;

    const property = decl.slice(0, colonIndex).trim().toLowerCase();
    const value = decl.slice(colonIndex + 1).trim();

    if (!property || !value) continue;

    if (property === 'color') {
      color = value;
      continue;
    }

    if (property === 'padding' || property === 'margin') {
      const parts = value.split(/\s+/).map((v) => parseFloat(v) || 0);
      if (parts.length === 1) {
        style[property] = parts[0];
      } else if (parts.length === 2) {
        style[property] = [parts[0], parts[1]] as [number, number];
      } else if (parts.length >= 4) {
        style[property] = [parts[0], parts[1], parts[2], parts[3]] as [number, number, number, number];
      }
    } else if (property === 'opacity') {
      style.opacity = parseFloat(value) || 1;
    } else {
      style[property] = value;
    }
  }

  return { color, style };
}

// Check if text contains ANSI escape codes
function hasAnsiCodes(text: string): boolean {
  return /\x1b\[|\\x1b\[|\\033\[|\\e\[/.test(text);
}

// Convert escaped ANSI representations to actual escape characters
function parseAnsiEscapes(text: string): string {
  return text
    .replace(/\\x1b\[/gi, '\x1b[')
    .replace(/\\033\[/g, '\x1b[')
    .replace(/\\e\[/g, '\x1b[');
}

// Build watermark config for shellfie
function buildWatermarkConfig(watermark?: WatermarkConfig): ShellfieWatermarkConfig | undefined {
  if (!watermark) return undefined;

  if (watermark.type === 'markup') {
    if (!watermark.markup) return undefined;
    return {
      content: watermark.markup,
      type: 'markup' as const,
    };
  }

  if (!watermark.text) return undefined;

  if (hasAnsiCodes(watermark.text)) {
    return {
      content: parseAnsiEscapes(watermark.text),
      type: 'text' as const,
    };
  }

  const { color, style } = parseStyleString(watermark.style);
  const colorValue = color || '#888888';
  const colorCode = colorToAnsi(colorValue);
  const reset = '\x1b[0m';
  const content = `${colorCode}${watermark.text}${reset}`;

  return {
    content,
    type: 'text' as const,
    style,
  };
}

// Build a custom template with the specified controls position and border radius
function buildTemplate(
  templateType: TemplateType,
  controlsPosition: ControlsPosition,
  borderRadius: number,
  borderColor?: string,
  borderWidth?: number,
) {
  const baseTemplate = templates[templateType];
  if (!baseTemplate) return templateType;

  const defaultPosition = templateType === 'windows' ? 'right' : 'left';
  const defaultRadius = baseTemplate.shell.borderRadius;
  const hasBorder = !!borderColor;

  if (controlsPosition === defaultPosition && borderRadius === defaultRadius && !hasBorder) {
    return templateType;
  }

  return {
    ...baseTemplate,
    shell: {
      ...baseTemplate.shell,
      controlsPosition,
      borderRadius,
      ...(hasBorder ? { border: true, borderColor, borderWidth: borderWidth || 1 } : {}),
    },
  };
}

// Build header options for shellfie
function buildHeaderOptions(header?: HeaderConfig) {
  if (!header?.enabled) return undefined;
  return {
    backgroundColor: header.backgroundColor || undefined,
    height: header.height,
    border: header.border,
    borderColor: header.borderColor || undefined,
    borderWidth: header.borderWidth,
  };
}

// Build footer options for shellfie
function buildFooterOptions(footer?: FooterConfig) {
  if (!footer?.enabled) return undefined;
  return {
    backgroundColor: footer.backgroundColor || undefined,
    height: footer.height,
    border: footer.border,
    borderColor: footer.borderColor || undefined,
    borderWidth: footer.borderWidth,
  };
}

// Server-side syntax highlighting using Prism
import Prism from 'prismjs';

// Import core/markup first (many languages depend on it)
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-typescript';

// PrismJS doesn't highlight custom type references in TypeScript (e.g. `x: MyType`).
if (Prism.languages.typescript) {
  Prism.languages.insertBefore('typescript', 'operator', {
    'class-name-inline': {
      pattern: /(?<=[\s:,<(])[A-Z]\w*(?=\s*[<>[\],;)=&|]|\s*$)/m,
      alias: 'class-name',
    },
  });
}

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-sql';

// ANSI escape codes for terminal colors
const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

const TOKEN_COLORS: Record<string, string> = {
  comment: ANSI.brightBlack,
  prolog: ANSI.brightBlack,
  doctype: ANSI.brightBlack,
  cdata: ANSI.brightBlack,
  punctuation: ANSI.white,
  operator: ANSI.cyan,
  property: ANSI.cyan,
  tag: ANSI.red,
  'attr-name': ANSI.yellow,
  'attr-value': ANSI.green,
  string: ANSI.green,
  'template-string': ANSI.green,
  char: ANSI.green,
  number: ANSI.magenta,
  boolean: ANSI.magenta,
  constant: ANSI.magenta,
  keyword: ANSI.red,
  atrule: ANSI.red,
  selector: ANSI.red,
  important: ANSI.red,
  function: ANSI.blue,
  'function-variable': ANSI.blue,
  'class-name': ANSI.yellow,
  builtin: ANSI.cyan,
  variable: ANSI.brightCyan,
  symbol: ANSI.brightMagenta,
  regex: ANSI.brightGreen,
  shebang: ANSI.brightBlack,
  command: ANSI.brightBlue,
  parameter: ANSI.brightCyan,
  assign: ANSI.white,
};

type PrismToken = string | Prism.Token;

function processToken(token: PrismToken): string {
  if (typeof token === 'string') {
    return token;
  }

  const alias = typeof token.alias === 'string' ? token.alias : Array.isArray(token.alias) ? token.alias[0] : undefined;
  const color = TOKEN_COLORS[token.type] || (alias && TOKEN_COLORS[alias]) || '';
  const content = Array.isArray(token.content)
    ? token.content.map(processToken).join('')
    : typeof token.content === 'string'
    ? token.content
    : processToken(token.content);

  if (color) {
    return `${color}${content}${ANSI.reset}`;
  }
  return content;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'markup',
  xml: 'markup',
  apache: 'apacheconf',
  shell: 'bash',
};

const ANSI_REGEX = /\x1b(?:\[[0-9;:]*[A-Za-z]|\][^\x07]*\x07|\(B|=|>|c)/;
const LITERAL_ESCAPE_REGEX = /\\u001[bB]|\\x1[bB]|\\033|\\e/g;
// Matches CSI (e.g. \x1b[31m) and OSC (e.g. \x1b]…\x07) sequences so we can
// passthrough pre-styled regions during highlighting instead of tokenizing them.
const ANSI_PASSTHROUGH_REGEX = /\x1b\[[0-9;:]*[A-Za-z]|\x1b\].*?(?:\x07|\x1b\\)/g;

function normalizeAnsiEscapes(text: string): string {
  return text.replace(LITERAL_ESCAPE_REGEX, '\x1b');
}

function containsAnsi(text: string): boolean {
  if (ANSI_REGEX.test(text)) return true;
  return LITERAL_ESCAPE_REGEX.test(text);
}

export function highlightWithAnsi(code: string, language: string): string {
  if (language === 'plain' || !code) {
    return code;
  }

  const resolvedLanguage = LANGUAGE_ALIASES[language] || language;
  const grammar = Prism.languages[resolvedLanguage];

  if (!grammar) {
    return code;
  }

  const tokenizeSegment = (segment: string): string => {
    if (!segment) return '';
    try {
      return Prism.tokenize(segment, grammar).map(processToken).join('');
    } catch {
      return segment;
    }
  };

  // Fast path: no embedded ANSI — tokenize the whole input.
  if (!code.includes('\x1b')) {
    return tokenizeSegment(code);
  }

  // Hybrid path: tokenize plain segments, passthrough ANSI sequences verbatim
  // so users can mix syntax-highlighted code with inline ANSI styling.
  let result = '';
  let lastIndex = 0;
  ANSI_PASSTHROUGH_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANSI_PASSTHROUGH_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += tokenizeSegment(code.slice(lastIndex, match.index));
    }
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) {
    result += tokenizeSegment(code.slice(lastIndex));
  }
  return result;
}

// Auto-detect language from code
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) return 'plain';

  const trimmed = code.trim();
  const firstLine = trimmed.split('\n')[0].trim();

  // Shell/Bash patterns
  if (
    /^(\$|#!\/bin\/(ba)?sh|#!\/usr\/bin\/env (ba)?sh)/.test(firstLine) ||
    /^\s*(sudo|apt|npm|yarn|pnpm|brew|pip|git|docker|kubectl|curl|wget|chmod|chown|ls|cd|mkdir|rm|cp|mv|cat|echo|export)\s/.test(trimmed)
  ) {
    return 'bash';
  }

  // JavaScript/TypeScript patterns
  if (/^(import|export|const|let|var|function|class|interface|type)\s/.test(firstLine)) {
    if (/:\s*(string|number|boolean|any|void|never|unknown)\b|interface\s+\w+|type\s+\w+\s*=|<[A-Z]\w*>/.test(trimmed)) {
      if (/<[A-Z][a-zA-Z]*[\s/>]|<\/[A-Z]/.test(trimmed)) {
        return 'tsx';
      }
      return 'typescript';
    }
    if (/<[A-Z][a-zA-Z]*[\s/>]|<\/[A-Z]/.test(trimmed)) {
      return 'jsx';
    }
    return 'javascript';
  }

  // Python patterns
  if (
    /^(def|class|import|from|if __name__|print\(|async def)\s/.test(firstLine) ||
    /^\s*(def|class|import|from)\s/.test(trimmed)
  ) {
    return 'python';
  }

  // Go patterns
  if (/^package\s+\w+|^func\s|^import\s+\(/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(fn|pub fn|impl|struct|enum|use|mod)\s/.test(trimmed) || /^#\[derive/.test(trimmed)) {
    return 'rust';
  }

  // JSON pattern
  if (/^\s*[[{]/.test(trimmed) && /[\]}]\s*$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // YAML patterns
  if (/^[a-zA-Z_][\w-]*:\s/.test(firstLine) && !trimmed.includes('{')) {
    return 'yaml';
  }

  return 'plain';
}

export interface GenerateSvgOptions {
  content: string;
  language?: string;
  template?: TemplateType;
  terminalTheme?: string;
  fontSize?: number;
  lineHeight?: number;
  padding?: PaddingTuple;
  title?: string;
  showControls?: boolean;
  controlsPosition?: ControlsPosition;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  width?: number | null;
  fontFamily?: string;
  header?: HeaderConfig;
  footer?: FooterConfig;
  watermark?: WatermarkConfig;
  /** Pre-fetched font data to embed (from fetchServerFont). Falls back to bundled JetBrains Mono. */
  customFontData?: { data: string; format: 'ttf' } | null;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** shellfie preset name (e.g. 'vercel', 'prisma'). When set, shellfie handles theme/template/overlays/background natively. */
  shellfiePreset?: string;
  /** Animation type to embed in the SVG */
  animation?: string;
  /** Background color override (solid hex or shellfie gradient string) */
  backgroundColorOverride?: string;
  /** Background padding override */
  backgroundPaddingOverride?: number;
  /** Animation color */
  animationColor?: string;
  /** Aspect ratio (e.g. '16:9', '1:1') */
  aspectRatio?: string;
  /** Radial gradient overlay function (for radial gradients shellfie can't render natively) */
  radialOverlay?: (w: number, h: number) => string;
}

/**
 * Generate SVG from code content (server-side)
 */
export function generateSvg(options: GenerateSvgOptions): string {
  const {
    content,
    language = 'auto',
    template = 'macos',
    terminalTheme = 'dracula',
    fontSize = 14,
    lineHeight = 1.4,
    padding = [16, 24, 16, 24],
    title,
    showControls = true,
    controlsPosition = 'left',
    borderRadius = 8,
    borderColor,
    borderWidth,
    width,
    fontFamily,
    header,
    footer,
    watermark,
    customFontData,
    lineNumbers,
    shellfiePreset,
    animation,
    backgroundColorOverride,
    backgroundPaddingOverride,
    animationColor,
    aspectRatio,
    radialOverlay,
  } = options;

  if (!content.trim()) {
    return '';
  }

  // Use pre-fetched font data if available.
  // Only fall back to bundled JetBrains Mono when the user's font IS JetBrains Mono
  // (or the default stack which starts with JetBrains Mono).
  // Otherwise we'd embed JetBrains Mono data labeled as the wrong font name.
  const primaryFont = fontFamily ? extractPrimaryFontFamily(fontFamily) : 'JetBrains Mono';
  const isJetBrainsMono = primaryFont === 'JetBrains Mono';
  const embeddedFont = customFontData ?? (isJetBrainsMono ? getEmbeddedFontData() : null);

  let svg: string;

  if (shellfiePreset) {
    // Shellfie preset is active — let shellfie handle everything natively
    // Normalize ANSI escapes (\e, \033, etc.) to real ESC bytes
    const normalizedContent = containsAnsi(content) ? normalizeAnsiEscapes(content) : content;
    const effectiveLanguage = language === 'auto' ? detectLanguage(content) : language;

    // Don't pass padding/fontSize/lineHeight/fontFamily — let the preset define them.
    // Only pass user-controllable overrides.
    // shellfie's highlight() does hybrid highlighting (tokenizes plain segments,
    // passes ANSI verbatim), so we let it handle ANSI-containing source too.
    svg = shellfie(normalizedContent, {
      preset: shellfiePreset,
      language: effectiveLanguage || 'auto',
      title: title || undefined,
      lineNumbers,
      watermark: buildWatermarkConfig(watermark),
      width: width || undefined,
      embedFont: false,
      animation: (animation as import('shellfie').AnimationType) || undefined,
      animationColor: animationColor || undefined,
      background: backgroundColorOverride
        ? { color: backgroundColorOverride, padding: backgroundPaddingOverride ?? 64 }
        : undefined,
      ...(borderColor ? { borderColor } : {}),
      ...(radialOverlay ? { overlays: radialOverlay } : {}),
    });
  } else {
    // No preset — manually build everything
    const effectiveLanguage = language === 'auto' ? detectLanguage(content) : language;
    const normalizedContent = containsAnsi(content) ? normalizeAnsiEscapes(content) : content;
    const highlightedContent = highlightWithAnsi(normalizedContent, effectiveLanguage);
    const theme = getTheme(terminalTheme);

    svg = shellfie(highlightedContent, {
      template: buildTemplate(template, controlsPosition, borderRadius, borderColor, borderWidth),
      theme,
      title: title || undefined,
      ...(borderColor ? { borderColor } : {}),
      fontSize,
      lineHeight,
      lineNumbers,
      padding,
      controls: showControls,
      watermark: buildWatermarkConfig(watermark),
      width: width || undefined,
      fontFamily: fontFamily || undefined,
      embedFont: false,
      header: buildHeaderOptions(header),
      footer: buildFooterOptions(footer),
      animation: (animation as import('shellfie').AnimationType) || undefined,
      animationColor: animationColor || undefined,
      background: backgroundColorOverride
        ? { color: backgroundColorOverride, padding: backgroundPaddingOverride ?? 32 }
        : undefined,
      ...(radialOverlay ? { overlays: radialOverlay } : {}),
    });
  }

  // Apply aspect ratio if set
  if (aspectRatio && aspectRatio !== 'auto') {
    svg = applyAspectRatio(svg, aspectRatio);
  }

  // Embed font as @font-face with correct format, matching the font-family name shellfie used
  if (embeddedFont) {
    return embedFontInSvgServer(svg, primaryFont, embeddedFont.data);
  }

  return svg;
}

/**
 * Calculate dimensions with aspect ratio constraint
 */
function calculateAspectRatioDimensions(
  contentWidth: number,
  contentHeight: number,
  aspectRatio: ImageAspectRatio,
  padding: number
): { totalWidth: number; totalHeight: number; offsetX: number; offsetY: number } {
  const baseWidth = contentWidth + padding * 2;
  const baseHeight = contentHeight + padding * 2;

  // Handle auto, undefined, null, or empty string - use base dimensions
  if (!aspectRatio || aspectRatio === 'auto') {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }

  // Validate aspect ratio format (e.g., "16:9", "4:3")
  if (!aspectRatio.includes(':')) {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }

  const [w, h] = aspectRatio.split(':').map(Number);

  // Validate parsed values
  if (!w || !h || isNaN(w) || isNaN(h)) {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }
  const targetRatio = w / h;
  const currentRatio = baseWidth / baseHeight;

  let totalWidth: number;
  let totalHeight: number;

  if (currentRatio > targetRatio) {
    // Content is wider than target ratio - expand height to match
    totalWidth = baseWidth;
    totalHeight = baseWidth / targetRatio;
  } else {
    // Content is taller than target ratio - expand width to match
    totalHeight = baseHeight;
    totalWidth = baseHeight * targetRatio;
  }

  // Always center the content within the expanded dimensions
  const offsetX = (totalWidth - contentWidth) / 2;
  const offsetY = (totalHeight - contentHeight) / 2;

  return { totalWidth, totalHeight, offsetX, offsetY };
}

/**
 * Extracts width and height from SVG content
 */
function getSvgDimensions(svgContent: string): { width: number; height: number } {
  // Parse SVG dimensions using regex (server-side, no DOMParser)
  const widthMatch = svgContent.match(/width="([^"]+)"/);
  const heightMatch = svgContent.match(/height="([^"]+)"/);
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);

  let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 0;

  if ((!width || !height) && viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(parseFloat);
    if (parts.length === 4) {
      width = width || parts[2];
      height = height || parts[3];
    }
  }

  return { width: width || 800, height: height || 600 };
}

/**
 * Extracts the inner content of an SVG
 */
function extractSvgContent(svgString: string): string {
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : '';
}

/**
 * Generates SVG background element based on config
 */
function generateSvgBackground(
  background: BackgroundConfig,
  totalWidth: number,
  totalHeight: number,
  borderRadius: number = 12
): string {
  if (background.type === 'none') return '';

  const GRADIENT_DIRECTIONS: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
    'to-right': { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
    'to-left': { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
    'to-bottom': { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
    'to-top': { x1: '0%', y1: '100%', x2: '0%', y2: '0%' },
    'to-bottom-right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
    'to-top-left': { x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
    'to-bottom-left': { x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
    'to-top-right': { x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
  };

  switch (background.type) {
    case 'solid':
      return `<rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="${background.color}"/>`;

    case 'gradient': {
      const isRadialReverse = background.gradientDirection === 'radial-reverse';
      const isRadial = background.gradientDirection === 'radial' || isRadialReverse;
      const fromColor = isRadialReverse ? background.gradientTo : background.gradientFrom;
      const toColor = isRadialReverse ? background.gradientFrom : background.gradientTo;

      if (isRadial) {
        // Calculate radius to match CSS radial-gradient(circle, ...) behavior
        // We use userSpaceOnUse to properly scale the gradient for non-square dimensions
        const radius = Math.max(totalWidth, totalHeight);
        const cx = totalWidth / 2;
        const cy = totalHeight / 2;
        return `
          <defs>
            <radialGradient id="bgGradient" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${radius / 2}" fx="${cx}" fy="${cy}">
              <stop offset="0%" stop-color="${fromColor}"/>
              <stop offset="100%" stop-color="${toColor}"/>
            </radialGradient>
          </defs>
          <rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="url(#bgGradient)"/>`;
      }
      const dir = GRADIENT_DIRECTIONS[background.gradientDirection] || GRADIENT_DIRECTIONS['to-right'];
      return `
        <defs>
          <linearGradient id="bgGradient" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}">
            <stop offset="0%" stop-color="${background.gradientFrom}"/>
            <stop offset="100%" stop-color="${background.gradientTo}"/>
          </linearGradient>
        </defs>
        <rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="url(#bgGradient)"/>`;
    }

    default:
      return '';
  }
}

/**
 * Wraps an SVG with a background (server-side version)
 */
export function wrapSvgWithBackground(
  svgContent: string,
  background: BackgroundConfig,
  borderRadius = 8
): string {
  if (background.type === 'none') {
    return svgContent;
  }

  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);
  const padding = background.padding ?? 0;
  const aspectRatio = background.imageAspectRatio ?? 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);
  const innerContent = extractSvgContent(svgContent);

  // Extract any existing defs (fonts, etc.) from the inner SVG
  const defsMatch = svgContent.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i);
  const existingDefs = defsMatch ? defsMatch[1] : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>${existingDefs}</defs>
  ${backgroundSvg}
  <g transform="translate(${offsetX}, ${offsetY})">
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${innerContent}
    </svg>
  </g>
</svg>`;
}

/**
 * Escapes XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


export interface CompareLabelConfig {
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface GenerateCompareSvgOptions extends Omit<GenerateSvgOptions, 'content' | 'title'> {
  beforeContent: string;
  afterContent: string;
  beforeLabel: string;
  afterLabel: string;
  beforeTitle?: string;
  afterTitle?: string;
  beforeLanguage?: string;
  afterLanguage?: string;
  compareLabelConfig: CompareLabelConfig;
  background?: BackgroundConfig;
  /** Pre-fetched label font data for embedding (from fetchServerFont) */
  labelFontData?: { data: string; format: 'ttf' } | null;
}

/**
 * Generate a combined compare mode SVG with two terminals side by side
 */
export function generateCompareSvg(options: GenerateCompareSvgOptions): string {
  const {
    beforeContent,
    afterContent,
    beforeLabel,
    afterLabel,
    beforeTitle = 'Terminal',
    afterTitle = 'Terminal',
    beforeLanguage = 'auto',
    afterLanguage = 'auto',
    compareLabelConfig,
    background,
    ...sharedOptions
  } = options;

  // Generate individual SVGs
  const beforeSvg = beforeContent
    ? generateSvg({ content: beforeContent, language: beforeLanguage, title: beforeTitle, ...sharedOptions })
    : '';
  const afterSvg = afterContent
    ? generateSvg({ content: afterContent, language: afterLanguage, title: afterTitle, ...sharedOptions })
    : '';

  if (!beforeSvg && !afterSvg) {
    return '';
  }

  // Get dimensions and match widths
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };
  const maxWidth = Math.max(beforeDims.width, afterDims.width);

  // Regenerate with matched widths if needed
  let finalBeforeSvg = beforeSvg;
  let finalAfterSvg = afterSvg;

  if (beforeSvg && beforeDims.width < maxWidth) {
    finalBeforeSvg = generateSvg({
      content: beforeContent,
      language: beforeLanguage,
      title: beforeTitle,
      ...sharedOptions,
      width: maxWidth,
    });
  }
  if (afterSvg && afterDims.width < maxWidth) {
    finalAfterSvg = generateSvg({
      content: afterContent,
      language: afterLanguage,
      title: afterTitle,
      ...sharedOptions,
      width: maxWidth,
    });
  }

  // Get final dimensions
  const finalBeforeDims = finalBeforeSvg ? getSvgDimensions(finalBeforeSvg) : beforeDims;
  const finalAfterDims = finalAfterSvg ? getSvgDimensions(finalAfterSvg) : afterDims;

  // Layout constants
  const gap = 32;
  const labelHeight = compareLabelConfig.fontSize + 24;
  const basePadding = background && background.type !== 'none' ? (background.padding ?? 32) : 32;
  const maxHeight = Math.max(finalBeforeDims.height, finalAfterDims.height);

  // Calculate base content dimensions (before aspect ratio adjustment)
  const contentWidth = finalBeforeDims.width + gap + finalAfterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final dimensions
  const aspectRatio = background && background.type !== 'none' ? (background.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

  // Mirror downloadCompareSvg: embed labelFontData when present (Google Font),
  // otherwise leave the user's font-family stack untouched so the browser resolves it.
  let effectiveLabelFontFamily = compareLabelConfig.fontFamily;
  let fontFaceStyle = '';
  const fontWeight = compareLabelConfig.fontWeight;

  if (options.labelFontData) {
    const primaryLabelFont = extractPrimaryFontFamily(compareLabelConfig.fontFamily);
    effectiveLabelFontFamily = `'${primaryLabelFont}', ${compareLabelConfig.fontFamily}`;
    fontFaceStyle = `@font-face { font-family: '${primaryLabelFont}'; src: url('data:font/ttf;base64,${options.labelFontData.data}') format('truetype'); font-weight: ${fontWeight}; }`;
  }

  // Calculate label positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + finalBeforeDims.width + gap;
  let textAnchor = 'start';

  if (compareLabelConfig.alignment === 'center') {
    beforeLabelX = offsetX + finalBeforeDims.width / 2;
    afterLabelX = offsetX + finalBeforeDims.width + gap + finalAfterDims.width / 2;
    textAnchor = 'middle';
  } else if (compareLabelConfig.alignment === 'right') {
    beforeLabelX = offsetX + finalBeforeDims.width;
    afterLabelX = offsetX + finalBeforeDims.width + gap + finalAfterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = background ? generateSvgBackground(background, totalWidth, totalHeight) : '';

  // Create combined SVG - all fonts embedded as base64, no @import needed
  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style><![CDATA[
      ${fontFaceStyle}
      .label {
        font-family: ${effectiveLabelFontFamily};
        font-size: ${compareLabelConfig.fontSize}px;
        font-weight: ${compareLabelConfig.fontWeight};
        fill: ${compareLabelConfig.color};
        text-anchor: ${textAnchor};
      }
    ]]></style>
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${offsetY + compareLabelConfig.fontSize}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${offsetY + compareLabelConfig.fontSize}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${offsetX}, ${offsetY + labelHeight})">
    ${finalBeforeSvg ? extractSvgContent(finalBeforeSvg) : `<rect width="${finalBeforeDims.width}" height="${finalBeforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${offsetX + finalBeforeDims.width + gap}, ${offsetY + labelHeight})">
    ${finalAfterSvg ? extractSvgContent(finalAfterSvg) : `<rect width="${finalAfterDims.width}" height="${finalAfterDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>
</svg>`;

  return combinedSvg;
}

export type { BackgroundConfig, BackgroundType, GradientDirection, ImageAspectRatio };
