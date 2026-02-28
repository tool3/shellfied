import type { ShellfieSettings, ColorMode, ExportFormat, ExportScale, HeaderConfig, FooterConfig } from '@/types';
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

export const DEFAULT_SETTINGS: ShellfieSettings = {
  template: 'macos',
  terminalTheme: 'dracula',
  fontSize: 14,
  lineHeight: 1.4,
  padding: [16, 24, 16, 24],
  title: 'Terminal',
  showControls: true,
  watermark: '',
  watermarkPadding: [8, 8, 8, 8],
  width: null,
  fontFamily: 'JetBrains Mono',
  header: DEFAULT_HEADER,
  footer: DEFAULT_FOOTER,
};

export const DEFAULT_CONTENT = SAMPLE_CODES.default;

export const DEFAULT_LANGUAGE = 'bash';

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

export const FONT_FAMILY_OPTIONS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Menlo', label: 'Menlo' },
  { value: 'Ubuntu Mono', label: 'Ubuntu Mono' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
];
