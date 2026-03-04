import type { ShellfieSettings, ColorMode, ExportFormat, ExportScale, HeaderConfig, FooterConfig, BackgroundConfig } from '@/types';
import { SAMPLE_CODES } from './sampleCode';

export const DEFAULT_HEADER: HeaderConfig = {
  enabled: false,
  backgroundColor: '',
  height: 40,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
};

export const DEFAULT_FOOTER: FooterConfig = {
  enabled: false,
  backgroundColor: '',
  height: 40,
  border: false,
  borderColor: '#333333',
  borderWidth: 1,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'none',
  color: '#6366f1',
  gradientFrom: '#6366f1',
  gradientTo: '#ec4899',
  gradientDirection: 'to-bottom-right',
  image: null,
  padding: 32,
};

// Default font stack that works in SVG across platforms
const DEFAULT_FONT_STACK = "'SF Mono', Monaco, Menlo, 'Ubuntu Mono', Consolas, 'Courier New', monospace";

export const DEFAULT_SETTINGS: ShellfieSettings = {
  template: 'macos',
  terminalTheme: 'dracula',
  fontSize: 14,
  lineHeight: 1.4,
  padding: [16, 24, 16, 24],
  title: 'Terminal',
  showControls: true,
  controlsPosition: 'left',
  watermark: '',
  watermarkPadding: [8, 8, 8, 8],
  width: null,
  fontFamily: DEFAULT_FONT_STACK,
  header: DEFAULT_HEADER,
  footer: DEFAULT_FOOTER,
  background: DEFAULT_BACKGROUND,
};

export const DEFAULT_CONTENT = SAMPLE_CODES.default;

export const DEFAULT_LANGUAGE = 'auto';

export const DEFAULT_COLOR_MODE: ColorMode = 'dark';

export const DEFAULT_EXPORT_FORMAT: ExportFormat = 'svg';

export const DEFAULT_EXPORT_SCALE: ExportScale = 2;

export const DEFAULT_JPEG_QUALITY = 0.9;

export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 24;

export const LINE_HEIGHT_MIN = 1.0;
export const LINE_HEIGHT_MAX = 2.0;

export const PADDING_MIN = 0;
export const PADDING_MAX = 64;

export const WIDTH_MIN = 400;
export const WIDTH_MAX = 1600;

export const HEADER_HEIGHT_MIN = 20;
export const HEADER_HEIGHT_MAX = 100;

export const BORDER_WIDTH_MIN = 1;
export const BORDER_WIDTH_MAX = 10;

export const BACKGROUND_PADDING_MIN = 0;
export const BACKGROUND_PADDING_MAX = 128;

export const GRADIENT_PRESETS = [
  { from: '#6366f1', to: '#ec4899', label: 'Purple Pink' },
  { from: '#3b82f6', to: '#06b6d4', label: 'Blue Cyan' },
  { from: '#f59e0b', to: '#ef4444', label: 'Amber Red' },
  { from: '#10b981', to: '#3b82f6', label: 'Emerald Blue' },
  { from: '#8b5cf6', to: '#06b6d4', label: 'Violet Cyan' },
  { from: '#f43f5e', to: '#f59e0b', label: 'Rose Orange' },
  { from: '#1e1e1e', to: '#3b3b3b', label: 'Dark Gray' },
  { from: '#0f172a', to: '#1e3a5f', label: 'Slate Blue' },
];

export const FONT_FAMILY_OPTIONS = [
  { value: DEFAULT_FONT_STACK, label: 'System Default' },
  { value: "'JetBrains Mono', 'SF Mono', Monaco, Menlo, monospace", label: 'JetBrains Mono' },
  { value: "'Fira Code', 'SF Mono', Monaco, Menlo, monospace", label: 'Fira Code' },
  { value: "'Source Code Pro', 'SF Mono', Monaco, Menlo, monospace", label: 'Source Code Pro' },
  { value: "'IBM Plex Mono', 'SF Mono', Monaco, Menlo, monospace", label: 'IBM Plex Mono' },
  { value: "'Roboto Mono', 'SF Mono', Monaco, Menlo, monospace", label: 'Roboto Mono' },
  { value: "'Ubuntu Mono', 'SF Mono', Monaco, Menlo, monospace", label: 'Ubuntu Mono' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
];
