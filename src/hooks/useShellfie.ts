import { useState, useEffect } from 'react';
import shellfie from 'shellfie';
import { useStore, useContent, useLanguage } from '@/store';
import { TERMINAL_THEMES } from '@/constants/themes';
import { useDebounce } from './useDebounce';
import { highlightWithAnsi } from '@/utils/syntaxHighlight';

export function useShellfie() {
  const content = useContent();
  const language = useLanguage();
  const debouncedContent = useDebounce(content, 300);

  // Get individual values to ensure proper reactivity
  const template = useStore((s) => s.template);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const title = useStore((s) => s.title);
  const showControls = useStore((s) => s.showControls);
  const watermark = useStore((s) => s.watermark);

  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedContent.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    try {
      // Apply syntax highlighting with ANSI codes
      const highlightedContent = highlightWithAnsi(debouncedContent, language);

      const result = shellfie(highlightedContent, {
        template,
        theme: TERMINAL_THEMES[terminalTheme].theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: watermark || undefined,
      });
      setSvg(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SVG');
      setSvg('');
    }
  }, [debouncedContent, language, template, terminalTheme, fontSize, lineHeight, padding, title, showControls, watermark]);

  return { svg, error, hasContent: Boolean(debouncedContent.trim()) };
}

export function useShellfieSync() {
  const content = useStore((s) => s.content);
  const language = useStore((s) => s.language);
  const template = useStore((s) => s.template);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const fontSize = useStore((s) => s.fontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const padding = useStore((s) => s.padding);
  const title = useStore((s) => s.title);
  const showControls = useStore((s) => s.showControls);
  const watermark = useStore((s) => s.watermark);

  const generate = () => {
    if (!content.trim()) return '';

    try {
      // Apply syntax highlighting with ANSI codes
      const highlightedContent = highlightWithAnsi(content, language);

      return shellfie(highlightedContent, {
        template,
        theme: TERMINAL_THEMES[terminalTheme].theme,
        title: title || undefined,
        fontSize,
        lineHeight,
        padding,
        controls: showControls,
        watermark: watermark || undefined,
      });
    } catch {
      return '';
    }
  };

  return { generate };
}
