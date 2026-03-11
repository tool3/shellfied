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
  WatermarkConfig,
  CustomTheme,
  CompareLabelConfig,
} from '@/types';

export interface EditorState {
  content: string;
  language: string;
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  clearContent: () => void;

  // Compare mode content
  beforeContent: string;
  afterContent: string;
  beforeLabel: string;
  afterLabel: string;
  beforeLanguage: string;
  afterLanguage: string;
  compareLabelConfig: CompareLabelConfig;
  setBeforeContent: (content: string) => void;
  setAfterContent: (content: string) => void;
  setBeforeLabel: (label: string) => void;
  setAfterLabel: (label: string) => void;
  setBeforeLanguage: (language: string) => void;
  setAfterLanguage: (language: string) => void;
  setCompareLabelConfig: (config: Partial<CompareLabelConfig>) => void;
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
  borderRadius: number;
  watermark: WatermarkConfig;
  width: number | null;
  fontFamily: string;
  header: HeaderConfig;
  footer: FooterConfig;
  background: BackgroundConfig;
  customThemes: CustomTheme[];
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
  setBorderRadius: (radius: number) => void;
  setWatermark: (watermark: Partial<WatermarkConfig>) => void;
  setWidth: (width: number | null) => void;
  setFontFamily: (fontFamily: string) => void;
  setHeader: (header: Partial<HeaderConfig>) => void;
  setFooter: (footer: Partial<FooterConfig>) => void;
  setBackground: (background: Partial<BackgroundConfig>) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  updateCustomTheme: (id: string, theme: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportScale: (scale: ExportScale) => void;
  setJpegQuality: (quality: number) => void;
  resetSettings: () => void;
}

export interface UIState {
  colorMode: ColorMode;
  isSettingsPanelOpen: boolean;
  previewZoom: number;
  compareMode: boolean;

  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setPreviewZoom: (zoom: number) => void;
  setCompareMode: (enabled: boolean) => void;
}

export type AppStore = EditorState & SettingsState & UIState;
