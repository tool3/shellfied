import { memo, useMemo } from 'react';
import { useStore } from '@/store';
import { useShellfie } from '@/hooks/useShellfie';
import { usePanZoom } from '@/hooks/usePanZoom';
import { Button } from '@/components/common';
import styles from './Preview.module.scss';

const GRADIENT_DIRECTIONS: Record<string, string> = {
  'to-right': 'to right',
  'to-bottom': 'to bottom',
  'to-bottom-right': '135deg',
  'to-bottom-left': '225deg',
};

export const Preview = memo(function Preview() {
  const previewZoom = useStore((s) => s.previewZoom);
  const setPreviewZoom = useStore((s) => s.setPreviewZoom);
  const background = useStore((s) => s.background);

  const { svg, error, hasContent } = useShellfie();

  const { containerRef, state, isPanning, handlers, reset } = usePanZoom({
    minScale: 0.25,
    maxScale: 2,
    scaleStep: 0.25,
    initialScale: previewZoom / 100,
    onScaleChange: setPreviewZoom,
  });

  const backgroundStyle = useMemo(() => {
    if (background.type === 'none') return {};

    const padding = background.padding;
    const baseStyle: React.CSSProperties = { padding };

    switch (background.type) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: background.color,
          borderRadius: 'var(--radius-lg)',
        };
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(${GRADIENT_DIRECTIONS[background.gradientDirection]}, ${background.gradientFrom}, ${background.gradientTo})`,
          borderRadius: 'var(--radius-lg)',
        };
      case 'image':
        return background.image
          ? {
              ...baseStyle,
              backgroundImage: `url(${background.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-lg)',
            }
          : {};
      default:
        return {};
    }
  }, [background]);

  const handleZoomIn = () => {
    setPreviewZoom(Math.min(previewZoom + 25, 200));
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

  return (
    <div className={styles.preview}>
      <div className={styles.toolbar}>
        <span className={styles.title}>Preview</span>
        <div className={styles.controls}>
          <Button variant="ghost" size="sm" icon="zoomOut" onClick={handleZoomOut} aria-label="Zoom out" />
          <span className={styles.zoomLevel}>{Math.round(state.scale * 100)}%</span>
          <Button variant="ghost" size="sm" icon="zoomIn" onClick={handleZoomIn} aria-label="Zoom in" />
          <Button variant="ghost" size="sm" icon="refresh" onClick={handleZoomReset} aria-label="Reset zoom" />
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${isPanning ? styles.panning : ''}`}
        {...handlers}
      >
        <div className={styles.svgContainer} style={transformStyle}>
          {error ? (
            <div className={styles.error}>
              <p>Error generating preview</p>
              <code>{error}</code>
            </div>
          ) : svg ? (
            <div className={styles.backgroundWrapper} style={backgroundStyle}>
              <div
                className={styles.svgWrapper}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
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
