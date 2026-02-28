import type { ShellfieSettings, ColorMode, ExportFormat, ExportScale } from '@/types';
import { SAMPLE_CODES } from './sampleCode';

export const DEFAULT_SETTINGS: ShellfieSettings = {
  template: 'macos',
  terminalTheme: 'dracula',
  fontSize: 14,
  lineHeight: 1.4,
  padding: [16, 24, 16, 24],
  title: 'Terminal',
  showControls: true,
  watermark: '',
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
