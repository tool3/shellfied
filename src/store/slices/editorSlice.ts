import type { StateCreator } from 'zustand';
import type { AppStore, EditorState } from '../types';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE } from '@/constants/defaults';

export const createEditorSlice: StateCreator<AppStore, [], [], EditorState> = (set) => ({
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,

  setContent: (content) => set({ content }),
  setLanguage: (language) => set({ language }),
  clearContent: () => set({ content: '' }),
});
