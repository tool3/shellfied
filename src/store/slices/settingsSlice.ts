import type { StateCreator } from 'zustand';
import type { AppStore, SettingsState } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_EXPORT_SCALE } from '@/constants/defaults';

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsState> = (set) => ({
  ...DEFAULT_SETTINGS,
  exportScale: DEFAULT_EXPORT_SCALE,

  setTemplate: (template) => set({ template }),
  setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setPadding: (padding) => set({ padding }),
  setTitle: (title) => set({ title }),
  setShowControls: (showControls) => set({ showControls }),
  setWatermark: (watermark) => set({ watermark }),
  setExportScale: (exportScale) => set({ exportScale }),
  resetSettings: () =>
    set({
      ...DEFAULT_SETTINGS,
      exportScale: DEFAULT_EXPORT_SCALE,
    }),
});
