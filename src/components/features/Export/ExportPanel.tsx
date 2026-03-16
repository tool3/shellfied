import { memo, useState, useCallback } from 'react';
import { useStore, useContent } from '@/store';
import { useExport } from '@/hooks/useExport';
import { Button, Select, Slider } from '@/components/common';
import { ShareModal } from '@/components/features/Share';
import { generateShareUrlLZ } from '@/utils/urlParams';
import type { ExportFormat, ExportScale } from '@/types';
import styles from './ExportPanel.module.scss';

const FORMAT_OPTIONS = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
];

const SCALE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x (Recommended)' },
  { value: '3', label: '3x' },
];

export const ExportPanel = memo(function ExportPanel() {
  const content = useContent();
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const exportScale = useStore((s) => s.exportScale);
  const setExportScale = useStore((s) => s.setExportScale);
  const jpegQuality = useStore((s) => s.jpegQuality);
  const setJpegQuality = useStore((s) => s.setJpegQuality);

  const { download, copyToClipboard, isExporting, isDownloadSuccess, isCopySuccess } = useExport();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrls, setShareUrls] = useState({ viewUrl: '', editUrl: '' });

  const hasContent = Boolean(content.trim());
  const isRasterFormat = exportFormat !== 'svg';
  const isJpeg = exportFormat === 'jpeg';

  const [isGeneratingUrls, setIsGeneratingUrls] = useState(false);

  const handleShare = useCallback(() => {
    setIsGeneratingUrls(true);
    try {
      const state = useStore.getState();
      // LZ compression is synchronous and much more efficient
      const viewUrl = generateShareUrlLZ(state, 'view');
      const editUrl = generateShareUrlLZ(state, 'edit');
      setShareUrls({ viewUrl, editUrl });
      setShowShareModal(true);
    } finally {
      setIsGeneratingUrls(false);
    }
  }, []);

  const handleFormatChange = (value: string) => {
    setExportFormat(value as ExportFormat);
  };

  const handleScaleChange = (value: string) => {
    setExportScale(Number(value) as ExportScale);
  };

  return (
    <div className={styles.exportPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Export</h3>
      </div>

      <div className={styles.content}>
        <div className={styles.options}>
          <Select
            label="Format"
            options={FORMAT_OPTIONS}
            value={exportFormat}
            onChange={handleFormatChange}
            fullWidth
          />

          {isRasterFormat && (
            <Select
              label="Scale"
              options={SCALE_OPTIONS}
              value={String(exportScale)}
              onChange={handleScaleChange}
              fullWidth
            />
          )}

          {isJpeg && (
            <Slider
              label="Quality"
              value={jpegQuality}
              onChange={setJpegQuality}
              min={0.6}
              max={1.0}
              step={0.1}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          )}
        </div>

        <div className={styles.buttons}>
          <Button
            variant="primary"
            icon="share"
            onClick={handleShare}
            disabled={!hasContent || isGeneratingUrls}
            isLoading={isGeneratingUrls}
            fullWidth
          >
            Share
          </Button>

          <Button
            variant="primary"
            icon={isDownloadSuccess ? 'check' : 'download'}
            onClick={() => download()}
            disabled={!hasContent || isExporting}
            isLoading={isExporting}
            fullWidth
          >
            Download
          </Button>

          <Button
            variant="ghost"
            icon={isCopySuccess ? 'check' : 'copy'}
            onClick={() => copyToClipboard()}
            disabled={!hasContent || isExporting}
            fullWidth
          >
            {isCopySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </div>

      {showShareModal && (
        <ShareModal
          viewUrl={shareUrls.viewUrl}
          editUrl={shareUrls.editUrl}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
});
