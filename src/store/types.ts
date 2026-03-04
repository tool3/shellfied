import type {
  TemplateType,
  TerminalThemeName,
  ControlsPosition,
  ColorMode,
  ExportFormat,
  ExportScale,
  PaddingTuple,
  HeaderConfig,
  FooterConfig,
  BackgroundConfig,
} from '@/types';

export interface EditorState {
  content: string;
  language: string;
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  clearContent: () => void;
}

export interface SettingsState {
  template: TemplateType;
  terminalTheme: TerminalThemeName;
  fontSize: number;
  lineHeight: number;
  padding: PaddingTuple;
  title: string;
  showControls: boolean;
  controlsPosition: ControlsPosition;
  watermark: string;
  watermarkPadding: PaddingTuple;
  width: number | null;
  fontFamily: string;
  header: HeaderConfig;
  footer: FooterConfig;
  background: BackgroundConfig;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
  jpegQuality: number;

  setTemplate: (template: TemplateType) => void;
  setTerminalTheme: (theme: TerminalThemeName) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setPadding: (padding: PaddingTuple) => void;
  setTitle: (title: string) => void;
  setShowControls: (show: boolean) => void;
  setControlsPosition: (position: ControlsPosition) => void;
  setWatermark: (watermark: string) => void;
  setWatermarkPadding: (padding: PaddingTuple) => void;
  setWidth: (width: number | null) => void;
  setFontFamily: (fontFamily: string) => void;
  setHeader: (header: Partial<HeaderConfig>) => void;
  setFooter: (footer: Partial<FooterConfig>) => void;
  setBackground: (background: Partial<BackgroundConfig>) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportScale: (scale: ExportScale) => void;
  setJpegQuality: (quality: number) => void;
  resetSettings: () => void;
}

export interface UIState {
  colorMode: ColorMode;
  isSettingsPanelOpen: boolean;
  previewZoom: number;

  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setPreviewZoom: (zoom: number) => void;
}

export type AppStore = EditorState & SettingsState & UIState;
