import { memo, useState, useCallback, useRef } from 'react';
import { useStore, useExportSettings, useExportActions, useCompareState } from '@/store';
import { useExport } from '@/hooks/useExport';
import { Button, Select, Slider } from '@/components/common';
import { ShareModal, type ShortUrls } from '@/components/features/Share';
import { generateShareUrlLZ, generateCompressedData } from '@/utils/urlParams';
import type { ExportFormat, ExportScale } from '@/types';
import styles from './ExportPanel.module.scss';

// Generate a simple hash of the state that affects share URLs
function getStateHash(state: ReturnType<typeof useStore.getState>): string {
  // Include all state that affects the generated image
  return JSON.stringify({
    content: state.content,
    language: state.language,
    template: state.template,
    terminalTheme: state.terminalTheme,
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
    padding: state.padding,
    title: state.title,
    showControls: state.showControls,
    controlsPosition: state.controlsPosition,
    borderRadius: state.borderRadius,
    width: state.width,
    fontFamily: state.fontFamily,
    watermark: state.watermark,
    header: state.header,
    footer: state.footer,
    background: state.background,
    compareMode: state.compareMode,
    beforeContent: state.beforeContent,
    afterContent: state.afterContent,
    beforeLabel: state.beforeLabel,
    afterLabel: state.afterLabel,
    beforeTitle: state.beforeTitle,
    afterTitle: state.afterTitle,
    beforeLanguage: state.beforeLanguage,
    afterLanguage: state.afterLanguage,
    compareLabelConfig: state.compareLabelConfig,
  });
}

const FORMAT_OPTIONS = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
];

const SCALE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

export const ExportPanel = memo(function ExportPanel() {
  const content = useStore((s) => s.content);
  const { compareMode, beforeContent, afterContent } = useCompareState();
  const { exportFormat, exportScale, jpegQuality } = useExportSettings();
  const { setExportFormat, setExportScale, setJpegQuality } = useExportActions();

  const { download, copyToClipboard, isExporting, isDownloadSuccess, isCopySuccess } = useExport();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrls, setShareUrls] = useState({ viewUrl: '', editUrl: '', compressedData: '' });
  const [shortUrls, setShortUrls] = useState<ShortUrls | null>(null);
  const lastStateHashRef = useRef<string>('');

  // Check for content based on current mode
  const hasContent = compareMode
    ? Boolean(beforeContent.trim() || afterContent.trim())
    : Boolean(content.trim());
  const isRasterFormat = exportFormat !== 'svg';
  const isJpeg = exportFormat === 'jpeg';

  const [isGeneratingUrls, setIsGeneratingUrls] = useState(false);

  const handleShare = useCallback(() => {
    const state = useStore.getState();
    const currentHash = getStateHash(state);

    // Only regenerate URLs if state has changed since last generation
    if (currentHash !== lastStateHashRef.current || !shareUrls.viewUrl) {
      setIsGeneratingUrls(true);
      try {
        const viewUrl = generateShareUrlLZ(state, 'view');
        const editUrl = generateShareUrlLZ(state, 'edit');
        const compressedData = generateCompressedData(state, 'view');
        setShareUrls({ viewUrl, editUrl, compressedData });
        // Clear short URLs when state changes since they're no longer valid
        setShortUrls(null);
        lastStateHashRef.current = currentHash;
      } finally {
        setIsGeneratingUrls(false);
      }
    }

    setShowShareModal(true);
  }, [shareUrls.viewUrl]);

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
          shortUrls={shortUrls}
          onShortUrlsChange={setShortUrls}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
});
