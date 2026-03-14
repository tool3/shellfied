import type { StateCreator } from 'zustand';
import type { AppStore, UIState } from '../types';
import { DEFAULT_COLOR_MODE } from '@/constants/defaults';
import { switchToEditMode } from '@/utils/urlParams';

const getSystemColorMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return DEFAULT_COLOR_MODE;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const createUISlice: StateCreator<AppStore, [], [], UIState> = (set, get) => ({
  colorMode: getSystemColorMode(),
  isSettingsPanelOpen: true,
  previewZoom: 100,
  compareMode: false,
  shareMode: null,
  isViewMode: false,
  staticOutput: null,

  toggleColorMode: () =>
    set({
      colorMode: get().colorMode === 'dark' ? 'light' : 'dark',
    }),
  setColorMode: (colorMode) => set({ colorMode }),
  setSettingsPanelOpen: (isSettingsPanelOpen) => set({ isSettingsPanelOpen }),
  setPreviewZoom: (previewZoom) => set({ previewZoom }),
  setCompareMode: (compareMode) => set({ compareMode }),
  setShareMode: (shareMode) =>
    set({
      shareMode,
      isViewMode: shareMode === 'view',
    }),
  exitViewMode: () => {
    switchToEditMode();
    set({ shareMode: 'edit', isViewMode: false, staticOutput: null });
  },
});
