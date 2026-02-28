import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useShellfieSync } from './useShellfie';
import {
  downloadSvg,
  downloadPng,
  copySvgToClipboard,
  copyPngToClipboard,
} from '@/services/exportService';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const exportScale = useStore((s) => s.exportScale);
  const { generate } = useShellfieSync();

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const exportToSvg = useCallback(
    async (filename: string = 'shellfie') => {
      setStatus('exporting');
      setError(null);

      try {
        const svg = generate();
        if (!svg) {
          throw new Error('No content to export');
        }
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
        if (!svg) {
          throw new Error('No content to export');
        }
        await downloadPng(svg, filename, exportScale);
        setStatus('success');
        setTimeout(resetStatus, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [generate, exportScale, resetStatus]
  );

  const copyAsSvg = useCallback(async () => {
    setStatus('exporting');
    setError(null);

    try {
      const svg = generate();
      if (!svg) {
        throw new Error('No content to copy');
      }
      await copySvgToClipboard(svg);
      setStatus('success');
      setTimeout(resetStatus, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed');
      setStatus('error');
    }
  }, [generate, resetStatus]);

  const copyAsPng = useCallback(async () => {
    setStatus('exporting');
    setError(null);

    try {
      const svg = generate();
      if (!svg) {
        throw new Error('No content to copy');
      }
      await copyPngToClipboard(svg, exportScale);
      setStatus('success');
      setTimeout(resetStatus, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed');
      setStatus('error');
    }
  }, [generate, exportScale, resetStatus]);

  return {
    exportToSvg,
    exportToPng,
    copyAsSvg,
    copyAsPng,
    status,
    error,
    isExporting: status === 'exporting',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
