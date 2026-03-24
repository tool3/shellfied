import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useShellfieSync, useShellfieCompareSync } from './useShellfie';
import {
  downloadSvg,
  downloadRaster,
  copySvgToClipboard,
  copyToClipboard,
  downloadCompareRaster,
  downloadCompareSvg,
  copyCompareToClipboard,
  embedFontInSvg,
} from '@/services/exportService';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
type LastAction = 'download' | 'copy' | null;

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [error, setError] = useState<string | null>(null);
  const { generate } = useShellfieSync();
  const { generate: generateCompare } = useShellfieCompareSync();

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setLastAction(null);
    setError(null);
  }, []);

  const download = useCallback(
    async (filename: string = 'shellfie') => {
      console.log('[useExport.download] Starting export...');
      setStatus('exporting');
      setLastAction('download');
      setError(null);

      // Read current state directly to avoid stale closure issues
      const state = useStore.getState();
      console.log('[useExport.download] Format:', state.exportFormat, 'compareMode:', state.compareMode);
      const { compareMode, exportFormat, exportScale, jpegQuality, background, compareLabelConfig, fontFamily } = state;

      try {
        // Handle compare mode export
        if (compareMode) {
          let { beforeSvg, afterSvg, beforeLabel, afterLabel } = generateCompare();
          if (!beforeSvg && !afterSvg) {
            throw new Error('No content to export');
          }

          // Embed the terminal font in both SVGs for portable exports
          if (beforeSvg) {
            beforeSvg = await embedFontInSvg(beforeSvg, fontFamily);
          }
          if (afterSvg) {
            afterSvg = await embedFontInSvg(afterSvg, fontFamily);
          }

          const compareOptions = {
            scale: exportScale,
            quality: exportFormat === 'jpeg' ? jpegQuality : 1.0,
            background,
            gap: 32,
            labelHeight: compareLabelConfig.fontSize + 24,
            labelColor: compareLabelConfig.color,
            labelFont: `${compareLabelConfig.fontWeight} ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`,
            labelFontWeight: compareLabelConfig.fontWeight,
            labelAlignment: compareLabelConfig.alignment,
          };

          if (exportFormat === 'svg') {
            await downloadCompareSvg(beforeSvg, afterSvg, beforeLabel, afterLabel, filename, compareOptions);
          } else {
            await downloadCompareRaster(
              beforeSvg,
              afterSvg,
              beforeLabel,
              afterLabel,
              filename,
              exportFormat,
              compareOptions
            );
          }
        } else {
          // Handle single mode export
          let svg = generate();
          if (!svg) {
            throw new Error('No content to export');
          }

          // Embed the terminal font in the SVG for portable exports
          svg = await embedFontInSvg(svg, fontFamily);

          if (exportFormat === 'svg') {
            // Wrap SVG with background if configured
            const { wrapSvgWithBackground } = await import('@/services/exportService');
            const finalSvg = background.type !== 'none' ? wrapSvgWithBackground(svg, background) : svg;
            downloadSvg(finalSvg, filename);
          } else {
            const quality = exportFormat === 'jpeg' ? jpegQuality : 1.0;
            console.log('[useExport.download] Calling downloadRaster with background:', background);
            await downloadRaster(svg, filename, exportFormat, {
              scale: exportScale,
              quality,
              background,
            });
          }
        }

        setStatus('success');
        setTimeout(resetStatus, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [generate, generateCompare, resetStatus]
  );

  const copyToClipboardFn = useCallback(async () => {
    setStatus('exporting');
    setLastAction('copy');
    setError(null);

    // Read current state directly to avoid stale closure issues
    const state = useStore.getState();
    const { compareMode, exportFormat, exportScale, background, compareLabelConfig, fontFamily } = state;

    try {
      // Handle compare mode copy
      if (compareMode) {
        let { beforeSvg, afterSvg, beforeLabel, afterLabel } = generateCompare();
        if (!beforeSvg && !afterSvg) {
          throw new Error('No content to copy');
        }

        // Embed the terminal font in both SVGs for portable exports
        if (beforeSvg) {
          beforeSvg = await embedFontInSvg(beforeSvg, fontFamily);
        }
        if (afterSvg) {
          afterSvg = await embedFontInSvg(afterSvg, fontFamily);
        }

        const compareOptions = {
          scale: exportScale,
          background,
          gap: 32,
          labelHeight: compareLabelConfig.fontSize + 24,
          labelColor: compareLabelConfig.color,
          labelFont: `${compareLabelConfig.fontWeight} ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`,
          labelFontWeight: compareLabelConfig.fontWeight,
          labelAlignment: compareLabelConfig.alignment,
        };

        // For compare mode, we always copy as PNG (combined image)
        await copyCompareToClipboard(beforeSvg, afterSvg, beforeLabel, afterLabel, compareOptions);
      } else {
        // Handle single mode copy
        let svg = generate();
        if (!svg) {
          throw new Error('No content to copy');
        }

        // Embed the terminal font in the SVG for portable exports
        svg = await embedFontInSvg(svg, fontFamily);

        if (exportFormat === 'svg') {
          await copySvgToClipboard(svg);
        } else {
          await copyToClipboard(svg, { scale: exportScale, background });
        }
      }

      setStatus('success');
      setTimeout(resetStatus, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed');
      setStatus('error');
    }
  }, [generate, generateCompare, resetStatus]);

  // Legacy exports for backward compatibility
  const exportToSvg = useCallback(
    async (filename: string = 'shellfie') => {
      setStatus('exporting');
      setError(null);
      try {
        const svg = generate();
        if (!svg) throw new Error('No content to export');
        downloadSvg(svg, filename);
        setStatus('success');
        setTimeout(resetStatus, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [generate, resetStatus]
  );

  const exportToPng = useCallback(
    async (filename: string = 'shellfie') => {
      setStatus('exporting');
      setError(null);
      try {
        const svg = generate();
        if (!svg) throw new Error('No content to export');
        const { exportScale } = useStore.getState();
        await downloadRaster(svg, filename, 'png', { scale: exportScale });
        setStatus('success');
        setTimeout(resetStatus, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [generate, resetStatus]
  );

  return {
    download,
    copyToClipboard: copyToClipboardFn,
    // Legacy
    exportToSvg,
    exportToPng,
    copyAsSvg: () => copySvgToClipboard(generate()),
    copyAsPng: copyToClipboardFn,
    status,
    error,
    isExporting: status === 'exporting',
    isSuccess: status === 'success',
    isDownloadSuccess: status === 'success' && lastAction === 'download',
    isCopySuccess: status === 'success' && lastAction === 'copy',
    isError: status === 'error',
  };
}
