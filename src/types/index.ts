import type { EffectConfig } from '@/lib/effects';
export type TemplateType = 'macos' | 'windows' | 'minimal';

export type ControlsPosition = 'left' | 'right';

// Theme names are now dynamic - derived from shellfie's themes export
// Using string for flexibility as themes can be added at runtime
export type TerminalThemeName = string;

export type ColorMode = 'light' | 'dark';

export type ExportFormat = 'svg' | 'png' | 'webp' | 'jpeg';

// Alias for static output format (same as ExportFormat)
export type OutputFormat = ExportFormat;

export type ExportScale = 1 | 2 | 3;

export type JpegQuality = 0.6 | 0.8 | 0.9 | 1.0;

export type PaddingTuple = [number, number, number, number];

export type BackgroundType = 'none' | 'solid' | 'gradient' | 'image' | 'pattern';

export type PatternType = 'dotted' | 'grid' | 'noise' | 'topographic';

export type PatternBaseType = 'solid' | 'gradient';

export type GradientDirection =
  | 'to-right' | 'to-left'
  | 'to-bottom' | 'to-top'
  | 'to-bottom-right' | 'to-top-left'
  | 'to-bottom-left' | 'to-top-right'
  | 'radial' | 'radial-reverse';

export type ImageAspectRatio = 'auto' | '1:1' | '4:3' | '3:2' | '16:9' | '9:16' | '3:4' | '2:3';

export type BackgroundAnimation = 'particles' | 'border-pulse' | 'waves' | 'border-gradient' | 'border-shimmer' | 'aurora' | 'grid';

export type BackgroundOverlay =
  | 'prisma-glow' | 'nuxt-glow' | 'vercel-grid' | 'elevenlabs-grid' | 'cloudflare-grid' | 'tailwind-beams'
  | 'clerk-halftone' | 'mintlify-lines' | 'resend-topo' | 'triggerdev-lines'
  | 'firecrawl-grid' | 'browserbase-lines' | 'stripe-lines'
  | 'gemini-stars' | 'noir-noise' | 'ice-dots';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: GradientDirection;
  image: string | null;
  imageAspectRatio: ImageAspectRatio;
  padding: number;
  animation: BackgroundAnimation | null;
  animationColor: string;
  overlay: BackgroundOverlay | null;

  // Pattern background — used when type === 'pattern'.
  // The base layer reuses `color` (when patternBaseType === 'solid') or
  // gradientFrom/gradientTo/gradientDirection (when 'gradient').
  patternType: PatternType;
  patternBaseType: PatternBaseType;
  patternColor: string;
  // Primary scale: dot/grid spacing (px), topographic line spacing (px),
  // or noise frequency divisor (smaller value = larger grain).
  patternSize: number;
  // Stroke/dot thickness — applies to dotted/grid/topographic.
  patternThickness: number;
  // Overall pattern layer opacity, 0–1.
  patternOpacity: number;
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

export type WatermarkType = 'text' | 'markup';

export interface WatermarkConfig {
  type: WatermarkType;
  text: string;
  style: string; // CSS-like style string, e.g. "color: #888; padding: 8px"
  markup: string; // SVG markup for markup mode
}

export interface BrandConfig {
  enabled: boolean;
  text: string; // Custom text to replace "Created with"
  name: string; // Brand name (replaces "Shellfied")
  url: string; // Custom URL
  showIcon: boolean; // Whether to show logo icon
  iconUrl: string; // Custom icon URL when showIcon is true
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

export interface ControlStyleConfig {
  close: string;
  minimize: string;
  maximize: string;
  size: number;
}

export interface ShellfieSettings {
  template: TemplateType;
  terminalTheme: TerminalThemeName | string;
  fontSize: number;
  lineHeight: number;
  padding: PaddingTuple;
  title: string;
  showControls: boolean;
  controlsPosition: ControlsPosition;
  controlStyle: ControlStyleConfig;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  watermark: WatermarkConfig;
  width: number | null;
  fontFamily: string;
  header: HeaderConfig;
  footer: FooterConfig;
  background: BackgroundConfig;
  lineNumbers: boolean;
  /** Post-processing stack (see `@/lib/effects`). */
  effects: EffectConfig[];
}

export type CompareLabelAlignment = 'left' | 'center' | 'right';

export type FontWeight = 400 | 500 | 600 | 700;

export interface CompareLabelConfig {
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
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
  labelFontWeight?: FontWeight;
  labelAlignment?: CompareLabelAlignment;
}
