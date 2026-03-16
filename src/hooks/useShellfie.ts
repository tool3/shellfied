import { useMemo } from 'react';
import shellfie, { templates } from 'shellfie';
import type { WatermarkStyle, WatermarkConfig as ShellfieWatermarkConfig } from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { TERMINAL_THEMES } from '@/constants/themes';
import { useDebounce } from './useDebounce';
import { highlightWithAnsi } from '@/utils/syntaxHighlight';
import { detectLanguage } from '@/constants/languages';
import type { HeaderConfig, FooterConfig, ControlsPosition, TemplateType, CustomTheme, WatermarkConfig } from '@/types';

// Named CSS colors to hex mapping
const CSS_COLORS: Record<string, string> = {
  black: '#000000', silver: '#c0c0c0', gray: '#808080', grey: '#808080',
  white: '#ffffff', maroon: '#800000', red: '#ff0000', purple: '#800080',
  fuchsia: '#ff00ff', green: '#008000', lime: '#00ff00', olive: '#808000',
  yellow: '#ffff00', navy: '#000080', blue: '#0000ff', teal: '#008080',
  aqua: '#00ffff', orange: '#ffa500', aliceblue: '#f0f8ff', antiquewhite: '#faebd7',
  aquamarine: '#7fffd4', azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4',
  blanchedalmond: '#ffebcd', blueviolet: '#8a2be2', brown: '#a52a2a',
  burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
  chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff', darkblue: '#00008b',
  darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgray: '#a9a9a9',
  darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00',
  darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3',
  deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969',
  dimgrey: '#696969', dodgerblue: '#1e90ff', firebrick: '#b22222',
  floralwhite: '#fffaf0', forestgreen: '#228b22', gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520',
  greenyellow: '#adff2f', honeydew: '#f0fff0', hotpink: '#ff69b4',
  indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c',
  lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd', lightblue: '#add8e6', lightcoral: '#f08080',
  lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
  lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa',
  lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0', limegreen: '#32cd32', linen: '#faf0e6',
  magenta: '#ff00ff', mediumaquamarine: '#66cdaa', mediumblue: '#0000cd',
  mediumorchid: '#ba55d3', mediumpurple: '#9370db', mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc', mediumvioletred: '#c71585', midnightblue: '#191970',
  mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
  navajowhite: '#ffdead', oldlace: '#fdf5e6', olivedrab: '#6b8e23',
  orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa',
  palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093',
  papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb',
  plum: '#dda0dd', powderblue: '#b0e0e6', rosybrown: '#bc8f8f',
  royalblue: '#4169e1', saddlebrown: '#8b4513', salmon: '#fa8072',
  sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee',
  sienna: '#a0522d', skyblue: '#87ceeb', slateblue: '#6a5acd',
  slategray: '#708090', slategrey: '#708090', snow: '#fffafa',
  springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c',
  thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee',
  wheat: '#f5deb3', whitesmoke: '#f5f5f5', yellowgreen: '#9acd32',
};

// Convert color (hex or named) to ANSI 24-bit true color escape sequence
function colorToAnsi(color: string): string {
  const trimmed = color.trim().toLowerCase();

  // Check if it's a named color
  const hex = CSS_COLORS[trimmed] || trimmed;

  // Parse hex color
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try 3-digit hex
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      const r = parseInt(short[1] + short[1], 16);
      const g = parseInt(short[2] + short[2], 16);
      const b = parseInt(short[3] + short[3], 16);
      return `\x1b[38;2;${r};${g};${b}m`;
    }
    return '';
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

