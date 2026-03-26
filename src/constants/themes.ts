import { themes, createTheme, type Theme } from 'shellfie';
import { presetThemes } from './presetThemes';

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

// Custom themes to add alongside shellfie themes
const customThemes: Record<string, Theme> = {
  nightOwl,
  cobalt2,
  materialDark,
};

// Combine shellfie themes with custom themes and preset themes
const allThemes: Record<string, Theme> = {
  ...themes,
  ...customThemes,
  ...presetThemes,
};

export interface TerminalThemeConfig {
  theme: Theme;
  label: string;
  isDark: boolean;
  previewBg: string;
  previewFg: string;
}

// Calculate relative luminance to determine if a color is dark
function getLuminance(hex: string): number {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((c) => {
      const val = parseInt(c, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
  if (!rgb || rgb.length !== 3) return 0;
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// Determine if a background color is dark (luminance < 0.5)
function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

// Convert camelCase or other formats to Title Case
function toLabel(name: string): string {
  // Handle special cases
  const specialLabels: Record<string, string> = {
    night3024: '3024 Night',
    a11yDark: 'A11y Dark',
    base16Dark: 'Base16 Dark',
    base16Light: 'Base16 Light',
    catppuccinMocha: 'Catppuccin Mocha',
    draculaPro: 'Dracula Pro',
    duotoneDark: 'Duotone Dark',
    githubDark: 'GitHub Dark',
    githubLight: 'GitHub Light',
    gruvboxDark: 'Gruvbox Dark',
    gruvboxLight: 'Gruvbox Light',
    oceanicNext: 'Oceanic Next',
    oneDark: 'One Dark',
    oneLight: 'One Light',
    pandaSyntax: 'Panda Syntax',
    paraisoDark: 'Paraiso Dark',
    shadesOfPurple: 'Shades of Purple',
    solarizedDark: 'Solarized Dark',
    solarizedLight: 'Solarized Light',
    synthwave84: 'Synthwave 84',
    tokyoNight: 'Tokyo Night',
    materialDark: 'Material Dark',
    nightOwl: 'Night Owl',
    cobalt2: 'Cobalt2',
    vscode: 'VS Code',
    // Preset themes
    presetVercel: 'Vercel',
    presetSupabase: 'Supabase',
    presetTailwind: 'Tailwind',
    presetOpenAI: 'OpenAI',
    presetClerk: 'Clerk',
    presetPrisma: 'Prisma',
    presetMintlify: 'Mintlify',
    presetElevenLabs: 'ElevenLabs',
    presetResend: 'Resend',
    presetTriggerDev: 'Trigger.dev',
    presetNuxt: 'Nuxt',
    presetBrowserbase: 'Browserbase',
    presetCloudflare: 'Cloudflare',
    presetGemini: 'Gemini',
    presetStripe: 'Stripe',
    presetFirecrawl: 'Firecrawl',
    presetBreeze: 'Breeze',
    presetCandy: 'Candy',
    presetCrimson: 'Crimson',
    presetFalcon: 'Falcon',
    presetMeadow: 'Meadow',
    presetMidnight: 'Midnight',
    presetRaindrop: 'Raindrop',
    presetSunset: 'Sunset',
    presetNoir: 'Noir',
    presetIce: 'Ice',
    presetSand: 'Sand',
    presetForest: 'Forest',
    presetMono: 'Mono',
  };

  if (specialLabels[name]) {
    return specialLabels[name];
  }

  // Default: convert camelCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Programmatically generate theme configs from all available themes
export const TERMINAL_THEMES: Record<string, TerminalThemeConfig> = Object.fromEntries(
  Object.entries(allThemes).map(([name, theme]) => [
    name,
    {
      theme,
      label: toLabel(name),
      isDark: isDarkColor(theme.background),
      previewBg: theme.background,
      previewFg: theme.foreground,
    },
  ])
);

// Get all theme names as a type-safe array
export const THEME_NAMES = Object.keys(TERMINAL_THEMES) as string[];

export const THEME_LIST = Object.entries(TERMINAL_THEMES).map(([key, config]) => ({
  id: key,
  ...config,
}));

export const DARK_THEMES = THEME_LIST.filter((t) => t.isDark);
export const LIGHT_THEMES = THEME_LIST.filter((t) => !t.isDark);

// Default theme
export const DEFAULT_THEME = 'dracula';
