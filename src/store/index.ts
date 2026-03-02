import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createEditorSlice } from './slices/editorSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createUISlice } from './slices/uiSlice';
import type { AppStore } from './types';

export const useStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createEditorSlice(...args),
      ...createSettingsSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'shellfied-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user preferences
        content: state.content,
        language: state.language,
        template: state.template,
        terminalTheme: state.terminalTheme,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        padding: state.padding,
        title: state.title,
        showControls: state.showControls,
        controlsPosition: state.controlsPosition,
        watermark: state.watermark,
        watermarkPadding: state.watermarkPadding,
        width: state.width,
        fontFamily: state.fontFamily,
        header: state.header,
        footer: state.footer,
        exportFormat: state.exportFormat,
        exportScale: state.exportScale,
        jpegQuality: state.jpegQuality,
        colorMode: state.colorMode,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useContent = () => useStore((s) => s.content);
export const useLanguage = () => useStore((s) => s.language);
export const useColorMode = () => useStore((s) => s.colorMode);
export const useTerminalTheme = () => useStore((s) => s.terminalTheme);
export const useTemplate = () => useStore((s) => s.template);
export const useExportScale = () => useStore((s) => s.exportScale);

export const useShellfieOptions = () =>
  useStore(
    useShallow((s) => ({
      template: s.template,
      terminalTheme: s.terminalTheme,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      padding: s.padding,
      title: s.title,
      showControls: s.showControls,
      controlsPosition: s.controlsPosition,
      watermark: s.watermark,
      watermarkPadding: s.watermarkPadding,
      width: s.width,
      fontFamily: s.fontFamily,
      header: s.header,
      footer: s.footer,
    }))
  );

export type { AppStore } from './types';
