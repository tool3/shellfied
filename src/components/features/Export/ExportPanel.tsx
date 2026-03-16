import { memo, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useExport } from '@/hooks/useExport';
import { Button, Select, Slider } from '@/components/common';
import { ShareModal } from '@/components/features/Share';
import { generateShareUrlLZ, generateCompressedData } from '@/utils/urlParams';
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
  const content = useStore((s) => s.content);
  const compareMode = useStore((s) => s.compareMode);
  const beforeContent = useStore((s) => s.beforeContent);
  const afterContent = useStore((s) => s.afterContent);
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const exportScale = useStore((s) => s.exportScale);
  const setExportScale = useStore((s) => s.setExportScale);
  const jpegQuality = useStore((s) => s.jpegQuality);
  const setJpegQuality = useStore((s) => s.setJpegQuality);

  const { download, copyToClipboard, isExporting, isDownloadSuccess, isCopySuccess } = useExport();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrls, setShareUrls] = useState({ viewUrl: '', editUrl: '', compressedData: '' });

  // Check for content based on current mode
  const hasContent = compareMode
    ? Boolean(beforeContent.trim() || afterContent.trim())
    : Boolean(content.trim());
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
      const compressedData = generateCompressedData(state, 'view');
      setShareUrls({ viewUrl, editUrl, compressedData });
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
          {/* Format & Scale in a row */}
          <div className={styles.optionsRow}>
            <Select
              label="Format"
              options={FORMAT_OPTIONS}
              value={exportFormat}
              onChange={handleFormatChange}
            />

            {isRasterFormat && (
              <Select
                label="Scale"
                options={SCALE_OPTIONS}
                value={String(exportScale)}
                onChange={handleScaleChange}
              />
            )}
          </div>

          {/* Quality slider on its own row */}
          {isJpeg && (
            <div className={styles.qualityRow}>
              <Slider
                label="Quality"
                value={jpegQuality}
                onChange={setJpegQuality}
                min={0.6}
                max={1.0}
                step={0.1}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
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
          compressedData={shareUrls.compressedData}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
});
