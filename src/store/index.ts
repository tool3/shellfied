import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect } from 'react';
import { createEditorSlice } from './slices/editorSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createUISlice } from './slices/uiSlice';
import { DEFAULT_WATERMARK, DEFAULT_WATERMARK_STYLE, DEFAULT_WATERMARK_MARKUP, DEFAULT_BACKGROUND } from '@/constants/defaults';
import { parseUrlParams, getShareMode, getOutputFormat, type UrlState } from '@/utils/urlParams';
import type { AppStore } from './types';

/**
 * Safe localStorage wrapper that handles private/incognito mode gracefully.
 * In some browsers (e.g. Safari private mode), localStorage throws on access.
 */
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Silently fail in private mode - state won't persist but app still works
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Silently fail
    }
  },
};

// Parse URL params once at module load
const initialUrlState = typeof window !== 'undefined' ? parseUrlParams() : null;
const initialShareMode = typeof window !== 'undefined' ? getShareMode() : null;
const initialOutputFormat = typeof window !== 'undefined' ? getOutputFormat() : null;

// Track hydration state
let hasHydrated = false;

export const useStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createEditorSlice(...args),
      ...createSettingsSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'shellfied-storage',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => {
        return () => {
          hasHydrated = true;
        };
      },
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
        brand: state.brand,
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

        // Base merged state from persistence
        const mergedState = {
          ...currentState,
          ...persisted,
          watermark: watermark || DEFAULT_WATERMARK,
          background,
          customThemes: persisted.customThemes || [],
        };

        // Apply URL params if present (they take precedence)
        if (initialUrlState) {
          return applyUrlState(mergedState, initialUrlState, initialShareMode, initialOutputFormat);
        }

        return mergedState;
      },
    }
  )
);

// Apply URL state to store state
function applyUrlState(
  state: AppStore,
  urlState: UrlState,
  shareMode: 'view' | 'edit' | null,
  outputFormat: 'svg' | 'png' | 'webp' | 'jpeg' | null
): AppStore {
  const result = { ...state };

  // Share mode
  if (shareMode) {
    result.shareMode = shareMode;
    result.isViewMode = shareMode === 'view';
  }

  // Static output format (for serving images directly)
  if (outputFormat) {
    result.staticOutput = outputFormat;
  }

  // Core settings
  if (urlState.template !== undefined) result.template = urlState.template;
  if (urlState.terminalTheme !== undefined) result.terminalTheme = urlState.terminalTheme;
  if (urlState.fontSize !== undefined) result.fontSize = urlState.fontSize;
  if (urlState.lineHeight !== undefined) result.lineHeight = urlState.lineHeight;
  if (urlState.padding !== undefined) result.padding = urlState.padding;
  if (urlState.title !== undefined) result.title = urlState.title;
  if (urlState.showControls !== undefined) result.showControls = urlState.showControls;
  if (urlState.controlsPosition !== undefined) result.controlsPosition = urlState.controlsPosition;
  if (urlState.borderRadius !== undefined) result.borderRadius = urlState.borderRadius;
  if (urlState.width !== undefined) result.width = urlState.width;
  if (urlState.fontFamily !== undefined) result.fontFamily = urlState.fontFamily;

  // Export settings
  if (urlState.exportFormat !== undefined) result.exportFormat = urlState.exportFormat;
  if (urlState.exportScale !== undefined) result.exportScale = urlState.exportScale;
  if (urlState.jpegQuality !== undefined) result.jpegQuality = urlState.jpegQuality;

  // Editor content
  if (urlState.content !== undefined) result.content = urlState.content;
  if (urlState.language !== undefined) result.language = urlState.language;
  if (urlState.colorMode !== undefined) result.colorMode = urlState.colorMode;

  // Compare mode
  if (urlState.compareMode !== undefined) result.compareMode = urlState.compareMode;
  if (urlState.beforeContent !== undefined) result.beforeContent = urlState.beforeContent;
  if (urlState.afterContent !== undefined) result.afterContent = urlState.afterContent;
  if (urlState.beforeLabel !== undefined) result.beforeLabel = urlState.beforeLabel;
  if (urlState.afterLabel !== undefined) result.afterLabel = urlState.afterLabel;
  if (urlState.beforeTitle !== undefined) result.beforeTitle = urlState.beforeTitle;
  if (urlState.afterTitle !== undefined) result.afterTitle = urlState.afterTitle;
  if (urlState.beforeLanguage !== undefined) result.beforeLanguage = urlState.beforeLanguage;
  if (urlState.afterLanguage !== undefined) result.afterLanguage = urlState.afterLanguage;
  if (urlState.compareLabelConfig) {
    result.compareLabelConfig = { ...result.compareLabelConfig, ...urlState.compareLabelConfig } as typeof result.compareLabelConfig;
  }

  // Watermark
  if (urlState.watermark) {
    result.watermark = { ...result.watermark, ...urlState.watermark };
  }

  // Header
  if (urlState.header) {
    result.header = { ...result.header, ...urlState.header };
  }

  // Footer
  if (urlState.footer) {
    result.footer = { ...result.footer, ...urlState.footer };
  }

  // Background
  if (urlState.background) {
    result.background = { ...result.background, ...urlState.background };
  }

  // Brand
  if (urlState.brand) {
    result.brand = { ...result.brand, ...urlState.brand };
  }

  return result;
}

