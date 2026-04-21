import { useMemo } from 'react';
import shellfie from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { useDebounce } from './useDebounce';
import { buildShellfieArgs, buildShellfieArgsCompare } from '@/lib/shellfieOptionsBuilder';
import { getSvgWidth } from '@/lib/svgHelpers';
import { applyAspectRatio } from '@/lib/aspectRatio';
import { generateCompareSvg } from '@/lib/compareComposer';

/**
 * Main hook: generates a single shellfie SVG from editor content.
 */
export function useShellfie() {
  const content = useContent();
  const language = useLanguage();
  const debouncedContent = useDebounce(content, 300);

  // All store values that affect SVG output
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
  const activePreset = useStore((s) => s.activePreset);
  const background = useStore((s) => s.background);
  const lineNumbers = useStore((s) => s.lineNumbers);
  const controlStyle = useStore((s) => s.controlStyle);
  const borderColor = useStore((s) => s.borderColor);
  const borderWidth = useStore((s) => s.borderWidth);

  const { svg, error } = useMemo(() => {
    if (!debouncedContent.trim()) {
      return { svg: '', error: null };
    }

    try {
      const state = useStore.getState();
      // Override content with debounced version
      const { content: processedContent, options } = buildShellfieArgs(
        { ...state, content: debouncedContent }
      );

      if (!processedContent.trim()) return { svg: '', error: null };

      let result = shellfie(processedContent, options);
      // Apply aspect ratio if set (expands SVG dimensions to target ratio)
      const aspectRatio = state.background.imageAspectRatio;
      if (aspectRatio && aspectRatio !== 'auto' && state.background.type !== 'none') {
        result = applyAspectRatio(result, aspectRatio);
      }
      return { svg: result, error: null };
    } catch (err) {
      return { svg: '', error: err instanceof Error ? err.message : 'Failed to generate SVG' };
    }
  }, [
    debouncedContent, language, template, controlsPosition, borderRadius,
    terminalTheme, customThemes, fontSize, lineHeight, padding, title, showControls,
    watermark, width, fontFamily, header, footer, activePreset, background, lineNumbers,
    controlStyle, borderColor, borderWidth,
  ]);

  return { svg, error, hasContent: Boolean(debouncedContent.trim()) };
}

/**
 * Sync version: generates SVG on demand (not debounced). Used for exports.
 */
export function useShellfieSync() {
  const generate = () => {
    const state = useStore.getState();
    if (!state.content.trim()) return '';

    try {
      const { content, options } = buildShellfieArgs(state);
      if (!content.trim()) return '';
      return shellfie(content, options);
    } catch {
      return '';
    }
  };

  return { generate };
}

/**
 * Compare mode: generates a single composed SVG with both terminals
 * inside one unified background (no duplicate backgrounds).
 */
export function useShellfieCompare() {
  const beforeContent = useStore((s) => s.beforeContent);
  const afterContent = useStore((s) => s.afterContent);
  const beforeLanguage = useStore((s) => s.beforeLanguage);
  const afterLanguage = useStore((s) => s.afterLanguage);
  const beforeLabel = useStore((s) => s.beforeLabel);
  const afterLabel = useStore((s) => s.afterLabel);
  const beforeTitle = useStore((s) => s.beforeTitle);
  const afterTitle = useStore((s) => s.afterTitle);

  const debouncedBeforeContent = useDebounce(beforeContent, 300);
  const debouncedAfterContent = useDebounce(afterContent, 300);

  // All store values that affect SVG output
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
  const activePreset = useStore((s) => s.activePreset);
  const background = useStore((s) => s.background);
  const lineNumbers = useStore((s) => s.lineNumbers);
  const controlStyle = useStore((s) => s.controlStyle);
  const borderColor = useStore((s) => s.borderColor);
  const borderWidth = useStore((s) => s.borderWidth);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);

  const { svg, error } = useMemo(() => {
    if (!debouncedBeforeContent.trim() && !debouncedAfterContent.trim()) {
      return { svg: '', error: null };
    }

    try {
      const state = useStore.getState();
      const result = generateCompareSvg(
        state,
        debouncedBeforeContent,
        debouncedAfterContent,
        beforeLanguage,
        afterLanguage,
        beforeTitle,
        afterTitle,
      );
      return { svg: result.svg, error: null };
    } catch (err) {
      return { svg: '', error: err instanceof Error ? err.message : 'Failed to generate SVG' };
    }
  }, [
    debouncedBeforeContent, debouncedAfterContent, beforeLanguage, afterLanguage,
    beforeTitle, afterTitle, beforeLabel, afterLabel, compareLabelConfig,
    template, controlsPosition, borderRadius, terminalTheme, customThemes,
    fontSize, lineHeight, padding, showControls, fontFamily, watermark,
    header, footer, activePreset, background, lineNumbers,
    controlStyle, borderColor, borderWidth,
  ]);

  return {
    svg,
    beforeLabel,
    afterLabel,
    error,
    hasContent: Boolean(debouncedBeforeContent.trim() || debouncedAfterContent.trim()),
  };
}

/**
 * Compare mode sync: generates bare terminals (no background) on demand for exports.
 * Export functions handle their own background composition.
 */
export function useShellfieCompareSync() {
  const generate = () => {
    const state = useStore.getState();
    const {
      beforeContent, afterContent, beforeLanguage, afterLanguage,
      beforeLabel, afterLabel, beforeTitle, afterTitle,
    } = state;

    const generateOne = (content: string, lang: string, title: string, overrideWidth?: number) => {
      if (!content.trim()) return '';
      try {
        const { content: processed, options } = buildShellfieArgsCompare(
          { ...state, content, language: lang, title }
        );
        if (!processed.trim()) return '';
        return shellfie(processed, { ...options, width: overrideWidth || options.width });
      } catch {
        return '';
      }
    };

    const beforeInitial = generateOne(beforeContent, beforeLanguage, beforeTitle);
    const afterInitial = generateOne(afterContent, afterLanguage, afterTitle);

    const beforeWidth = getSvgWidth(beforeInitial);
    const afterWidth = getSvgWidth(afterInitial);
    const maxWidth = Math.max(beforeWidth, afterWidth);

    if (beforeWidth === afterWidth || maxWidth === 0) {
      return { beforeSvg: beforeInitial, afterSvg: afterInitial, beforeLabel, afterLabel };
    }

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
