import type { StateCreator } from 'zustand';
import type { AppStore, SettingsState } from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_SCALE,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_BRAND,
} from '@/constants/defaults';
import { PRESET_MAP } from '@/constants/presets';

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsState> = (set, get) => ({
  ...DEFAULT_SETTINGS,
  customThemes: [],
  exportFormat: DEFAULT_EXPORT_FORMAT,
  exportScale: DEFAULT_EXPORT_SCALE,
  jpegQuality: DEFAULT_JPEG_QUALITY,
  activePreset: null,
  brand: DEFAULT_BRAND,

  setTemplate: (template) => {
    // Auto-switch controls position based on template style
    const controlsPosition = template === 'windows' ? 'right' : 'left';
    set({ template, controlsPosition });
  },
  setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setPadding: (padding) => set({ padding }),
  setTitle: (title) => set({ title }),
  setShowControls: (showControls) => set({ showControls }),
  setControlsPosition: (controlsPosition) => set({ controlsPosition }),
  setBorderRadius: (borderRadius) => set({ borderRadius }),
  setLineNumbers: (lineNumbers) => set({ lineNumbers }),
  setWatermark: (watermarkUpdate) => set({ watermark: { ...get().watermark, ...watermarkUpdate } }),
  setWidth: (width) => set({ width }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setHeader: (headerUpdate) => set({ header: { ...get().header, ...headerUpdate } }),
  setFooter: (footerUpdate) => set({ footer: { ...get().footer, ...footerUpdate } }),
  setBackground: (backgroundUpdate) => set({ background: { ...get().background, ...backgroundUpdate } }),
  addCustomTheme: (theme) => set({ customThemes: [...get().customThemes, theme] }),
  updateCustomTheme: (id, themeUpdate) =>
    set({
      customThemes: get().customThemes.map((t) => (t.id === id ? { ...t, ...themeUpdate } : t)),
    }),
  deleteCustomTheme: (id) =>
    set({
      customThemes: get().customThemes.filter((t) => t.id !== id),
      // Reset to dracula if the deleted theme was selected
      terminalTheme: get().terminalTheme === id ? 'dracula' : get().terminalTheme,
    }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setExportScale: (exportScale) => set({ exportScale }),
  setJpegQuality: (jpegQuality) => set({ jpegQuality }),
  setBrand: (brandUpdate) => set({ brand: { ...get().brand, ...brandUpdate } }),
  applyPreset: (presetId) => {
    const preset = PRESET_MAP[presetId];
    if (!preset) return;
    const { settings } = preset;

    // Partner presets (with shellfiePreset) — shellfie handles background natively.
    // Set background.type to 'none' so shellfied doesn't render its own on top.
    // Classic presets use shellfied's background system (gradients, etc.)
    const background = preset.shellfiePreset
      ? { ...DEFAULT_SETTINGS.background, type: 'none' as const }
      : { ...DEFAULT_SETTINGS.background, ...settings.background };

    set({
      ...DEFAULT_SETTINGS,
      activePreset: presetId,
      customThemes: get().customThemes,
      template: settings.template,
      terminalTheme: settings.terminalTheme,
      showControls: settings.showControls,
      borderRadius: settings.borderRadius,
      fontFamily: settings.fontFamily,
      padding: settings.padding,
      background,
    });
  },
  resetSettings: () =>
    set({
      ...DEFAULT_SETTINGS,
      activePreset: null,
      customThemes: get().customThemes, // Preserve custom themes on reset
      exportFormat: DEFAULT_EXPORT_FORMAT,
      exportScale: DEFAULT_EXPORT_SCALE,
      jpegQuality: DEFAULT_JPEG_QUALITY,
    }),
});
