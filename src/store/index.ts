import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createEditorSlice } from './slices/editorSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createUISlice } from './slices/uiSlice';
import { DEFAULT_WATERMARK, DEFAULT_WATERMARK_STYLE, DEFAULT_WATERMARK_MARKUP, DEFAULT_BACKGROUND } from '@/constants/defaults';
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
        borderRadius: state.borderRadius,
        watermark: state.watermark,
        width: state.width,
        fontFamily: state.fontFamily,
        header: state.header,
        footer: state.footer,
        background: state.background,
        customThemes: state.customThemes,
        exportFormat: state.exportFormat,
        exportScale: state.exportScale,
        jpegQuality: state.jpegQuality,
        colorMode: state.colorMode,
        // Compare mode
        compareMode: state.compareMode,
        beforeContent: state.beforeContent,
        afterContent: state.afterContent,
        beforeLabel: state.beforeLabel,
        afterLabel: state.afterLabel,
        beforeLanguage: state.beforeLanguage,
        afterLanguage: state.afterLanguage,
        compareLabelConfig: state.compareLabelConfig,
      }),
      // Migrate old data formats
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppStore>;

        // Handle watermark migration: old format had color and padding fields
        let watermark = persisted.watermark;
        if (typeof watermark === 'string') {
          // Very old format: just a string
          watermark = { type: 'text', text: watermark, style: DEFAULT_WATERMARK_STYLE, markup: DEFAULT_WATERMARK_MARKUP };
        } else if (watermark && 'color' in watermark && 'padding' in watermark) {
          // Old format: { text, color, padding }
          const oldWatermark = watermark as { text: string; color: string; padding: number[] };
          const paddingStr = oldWatermark.padding.every((v: number) => v === oldWatermark.padding[0])
            ? `${oldWatermark.padding[0]}px`
            : `${oldWatermark.padding[0]}px ${oldWatermark.padding[1]}px ${oldWatermark.padding[2]}px ${oldWatermark.padding[3]}px`;
          watermark = {
            type: 'text',
            text: oldWatermark.text,
            style: `color: ${oldWatermark.color};\npadding: ${paddingStr};`,
            markup: DEFAULT_WATERMARK_MARKUP,
          };
        } else if (watermark && !watermark.type) {
          // Previous format without type field
          watermark = { ...DEFAULT_WATERMARK, ...watermark, type: 'text' };
        } else if (watermark && !watermark.markup) {
          // Previous format without markup field
          watermark = { ...watermark, markup: DEFAULT_WATERMARK_MARKUP };
        }

        // Handle background migration: might not exist in old data or missing new fields
        let background = persisted.background || DEFAULT_BACKGROUND;
        // Ensure imageAspectRatio exists (added in later version)
        if (background && !background.imageAspectRatio) {
          background = { ...background, imageAspectRatio: 'auto' };
        }

        return {
          ...currentState,
          ...persisted,
          watermark: watermark || DEFAULT_WATERMARK,
          background,
          customThemes: persisted.customThemes || [],
        };
      },
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
export const useCompareMode = () => useStore((s) => s.compareMode);

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
      borderRadius: s.borderRadius,
      watermark: s.watermark,
      width: s.width,
      fontFamily: s.fontFamily,
      header: s.header,
      footer: s.footer,
    }))
  );

export type { AppStore } from './types';
