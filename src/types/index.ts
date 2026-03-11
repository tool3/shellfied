export type TemplateType = 'macos' | 'windows' | 'minimal';

export type ControlsPosition = 'left' | 'right';

// Theme names are now dynamic - derived from shellfie's themes export
// Using string for flexibility as themes can be added at runtime
export type TerminalThemeName = string;

export type ColorMode = 'light' | 'dark';

export type ExportFormat = 'svg' | 'png' | 'webp' | 'jpeg';

export type ExportScale = 1 | 2 | 3;

export type JpegQuality = 0.6 | 0.8 | 0.9 | 1.0;

export type PaddingTuple = [number, number, number, number];

export type BackgroundType = 'none' | 'solid' | 'gradient' | 'image';

export type GradientDirection = 'to-right' | 'to-bottom' | 'to-bottom-right' | 'to-bottom-left';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: GradientDirection;
  image: string | null;
  padding: number;
}

export interface HeaderConfig {
  enabled: boolean;
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

export interface FooterConfig {
  enabled: boolean;
  backgroundColor: string;
  height: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
}

export interface WatermarkConfig {
  text: string;
  color: string;
  padding: PaddingTuple;
}

export interface CustomTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface ShellfieSettings {
  template: TemplateType;
  terminalTheme: TerminalThemeName | string; // string for custom theme IDs
  fontSize: number;
  lineHeight: number;
  padding: PaddingTuple;
  title: string;
  showControls: boolean;
  controlsPosition: ControlsPosition;
  borderRadius: number;
  watermark: WatermarkConfig;
  width: number | null;
  fontFamily: string;
  header: HeaderConfig;
  footer: FooterConfig;
  background: BackgroundConfig;
}

export type CompareLabelAlignment = 'left' | 'center' | 'right';

export interface CompareLabelConfig {
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: CompareLabelAlignment;
}

export interface CompareExportOptions {
  scale: ExportScale;
  quality?: number;
  background?: BackgroundConfig;
  gap?: number;
  labelHeight?: number;
  labelColor?: string;
  labelFont?: string;
  labelAlignment?: CompareLabelAlignment;
}