// Parse CSS-like style string into WatermarkStyle for shellfie
// Passes through all properties - shellfie's WatermarkStyle has an index signature
function parseStyleString(styleStr: string): { color?: string; style: WatermarkStyle } {
  const style: WatermarkStyle = {};
  let color: string | undefined;

  if (!styleStr) return { color, style };

  // Split by semicolons and newlines, filter empty
  const declarations = styleStr.split(/[;\n]/).filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;

    const property = decl.slice(0, colonIndex).trim().toLowerCase();
    const value = decl.slice(colonIndex + 1).trim();

    if (!property || !value) continue;

    // Handle color separately (for ANSI formatting)
    if (property === 'color') {
      color = value;
      continue;
    }

    // Parse padding/margin into CSS shorthand format
    if (property === 'padding' || property === 'margin') {
      const parts = value.split(/\s+/).map((v) => parseFloat(v) || 0);
      if (parts.length === 1) {
        style[property] = parts[0];
      } else if (parts.length === 2) {
        style[property] = [parts[0], parts[1]] as [number, number];
      } else if (parts.length >= 4) {
        style[property] = [parts[0], parts[1], parts[2], parts[3]] as [number, number, number, number];
      }
    } else if (property === 'opacity') {
      style.opacity = parseFloat(value) || 1;
    } else {
      // Pass through any other property (filter, transform, outline, etc.)
      style[property] = value;
    }
  }

  return { color, style };
}

