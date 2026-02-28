import { memo } from 'react';
import { useStore, useContent } from '@/store';
import { useExport } from '@/hooks/useExport';
import { Button, Select } from '@/components/common';
import type { ExportScale } from '@/types';
import styles from './ExportPanel.module.scss';

const SCALE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x (Recommended)' },
  { value: '3', label: '3x' },
];

export const ExportPanel = memo(function ExportPanel() {
  const content = useContent();
  const exportScale = useStore((s) => s.exportScale);
  const setExportScale = useStore((s) => s.setExportScale);

  const { exportToSvg, exportToPng, copyAsPng, isExporting, isSuccess } = useExport();

  const hasContent = Boolean(content.trim());

  const handleScaleChange = (value: string) => {
    setExportScale(Number(value) as ExportScale);
  };

  return (
    <div className={styles.exportPanel}>
      <h3 className={styles.title}>Export</h3>

      <div className={styles.scaleSelector}>
        <Select
          label="PNG Scale"
          options={SCALE_OPTIONS}
          value={String(exportScale)}
          onChange={handleScaleChange}
          fullWidth
        />
      </div>

      <div className={styles.buttons}>
        <Button
          variant="primary"
          icon={isSuccess ? 'check' : 'download'}
          onClick={() => exportToPng()}
          disabled={!hasContent || isExporting}
          isLoading={isExporting}
          fullWidth
        >
          Download PNG
        </Button>

        <Button
          variant="secondary"
          icon="download"
          onClick={() => exportToSvg()}
          disabled={!hasContent || isExporting}
          fullWidth
        >
          Download SVG
        </Button>

        <Button
          variant="ghost"
          icon="copy"
          onClick={() => copyAsPng()}
          disabled={!hasContent || isExporting}
          fullWidth
        >
          Copy to Clipboard
        </Button>
      </div>
    </div>
  );
});
