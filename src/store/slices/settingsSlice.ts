import type { StateCreator } from 'zustand';
import type { AppStore, SettingsState } from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_SCALE,
  DEFAULT_JPEG_QUALITY,
} from '@/constants/defaults';

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsState> = (set, get) => ({
  ...DEFAULT_SETTINGS,
  exportFormat: DEFAULT_EXPORT_FORMAT,
  exportScale: DEFAULT_EXPORT_SCALE,
  jpegQuality: DEFAULT_JPEG_QUALITY,

  setTemplate: (template) => set({ template }),
  setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setPadding: (padding) => set({ padding }),
  setTitle: (title) => set({ title }),
  setShowControls: (showControls) => set({ showControls }),
  setControlsPosition: (controlsPosition) => set({ controlsPosition }),
  setWatermark: (watermark) => set({ watermark }),
  setWatermarkPadding: (watermarkPadding) => set({ watermarkPadding }),
  setWidth: (width) => set({ width }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setHeader: (headerUpdate) => set({ header: { ...get().header, ...headerUpdate } }),
  setFooter: (footerUpdate) => set({ footer: { ...get().footer, ...footerUpdate } }),
  setBackground: (backgroundUpdate) => set({ background: { ...get().background, ...backgroundUpdate } }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setExportScale: (exportScale) => set({ exportScale }),
  setJpegQuality: (jpegQuality) => set({ jpegQuality }),
  resetSettings: () =>
    set({
      ...DEFAULT_SETTINGS,
      exportFormat: DEFAULT_EXPORT_FORMAT,
      exportScale: DEFAULT_EXPORT_SCALE,
      jpegQuality: DEFAULT_JPEG_QUALITY,
    }),
});
