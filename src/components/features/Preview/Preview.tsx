import { memo, useMemo } from 'react';
import { useStore } from '@/store';
import { useShellfie, useShellfieCompare } from '@/hooks/useShellfie';
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
  const compareMode = useStore((s) => s.compareMode);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);

  const { svg, error, hasContent } = useShellfie();
  const {
    beforeSvg,
    afterSvg,
    beforeLabel,
    afterLabel,
    error: compareError,
    hasContent: hasCompareContent,
  } = useShellfieCompare();

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
          background: background.gradientDirection === 'radial'
            ? `radial-gradient(circle, ${background.gradientFrom}, ${background.gradientTo})`
            : `linear-gradient(${GRADIENT_DIRECTIONS[background.gradientDirection]}, ${background.gradientFrom}, ${background.gradientTo})`,
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

  // Render compare mode preview
  const renderComparePreview = () => {
    if (compareError) {
      return (
        <div className={styles.error}>
          <p>Error generating preview</p>
          <code>{compareError}</code>
        </div>
      );
    }

    if (beforeSvg || afterSvg) {
      const labelStyle: React.CSSProperties = {
        fontSize: compareLabelConfig.fontSize,
        fontFamily: compareLabelConfig.fontFamily,
        color: compareLabelConfig.color,
        textAlign: compareLabelConfig.alignment,
      };

      return (
        <div className={styles.comparePreview} style={backgroundStyle}>
          <div className={styles.comparePane}>
            <span className={styles.compareLabel} style={labelStyle}>{beforeLabel}</span>
            {beforeSvg ? (
              <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: beforeSvg }} />
            ) : (
              <div className={styles.emptyPane}>
                <p>No content</p>
              </div>
            )}
          </div>
          <div className={styles.comparePane}>
            <span className={styles.compareLabel} style={labelStyle}>{afterLabel}</span>
            {afterSvg ? (
              <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: afterSvg }} />
            ) : (
              <div className={styles.emptyPane}>
                <p>No content</p>
              </div>
            )}
          </div>
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
      return (
        <div className={styles.backgroundWrapper} style={backgroundStyle}>
          <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: svg }} />
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
          <Button variant="ghost" size="sm" icon="refresh" onClick={handleZoomReset} aria-label="Reset zoom" />
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${isPanning ? styles.panning : ''}`}
        {...handlers}
      >
        <div className={styles.svgContainer} style={transformStyle}>
          {compareMode ? renderComparePreview() : renderSinglePreview()}
        </div>
      </div>
    </div>
  );
});