// Selectors for optimized re-renders
export const useContent = () => useStore((s) => s.content);
export const useLanguage = () => useStore((s) => s.language);
export const useColorMode = () => useStore((s) => s.colorMode);
export const useTerminalTheme = () => useStore((s) => s.terminalTheme);
export const useTemplate = () => useStore((s) => s.template);
export const useExportScale = () => useStore((s) => s.exportScale);
export const useCompareMode = () => useStore((s) => s.compareMode);
export const useShareMode = () => useStore((s) => s.shareMode);
export const useIsViewMode = () => useStore((s) => s.isViewMode);
export const useStaticOutput = () => useStore((s) => s.staticOutput);

// Hook to check if store has been hydrated
export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(hasHydrated);

  useEffect(() => {
    // Subscribe to hydration if not already hydrated
    if (!hasHydrated) {
      const unsubscribe = useStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return unsubscribe;
    }
  }, []);

  return hydrated;
};

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

// Compare mode state
export const useCompareState = () =>
  useStore(
    useShallow((s) => ({
      compareMode: s.compareMode,
      beforeContent: s.beforeContent,
      afterContent: s.afterContent,
      beforeLabel: s.beforeLabel,
      afterLabel: s.afterLabel,
      beforeLanguage: s.beforeLanguage,
      afterLanguage: s.afterLanguage,
      beforeTitle: s.beforeTitle,
      afterTitle: s.afterTitle,
      compareLabelConfig: s.compareLabelConfig,
    }))
  );

// Compare mode actions
export const useCompareActions = () =>
  useStore(
    useShallow((s) => ({
      setCompareMode: s.setCompareMode,
      setBeforeContent: s.setBeforeContent,
      setAfterContent: s.setAfterContent,
      setBeforeLabel: s.setBeforeLabel,
      setAfterLabel: s.setAfterLabel,
      setBeforeLanguage: s.setBeforeLanguage,
      setAfterLanguage: s.setAfterLanguage,
      setBeforeTitle: s.setBeforeTitle,
      setAfterTitle: s.setAfterTitle,
      setCompareLabelConfig: s.setCompareLabelConfig,
    }))
  );

// Export settings state
export const useExportSettings = () =>
  useStore(
    useShallow((s) => ({
      exportFormat: s.exportFormat,
      exportScale: s.exportScale,
      jpegQuality: s.jpegQuality,
    }))
  );

// Export settings actions
export const useExportActions = () =>
  useStore(
    useShallow((s) => ({
      setExportFormat: s.setExportFormat,
      setExportScale: s.setExportScale,
      setJpegQuality: s.setJpegQuality,
    }))
  );

// Background state
export const useBackgroundState = () =>
  useStore(
    useShallow((s) => ({
      background: s.background,
      setBackground: s.setBackground,
    }))
  );

export type { AppStore } from './types';
