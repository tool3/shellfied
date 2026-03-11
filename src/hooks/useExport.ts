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
} from '@/services/exportService';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
type LastAction = 'download' | 'copy' | null;

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [error, setError] = useState<string | null>(null);
  const exportFormat = useStore((s) => s.exportFormat);
  const exportScale = useStore((s) => s.exportScale);
  const jpegQuality = useStore((s) => s.jpegQuality);
  const background = useStore((s) => s.background);
  const compareMode = useStore((s) => s.compareMode);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);
  const { generate } = useShellfieSync();
  const { generate: generateCompare } = useShellfieCompareSync();

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setLastAction(null);
    setError(null);
  }, []);

  const download = useCallback(
    async (filename: string = 'shellfie') => {
      setStatus('exporting');
      setLastAction('download');
      setError(null);

      try {
        // Handle compare mode export
        if (compareMode) {
          const { beforeSvg, afterSvg, beforeLabel, afterLabel } = generateCompare();
          if (!beforeSvg && !afterSvg) {
            throw new Error('No content to export');
          }

          const compareOptions = {
            scale: exportScale,
            quality: exportFormat === 'jpeg' ? jpegQuality : 1.0,
            background,
            gap: 32,
            labelHeight: compareLabelConfig.fontSize + 24,
            labelColor: compareLabelConfig.color,
            labelFont: `600 ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`,
            labelAlignment: compareLabelConfig.alignment,
          };

          if (exportFormat === 'svg') {
            downloadCompareSvg(beforeSvg, afterSvg, beforeLabel, afterLabel, filename, compareOptions);
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
          const svg = generate();
          if (!svg) {
            throw new Error('No content to export');
          }

          if (exportFormat === 'svg') {
            downloadSvg(svg, filename);
          } else {
            const quality = exportFormat === 'jpeg' ? jpegQuality : 1.0;
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
    [generate, generateCompare, compareMode, exportFormat, exportScale, jpegQuality, background, compareLabelConfig, resetStatus]
  );

  const copyToClipboardFn = useCallback(async () => {
    setStatus('exporting');
    setLastAction('copy');
    setError(null);

    try {
      // Handle compare mode copy
      if (compareMode) {
        const { beforeSvg, afterSvg, beforeLabel, afterLabel } = generateCompare();
        if (!beforeSvg && !afterSvg) {
          throw new Error('No content to copy');
        }

        const compareOptions = {
          scale: exportScale,
          background,
          gap: 32,
          labelHeight: compareLabelConfig.fontSize + 24,
          labelColor: compareLabelConfig.color,
          labelFont: `600 ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`,
          labelAlignment: compareLabelConfig.alignment,
        };

        // For compare mode, we always copy as PNG (combined image)
        await copyCompareToClipboard(beforeSvg, afterSvg, beforeLabel, afterLabel, compareOptions);
      } else {
        // Handle single mode copy
        const svg = generate();
        if (!svg) {
          throw new Error('No content to copy');
        }

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
  }, [generate, generateCompare, compareMode, exportFormat, exportScale, background, compareLabelConfig, resetStatus]);

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
        await downloadRaster(svg, filename, 'png', { scale: exportScale });
        setStatus('success');
        setTimeout(resetStatus, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [generate, exportScale, resetStatus]
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
