export type TemplateType = 'macos' | 'windows' | 'minimal';

export type TerminalThemeName =
  | 'dracula'
  | 'nord'
  | 'tokyoNight'
  | 'oneDark'
  | 'monokai'
  | 'catppuccinMocha'
  | 'githubDark'
  | 'githubLight'
  | 'gruvboxDark'
  | 'gruvboxLight'
  | 'solarizedDark'
  | 'solarizedLight'
  | 'nightOwl'
  | 'cobalt2'
  | 'materialDark';

export type ColorMode = 'light' | 'dark';

export type ExportScale = 1 | 2 | 3;

export type PaddingTuple = [number, number, number, number];

export interface ShellfieSettings {
  template: TemplateType;
  terminalTheme: TerminalThemeName;
  fontSize: number;
  lineHeight: number;
  padding: PaddingTuple;
  title: string;
  showControls: boolean;
  watermark: string;
}
