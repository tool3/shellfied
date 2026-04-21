import { memo, useRef } from 'react';
import { useStore } from '@/store';
import { useShellfie, useShellfieCompare } from '@/hooks/useShellfie';
import { usePanZoom } from '@/hooks/usePanZoom';
import { Button } from '@/components/common';
import styles from './Preview.module.scss';

export const Preview = memo(function Preview() {
  const previewZoom = useStore((s) => s.previewZoom);
  const setPreviewZoom = useStore((s) => s.setPreviewZoom);
  const compareMode = useStore((s) => s.compareMode);

  const { svg, error, hasContent } = useShellfie();
  const {
    svg: compareSvg,
    error: compareError,
    hasContent: hasCompareContent,
  } = useShellfieCompare();

  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const compareWrapperRef = useRef<HTMLDivElement>(null);

  const { containerRef, state, isPanning, handlers, reset } = usePanZoom({
    minScale: 0.25,
    maxScale: 5,
    scaleStep: 0.25,
    initialScale: previewZoom / 100,
    onScaleChange: setPreviewZoom,
  });

  // Create background style for single preview mode with aspect ratio support
  // backgroundStyle removed — shellfie renders backgrounds natively in the SVG

  // Create background style for compare preview mode with aspect ratio support
  // compareBackgroundStyle removed — shellfie renders backgrounds natively

  const handleZoomIn = () => {
    setPreviewZoom(Math.min(previewZoom + 25, 500));
  };

  const handleZoomOut = () => {
    setPreviewZoom(Math.max(previewZoom - 25, 25));
  };

  const handleZoomReset = () => {
    reset();
  };

  const transformStyle: React.CSSProperties = {
    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
  };

  // Render compare mode preview — single composed SVG with unified background
  const renderComparePreview = () => {
    if (compareError) {
      return (
        <div className={styles.error}>
          <p>Error generating preview</p>
          <code>{compareError}</code>
        </div>
      );
    }

    if (compareSvg) {
      return (
        <div className={styles.backgroundWrapper}>
          <div ref={compareWrapperRef} className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: compareSvg }} suppressHydrationWarning />
        </div>
      );
    }

    if (hasCompareContent) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Generating preview...</p>
        </div>
      );
    }

    return (
      <div className={styles.empty}>
        <p>Enter text in both editors to see a comparison preview</p>
      </div>
    );
  };

  // Render single preview
  const renderSinglePreview = () => {
    if (error) {
      return (
        <div className={styles.error}>
          <p>Error generating preview</p>
          <code>{error}</code>
        </div>
      );
    }

    if (svg) {
      // shellfie renders backgrounds, overlays, and animations natively in the SVG.
      // No CSS background or extra SVG overlays needed — just render the SVG.
      return (
        <div className={styles.backgroundWrapper}>
          <div ref={svgWrapperRef} className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: svg }} suppressHydrationWarning />
        </div>
      );
    }

    if (hasContent) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Generating preview...</p>
        </div>
      );
    }

    return (
      <div className={styles.empty}>
        <p>Enter text in the editor to see a preview</p>
      </div>
    );
  };

  return (
    <div className={styles.preview}>
      <div className={styles.toolbar}>
        <span className={styles.title}>Preview{compareMode ? ' (Compare)' : ''}</span>
        <div className={styles.controls}>
          <Button variant="ghost" size="sm" icon="zoomOut" onClick={handleZoomOut} aria-label="Zoom out" />
          <span className={styles.zoomLevel}>{Math.round(state.scale * 100)}%</span>
          <Button variant="ghost" size="sm" icon="zoomIn" onClick={handleZoomIn} aria-label="Zoom in" />
          <Button variant="ghost" size="sm" icon="fitView" onClick={handleZoomReset} aria-label="Reset zoom" />
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${isPanning ? styles.panning : ''}`}
        {...handlers}
      >
        <div className={styles.svgContainer} style={transformStyle} data-pan-content>
          {compareMode ? renderComparePreview() : renderSinglePreview()}
        </div>
      </div>
    </div>
  );
});
