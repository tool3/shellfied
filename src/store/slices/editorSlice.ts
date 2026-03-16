import type { StateCreator } from 'zustand';
import type { AppStore, EditorState } from '../types';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE } from '@/constants/defaults';
import type { CompareLabelConfig } from '@/types';

const DEFAULT_COMPARE_LABEL_CONFIG: CompareLabelConfig = {
  fontSize: 16,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 600,
  color: '#ffffff',
  alignment: 'left',
};

export const createEditorSlice: StateCreator<AppStore, [], [], EditorState> = (set) => ({
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,

  setContent: (content) => set({ content }),
  setLanguage: (language) => set({ language }),
  clearContent: () => set({ content: '' }),

  // Compare mode content
  beforeContent: '',
  afterContent: '',
  beforeLabel: 'Before',
  afterLabel: 'After',
  beforeTitle: 'Terminal',
  afterTitle: 'Terminal',
  beforeLanguage: 'auto',
  afterLanguage: 'auto',
  compareLabelConfig: DEFAULT_COMPARE_LABEL_CONFIG,

  setBeforeContent: (beforeContent) => set({ beforeContent }),
  setAfterContent: (afterContent) => set({ afterContent }),
  setBeforeLabel: (beforeLabel) => set({ beforeLabel }),
  setAfterLabel: (afterLabel) => set({ afterLabel }),
  setBeforeTitle: (beforeTitle) => set({ beforeTitle }),
  setAfterTitle: (afterTitle) => set({ afterTitle }),
  setBeforeLanguage: (beforeLanguage) => set({ beforeLanguage }),
  setAfterLanguage: (afterLanguage) => set({ afterLanguage }),
  setCompareLabelConfig: (config) =>
    set((state) => ({
      compareLabelConfig: { ...state.compareLabelConfig, ...config },
    })),
});
