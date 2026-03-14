import type { ShellfieSettings, ColorMode, ExportFormat, ExportScale, HeaderConfig, FooterConfig, BackgroundConfig, WatermarkConfig, BrandConfig } from '@/types';
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
  imageAspectRatio: 'auto',
  padding: 32,
};

// Default monospace font stack for code rendering in SVG
const DEFAULT_FONT_STACK = "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace";

export const DEFAULT_WATERMARK_STYLE = 'color: #888888;\npadding: 8px;';

// Brand colors for watermark - matches _variables.scss
export const BRAND_COLOR_DARK = '#34D399';
export const BRAND_COLOR_LIGHT = '#F97316';

export const getDefaultWatermarkMarkup = (colorMode: 'dark' | 'light' = 'dark') => {
  const brandColor = colorMode === 'dark' ? BRAND_COLOR_DARK : BRAND_COLOR_LIGHT;
  return `<a href="https://github.com/tool3/shellfie">
  <g transform="translate(-90, -5)">
    <defs>
      <clipPath id="wm-clip">
        <rect width="100" height="15" rx="3" fill="#fff"/>
      </clipPath>
    </defs>
    <g clip-path="url(#wm-clip)">
      <rect width="60" height="15" fill="#555"/>
      <rect x="60" width="40" height="15" fill="${brandColor}"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110">
      <text x="385" y="130" transform="scale(.08)" fill="#fff" textLength="650">powered by</text>
      <text x="985" y="130" transform="scale(.08)" fill="#333" textLength="390">shellfie</text>
    </g>
  </g>
</a>`;
};

// Default markup for backwards compatibility (uses dark mode)
export const DEFAULT_WATERMARK_MARKUP = getDefaultWatermarkMarkup('dark');

export const DEFAULT_WATERMARK: WatermarkConfig = {
  type: 'text',
  text: '',
  style: DEFAULT_WATERMARK_STYLE,
  markup: DEFAULT_WATERMARK_MARKUP,
};

export const DEFAULT_BRAND: BrandConfig = {
  enabled: false,
  text: 'Created with',
  name: 'Shellfied',
  url: '/',
  showIcon: true,
};

export const DEFAULT_SETTINGS: ShellfieSettings = {
  template: 'macos',
  terminalTheme: 'dracula',
  fontSize: 14,
  lineHeight: 1.4,
  padding: [16, 24, 16, 24],
  title: 'Terminal',
  showControls: true,
  controlsPosition: 'left',
  borderRadius: 8,
  watermark: DEFAULT_WATERMARK,
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
  { from: '#14b8a6', to: '#a855f7', label: 'Teal Purple' },
  { from: '#f97316', to: '#fbbf24', label: 'Orange Gold' },
  { from: '#dc2626', to: '#7c3aed', label: 'Red Violet' },
  { from: '#8b5cf6', to: '#06b6d4', label: 'Violet Cyan' },
  { from: '#059669', to: '#84cc16', label: 'Emerald Lime' },
  { from: '#1e1e1e', to: '#3b3b3b', label: 'Dark Gray' },
  { from: '#0f172a', to: '#1e3a5f', label: 'Slate Blue' },
];

export const FONT_FAMILY_OPTIONS = [
  { value: DEFAULT_FONT_STACK, label: 'System Default' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: "'IBM Plex Mono', monospace", label: 'IBM Plex Mono' },
  { value: "'Roboto Mono', monospace", label: 'Roboto Mono' },
  { value: "'Ubuntu Mono', monospace", label: 'Ubuntu Mono' },
  { value: "'Space Mono', monospace", label: 'Space Mono' },
];

export const BORDER_RADIUS_MIN = 0;
export const BORDER_RADIUS_MAX = 24;
