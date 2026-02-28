import { memo, useRef } from 'react';
import { useStore } from '@/store';
import { useShellfie } from '@/hooks/useShellfie';
import { Button } from '@/components/common';
import styles from './Preview.module.scss';

export const Preview = memo(function Preview() {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewZoom = useStore((s) => s.previewZoom);
  const setPreviewZoom = useStore((s) => s.setPreviewZoom);

  const { svg, error, hasContent } = useShellfie();

  const handleZoomIn = () => {
    setPreviewZoom(Math.min(previewZoom + 25, 200));
  };

  const handleZoomOut = () => {
    setPreviewZoom(Math.max(previewZoom - 25, 25));
  };

  const handleZoomReset = () => {
    setPreviewZoom(100);
  };

  return (
    <div className={styles.preview}>
      <div className={styles.toolbar}>
        <span className={styles.title}>Preview</span>
        <div className={styles.controls}>
          <Button variant="ghost" size="sm" icon="zoomOut" onClick={handleZoomOut} aria-label="Zoom out" />
          <span className={styles.zoomLevel}>{previewZoom}%</span>
          <Button variant="ghost" size="sm" icon="zoomIn" onClick={handleZoomIn} aria-label="Zoom in" />
          <Button variant="ghost" size="sm" icon="refresh" onClick={handleZoomReset} aria-label="Reset zoom" />
        </div>
      </div>

      <div className={styles.canvas}>
        <div
          ref={previewRef}
          className={styles.svgContainer}
          style={{ transform: `scale(${previewZoom / 100})` }}
        >
          {error ? (
            <div className={styles.error}>
              <p>Error generating preview</p>
              <code>{error}</code>
            </div>
          ) : svg ? (
            <div
              className={styles.svgWrapper}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : hasContent ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Generating preview...</p>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Enter text in the editor to see a preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
