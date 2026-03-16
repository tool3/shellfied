import LZString from 'lz-string';
import type {
  TemplateType,
  ControlsPosition,
  ColorMode,
  ExportFormat,
  ExportScale,
  PaddingTuple,
  BackgroundType,
  GradientDirection,
  ImageAspectRatio,
  WatermarkType,
  CompareLabelAlignment,
} from '@/types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CONTENT,
  DEFAULT_LANGUAGE,
  DEFAULT_COLOR_MODE,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_SCALE,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_HEADER,
  DEFAULT_FOOTER,
  DEFAULT_BACKGROUND,
  DEFAULT_WATERMARK,
} from '@/constants/defaults';

// URL parameter short names to minimize URL length
export const URL_PARAM_MAP = {
  // Mode
  mode: 'm',
  output: 'o', // 'svg' | 'png' | 'webp' | 'jpeg' - serves static image in view mode

  // Core settings
  template: 'tp',
  terminalTheme: 'th',
  fontSize: 'fs',
  lineHeight: 'lh',
  padding: 'pd',
  title: 'ti',
  showControls: 'sc',
  controlsPosition: 'cp',
  borderRadius: 'br',
  width: 'wd',
  fontFamily: 'ff',

  // Export settings
  exportFormat: 'ef',
  exportScale: 'es',
  jpegQuality: 'jq',

  // Editor content
  content: 'c',
  language: 'lg',
  colorMode: 'cm',

  // Compare mode
  compareMode: 'cmp',
  beforeContent: 'bc',
  afterContent: 'ac',
  beforeLabel: 'bl',
  afterLabel: 'al',
  beforeTitle: 'bti',
  afterTitle: 'ati',
  beforeLanguage: 'blg',
  afterLanguage: 'alg',
  compareLabelFontSize: 'clf',
  compareLabelFontFamily: 'clff',
  compareLabelFontWeight: 'clfw',
  compareLabelColor: 'clc',
  compareLabelAlignment: 'cla',

  // Watermark
  watermarkType: 'wt',
  watermarkText: 'wtx',
  watermarkStyle: 'wst',
  watermarkMarkup: 'wmk',

  // Header
  headerEnabled: 'he',
  headerBgColor: 'hbg',
  headerHeight: 'hh',
  headerBorder: 'hbd',
  headerBorderColor: 'hbc',
  headerBorderWidth: 'hbw',

  // Footer
  footerEnabled: 'fe',
  footerBgColor: 'fbg',
  footerHeight: 'fh',
  footerBorder: 'fbd',
  footerBorderColor: 'fbc',
  footerBorderWidth: 'fbw',

  // Background
  bgType: 'bt',
  bgColor: 'bgc',
  bgGradientFrom: 'bgf',
  bgGradientTo: 'bgt',
  bgGradientDirection: 'bgd',
  bgImageAspectRatio: 'bga',
  bgPadding: 'bgp',
} as const;

// Reverse mapping for decoding
export const PARAM_TO_KEY_MAP = Object.fromEntries(
  Object.entries(URL_PARAM_MAP).map(([k, v]) => [v, k])
) as Record<string, keyof typeof URL_PARAM_MAP>;

// Compress string using gzip
async function compressString(str: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  const compressed = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(compressed);
}

// Decompress gzip data
async function decompressData(data: Uint8Array): Promise<string> {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(data as ArrayBufferView<ArrayBuffer>);
  writer.close();
  const decompressed = await new Response(stream.readable).arrayBuffer();
  const decoder = new TextDecoder();
  return decoder.decode(decompressed);
}