// Check if text contains ANSI escape codes (actual or escaped representations)
function hasAnsiCodes(text: string): boolean {
  // Match actual escape character or escaped representations
  return /\x1b\[|\\x1b\[|\\033\[|\\e\[/.test(text);
}

// Convert escaped ANSI representations to actual escape characters
// Handles: \x1b[, \033[, \e[ -> actual ESC character
function parseAnsiEscapes(text: string): string {
  return text
    // \x1b[ -> ESC[
    .replace(/\\x1b\[/gi, '\x1b[')
    // \033[ -> ESC[
    .replace(/\\033\[/g, '\x1b[')
    // \e[ -> ESC[
    .replace(/\\e\[/g, '\x1b[');
}

// Build watermark config for shellfie's new interface
// New interface: { content: string, type?: 'text' | 'markup', style?: WatermarkStyle }
function buildWatermarkConfig(watermark: WatermarkConfig): ShellfieWatermarkConfig | undefined {
  // Handle markup mode
  if (watermark.type === 'markup') {
    if (!watermark.markup) return undefined;
    return {
      content: watermark.markup,
      type: 'markup' as const,
    };
  }

  // Handle text mode
  if (!watermark.text) return undefined;

  // If text already contains ANSI codes, parse escapes and use it without applying styles
  if (hasAnsiCodes(watermark.text)) {
    return {
      content: parseAnsiEscapes(watermark.text),
      type: 'text' as const,
    };
  }

  // Parse style string and apply color via ANSI codes
  const { color, style } = parseStyleString(watermark.style);

  // Extract color for ANSI formatting (default to gray if not specified)
  const colorValue = color || '#888888';
  const colorCode = colorToAnsi(colorValue);
  const reset = '\x1b[0m';
  const content = `${colorCode}${watermark.text}${reset}`;

  return {
    content,
    type: 'text' as const,
    style,
  };
}

// Build a custom template with the specified controls position and border radius
function buildTemplate(
  templateType: TemplateType,
  controlsPosition: ControlsPosition,
  borderRadius: number
) {
  const baseTemplate = templates[templateType];
  if (!baseTemplate) return templateType;

  const defaultPosition = templateType === 'windows' ? 'right' : 'left';
  const defaultRadius = baseTemplate.shell.borderRadius;

  // If all values match defaults, just return the template name
  if (controlsPosition === defaultPosition && borderRadius === defaultRadius) {
    return templateType;
  }

  // Create a custom template with overridden values
  return {
    ...baseTemplate,
    shell: {
      ...baseTemplate.shell,
      controlsPosition,
      borderRadius,
    },
  };
}

// Get theme object - either from built-in themes or custom themes
function getTheme(themeName: string, customThemes: CustomTheme[]) {
  // Check if it's a custom theme
  const customTheme = customThemes.find((t) => t.id === themeName);
  if (customTheme) {
    const { id, ...themeWithoutId } = customTheme;
    return themeWithoutId;
  }
  // Otherwise use built-in theme
  return TERMINAL_THEMES[themeName as keyof typeof TERMINAL_THEMES]?.theme;
}

// Build header/footer options for shellfie
function buildHeaderOptions(header: HeaderConfig) {
  if (!header.enabled) return undefined;
  return {
    backgroundColor: header.backgroundColor || undefined,
    height: header.height,
    border: header.border,
    borderColor: header.borderColor || undefined,
    borderWidth: header.borderWidth,
  };
}

function buildFooterOptions(footer: FooterConfig) {
  if (!footer.enabled) return undefined;
  return {
    backgroundColor: footer.backgroundColor || undefined,
    height: footer.height,
    border: footer.border,
    borderColor: footer.borderColor || undefined,
    borderWidth: footer.borderWidth,
  };
}

export function useShellfie() {
  const content = useContent();
  const language = useLanguage();
  const debouncedContent = useDebounce(content, 300);

  // Resolve auto-detect to actual language
  const effectiveLanguage = useMemo(() => {
    if (language === 'auto') {
      return detectLanguage(debouncedContent);
    }
    return language;
  }, [language, debouncedContent]);

  // Get individual values to ensure proper reactivity
  const template = useStore((s) => s.template);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const customThemes = useStore((s) => s.customThemes);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const title = useStore((s) => s.title);
  const showControls = useStore((s) => s.showControls);
  const watermark = useStore((s) => s.watermark);
  const width = useStore((s) => s.width);
  const fontFamily = useStore((s) => s.fontFamily);
  const header = useStore((s) => s.header);
  const footer = useStore((s) => s.footer);

  const { svg, error } = useMemo(() => {
    if (!debouncedContent.trim()) {
      return { svg: '', error: null };
    }

    try {
      // Apply syntax highlighting with ANSI codes using resolved language
      const highlightedContent = highlightWithAnsi(debouncedContent, effectiveLanguage);
      const theme = getTheme(terminalTheme, customThemes);

            const result = shellfie(highlightedContent, {
        template: buildTemplate(template, controlsPosition, borderRadius),
        theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: buildWatermarkConfig(watermark),
        width: width || undefined,
        fontFamily: fontFamily || undefined,
        header: buildHeaderOptions(header),
        footer: buildFooterOptions(footer),
      });
      return { svg: result, error: null };
    } catch (err) {
      return {
        svg: '',
        error: err instanceof Error ? err.message : 'Failed to generate SVG',
      };
    }
  }, [debouncedContent, effectiveLanguage, template, controlsPosition, borderRadius, terminalTheme, customThemes, fontSize, lineHeight, padding, title, showControls, watermark, width, fontFamily, header, footer]);

  return { svg, error, hasContent: Boolean(debouncedContent.trim()) };
}

// Helper to extract width from SVG string
function getSvgWidth(svg: string): number {
  const match = svg.match(/width="(\d+(?:\.\d+)?)"/);
  return match ? parseFloat(match[1]) : 0;
}

export function useShellfieCompare() {
  const beforeContent = useStore((s) => s.beforeContent);
  const afterContent = useStore((s) => s.afterContent);
  const beforeLanguage = useStore((s) => s.beforeLanguage);
  const afterLanguage = useStore((s) => s.afterLanguage);
  const beforeLabel = useStore((s) => s.beforeLabel);
  const afterLabel = useStore((s) => s.afterLabel);

  const debouncedBeforeContent = useDebounce(beforeContent, 300);
  const debouncedAfterContent = useDebounce(afterContent, 300);

  // Resolve auto-detect to actual languages
  const effectiveBeforeLanguage = useMemo(() => {
    if (beforeLanguage === 'auto') {
      return detectLanguage(debouncedBeforeContent);
    }
    return beforeLanguage;
  }, [beforeLanguage, debouncedBeforeContent]);

  const effectiveAfterLanguage = useMemo(() => {
    if (afterLanguage === 'auto') {
      return detectLanguage(debouncedAfterContent);
    }
    return afterLanguage;
  }, [afterLanguage, debouncedAfterContent]);

  // Get shared styling settings
  const template = useStore((s) => s.template);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const customThemes = useStore((s) => s.customThemes);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const beforeTitle = useStore((s) => s.beforeTitle);
  const afterTitle = useStore((s) => s.afterTitle);
  const showControls = useStore((s) => s.showControls);
  const fontFamily = useStore((s) => s.fontFamily);
  const watermark = useStore((s) => s.watermark);
  const header = useStore((s) => s.header);
  const footer = useStore((s) => s.footer);

  const generateSvg = useMemo(() => {
    return (content: string, effectiveLanguage: string, title: string, width?: number) => {
      if (!content.trim()) return '';
      try {
        const highlightedContent = highlightWithAnsi(content, effectiveLanguage);
        const theme = getTheme(terminalTheme, customThemes);

        return shellfie(highlightedContent, {
          template: buildTemplate(template, controlsPosition, borderRadius),
          theme,
          title: title || undefined,
          fontSize,
          lineHeight,
          padding,
          controls: showControls,
          fontFamily: fontFamily || undefined,
          width: width || undefined,
          watermark: buildWatermarkConfig(watermark),
          header: buildHeaderOptions(header),
          footer: buildFooterOptions(footer),
        });
      } catch {
        return '';
      }
    };
  }, [template, controlsPosition, borderRadius, terminalTheme, customThemes, fontSize, lineHeight, padding, showControls, fontFamily, watermark, header, footer]);

  const { beforeSvg, afterSvg, error } = useMemo(() => {
    try {
      // First pass: generate SVGs to determine natural widths
      const beforeInitial = generateSvg(debouncedBeforeContent, effectiveBeforeLanguage, beforeTitle);
      const afterInitial = generateSvg(debouncedAfterContent, effectiveAfterLanguage, afterTitle);

      // Get the maximum width
      const beforeWidth = getSvgWidth(beforeInitial);
      const afterWidth = getSvgWidth(afterInitial);
      const maxWidth = Math.max(beforeWidth, afterWidth);

      // If both have the same width or one is empty, no need to regenerate
      if (beforeWidth === afterWidth || maxWidth === 0) {
        return { beforeSvg: beforeInitial, afterSvg: afterInitial, error: null };
      }

      // Second pass: regenerate with the shared max width
      const before = beforeWidth < maxWidth && debouncedBeforeContent.trim()
        ? generateSvg(debouncedBeforeContent, effectiveBeforeLanguage, beforeTitle, maxWidth)
        : beforeInitial;
      const after = afterWidth < maxWidth && debouncedAfterContent.trim()
        ? generateSvg(debouncedAfterContent, effectiveAfterLanguage, afterTitle, maxWidth)
        : afterInitial;

      return { beforeSvg: before, afterSvg: after, error: null };
    } catch (err) {
      return {
        beforeSvg: '',
        afterSvg: '',
        error: err instanceof Error ? err.message : 'Failed to generate SVG',
      };
    }
  }, [generateSvg, debouncedBeforeContent, debouncedAfterContent, effectiveBeforeLanguage, effectiveAfterLanguage, beforeTitle, afterTitle]);

  // Calculate the shared width for empty pane placeholders
  const sharedWidth = useMemo(() => {
    const beforeWidth = getSvgWidth(beforeSvg);
    const afterWidth = getSvgWidth(afterSvg);
    return Math.max(beforeWidth, afterWidth);
  }, [beforeSvg, afterSvg]);

  return {
    beforeSvg,
    afterSvg,
    beforeLabel,
    afterLabel,
    error,
    hasContent: Boolean(debouncedBeforeContent.trim() || debouncedAfterContent.trim()),
    sharedWidth,
  };
}

export function useShellfieCompareSync() {
  const generate = () => {
    // Read state directly at call time to avoid stale closure issues
    const state = useStore.getState();
    const {
      beforeContent,
      afterContent,
      beforeLanguage,
      afterLanguage,
      beforeLabel,
      afterLabel,
      beforeTitle,
      afterTitle,
      template,
      controlsPosition,
      borderRadius,
      terminalTheme,
      customThemes,
      fontSize,
      lineHeight,
      padding,
      showControls,
      fontFamily,
      watermark,
      header,
      footer,
    } = state;

    const generateOne = (content: string, language: string, title: string, width?: number) => {
      if (!content.trim()) return '';
      try {
        const effectiveLang = language === 'auto' ? detectLanguage(content) : language;
        const highlightedContent = highlightWithAnsi(content, effectiveLang);
        const theme = getTheme(terminalTheme, customThemes);

        return shellfie(highlightedContent, {
          template: buildTemplate(template, controlsPosition, borderRadius),
          theme,
          title: title || undefined,
          fontSize,
          lineHeight,
          padding,
          controls: showControls,
          fontFamily: fontFamily || undefined,
          width: width || undefined,
          watermark: buildWatermarkConfig(watermark),
          header: buildHeaderOptions(header),
          footer: buildFooterOptions(footer),
        });
      } catch {
        return '';
      }
    };

    // First pass: generate SVGs to determine natural widths
    const beforeInitial = generateOne(beforeContent, beforeLanguage, beforeTitle);
    const afterInitial = generateOne(afterContent, afterLanguage, afterTitle);

    // Get the maximum width
    const beforeWidth = getSvgWidth(beforeInitial);
    const afterWidth = getSvgWidth(afterInitial);
    const maxWidth = Math.max(beforeWidth, afterWidth);

    // If both have the same width or one is empty, no need to regenerate
    if (beforeWidth === afterWidth || maxWidth === 0) {
      return {
        beforeSvg: beforeInitial,
        afterSvg: afterInitial,
        beforeLabel,
        afterLabel,
      };
    }

    // Second pass: regenerate with the shared max width
    const beforeSvg = beforeWidth < maxWidth && beforeContent.trim()
      ? generateOne(beforeContent, beforeLanguage, beforeTitle, maxWidth)
      : beforeInitial;
    const afterSvg = afterWidth < maxWidth && afterContent.trim()
      ? generateOne(afterContent, afterLanguage, afterTitle, maxWidth)
      : afterInitial;

    return {
      beforeSvg,
      afterSvg,
      beforeLabel,
      afterLabel,
    };
  };

  return { generate };
}

export function useShellfieSync() {
  const generate = () => {
    // Read state directly at call time to avoid stale closure issues
    const state = useStore.getState();
    const {
      content,
      language,
      template,
      controlsPosition,
      borderRadius,
      terminalTheme,
      customThemes,
      fontSize,
      lineHeight,
      padding,
      title,
      showControls,
      watermark,
      width,
      fontFamily,
      header,
      footer,
    } = state;

    if (!content.trim()) return '';

    try {
      // Resolve auto-detect to actual language
      const effectiveLang = language === 'auto' ? detectLanguage(content) : language;
      // Apply syntax highlighting with ANSI codes
      const highlightedContent = highlightWithAnsi(content, effectiveLang);
      const theme = getTheme(terminalTheme, customThemes);

      return shellfie(highlightedContent, {
        template: buildTemplate(template, controlsPosition, borderRadius),
        theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: buildWatermarkConfig(watermark),
        width: width || undefined,
        fontFamily: fontFamily || undefined,
        header: buildHeaderOptions(header),
        footer: buildFooterOptions(footer),
      });
    } catch {
      return '';
    }
  };

  return { generate };
}
