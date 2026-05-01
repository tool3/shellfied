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
  // Anti-diagonal: swap colors and use diagonal (shellfie only supports one diagonal axis)
  'to-bottom-left': 'diagonal:swap',
  'to-top-right': 'diagonal:reverse:swap',
};

interface ShellfieBackgroundResult {
  color: string;
  padding: number;
  radialOverlay?: (w: number, h: number) => string;
}

function buildShellfieBackground(bg: AppStore['background']): ShellfieBackgroundResult | undefined {
  if (bg.type === 'none') return undefined;

  if (bg.type === 'gradient') {
    const isRadial = bg.gradientDirection === 'radial' || bg.gradientDirection === 'radial-reverse';

    if (isRadial) {
      // Shellfie doesn't support radial gradients natively.
      // Pass the outer color as solid background and inject radial via overlay.
      const isReverse = bg.gradientDirection === 'radial-reverse';
      const innerColor = isReverse ? bg.gradientTo : bg.gradientFrom;
      const outerColor = isReverse ? bg.gradientFrom : bg.gradientTo;

      return {
        color: outerColor,
        padding: bg.padding,
        radialOverlay: (w: number, h: number) => {
          const r = Math.max(w, h);
          const cx = w / 2;
          const cy = h / 2;
          return `<defs><radialGradient id="shellfied-radial" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r / 2}" fx="${cx}" fy="${cy}"><stop offset="0%" stop-color="${innerColor}"/><stop offset="100%" stop-color="${outerColor}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#shellfied-radial)"/>`;
        },
      };
    }

    const mapping = GRADIENT_DIR_MAP[bg.gradientDirection] || 'diagonal';
    const needsSwap = mapping.includes(':swap');
    const dir = mapping.replace(':swap', '');
    const from = needsSwap ? bg.gradientTo : bg.gradientFrom;
    const to = needsSwap ? bg.gradientFrom : bg.gradientTo;
    return { color: `gradient(${from}, ${to}:${dir})`, padding: bg.padding };
  }

  return { color: bg.color, padding: bg.padding };
}

/**
 * Builds shellfie args for compare mode — terminals only, no background/animation.
 * The caller composes both terminals into a single background.
 */
export function buildShellfieArgsCompare(state: AppStore, contentOverride?: string): BuildResult {
  const result = buildShellfieArgs(state, contentOverride);
  // Strip background, animation, and overlays — compare mode renders these at the wrapper level
  const opts = { ...result.options };
  delete opts.background;
  delete opts.animation;
  delete opts.animationColor;
  delete opts.overlays;
  return { content: result.content, options: opts };
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
    const normalizedContent = containsAnsi(content) ? normalizeAnsiEscapes(content) : content;

    // shellfie's highlight() does hybrid highlighting — it tokenizes plain
    // segments while passing ANSI sequences through verbatim — so we let it
    // handle ANSI-containing source as well. Only fall back to disabling the
    // highlighter when the user explicitly picked a language we don't support.
    const shellfieLanguage = state.language !== 'auto' && SHELLFIE_LANGUAGES.has(state.language)
      ? state.language
      : 'auto';

    // Only pass theme when user explicitly changed it from the preset default.
    // Otherwise let shellfie use its native preset theme.
    const presetDefaultTheme = presetConfig?.settings?.terminalTheme;
    const userChangedTheme = presetDefaultTheme && state.terminalTheme !== presetDefaultTheme;
    const themeOverride = userChangedTheme ? getTheme(state.terminalTheme, state.customThemes) : undefined;

    // If user changed ANY background setting from the preset's default, pass as override
    const presetBg = presetConfig?.settings?.background;
    const presetBgType = presetBg?.type || 'solid';
    const userChangedBgType = state.background.type !== presetBgType;
    const userChangedBgColor = presetBg?.color && state.background.color !== presetBg.color;
    const userChangedBgPadding = presetBg?.padding !== undefined && state.background.padding !== presetBg.padding;
    const bgResult = (userChangedBgType || userChangedBgColor || userChangedBgPadding)
      ? buildShellfieBackground(state.background)
      : undefined;
    const backgroundOverride = bgResult ? { color: bgResult.color, padding: bgResult.padding } : undefined;

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
      // Pass border color if user has set one
      ...(state.borderColor ? { borderColor: state.borderColor } : {}),
      // Radial gradient overlay (shellfie doesn't support radial natively)
      ...(bgResult?.radialOverlay ? { overlays: bgResult.radialOverlay } : {}),
    };

    return { content: normalizedContent, options: opts };
  }

  // No preset — manually build everything
  // Normalize ANSI escapes (\e, \033, etc.) before highlighting
  const normalizedContent = containsAnsi(content) ? normalizeAnsiEscapes(content) : content;
  const processedContent = highlightWithAnsi(normalizedContent, effectiveLanguage);

  const bgResult = buildShellfieBackground(state.background);
  const background = bgResult ? { color: bgResult.color, padding: bgResult.padding } : undefined;

  return {
    content: processedContent,
    options: {
      language: false, // already highlighted above
      template: buildTemplate(state.template, state.controlsPosition, state.borderRadius, state.borderColor || undefined, state.borderWidth),
      theme: getTheme(state.terminalTheme, state.customThemes),
      title: state.title || undefined,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      lineNumbers: state.lineNumbers,
      padding: state.padding,
      controls: state.showControls,
      controlStyle: state.controlStyle,
      watermark: buildWatermarkConfig(state.watermark),
      width: state.width || undefined,
      fontFamily: state.fontFamily || undefined,
      embedFont: true,
      header: buildHeaderOptions(state.header),
      footer: buildFooterOptions(state.footer),
      animation: state.background.animation || undefined,
      animationColor: state.background.animationColor || undefined,
      background,
      // Radial gradient overlay (shellfie doesn't support radial natively)
      ...(bgResult?.radialOverlay ? { overlays: bgResult.radialOverlay } : {}),
    },
  };
}
