import { useMemo } from 'react';
import shellfie from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { useDebounce } from './useDebounce';
import { highlightWithAnsi } from '@/utils/syntaxHighlight';
import { detectLanguage } from '@/constants/languages';
import {
  buildWatermarkConfig,
  buildTemplate,
  buildHeaderOptions,
  buildFooterOptions,
  getTheme,
  getSvgWidth,
} from '@/lib/svgHelpers';

export function useShellfie() {
  const content = useContent();
  const language = useLanguage();
  const debouncedContent = useDebounce(content, 300);

  const effectiveLanguage = useMemo(() => {
    return language === 'auto' ? detectLanguage(debouncedContent) : language;
  }, [language, debouncedContent]);

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
      return { svg: '', error: err instanceof Error ? err.message : 'Failed to generate SVG' };
    }
  }, [
    debouncedContent, effectiveLanguage, template, controlsPosition, borderRadius,
    terminalTheme, customThemes, fontSize, lineHeight, padding, title, showControls,
    watermark, width, fontFamily, header, footer,
  ]);

  return { svg, error, hasContent: Boolean(debouncedContent.trim()) };
}

export function useShellfieSync() {
  const generate = () => {
    const state = useStore.getState();
    const {
      content, language, template, controlsPosition, borderRadius,
      terminalTheme, customThemes, fontSize, lineHeight, padding, title,
      showControls, watermark, width, fontFamily, header, footer,
    } = state;

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

export function useShellfieCompare() {
  const beforeContent = useStore((s) => s.beforeContent);
  const afterContent = useStore((s) => s.afterContent);
  const beforeLanguage = useStore((s) => s.beforeLanguage);
  const afterLanguage = useStore((s) => s.afterLanguage);
  const beforeLabel = useStore((s) => s.beforeLabel);
  const afterLabel = useStore((s) => s.afterLabel);

  const debouncedBeforeContent = useDebounce(beforeContent, 300);
  const debouncedAfterContent = useDebounce(afterContent, 300);

  const effectiveBeforeLanguage = useMemo(() => {
    return beforeLanguage === 'auto' ? detectLanguage(debouncedBeforeContent) : beforeLanguage;
  }, [beforeLanguage, debouncedBeforeContent]);

  const effectiveAfterLanguage = useMemo(() => {
    return afterLanguage === 'auto' ? detectLanguage(debouncedAfterContent) : afterLanguage;
  }, [afterLanguage, debouncedAfterContent]);

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
  }, [
    template, controlsPosition, borderRadius, terminalTheme, customThemes,
    fontSize, lineHeight, padding, showControls, fontFamily, watermark, header, footer,
  ]);

  const { beforeSvg, afterSvg, error } = useMemo(() => {
    try {
      // First pass: generate SVGs to determine natural widths
      const beforeInitial = generateSvg(debouncedBeforeContent, effectiveBeforeLanguage, beforeTitle);
      const afterInitial = generateSvg(debouncedAfterContent, effectiveAfterLanguage, afterTitle);

      const beforeWidth = getSvgWidth(beforeInitial);
      const afterWidth = getSvgWidth(afterInitial);
      const maxWidth = Math.max(beforeWidth, afterWidth);

      // If widths match or one is empty, no need to regenerate
      if (beforeWidth === afterWidth || maxWidth === 0) {
        return { beforeSvg: beforeInitial, afterSvg: afterInitial, error: null };
      }

      // Second pass: regenerate narrower SVG with shared max width
      const before = beforeWidth < maxWidth && debouncedBeforeContent.trim()
        ? generateSvg(debouncedBeforeContent, effectiveBeforeLanguage, beforeTitle, maxWidth)
        : beforeInitial;
      const after = afterWidth < maxWidth && debouncedAfterContent.trim()
        ? generateSvg(debouncedAfterContent, effectiveAfterLanguage, afterTitle, maxWidth)
        : afterInitial;

      return { beforeSvg: before, afterSvg: after, error: null };
    } catch (err) {
      return { beforeSvg: '', afterSvg: '', error: err instanceof Error ? err.message : 'Failed to generate SVG' };
    }
  }, [generateSvg, debouncedBeforeContent, debouncedAfterContent, effectiveBeforeLanguage, effectiveAfterLanguage, beforeTitle, afterTitle]);

  const sharedWidth = useMemo(() => {
    return Math.max(getSvgWidth(beforeSvg), getSvgWidth(afterSvg));
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
    const state = useStore.getState();
    const {
      beforeContent, afterContent, beforeLanguage, afterLanguage,
      beforeLabel, afterLabel, beforeTitle, afterTitle,
      template, controlsPosition, borderRadius, terminalTheme, customThemes,
      fontSize, lineHeight, padding, showControls, fontFamily, watermark,
      header, footer,
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

    // First pass
    const beforeInitial = generateOne(beforeContent, beforeLanguage, beforeTitle);
    const afterInitial = generateOne(afterContent, afterLanguage, afterTitle);

    const beforeWidth = getSvgWidth(beforeInitial);
    const afterWidth = getSvgWidth(afterInitial);
    const maxWidth = Math.max(beforeWidth, afterWidth);

    if (beforeWidth === afterWidth || maxWidth === 0) {
      return { beforeSvg: beforeInitial, afterSvg: afterInitial, beforeLabel, afterLabel };
    }

    // Second pass with matched widths
    const beforeSvg = beforeWidth < maxWidth && beforeContent.trim()
      ? generateOne(beforeContent, beforeLanguage, beforeTitle, maxWidth)
      : beforeInitial;
    const afterSvg = afterWidth < maxWidth && afterContent.trim()
      ? generateOne(afterContent, afterLanguage, afterTitle, maxWidth)
      : afterInitial;

    return { beforeSvg, afterSvg, beforeLabel, afterLabel };
  };

  return { generate };
}
