/**
 * Builds shellfie options from the app store state.
 *
 * When a shellfie preset is active:
 *   - Pass `preset: 'name'` and let shellfie handle theme, template, overlays, background
 *   - Only pass user overrides that shellfie presets don't control (title, watermark, width, animation)
 *   - Don't pass template/theme/controls/padding/fontSize/lineHeight/fontFamily/header/footer
 *     because they would override the preset's carefully tuned values
 *
 * When no preset is active:
 *   - Pre-highlight content and pass all settings manually
 */

import type { shellfieOptions } from 'shellfie';
import type { AppStore } from '@/store/types';
import { PRESET_MAP } from '@/constants/presets';
import {
  buildWatermarkConfig,
  buildTemplate,
  buildHeaderOptions,
  buildFooterOptions,
  getTheme,
} from '@/lib/svgHelpers';
import { highlightWithAnsi, normalizeAnsiEscapes, containsAnsi } from '@/utils/syntaxHighlight';
import { detectLanguage } from '@/constants/languages';
import { DEFAULT_SETTINGS } from '@/constants/defaults';

const DEFAULT_FONT_SIZE = DEFAULT_SETTINGS.fontSize;
const DEFAULT_LINE_HEIGHT = DEFAULT_SETTINGS.lineHeight;

// Languages shellfie's built-in highlighter supports
const SHELLFIE_LANGUAGES = new Set([
  'bash', 'javascript', 'typescript', 'python', 'json',
  'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'html',
]);

interface BuildResult {
  content: string;
  options: shellfieOptions;
}

// Map shellfied gradient direction to shellfie gradient syntax
const GRADIENT_DIR_MAP: Record<string, string> = {
  'to-right': 'horizontal',
  'to-left': 'horizontal:reverse',
  'to-bottom': 'vertical',
  'to-top': 'vertical:reverse',
  'to-bottom-right': 'diagonal',
  'to-top-left': 'diagonal:reverse',
  'to-bottom-left': 'diagonal',
  'to-top-right': 'diagonal:reverse',
};

function buildShellfieBackground(bg: AppStore['background']): { color: string; padding: number } | undefined {
  if (bg.type === 'none') return undefined;

  let color: string;
  if (bg.type === 'gradient') {
    const dir = GRADIENT_DIR_MAP[bg.gradientDirection] || 'diagonal';
    color = `gradient(${bg.gradientFrom}, ${bg.gradientTo}:${dir})`;
  } else {
    color = bg.color;
  }

  return { color, padding: bg.padding };
}

export function buildShellfieArgs(state: AppStore, contentOverride?: string): BuildResult {
  const content = contentOverride ?? state.content;
  if (!content.trim()) return { content: '', options: {} };

  const effectiveLanguage = state.language === 'auto' ? detectLanguage(content) : state.language;

  // Check for active shellfie preset
  const presetConfig = state.activePreset ? PRESET_MAP[state.activePreset] : null;
  const shellfiePreset = presetConfig?.shellfiePreset;

  if (shellfiePreset) {
    // Shellfie preset is active — let shellfie handle everything natively.
    // Normalize literal escape notations (\e[, \033, etc.) to real ESC bytes
    // so shellfie's ANSI parser can process them.
    const hasAnsi = containsAnsi(content);
    const normalizedContent = hasAnsi ? normalizeAnsiEscapes(content) : content;

    // If content has ANSI codes, disable syntax highlighting (language: false)
    // so shellfie doesn't try to re-highlight already-colored terminal output.
    // Otherwise let shellfie auto-detect and highlight.
    const shellfieLanguage = hasAnsi
      ? false as const
      : (state.language !== 'auto' && SHELLFIE_LANGUAGES.has(state.language)
        ? state.language
        : 'auto');

    // Only pass theme when user explicitly changed it from the preset default.
    // Otherwise let shellfie use its native preset theme.
    const presetDefaultTheme = presetConfig?.settings?.terminalTheme;
    const userChangedTheme = presetDefaultTheme && state.terminalTheme !== presetDefaultTheme;
    const themeOverride = userChangedTheme ? getTheme(state.terminalTheme, state.customThemes) : undefined;

    // If user changed the background color OR padding from the preset's default, pass as override
    const presetBg = presetConfig?.settings?.background;
    const userChangedBgColor = presetBg?.color && state.background.color !== presetBg.color;
    const userChangedBgPadding = presetBg?.padding !== undefined && state.background.padding !== presetBg.padding;
    const backgroundOverride = (userChangedBgColor || userChangedBgPadding)
      ? buildShellfieBackground(state.background)
      : undefined;

    // Pass overrides only when user changed from the preset's defaults.
    // Otherwise let shellfie use its native preset values.
    const presetSettings = presetConfig?.settings;
    const userChangedPadding = presetSettings && JSON.stringify(state.padding) !== JSON.stringify(presetSettings.padding);
    const userChangedFontSize = presetSettings && state.fontSize !== DEFAULT_FONT_SIZE;
    const userChangedLineHeight = presetSettings && state.lineHeight !== DEFAULT_LINE_HEIGHT;
    const userChangedFontFamily = presetSettings && state.fontFamily !== presetSettings.fontFamily;

    const opts: shellfieOptions = {
      preset: shellfiePreset,
      language: shellfieLanguage,
      embedFont: true,
      theme: themeOverride,
      background: backgroundOverride,
      lineNumbers: state.lineNumbers,
      animation: state.background.animation || undefined,
      animationColor: state.background.animationColor || undefined,
      title: state.title || undefined,
      watermark: buildWatermarkConfig(state.watermark),
      width: state.width || undefined,
      // Only pass layout overrides when user changed from preset defaults
      ...(userChangedPadding ? { padding: state.padding } : {}),
      ...(userChangedFontSize ? { fontSize: state.fontSize } : {}),
      ...(userChangedLineHeight ? { lineHeight: state.lineHeight } : {}),
      ...(userChangedFontFamily ? { fontFamily: state.fontFamily } : {}),
    };

    return { content: normalizedContent, options: opts };
  }

  // No preset — manually build everything
  // Normalize ANSI escapes (\e, \033, etc.) before highlighting
  const normalizedContent = containsAnsi(content) ? normalizeAnsiEscapes(content) : content;
  const processedContent = highlightWithAnsi(normalizedContent, effectiveLanguage);

  return {
    content: processedContent,
    options: {
      language: false, // already highlighted above
      template: buildTemplate(state.template, state.controlsPosition, state.borderRadius),
      theme: getTheme(state.terminalTheme, state.customThemes),
      title: state.title || undefined,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      lineNumbers: state.lineNumbers,
      padding: state.padding,
      controls: state.showControls,
      watermark: buildWatermarkConfig(state.watermark),
      width: state.width || undefined,
      fontFamily: state.fontFamily || undefined,
      embedFont: true,
      header: buildHeaderOptions(state.header),
      footer: buildFooterOptions(state.footer),
      animation: state.background.animation || undefined,
      animationColor: state.background.animationColor || undefined,
      // Pass background to shellfie so it's part of the SVG output
      background: buildShellfieBackground(state.background),
    },
  };
}
