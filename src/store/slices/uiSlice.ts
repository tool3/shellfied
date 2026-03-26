import type { StateCreator } from 'zustand';
import type { AppStore, UIState } from '../types';
import { DEFAULT_COLOR_MODE } from '@/constants/defaults';
import { switchToEditMode, getShareMode } from '@/utils/urlParams';

const getSystemColorMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return DEFAULT_COLOR_MODE;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Read share mode from URL at module load time so the very first render is correct.
// Without this, incognito/private mode (empty localStorage) would flash the editor
// before hydration sets isViewMode.
const urlShareMode = typeof window !== 'undefined' ? getShareMode() : null;

export const createUISlice: StateCreator<AppStore, [], [], UIState> = (set, get) => ({
  colorMode: getSystemColorMode(),
  isSettingsPanelOpen: true,
  previewZoom: 100,
  compareMode: false,
  shareMode: urlShareMode,
  isViewMode: urlShareMode === 'view',
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
      // Set optimal export defaults for view mode (3x scale, 100% quality)
      ...(shareMode === 'view' && { exportScale: 3, jpegQuality: 1.0 }),
    }),
  exitViewMode: () => {
    switchToEditMode();
    set({ shareMode: 'edit', isViewMode: false, staticOutput: null });
  },
});
