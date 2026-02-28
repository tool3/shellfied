import type { StateCreator } from 'zustand';
import type { AppStore, UIState } from '../types';
import { DEFAULT_COLOR_MODE } from '@/constants/defaults';

const getSystemColorMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return DEFAULT_COLOR_MODE;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const createUISlice: StateCreator<AppStore, [], [], UIState> = (set, get) => ({
  colorMode: getSystemColorMode(),
  isSettingsPanelOpen: true,
  previewZoom: 100,

  toggleColorMode: () =>
    set({
      colorMode: get().colorMode === 'dark' ? 'light' : 'dark',
    }),
  setColorMode: (colorMode) => set({ colorMode }),
  setSettingsPanelOpen: (isSettingsPanelOpen) => set({ isSettingsPanelOpen }),
  setPreviewZoom: (previewZoom) => set({ previewZoom }),
});
