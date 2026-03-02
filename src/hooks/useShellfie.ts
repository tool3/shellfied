import { useMemo } from 'react';
import shellfie, { templates } from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { TERMINAL_THEMES } from '@/constants/themes';
import { useDebounce } from './useDebounce';
import { highlightWithAnsi } from '@/utils/syntaxHighlight';
import { detectLanguage } from '@/constants/languages';
import type { HeaderConfig, FooterConfig, ControlsPosition, TemplateType } from '@/types';

// Build a custom template with the specified controls position
function buildTemplate(templateType: TemplateType, controlsPosition: ControlsPosition) {
  const baseTemplate = templates[templateType];
  if (!baseTemplate) return templateType;

  // If position matches the template default, just return the template name
  const defaultPosition = templateType === 'windows' ? 'right' : 'left';
  if (controlsPosition === defaultPosition) {
    return templateType;
  }

  // Create a custom template with only the controls position overridden
  // Keep the original control style (macOS circles stay circles, Windows squares stay squares)
  return {
    ...baseTemplate,
    shell: {
      ...baseTemplate.shell,
      controlsPosition,
    },
  };
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
  const terminalTheme = useStore((s) => s.terminalTheme);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const title = useStore((s) => s.title);
  const showControls = useStore((s) => s.showControls);
  const watermark = useStore((s) => s.watermark);
  const watermarkPadding = useStore((s) => s.watermarkPadding);
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

      const result = shellfie(highlightedContent, {
        template: buildTemplate(template, controlsPosition),
        theme: TERMINAL_THEMES[terminalTheme].theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: watermark || undefined,
        watermarkPadding: watermark ? watermarkPadding : undefined,
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
  }, [debouncedContent, effectiveLanguage, template, controlsPosition, terminalTheme, fontSize, lineHeight, padding, title, showControls, watermark, watermarkPadding, width, fontFamily, header, footer]);

  return { svg, error, hasContent: Boolean(debouncedContent.trim()) };
}

export function useShellfieSync() {
  const content = useStore((s) => s.content);
  const language = useStore((s) => s.language);
  const template = useStore((s) => s.template);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const title = useStore((s) => s.title);
  const showControls = useStore((s) => s.showControls);
  const watermark = useStore((s) => s.watermark);
  const watermarkPadding = useStore((s) => s.watermarkPadding);
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

      return shellfie(highlightedContent, {
        template: buildTemplate(template, controlsPosition),
        theme: TERMINAL_THEMES[terminalTheme].theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: watermark || undefined,
        watermarkPadding: watermark ? watermarkPadding : undefined,
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
