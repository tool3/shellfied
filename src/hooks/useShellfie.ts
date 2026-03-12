import { useMemo } from 'react';
import shellfie, { templates } from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { TERMINAL_THEMES } from '@/constants/themes';
import { useDebounce } from './useDebounce';
import { highlightWithAnsi } from '@/utils/syntaxHighlight';
import { detectLanguage } from '@/constants/languages';
import type { HeaderConfig, FooterConfig, ControlsPosition, TemplateType, CustomTheme, WatermarkConfig } from '@/types';

// Convert hex color to ANSI 24-bit true color escape sequence
function hexToAnsi(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

// Format watermark text with ANSI color
function formatWatermark(watermark: WatermarkConfig): string | undefined {
  if (!watermark.text) return undefined;
  const colorCode = hexToAnsi(watermark.color);
  const reset = '\x1b[0m';
  return `${colorCode}${watermark.text}${reset}`;
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
        watermark: formatWatermark(watermark),
        watermarkPadding: watermark.text ? watermark.padding : undefined,
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
  const showControls = useStore((s) => s.showControls);
  const fontFamily = useStore((s) => s.fontFamily);
  const watermark = useStore((s) => s.watermark);
  const header = useStore((s) => s.header);
  const footer = useStore((s) => s.footer);

  const generateSvg = useMemo(() => {
    return (content: string, effectiveLanguage: string, width?: number) => {
      if (!content.trim()) return '';
      try {
        const highlightedContent = highlightWithAnsi(content, effectiveLanguage);
        const theme = getTheme(terminalTheme, customThemes);

        return shellfie(highlightedContent, {
          template: buildTemplate(template, controlsPosition, borderRadius),
          theme,
          fontSize,
          lineHeight,
          padding,
          controls: showControls,
          fontFamily: fontFamily || undefined,
          width: width || undefined,
          watermark: formatWatermark(watermark),
          watermarkPadding: watermark.text ? watermark.padding : undefined,
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
      const beforeInitial = generateSvg(debouncedBeforeContent, effectiveBeforeLanguage);
      const afterInitial = generateSvg(debouncedAfterContent, effectiveAfterLanguage);

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
        ? generateSvg(debouncedBeforeContent, effectiveBeforeLanguage, maxWidth)
        : beforeInitial;
      const after = afterWidth < maxWidth && debouncedAfterContent.trim()
        ? generateSvg(debouncedAfterContent, effectiveAfterLanguage, maxWidth)
        : afterInitial;

      return { beforeSvg: before, afterSvg: after, error: null };
    } catch (err) {
      return {
        beforeSvg: '',
        afterSvg: '',
        error: err instanceof Error ? err.message : 'Failed to generate SVG',
      };
    }
  }, [generateSvg, debouncedBeforeContent, debouncedAfterContent, effectiveBeforeLanguage, effectiveAfterLanguage]);

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
  const beforeContent = useStore((s) => s.beforeContent);
  const afterContent = useStore((s) => s.afterContent);
  const beforeLanguage = useStore((s) => s.beforeLanguage);
  const afterLanguage = useStore((s) => s.afterLanguage);
  const beforeLabel = useStore((s) => s.beforeLabel);
  const afterLabel = useStore((s) => s.afterLabel);
  const template = useStore((s) => s.template);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const customThemes = useStore((s) => s.customThemes);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const showControls = useStore((s) => s.showControls);
  const fontFamily = useStore((s) => s.fontFamily);
  const watermark = useStore((s) => s.watermark);
  const header = useStore((s) => s.header);
  const footer = useStore((s) => s.footer);

  const generate = () => {
    const generateOne = (content: string, language: string, width?: number) => {
      if (!content.trim()) return '';
      try {
        const effectiveLang = language === 'auto' ? detectLanguage(content) : language;
        const highlightedContent = highlightWithAnsi(content, effectiveLang);
        const theme = getTheme(terminalTheme, customThemes);

        return shellfie(highlightedContent, {
          template: buildTemplate(template, controlsPosition, borderRadius),
          theme,
          fontSize,
          lineHeight,
          padding,
          controls: showControls,
          fontFamily: fontFamily || undefined,
          width: width || undefined,
          watermark: formatWatermark(watermark),
          watermarkPadding: watermark.text ? watermark.padding : undefined,
          header: buildHeaderOptions(header),
          footer: buildFooterOptions(footer),
        });
      } catch {
        return '';
      }
    };

    // First pass: generate SVGs to determine natural widths
    const beforeInitial = generateOne(beforeContent, beforeLanguage);
    const afterInitial = generateOne(afterContent, afterLanguage);

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
      ? generateOne(beforeContent, beforeLanguage, maxWidth)
      : beforeInitial;
    const afterSvg = afterWidth < maxWidth && afterContent.trim()
      ? generateOne(afterContent, afterLanguage, maxWidth)
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
  const content = useStore((s) => s.content);
  const language = useStore((s) => s.language);
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

  const generate = () => {
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
        watermark: formatWatermark(watermark),
        watermarkPadding: watermark.text ? watermark.padding : undefined,
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
