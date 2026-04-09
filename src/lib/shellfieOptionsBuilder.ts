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

// Languages shellfie's built-in highlighter supports
const SHELLFIE_LANGUAGES = new Set([
  'bash', 'javascript', 'typescript', 'python', 'json',
  'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'html',
]);

interface BuildResult {
  content: string;
  options: shellfieOptions;
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

    // If user changed the terminal theme from the preset's default, pass it as override
    const presetDefaultTheme = presetConfig?.settings?.terminalTheme;
    const userChangedTheme = presetDefaultTheme && state.terminalTheme !== presetDefaultTheme;
    const themeOverride = userChangedTheme ? getTheme(state.terminalTheme, state.customThemes) : undefined;

    return {
      content: normalizedContent,
      options: {
        preset: shellfiePreset,
        language: shellfieLanguage,
        // Theme override — only when user explicitly changed it from preset default
        theme: themeOverride,
        // User overrides that should always apply on top of preset
        title: state.title || undefined,
        padding: state.padding,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        lineNumbers: state.lineNumbers,
        watermark: buildWatermarkConfig(state.watermark),
        width: state.width || undefined,
        fontFamily: state.fontFamily || undefined,
        embedFont: true,
        animation: state.background.animation || undefined,
      },
    };
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
      lineNumbers: state.lineNumbers || undefined,
      padding: state.padding,
      controls: state.showControls,
      watermark: buildWatermarkConfig(state.watermark),
      width: state.width || undefined,
      fontFamily: state.fontFamily || undefined,
      embedFont: true,
      header: buildHeaderOptions(state.header),
      footer: buildFooterOptions(state.footer),
      animation: state.background.animation || undefined,
    },
  };
}