// Convert Uint8Array to URL-safe base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert URL-safe base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standardBase64 + '==='.slice(0, (4 - (standardBase64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// URL-safe Base64 encoding with gzip compression
// Prefix: 'z.' indicates compressed, no prefix for uncompressed (backward compatible)
export function encodeBase64(str: string): string {
  try {
    // For sync encoding (generateShareUrl is sync), use plain base64
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

// Async version with compression - use for content that benefits from compression
export async function encodeBase64Compressed(str: string): Promise<string> {
  try {
    // Only compress if CompressionStream is available and content is large enough
    if (typeof CompressionStream !== 'undefined' && str.length > 100) {
      const compressed = await compressString(str);
      const base64 = uint8ArrayToBase64(compressed);
      // Only use compressed if it's actually smaller
      const uncompressed = btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      if (base64.length + 2 < uncompressed.length) {
        return 'z.' + base64;
      }
      return uncompressed;
    }
    return encodeBase64(str);
  } catch {
    return encodeBase64(str);
  }
}

// URL-safe Base64 decoding (handles both compressed and uncompressed)
export function decodeBase64(str: string): string {
  try {
    // Check for compressed prefix
    if (str.startsWith('z.')) {
      // Compressed - decode synchronously is not possible, return empty
      // This path shouldn't be hit since we use decodeBase64Async for compressed
      return '';
    }
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

// Async version that handles decompression
export async function decodeBase64Async(str: string): Promise<string> {
  try {
    // Check for compressed prefix
    if (str.startsWith('z.')) {
      const base64 = str.slice(2);
      const bytes = base64ToUint8Array(base64);
      return await decompressData(bytes);
    }
    // Fall back to sync decode for uncompressed
    return decodeBase64(str);
  } catch {
    // Fall back to sync decode on error
    return decodeBase64(str);
  }
}

// Check if a string is compressed (for deciding sync vs async decode)
export function isCompressed(str: string): boolean {
  return str.startsWith('z.');
}

// Padding tuple encoding: [16, 24, 16, 24] -> "16,24,16,24"
export function encodePadding(padding: PaddingTuple): string {
  return padding.join(',');
}

export function decodePadding(str: string): PaddingTuple | null {
  const parts = str.split(',').map(Number);
  if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0)) {
    return parts as PaddingTuple;
  }
  return null;
}

// Boolean encoding
export function encodeBool(value: boolean): string {
  return value ? '1' : '0';
}

export function decodeBool(str: string | null, defaultValue: boolean = false): boolean {
  if (str === '1') return true;
  if (str === '0') return false;
  return defaultValue;
}

// Share mode type
export type ShareMode = 'view' | 'edit';

// Output type for static image serving
export type OutputFormat = 'svg' | 'png' | 'webp' | 'jpeg';

// Get share mode from URL
export function getShareMode(): ShareMode | null {
  const params = new URLSearchParams(window.location.search);

  // Check for LZ-compressed data first
  const compressedData = params.get('d');
  if (compressedData) {
    const compact = decompressLZData(compressedData);
    if (compact?.m) {
      return compact.m;
    }
    // If compressed but no mode, default to view
    return 'view';
  }

  // Fall back to legacy mode parameter
  const mode = params.get(URL_PARAM_MAP.mode) || params.get('mode');

  if (mode === 'view') return 'view';
  if (mode === 'edit') return 'edit';

  // If there are URL params but no mode, default to view
  if (params.size > 0) return 'view';

  return null;
}

// Get output format from URL (for static image serving in view mode)
export function getOutputFormat(): OutputFormat | null {
  const params = new URLSearchParams(window.location.search);
  const output = params.get(URL_PARAM_MAP.output) || params.get('output');

  if (output && ['svg', 'png', 'webp', 'jpeg'].includes(output)) {
    return output as OutputFormat;
  }

  return null;
}

// State interface for URL serialization
export interface UrlState {
  // Core settings
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

  // Export
  exportFormat?: ExportFormat;
  exportScale?: ExportScale;
  jpegQuality?: number;

  // Editor
  content?: string;
  language?: string;
  colorMode?: ColorMode;

  // Compare mode
  compareMode?: boolean;
  beforeContent?: string;
  afterContent?: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeTitle?: string;
  afterTitle?: string;
  beforeLanguage?: string;
  afterLanguage?: string;
  compareLabelConfig?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    color?: string;
    alignment?: CompareLabelAlignment;
  };

  // Watermark
  watermark?: {
    type?: WatermarkType;
    text?: string;
    style?: string;
    markup?: string;
  };

  // Header
  header?: {
    enabled?: boolean;
    backgroundColor?: string;
    height?: number;
    border?: boolean;
    borderColor?: string;
    borderWidth?: number;
  };

  // Footer
  footer?: {
    enabled?: boolean;
    backgroundColor?: string;
    height?: number;
    border?: boolean;
    borderColor?: string;
    borderWidth?: number;
  };

  // Background
  background?: {
    type?: BackgroundType;
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: GradientDirection;
    imageAspectRatio?: ImageAspectRatio;
    padding?: number;
  };
}

// Internal helper to build share URL params
function buildShareUrlParams(
  state: UrlState,
  mode: ShareMode,
  contentEncoder: (str: string) => string
): URLSearchParams {
  const params = new URLSearchParams();

  params.set(URL_PARAM_MAP.mode, mode);

  // Helper to add param only if different from default
  const addIfChanged = <T>(
    key: keyof typeof URL_PARAM_MAP,
    value: T | undefined,
    defaultValue: T,
    encoder: (v: T) => string = String
  ) => {
    if (value !== undefined && value !== defaultValue) {
      params.set(URL_PARAM_MAP[key], encoder(value));
    }
  };

  // Core settings
  addIfChanged('template', state.template, DEFAULT_SETTINGS.template);
  addIfChanged('terminalTheme', state.terminalTheme, DEFAULT_SETTINGS.terminalTheme);
  addIfChanged('fontSize', state.fontSize, DEFAULT_SETTINGS.fontSize);
  addIfChanged('lineHeight', state.lineHeight, DEFAULT_SETTINGS.lineHeight);
  addIfChanged('title', state.title, DEFAULT_SETTINGS.title);
  addIfChanged('showControls', state.showControls, DEFAULT_SETTINGS.showControls, encodeBool);
  addIfChanged('controlsPosition', state.controlsPosition, DEFAULT_SETTINGS.controlsPosition);
  addIfChanged('borderRadius', state.borderRadius, DEFAULT_SETTINGS.borderRadius);
  addIfChanged('width', state.width, DEFAULT_SETTINGS.width, (v) => (v === null ? '' : String(v)));

  // Padding - encode as comma-separated
  if (state.padding && JSON.stringify(state.padding) !== JSON.stringify(DEFAULT_SETTINGS.padding)) {
    params.set(URL_PARAM_MAP.padding, encodePadding(state.padding));
  }

  // Font family - Base64 encode since it can have special chars
  if (state.fontFamily && state.fontFamily !== DEFAULT_SETTINGS.fontFamily) {
    params.set(URL_PARAM_MAP.fontFamily, encodeBase64(state.fontFamily));
  }

  // Export settings
  addIfChanged('exportFormat', state.exportFormat, DEFAULT_EXPORT_FORMAT);
  addIfChanged('exportScale', state.exportScale, DEFAULT_EXPORT_SCALE);
  addIfChanged('jpegQuality', state.jpegQuality, DEFAULT_JPEG_QUALITY);

  // Content - use provided encoder (may be compressed)
  if (state.content && state.content !== DEFAULT_CONTENT) {
    params.set(URL_PARAM_MAP.content, contentEncoder(state.content));
  }

  addIfChanged('language', state.language, DEFAULT_LANGUAGE);
  addIfChanged('colorMode', state.colorMode, DEFAULT_COLOR_MODE);

  // Compare mode
  addIfChanged('compareMode', state.compareMode, false, encodeBool);

  if (state.compareMode) {
    if (state.beforeContent) {
      params.set(URL_PARAM_MAP.beforeContent, contentEncoder(state.beforeContent));
    }
    if (state.afterContent) {
      params.set(URL_PARAM_MAP.afterContent, contentEncoder(state.afterContent));
    }
    addIfChanged('beforeLabel', state.beforeLabel, 'Before');
    addIfChanged('afterLabel', state.afterLabel, 'After');
    addIfChanged('beforeLanguage', state.beforeLanguage, 'auto');
    addIfChanged('afterLanguage', state.afterLanguage, 'auto');

    // Compare label config
    if (state.compareLabelConfig) {
      addIfChanged('compareLabelFontSize', state.compareLabelConfig.fontSize, 16);
      if (state.compareLabelConfig.fontFamily && state.compareLabelConfig.fontFamily !== 'system-ui, -apple-system, sans-serif') {
        params.set(URL_PARAM_MAP.compareLabelFontFamily, encodeBase64(state.compareLabelConfig.fontFamily));
      }
      addIfChanged('compareLabelFontWeight', state.compareLabelConfig.fontWeight, 600);
      addIfChanged('compareLabelColor', state.compareLabelConfig.color, '#ffffff');
      addIfChanged('compareLabelAlignment', state.compareLabelConfig.alignment, 'left');
    }
  }

  // Watermark
  if (state.watermark) {
    addIfChanged('watermarkType', state.watermark.type, DEFAULT_WATERMARK.type);
    if (state.watermark.text) {
      params.set(URL_PARAM_MAP.watermarkText, encodeBase64(state.watermark.text));
    }
    if (state.watermark.style && state.watermark.style !== DEFAULT_WATERMARK.style) {
      params.set(URL_PARAM_MAP.watermarkStyle, encodeBase64(state.watermark.style));
    }
    if (state.watermark.markup && state.watermark.markup !== DEFAULT_WATERMARK.markup) {
      params.set(URL_PARAM_MAP.watermarkMarkup, encodeBase64(state.watermark.markup));
    }
  }

  // Header
  if (state.header) {
    addIfChanged('headerEnabled', state.header.enabled, DEFAULT_HEADER.enabled, encodeBool);
    if (state.header.enabled) {
      if (state.header.backgroundColor) {
        params.set(URL_PARAM_MAP.headerBgColor, state.header.backgroundColor);
      }
      addIfChanged('headerHeight', state.header.height, DEFAULT_HEADER.height);
      addIfChanged('headerBorder', state.header.border, DEFAULT_HEADER.border, encodeBool);
      if (state.header.border) {
        addIfChanged('headerBorderColor', state.header.borderColor, DEFAULT_HEADER.borderColor);
        addIfChanged('headerBorderWidth', state.header.borderWidth, DEFAULT_HEADER.borderWidth);
      }
    }
  }

  // Footer
  if (state.footer) {
    addIfChanged('footerEnabled', state.footer.enabled, DEFAULT_FOOTER.enabled, encodeBool);
    if (state.footer.enabled) {
      if (state.footer.backgroundColor) {
        params.set(URL_PARAM_MAP.footerBgColor, state.footer.backgroundColor);
      }
      addIfChanged('footerHeight', state.footer.height, DEFAULT_FOOTER.height);
      addIfChanged('footerBorder', state.footer.border, DEFAULT_FOOTER.border, encodeBool);
      if (state.footer.border) {
        addIfChanged('footerBorderColor', state.footer.borderColor, DEFAULT_FOOTER.borderColor);
        addIfChanged('footerBorderWidth', state.footer.borderWidth, DEFAULT_FOOTER.borderWidth);
      }
    }
  }

  // Background (exclude image - too large for URL)
  if (state.background) {
    addIfChanged('bgType', state.background.type, DEFAULT_BACKGROUND.type);
    if (state.background.type === 'solid') {
      addIfChanged('bgColor', state.background.color, DEFAULT_BACKGROUND.color);
    }
    if (state.background.type === 'gradient') {
      addIfChanged('bgGradientFrom', state.background.gradientFrom, DEFAULT_BACKGROUND.gradientFrom);
      addIfChanged('bgGradientTo', state.background.gradientTo, DEFAULT_BACKGROUND.gradientTo);
      addIfChanged('bgGradientDirection', state.background.gradientDirection, DEFAULT_BACKGROUND.gradientDirection);
    }
    addIfChanged('bgImageAspectRatio', state.background.imageAspectRatio, DEFAULT_BACKGROUND.imageAspectRatio);
    addIfChanged('bgPadding', state.background.padding, DEFAULT_BACKGROUND.padding);
  }

  return params;
}

// Generate share URL from state (sync version, no compression)
export function generateShareUrl(state: UrlState, mode: ShareMode = 'view'): string {
  const params = buildShareUrlParams(state, mode, encodeBase64);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Generate share URL with compression (async version, uses gzip for content)
export async function generateShareUrlCompressed(state: UrlState, mode: ShareMode = 'view'): Promise<string> {
  // Pre-compress all content fields
  const contentFields: string[] = [];
  if (state.content && state.content !== DEFAULT_CONTENT) {
    contentFields.push(state.content);
  }
  if (state.compareMode) {
    if (state.beforeContent) contentFields.push(state.beforeContent);
    if (state.afterContent) contentFields.push(state.afterContent);
  }

  // Compress all content in parallel
  const encodedMap = new Map<string, string>();
  await Promise.all(
    contentFields.map(async (content) => {
      const encoded = await encodeBase64Compressed(content);
      encodedMap.set(content, encoded);
    })
  );

  // Build URL with pre-encoded content
  const encoder = (str: string) => encodedMap.get(str) ?? encodeBase64(str);
  const params = buildShareUrlParams(state, mode, encoder);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Generate static image URL (serves raw image without UI via API route)
export function generateStaticUrl(
  state: UrlState,
  format: 'svg' | 'png' | 'webp' | 'jpeg'
): string {
  // Use LZ compression for API route
  return generateStaticUrlLZ(state, format);
}

// Compact state object for LZ compression
interface CompactState {
  m?: ShareMode; // mode
  tp?: string; // template
  th?: string; // terminalTheme
  fs?: number; // fontSize
  lh?: number; // lineHeight
  pd?: PaddingTuple; // padding
  ti?: string; // title
  sc?: boolean; // showControls
  cp?: string; // controlsPosition
  br?: number; // borderRadius
  wd?: number | null; // width
  ff?: string; // fontFamily
  ef?: string; // exportFormat
  es?: number; // exportScale
  jq?: number; // jpegQuality
  c?: string; // content
  lg?: string; // language
  cm?: string; // colorMode
  cmp?: boolean; // compareMode
  bc?: string; // beforeContent
  ac?: string; // afterContent
  bl?: string; // beforeLabel
  al?: string; // afterLabel
  bti?: string; // beforeTitle
  ati?: string; // afterTitle
  blg?: string; // beforeLanguage
  alg?: string; // afterLanguage
  clf?: number; // compareLabelFontSize
  clff?: string; // compareLabelFontFamily
  clfw?: number; // compareLabelFontWeight
  clc?: string; // compareLabelColor
  cla?: string; // compareLabelAlignment
  wt?: string; // watermarkType
  wtx?: string; // watermarkText
  wst?: string; // watermarkStyle
  wmk?: string; // watermarkMarkup
  he?: boolean; // headerEnabled
  hbg?: string; // headerBgColor
  hh?: number; // headerHeight
  hbd?: boolean; // headerBorder
  hbc?: string; // headerBorderColor
  hbw?: number; // headerBorderWidth
  fe?: boolean; // footerEnabled
  fbg?: string; // footerBgColor
  fh?: number; // footerHeight
  fbd?: boolean; // footerBorder
  fbc?: string; // footerBorderColor
  fbw?: number; // footerBorderWidth
  bt?: string; // bgType
  bgc?: string; // bgColor
  bgf?: string; // bgGradientFrom
  bgt?: string; // bgGradientTo
  bgd?: string; // bgGradientDirection
  bgp?: number; // bgPadding
  bga?: string; // bgImageAspectRatio
}

// Build compact state for LZ compression
// includeContent: when true, always include content even if it matches default (needed for static API URLs)
function buildCompactState(state: UrlState, mode: ShareMode, includeContent: boolean = false): CompactState {
  const compact: CompactState = { m: mode };

  const add = <K extends keyof CompactState, T>(key: K, value: T | undefined, defaultValue: T) => {
    if (value !== undefined && value !== defaultValue) {
      compact[key] = value as CompactState[K];
    }
  };

  add('tp', state.template, DEFAULT_SETTINGS.template);
  add('th', state.terminalTheme, DEFAULT_SETTINGS.terminalTheme);
  add('fs', state.fontSize, DEFAULT_SETTINGS.fontSize);
  add('lh', state.lineHeight, DEFAULT_SETTINGS.lineHeight);
  add('ti', state.title, DEFAULT_SETTINGS.title);
  add('sc', state.showControls, DEFAULT_SETTINGS.showControls);
  add('cp', state.controlsPosition, DEFAULT_SETTINGS.controlsPosition);
  add('br', state.borderRadius, DEFAULT_SETTINGS.borderRadius);
  add('wd', state.width, DEFAULT_SETTINGS.width);

  if (state.padding && JSON.stringify(state.padding) !== JSON.stringify(DEFAULT_SETTINGS.padding)) {
    compact.pd = state.padding;
  }
  if (state.fontFamily && state.fontFamily !== DEFAULT_SETTINGS.fontFamily) {
    compact.ff = state.fontFamily;
  }

  add('ef', state.exportFormat, DEFAULT_EXPORT_FORMAT);
  add('es', state.exportScale, DEFAULT_EXPORT_SCALE);
  add('jq', state.jpegQuality, DEFAULT_JPEG_QUALITY);

  if (state.content && (includeContent || state.content !== DEFAULT_CONTENT)) {
    compact.c = state.content;
  }
  add('lg', state.language, DEFAULT_LANGUAGE);
  add('cm', state.colorMode, DEFAULT_COLOR_MODE);

  if (state.compareMode) {
    compact.cmp = true;
    if (state.beforeContent) compact.bc = state.beforeContent;
    if (state.afterContent) compact.ac = state.afterContent;
    if (state.beforeLabel && state.beforeLabel !== 'Before') compact.bl = state.beforeLabel;
    if (state.afterLabel && state.afterLabel !== 'After') compact.al = state.afterLabel;
    if (state.beforeTitle && state.beforeTitle !== DEFAULT_SETTINGS.title) compact.bti = state.beforeTitle;
    if (state.afterTitle && state.afterTitle !== DEFAULT_SETTINGS.title) compact.ati = state.afterTitle;
    if (state.beforeLanguage && state.beforeLanguage !== 'auto') compact.blg = state.beforeLanguage;
    if (state.afterLanguage && state.afterLanguage !== 'auto') compact.alg = state.afterLanguage;
    if (state.compareLabelConfig) {
      if (state.compareLabelConfig.fontSize !== 16) compact.clf = state.compareLabelConfig.fontSize;
      if (state.compareLabelConfig.fontFamily && state.compareLabelConfig.fontFamily !== 'system-ui, -apple-system, sans-serif') {
        compact.clff = state.compareLabelConfig.fontFamily;
      }
      if (state.compareLabelConfig.fontWeight !== undefined && state.compareLabelConfig.fontWeight !== 600) {
        compact.clfw = state.compareLabelConfig.fontWeight;
      }
      if (state.compareLabelConfig.color !== '#ffffff') compact.clc = state.compareLabelConfig.color;
      if (state.compareLabelConfig.alignment !== 'left') compact.cla = state.compareLabelConfig.alignment;
    }
  }

  if (state.watermark) {
    add('wt', state.watermark.type, DEFAULT_WATERMARK.type);
    if (state.watermark.text) compact.wtx = state.watermark.text;
    if (state.watermark.style && state.watermark.style !== DEFAULT_WATERMARK.style) {
      compact.wst = state.watermark.style;
    }
    if (state.watermark.markup && state.watermark.markup !== DEFAULT_WATERMARK.markup) {
      compact.wmk = state.watermark.markup;
    }
  }

  if (state.header?.enabled) {
    compact.he = true;
    if (state.header.backgroundColor) compact.hbg = state.header.backgroundColor;
    add('hh', state.header.height, DEFAULT_HEADER.height);
    if (state.header.border) {
      compact.hbd = true;
      add('hbc', state.header.borderColor, DEFAULT_HEADER.borderColor);
      add('hbw', state.header.borderWidth, DEFAULT_HEADER.borderWidth);
    }
  }

  if (state.footer?.enabled) {
    compact.fe = true;
    if (state.footer.backgroundColor) compact.fbg = state.footer.backgroundColor;
    add('fh', state.footer.height, DEFAULT_FOOTER.height);
    if (state.footer.border) {
      compact.fbd = true;
      add('fbc', state.footer.borderColor, DEFAULT_FOOTER.borderColor);
      add('fbw', state.footer.borderWidth, DEFAULT_FOOTER.borderWidth);
    }
  }

  if (state.background && state.background.type !== 'none') {
    compact.bt = state.background.type;
    if (state.background.type === 'solid') {
      add('bgc', state.background.color, DEFAULT_BACKGROUND.color);
    }
    if (state.background.type === 'gradient') {
      add('bgf', state.background.gradientFrom, DEFAULT_BACKGROUND.gradientFrom);
      add('bgt', state.background.gradientTo, DEFAULT_BACKGROUND.gradientTo);
      add('bgd', state.background.gradientDirection, DEFAULT_BACKGROUND.gradientDirection);
    }
    add('bgp', state.background.padding, DEFAULT_BACKGROUND.padding);
    add('bga', state.background.imageAspectRatio, DEFAULT_BACKGROUND.imageAspectRatio);
  }

  return compact;
}

// Generate compressed data only (for URL shortener)
export function generateCompressedData(state: UrlState, mode: ShareMode = 'view'): string {
  const compact = buildCompactState(state, mode, true); // Always include content
  const json = JSON.stringify(compact);
  return LZString.compressToEncodedURIComponent(json);
}

// Generate share URL with LZ-string compression
export function generateShareUrlLZ(state: UrlState, mode: ShareMode = 'view'): string {
  const compact = buildCompactState(state, mode);
  const json = JSON.stringify(compact);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?d=${compressed}`;
}

// Generate static image URL with LZ-string compression
export function generateStaticUrlLZ(state: UrlState, format: 'svg' | 'png' | 'webp' | 'jpeg'): string {
  // Always include content for static URLs (API needs content to generate image)
  const compact = buildCompactState(state, 'view', true);
  (compact as CompactState & { o?: string }).o = format;
  const json = JSON.stringify(compact);
  const compressed = LZString.compressToEncodedURIComponent(json);
  // Encode + as %2B for markdown compatibility (some parsers interpret + as space)
  const encodedCompressed = compressed.replace(/\+/g, '%2B');
  const baseUrl = `${window.location.origin}/api/image`;
  return `${baseUrl}?d=${encodedCompressed}`;
}

// Decompress LZ-string data
export function decompressLZData(compressed: string): CompactState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as CompactState;
  } catch {
    return null;
  }
}

// Parse compact state back to UrlState
function parseCompactState(compact: CompactState): UrlState {
  const state: UrlState = {};

  if (compact.tp) state.template = compact.tp as TemplateType;
  if (compact.th) state.terminalTheme = compact.th;
  if (compact.fs !== undefined) state.fontSize = compact.fs;
  if (compact.lh !== undefined) state.lineHeight = compact.lh;
  if (compact.pd) state.padding = compact.pd;
  if (compact.ti !== undefined) state.title = compact.ti;
  if (compact.sc !== undefined) state.showControls = compact.sc;
  if (compact.cp) state.controlsPosition = compact.cp as ControlsPosition;
  if (compact.br !== undefined) state.borderRadius = compact.br;
  if (compact.wd !== undefined) state.width = compact.wd;
  if (compact.ff) state.fontFamily = compact.ff;
  if (compact.ef) state.exportFormat = compact.ef as ExportFormat;
  if (compact.es !== undefined) state.exportScale = compact.es as ExportScale;
  if (compact.jq !== undefined) state.jpegQuality = compact.jq;
  if (compact.c) state.content = compact.c;
  if (compact.lg) state.language = compact.lg;
  if (compact.cm) state.colorMode = compact.cm as ColorMode;

  if (compact.cmp) {
    state.compareMode = true;
    if (compact.bc) state.beforeContent = compact.bc;
    if (compact.ac) state.afterContent = compact.ac;
    if (compact.bl) state.beforeLabel = compact.bl;
    if (compact.al) state.afterLabel = compact.al;
    if (compact.bti) state.beforeTitle = compact.bti;
    if (compact.ati) state.afterTitle = compact.ati;
    if (compact.blg) state.beforeLanguage = compact.blg;
    if (compact.alg) state.afterLanguage = compact.alg;
    if (compact.clf || compact.clff || compact.clfw || compact.clc || compact.cla) {
      state.compareLabelConfig = {
        fontSize: compact.clf,
        fontFamily: compact.clff,
        fontWeight: compact.clfw,
        color: compact.clc,
        alignment: compact.cla as CompareLabelAlignment,
      };
    }
  }

  if (compact.wt || compact.wtx || compact.wst || compact.wmk) {
    state.watermark = {
      type: compact.wt as WatermarkType,
    };
    // Only include properties that are defined to avoid overwriting defaults with undefined
    if (compact.wtx !== undefined) state.watermark.text = compact.wtx;
    if (compact.wst !== undefined) state.watermark.style = compact.wst;
    if (compact.wmk !== undefined) state.watermark.markup = compact.wmk;
  }

  if (compact.he) {
    state.header = { enabled: true };
    // Only include properties that are defined to avoid overwriting defaults with undefined
    if (compact.hbg !== undefined) state.header.backgroundColor = compact.hbg;
    if (compact.hh !== undefined) state.header.height = compact.hh;
    if (compact.hbd !== undefined) state.header.border = compact.hbd;
    if (compact.hbc !== undefined) state.header.borderColor = compact.hbc;
    if (compact.hbw !== undefined) state.header.borderWidth = compact.hbw;
  }

  if (compact.fe) {
    state.footer = { enabled: true };
    // Only include properties that are defined to avoid overwriting defaults with undefined
    if (compact.fbg !== undefined) state.footer.backgroundColor = compact.fbg;
    if (compact.fh !== undefined) state.footer.height = compact.fh;
    if (compact.fbd !== undefined) state.footer.border = compact.fbd;
    if (compact.fbc !== undefined) state.footer.borderColor = compact.fbc;
    if (compact.fbw !== undefined) state.footer.borderWidth = compact.fbw;
  }

  if (compact.bt && compact.bt !== 'none') {
    state.background = {
      type: compact.bt as BackgroundType,
    };
    // Only include properties that are defined to avoid overwriting with undefined
    if (compact.bgc !== undefined) state.background.color = compact.bgc;
    if (compact.bt === 'gradient') {
      // For gradients, always include colors (use defaults if not specified)
      state.background.gradientFrom = compact.bgf ?? DEFAULT_BACKGROUND.gradientFrom;
      state.background.gradientTo = compact.bgt ?? DEFAULT_BACKGROUND.gradientTo;
      state.background.gradientDirection = (compact.bgd ?? DEFAULT_BACKGROUND.gradientDirection) as GradientDirection;
    }
    if (compact.bgp !== undefined) state.background.padding = compact.bgp;
    if (compact.bga !== undefined) state.background.imageAspectRatio = compact.bga as ImageAspectRatio;
  }

  return state;
}

// Parse URL parameters into state
export function parseUrlParams(): UrlState | null {
  const params = new URLSearchParams(window.location.search);

  if (params.size === 0) return null;

  // Check for LZ-compressed data first
  const compressedData = params.get('d');
  if (compressedData) {
    const compact = decompressLZData(compressedData);
    if (compact) {
      return parseCompactState(compact);
    }
  }

  // Fall back to legacy parameter parsing
  const state: UrlState = {};

  // Helper to get and parse param
  const getParam = (key: keyof typeof URL_PARAM_MAP): string | null => {
    return params.get(URL_PARAM_MAP[key]);
  };

  // Core settings
  const template = getParam('template');
  if (template && ['macos', 'windows', 'minimal'].includes(template)) {
    state.template = template as TemplateType;
  }

  const terminalTheme = getParam('terminalTheme');
  if (terminalTheme) {
    state.terminalTheme = terminalTheme;
  }

  const fontSize = getParam('fontSize');
  if (fontSize) {
    const num = Number(fontSize);
    if (!isNaN(num) && num >= 10 && num <= 24) {
      state.fontSize = num;
    }
  }

  const lineHeight = getParam('lineHeight');
  if (lineHeight) {
    const num = Number(lineHeight);
    if (!isNaN(num) && num >= 1 && num <= 2) {
      state.lineHeight = num;
    }
  }

  const padding = getParam('padding');
  if (padding) {
    const decoded = decodePadding(padding);
    if (decoded) {
      state.padding = decoded;
    }
  }

  const title = getParam('title');
  if (title !== null) {
    state.title = title;
  }

  const showControls = getParam('showControls');
  if (showControls !== null) {
    state.showControls = decodeBool(showControls, true);
  }

  const controlsPosition = getParam('controlsPosition');
  if (controlsPosition && ['left', 'right'].includes(controlsPosition)) {
    state.controlsPosition = controlsPosition as ControlsPosition;
  }

  const borderRadius = getParam('borderRadius');
  if (borderRadius) {
    const num = Number(borderRadius);
    if (!isNaN(num) && num >= 0 && num <= 24) {
      state.borderRadius = num;
    }
  }

  const width = getParam('width');
  if (width !== null) {
    if (width === '') {
      state.width = null;
    } else {
      const num = Number(width);
      if (!isNaN(num) && num >= 400 && num <= 1600) {
        state.width = num;
      }
    }
  }

  const fontFamily = getParam('fontFamily');
  if (fontFamily) {
    const decoded = decodeBase64(fontFamily);
    if (decoded) {
      state.fontFamily = decoded;
    }
  }

  // Export settings
  const exportFormat = getParam('exportFormat');
  if (exportFormat && ['svg', 'png', 'webp', 'jpeg'].includes(exportFormat)) {
    state.exportFormat = exportFormat as ExportFormat;
  }

  const exportScale = getParam('exportScale');
  if (exportScale) {
    const num = Number(exportScale);
    if ([1, 2, 3].includes(num)) {
      state.exportScale = num as ExportScale;
    }
  }

  const jpegQuality = getParam('jpegQuality');
  if (jpegQuality) {
    const num = Number(jpegQuality);
    if (!isNaN(num) && num >= 0.6 && num <= 1) {
      state.jpegQuality = num;
    }
  }

  // Content
  const content = getParam('content');
  if (content) {
    const decoded = decodeBase64(content);
    if (decoded) {
      state.content = decoded;
    }
  }

  const language = getParam('language');
  if (language) {
    state.language = language;
  }

  const colorMode = getParam('colorMode');
  if (colorMode && ['light', 'dark'].includes(colorMode)) {
    state.colorMode = colorMode as ColorMode;
  }

  // Compare mode
  const compareMode = getParam('compareMode');
  if (compareMode !== null) {
    state.compareMode = decodeBool(compareMode, false);
  }

  const beforeContent = getParam('beforeContent');
  if (beforeContent) {
    const decoded = decodeBase64(beforeContent);
    if (decoded) {
      state.beforeContent = decoded;
    }
  }

  const afterContent = getParam('afterContent');
  if (afterContent) {
    const decoded = decodeBase64(afterContent);
    if (decoded) {
      state.afterContent = decoded;
    }
  }

  const beforeLabel = getParam('beforeLabel');
  if (beforeLabel !== null) {
    state.beforeLabel = beforeLabel;
  }

  const afterLabel = getParam('afterLabel');
  if (afterLabel !== null) {
    state.afterLabel = afterLabel;
  }

  const beforeLanguage = getParam('beforeLanguage');
  if (beforeLanguage) {
    state.beforeLanguage = beforeLanguage;
  }

  const afterLanguage = getParam('afterLanguage');
  if (afterLanguage) {
    state.afterLanguage = afterLanguage;
  }

  // Compare label config
  const compareLabelFontSize = getParam('compareLabelFontSize');
  const compareLabelFontFamily = getParam('compareLabelFontFamily');
  const compareLabelFontWeight = getParam('compareLabelFontWeight');
  const compareLabelColor = getParam('compareLabelColor');
  const compareLabelAlignment = getParam('compareLabelAlignment');

  if (compareLabelFontSize || compareLabelFontFamily || compareLabelFontWeight || compareLabelColor || compareLabelAlignment) {
    state.compareLabelConfig = {};
    if (compareLabelFontSize) {
      const num = Number(compareLabelFontSize);
      if (!isNaN(num)) {
        state.compareLabelConfig.fontSize = num;
      }
    }
    if (compareLabelFontFamily) {
      const decoded = decodeBase64(compareLabelFontFamily);
      if (decoded) {
        state.compareLabelConfig.fontFamily = decoded;
      }
    }
    if (compareLabelFontWeight) {
      const num = Number(compareLabelFontWeight);
      if (!isNaN(num) && [400, 500, 600, 700].includes(num)) {
        state.compareLabelConfig.fontWeight = num;
      }
    }
    if (compareLabelColor) {
      state.compareLabelConfig.color = compareLabelColor;
    }
    if (compareLabelAlignment && ['left', 'center', 'right'].includes(compareLabelAlignment)) {
      state.compareLabelConfig.alignment = compareLabelAlignment as CompareLabelAlignment;
    }
  }

  // Watermark
  const watermarkType = getParam('watermarkType');
  const watermarkText = getParam('watermarkText');
  const watermarkStyle = getParam('watermarkStyle');
  const watermarkMarkup = getParam('watermarkMarkup');

  if (watermarkType || watermarkText || watermarkStyle || watermarkMarkup) {
    state.watermark = {};
    if (watermarkType && ['text', 'markup'].includes(watermarkType)) {
      state.watermark.type = watermarkType as WatermarkType;
    }
    if (watermarkText) {
      const decoded = decodeBase64(watermarkText);
      if (decoded) {
        state.watermark.text = decoded;
      }
    }
    if (watermarkStyle) {
      const decoded = decodeBase64(watermarkStyle);
      if (decoded) {
        state.watermark.style = decoded;
      }
    }
    if (watermarkMarkup) {
      const decoded = decodeBase64(watermarkMarkup);
      if (decoded) {
        state.watermark.markup = decoded;
      }
    }
  }

  // Header
  const headerEnabled = getParam('headerEnabled');
  if (headerEnabled !== null) {
    state.header = {
      enabled: decodeBool(headerEnabled, false),
    };

    const headerBgColor = getParam('headerBgColor');
    if (headerBgColor) {
      state.header.backgroundColor = headerBgColor;
    }

    const headerHeight = getParam('headerHeight');
    if (headerHeight) {
      const num = Number(headerHeight);
      if (!isNaN(num)) {
        state.header.height = num;
      }
    }

    const headerBorder = getParam('headerBorder');
    if (headerBorder !== null) {
      state.header.border = decodeBool(headerBorder, false);
    }

    const headerBorderColor = getParam('headerBorderColor');
    if (headerBorderColor) {
      state.header.borderColor = headerBorderColor;
    }

    const headerBorderWidth = getParam('headerBorderWidth');
    if (headerBorderWidth) {
      const num = Number(headerBorderWidth);
      if (!isNaN(num)) {
        state.header.borderWidth = num;
      }
    }
  }

  // Footer
  const footerEnabled = getParam('footerEnabled');
  if (footerEnabled !== null) {
    state.footer = {
      enabled: decodeBool(footerEnabled, false),
    };

    const footerBgColor = getParam('footerBgColor');
    if (footerBgColor) {
      state.footer.backgroundColor = footerBgColor;
    }

    const footerHeight = getParam('footerHeight');
    if (footerHeight) {
      const num = Number(footerHeight);
      if (!isNaN(num)) {
        state.footer.height = num;
      }
    }

    const footerBorder = getParam('footerBorder');
    if (footerBorder !== null) {
      state.footer.border = decodeBool(footerBorder, false);
    }

    const footerBorderColor = getParam('footerBorderColor');
    if (footerBorderColor) {
      state.footer.borderColor = footerBorderColor;
    }

    const footerBorderWidth = getParam('footerBorderWidth');
    if (footerBorderWidth) {
      const num = Number(footerBorderWidth);
      if (!isNaN(num)) {
        state.footer.borderWidth = num;
      }
    }
  }

  // Background
  const bgType = getParam('bgType');
  if (bgType && ['none', 'solid', 'gradient', 'image'].includes(bgType)) {
    state.background = {
      type: bgType as BackgroundType,
    };

    const bgColor = getParam('bgColor');
    if (bgColor) {
      state.background.color = bgColor;
    }

    const bgGradientFrom = getParam('bgGradientFrom');
    if (bgGradientFrom) {
      state.background.gradientFrom = bgGradientFrom;
    }

    const bgGradientTo = getParam('bgGradientTo');
    if (bgGradientTo) {
      state.background.gradientTo = bgGradientTo;
    }

    const bgGradientDirection = getParam('bgGradientDirection');
    if (bgGradientDirection) {
      state.background.gradientDirection = bgGradientDirection as GradientDirection;
    }

    const bgImageAspectRatio = getParam('bgImageAspectRatio');
    if (bgImageAspectRatio) {
      state.background.imageAspectRatio = bgImageAspectRatio as ImageAspectRatio;
    }

    const bgPadding = getParam('bgPadding');
    if (bgPadding) {
      const num = Number(bgPadding);
      if (!isNaN(num)) {
        state.background.padding = num;
      }
    }
  }

  return Object.keys(state).length > 0 ? state : null;
}

// URL length validation
export interface UrlValidation {
  length: number;
  isValid: boolean;
  warning: string | null;
}

export function validateUrlLength(url: string): UrlValidation {
  const length = url.length;

  if (length > 8000) {
    return {
      length,
      isValid: false,
      warning: 'URL exceeds maximum length (8000 characters). Some browsers may not support this URL.',
    };
  }

  if (length > 2000) {
    return {
      length,
      isValid: true,
      warning: 'URL exceeds recommended length (2000 characters). May not work in all browsers.',
    };
  }

  return {
    length,
    isValid: true,
    warning: null,
  };
}

// Clear URL params and return to normal mode
export function clearUrlParams(): void {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, '', url.toString());
}

// Switch from view to edit mode in URL
export function switchToEditMode(): void {
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM_MAP.mode, 'edit');
  window.history.replaceState({}, '', url.toString());
}

// Rehydrate compressed URL content (call after store is created)
// Returns updates to apply to the store if there was compressed content
export async function rehydrateCompressedContent(): Promise<{
  content?: string;
  beforeContent?: string;
  afterContent?: string;
} | null> {
  const params = new URLSearchParams(window.location.search);
  const updates: { content?: string; beforeContent?: string; afterContent?: string } = {};
  let hasUpdates = false;

  const content = params.get(URL_PARAM_MAP.content);
  if (content && isCompressed(content)) {
    const decoded = await decodeBase64Async(content);
    if (decoded) {
      updates.content = decoded;
      hasUpdates = true;
    }
  }

  const beforeContent = params.get(URL_PARAM_MAP.beforeContent);
  if (beforeContent && isCompressed(beforeContent)) {
    const decoded = await decodeBase64Async(beforeContent);
    if (decoded) {
      updates.beforeContent = decoded;
      hasUpdates = true;
    }
  }

  const afterContent = params.get(URL_PARAM_MAP.afterContent);
  if (afterContent && isCompressed(afterContent)) {
    const decoded = await decodeBase64Async(afterContent);
    if (decoded) {
      updates.afterContent = decoded;
      hasUpdates = true;
    }
  }

  return hasUpdates ? updates : null;
}
