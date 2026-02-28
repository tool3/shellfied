import {
  dracula,
  nord,
  tokyoNight,
  oneDark,
  monokai,
  catppuccinMocha,
  githubDark,
  githubLight,
  gruvboxDark,
  gruvboxLight,
  solarizedDark,
  solarizedLight,
  createTheme,
  type Theme,
} from 'shellfie';
import type { TerminalThemeName } from '@/types';

// Custom themes not included in shellfie
export const nightOwl = createTheme({
  name: 'nightOwl',
  background: '#011627',
  foreground: '#d6deeb',
  black: '#011627',
  red: '#ef5350',
  green: '#22da6e',
  yellow: '#addb67',
  blue: '#82aaff',
  magenta: '#c792ea',
  cyan: '#21c7a8',
  white: '#ffffff',
  brightBlack: '#575656',
  brightRed: '#ef5350',
  brightGreen: '#22da6e',
  brightYellow: '#ffeb95',
  brightBlue: '#82aaff',
  brightMagenta: '#c792ea',
  brightCyan: '#7fdbca',
  brightWhite: '#ffffff',
  cursor: '#80a4c2',
  selection: '#1d3b53',
});

export const cobalt2 = createTheme({
  name: 'cobalt2',
  background: '#193549',
  foreground: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#38de21',
  yellow: '#ffe50a',
  blue: '#1460d2',
  magenta: '#ff005d',
  cyan: '#00bbbb',
  white: '#bbbbbb',
  brightBlack: '#555555',
  brightRed: '#f40e17',
  brightGreen: '#3bd01d',
  brightYellow: '#edc809',
  brightBlue: '#5555ff',
  brightMagenta: '#ff55ff',
  brightCyan: '#6ae3fa',
  brightWhite: '#ffffff',
  cursor: '#ffc600',
  selection: '#0050a4',
});

export const materialDark = createTheme({
  name: 'materialDark',
  background: '#263238',
  foreground: '#eeffff',
  black: '#000000',
  red: '#f07178',
  green: '#c3e88d',
  yellow: '#ffcb6b',
  blue: '#82aaff',
  magenta: '#c792ea',
  cyan: '#89ddff',
  white: '#eeffff',
  brightBlack: '#546e7a',
  brightRed: '#f07178',
  brightGreen: '#c3e88d',
  brightYellow: '#ffcb6b',
  brightBlue: '#82aaff',
  brightMagenta: '#c792ea',
  brightCyan: '#89ddff',
  brightWhite: '#ffffff',
  cursor: '#ffcc00',
  selection: '#80cbc4',
});

export interface TerminalThemeConfig {
  theme: Theme;
  label: string;
  isDark: boolean;
  previewBg: string;
  previewFg: string;
}

export const TERMINAL_THEMES: Record<TerminalThemeName, TerminalThemeConfig> = {
  // Dark themes
  dracula: {
    theme: dracula,
    label: 'Dracula',
    isDark: true,
    previewBg: '#282a36',
    previewFg: '#f8f8f2',
  },
  nord: {
    theme: nord,
    label: 'Nord',
    isDark: true,
    previewBg: '#2e3440',
    previewFg: '#eceff4',
  },
  tokyoNight: {
    theme: tokyoNight,
    label: 'Tokyo Night',
    isDark: true,
    previewBg: '#1a1b26',
    previewFg: '#c0caf5',
  },
  oneDark: {
    theme: oneDark,
    label: 'One Dark',
    isDark: true,
    previewBg: '#282c34',
    previewFg: '#abb2bf',
  },
  monokai: {
    theme: monokai,
    label: 'Monokai',
    isDark: true,
    previewBg: '#272822',
    previewFg: '#f8f8f2',
  },
  catppuccinMocha: {
    theme: catppuccinMocha,
    label: 'Catppuccin',
    isDark: true,
    previewBg: '#1e1e2e',
    previewFg: '#cdd6f4',
  },
  githubDark: {
    theme: githubDark,
    label: 'GitHub Dark',
    isDark: true,
    previewBg: '#0d1117',
    previewFg: '#c9d1d9',
  },
  gruvboxDark: {
    theme: gruvboxDark,
    label: 'Gruvbox Dark',
    isDark: true,
    previewBg: '#282828',
    previewFg: '#ebdbb2',
  },
  solarizedDark: {
    theme: solarizedDark,
    label: 'Solarized Dark',
    isDark: true,
    previewBg: '#002b36',
    previewFg: '#839496',
  },
  nightOwl: {
    theme: nightOwl,
    label: 'Night Owl',
    isDark: true,
    previewBg: '#011627',
    previewFg: '#d6deeb',
  },
  cobalt2: {
    theme: cobalt2,
    label: 'Cobalt2',
    isDark: true,
    previewBg: '#193549',
    previewFg: '#ffffff',
  },
  materialDark: {
    theme: materialDark,
    label: 'Material Dark',
    isDark: true,
    previewBg: '#263238',
    previewFg: '#eeffff',
  },
  // Light themes
  githubLight: {
    theme: githubLight,
    label: 'GitHub Light',
    isDark: false,
    previewBg: '#ffffff',
    previewFg: '#24292f',
  },
  gruvboxLight: {
    theme: gruvboxLight,
    label: 'Gruvbox Light',
    isDark: false,
    previewBg: '#fbf1c7',
    previewFg: '#3c3836',
  },
  solarizedLight: {
    theme: solarizedLight,
    label: 'Solarized Light',
    isDark: false,
    previewBg: '#fdf6e3',
    previewFg: '#657b83',
  },
};

export const THEME_LIST = Object.entries(TERMINAL_THEMES).map(([key, config]) => ({
  id: key as TerminalThemeName,
  ...config,
}));

export const DARK_THEMES = THEME_LIST.filter((t) => t.isDark);
export const LIGHT_THEMES = THEME_LIST.filter((t) => !t.isDark);
