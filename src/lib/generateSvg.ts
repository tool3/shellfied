/**
 * Server-side SVG generation utilities
 * Used by API routes for static image serving and OG image generation
 */

import shellfie, { templates, type Theme, createTheme } from 'shellfie';
import type { WatermarkStyle, WatermarkConfig as ShellfieWatermarkConfig } from 'shellfie';
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

const allThemes: Record<string, Theme> = {
  ...themes,
  nightOwl,
  cobalt2,
  materialDark,
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
  borderRadius: number
) {
  const baseTemplate = templates[templateType];
  if (!baseTemplate) return templateType;

  const defaultPosition = templateType === 'windows' ? 'right' : 'left';
  const defaultRadius = baseTemplate.shell.borderRadius;

  if (controlsPosition === defaultPosition && borderRadius === defaultRadius) {
    return templateType;
  }

  return {
    ...baseTemplate,
    shell: {
      ...baseTemplate.shell,
      controlsPosition,
      borderRadius,
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

  const color = TOKEN_COLORS[token.type] || '';
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

function normalizeAnsiEscapes(text: string): string {
  return text.replace(LITERAL_ESCAPE_REGEX, '\x1b');
}

function containsAnsi(text: string): boolean {
  if (ANSI_REGEX.test(text)) return true;
  return LITERAL_ESCAPE_REGEX.test(text);
}

export function highlightWithAnsi(code: string, language: string): string {
  if (containsAnsi(code)) {
    return normalizeAnsiEscapes(code);
  }

  if (language === 'plain' || !code) {
    return code;
  }

  const resolvedLanguage = LANGUAGE_ALIASES[language] || language;
  const grammar = Prism.languages[resolvedLanguage];

  if (!grammar) {
    return code;
  }

  try {
    const tokens = Prism.tokenize(code, grammar);
    return tokens.map(processToken).join('');
  } catch {
    return code;
  }
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
  width?: number | null;
  fontFamily?: string;
  header?: HeaderConfig;
  footer?: FooterConfig;
  watermark?: WatermarkConfig;
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
    width,
    fontFamily,
    header,
    footer,
    watermark,
  } = options;

  if (!content.trim()) {
    return '';
  }

  // Resolve language
  const effectiveLanguage = language === 'auto' ? detectLanguage(content) : language;

  // Apply syntax highlighting
  const highlightedContent = highlightWithAnsi(content, effectiveLanguage);

  // Get theme
  const theme = getTheme(terminalTheme);

  // Generate SVG
  const svg = shellfie(highlightedContent, {
    template: buildTemplate(template, controlsPosition, borderRadius),
    theme,
    title: title || undefined,
    fontSize,
    lineHeight,
    padding,
    controls: showControls,
    watermark: buildWatermarkConfig(watermark),
    width: width || undefined,
    fontFamily: fontFamily || undefined,
    header: buildHeaderOptions(header),
    footer: buildFooterOptions(footer),
  });

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
        return `
          <defs>
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
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
  background: BackgroundConfig
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

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
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

/**
 * Map font family to Google Fonts URL for embedding in SVG
 */
function getFontImportUrl(fontFamily: string): string | null {
  const fontMap: Record<string, string> = {
    'Inter': 'Inter:wght@400;500;600;700',
    'Roboto': 'Roboto:wght@400;500;700',
    'Poppins': 'Poppins:wght@400;500;600;700',
    'Montserrat': 'Montserrat:wght@400;500;600;700',
    'Open Sans': 'Open+Sans:wght@400;500;600;700',
    'Lato': 'Lato:wght@400;700',
    'Oswald': 'Oswald:wght@400;500;600;700',
    'Raleway': 'Raleway:wght@400;500;600;700',
    'Nunito': 'Nunito:wght@400;500;600;700',
    'Ubuntu': 'Ubuntu:wght@400;500;700',
    'Rubik': 'Rubik:wght@400;500;600;700',
    'Work Sans': 'Work+Sans:wght@400;500;600;700',
    'Quicksand': 'Quicksand:wght@400;500;600;700',
    'Bebas Neue': 'Bebas+Neue',
    'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
    'Merriweather': 'Merriweather:wght@400;700',
    'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
  };

  // Extract the primary font name from the font-family or font shorthand string
  // Handle both "Inter, sans-serif" and "600 16px Inter, sans-serif"
  const fontFamilyPart = fontFamily.includes('px ')
    ? fontFamily.split('px ')[1]
    : fontFamily;
  const primaryFont = fontFamilyPart.split(',')[0].trim().replace(/['"]/g, '');

  if (fontMap[primaryFont]) {
    // Use &amp; for XML/SVG compatibility
    return `https://fonts.googleapis.com/css2?family=${fontMap[primaryFont]}&amp;display=swap`;
  }
  return null;
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
  const padding = background && background.type !== 'none' ? (background.padding ?? 32) : 32;
  const maxHeight = Math.max(finalBeforeDims.height, finalAfterDims.height);
  const totalWidth = finalBeforeDims.width + gap + finalAfterDims.width + padding * 2;
  const totalHeight = maxHeight + labelHeight + padding * 2;

  // Build label font string
  const labelFont = `${compareLabelConfig.fontWeight} ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`;

  // Calculate label positions based on alignment
  let beforeLabelX = padding;
  let afterLabelX = padding + finalBeforeDims.width + gap;
  let textAnchor = 'start';

  if (compareLabelConfig.alignment === 'center') {
    beforeLabelX = padding + finalBeforeDims.width / 2;
    afterLabelX = padding + finalBeforeDims.width + gap + finalAfterDims.width / 2;
    textAnchor = 'middle';
  } else if (compareLabelConfig.alignment === 'right') {
    beforeLabelX = padding + finalBeforeDims.width;
    afterLabelX = padding + finalBeforeDims.width + gap + finalAfterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = background ? generateSvgBackground(background, totalWidth, totalHeight) : '';

  // Get font import URL if using a Google Font
  const fontImportUrl = getFontImportUrl(labelFont);
  const fontImportStyle = fontImportUrl ? `@import url('${fontImportUrl}');` : '';

  // Create combined SVG
  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style>
      ${fontImportStyle}
      .label { font: ${labelFont}; fill: ${compareLabelConfig.color}; text-anchor: ${textAnchor}; }
    </style>
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${padding + compareLabelConfig.fontSize}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${padding + compareLabelConfig.fontSize}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${padding}, ${padding + labelHeight})">
    ${finalBeforeSvg ? extractSvgContent(finalBeforeSvg) : `<rect width="${finalBeforeDims.width}" height="${finalBeforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${padding + finalBeforeDims.width + gap}, ${padding + labelHeight})">
    ${finalAfterSvg ? extractSvgContent(finalAfterSvg) : `<rect width="${finalAfterDims.width}" height="${finalAfterDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>
</svg>`;

  return combinedSvg;
}

export type { BackgroundConfig, BackgroundType, GradientDirection, ImageAspectRatio };
