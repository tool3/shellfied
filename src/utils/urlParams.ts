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
  beforeLanguage: 'blg',
  afterLanguage: 'alg',
  compareLabelFontSize: 'clf',
  compareLabelFontFamily: 'clff',
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

// URL-safe Base64 encoding (replace + with -, / with _, strip padding)
export function encodeBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

// URL-safe Base64 decoding
export function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
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

// Get share mode from URL
export function getShareMode(): ShareMode | null {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get(URL_PARAM_MAP.mode) || params.get('mode');

  if (mode === 'view') return 'view';
  if (mode === 'edit') return 'edit';

  // If there are URL params but no mode, default to view
  if (params.size > 0) return 'view';

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
  beforeLanguage?: string;
  afterLanguage?: string;
  compareLabelConfig?: {
    fontSize?: number;
    fontFamily?: string;
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

// Generate share URL from state
export function generateShareUrl(state: UrlState, mode: ShareMode = 'view'): string {
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

  // Content - always Base64 encode
  if (state.content && state.content !== DEFAULT_CONTENT) {
    params.set(URL_PARAM_MAP.content, encodeBase64(state.content));
  }

  addIfChanged('language', state.language, DEFAULT_LANGUAGE);
  addIfChanged('colorMode', state.colorMode, DEFAULT_COLOR_MODE);

  // Compare mode
  addIfChanged('compareMode', state.compareMode, false, encodeBool);

  if (state.compareMode) {
    if (state.beforeContent) {
      params.set(URL_PARAM_MAP.beforeContent, encodeBase64(state.beforeContent));
    }
    if (state.afterContent) {
      params.set(URL_PARAM_MAP.afterContent, encodeBase64(state.afterContent));
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

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const queryString = params.toString();

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Parse URL parameters into state
export function parseUrlParams(): UrlState | null {
  const params = new URLSearchParams(window.location.search);

  if (params.size === 0) return null;

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
  const compareLabelColor = getParam('compareLabelColor');
  const compareLabelAlignment = getParam('compareLabelAlignment');

  if (compareLabelFontSize || compareLabelFontFamily || compareLabelColor || compareLabelAlignment) {
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
