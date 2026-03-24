import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '@/store';
import { useShellfie, useShellfieCompare } from '@/hooks/useShellfie';
import { usePanZoom } from '@/hooks/usePanZoom';
import { Button } from '@/components/common';
import type { ImageAspectRatio } from '@/types';
import styles from './Preview.module.scss';

const GRADIENT_DIRECTIONS: Record<string, string> = {
  'to-right': 'to right',
  'to-left': 'to left',
  'to-bottom': 'to bottom',
  'to-top': 'to top',
  'to-bottom-right': '135deg',
  'to-top-left': '315deg',
  'to-bottom-left': '225deg',
  'to-top-right': '45deg',
  'radial-reverse': 'radial', // handled specially
};

/**
 * Calculate expanded dimensions to fit aspect ratio (never shrinks)
 * Same logic as exportService.ts calculateAspectRatioDimensions
 */
function calculateExpandedDimensions(
  contentWidth: number,
  contentHeight: number,
  aspectRatio: ImageAspectRatio,
  padding: number
): { width: number; height: number; paddingX: number; paddingY: number } {
  const baseWidth = contentWidth + padding * 2;
  const baseHeight = contentHeight + padding * 2;

  // Handle auto, undefined, null, or empty string
  if (!aspectRatio || aspectRatio === 'auto') {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

  // Validate aspect ratio format
  if (!aspectRatio.includes(':')) {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

  // Parse aspect ratio string (e.g., "16:9" -> 16/9)
  const [w, h] = aspectRatio.split(':').map(Number);

  // Validate parsed values
  if (!w || !h || isNaN(w) || isNaN(h)) {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

  const targetRatio = w / h;
  const currentRatio = baseWidth / baseHeight;

  let totalWidth: number;
  let totalHeight: number;

  if (currentRatio > targetRatio) {
    // Content is wider than target ratio - expand height to match
    totalWidth = baseWidth;
    totalHeight = baseWidth / targetRatio;
  } else {
    // Content is taller than target ratio - expand width to match
    totalHeight = baseHeight;
    totalWidth = baseHeight * targetRatio;
  }

  // Always center the content within the expanded dimensions
  const paddingX = (totalWidth - contentWidth) / 2;
  const paddingY = (totalHeight - contentHeight) / 2;

  return { width: totalWidth, height: totalHeight, paddingX, paddingY };
}

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
    sharedWidth,
  } = useShellfieCompare();

  // Refs for measuring SVG content dimensions
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const compareWrapperRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [compareDimensions, setCompareDimensions] = useState({ width: 0, height: 0 });

  // Measure SVG dimensions after render for aspect ratio calculations
  // Use useEffect (not useLayoutEffect) for Safari mobile compatibility
  useEffect(() => {
    if (svgWrapperRef.current && svg) {
      // Use requestAnimationFrame to ensure DOM is painted before measuring
      requestAnimationFrame(() => {
        const svgEl = svgWrapperRef.current?.querySelector('svg');
        if (svgEl) {
          const width = svgEl.clientWidth || svgEl.getBoundingClientRect().width;
          const height = svgEl.clientHeight || svgEl.getBoundingClientRect().height;
          console.log('[Preview] Measured SVG dimensions:', width, 'x', height);
          // Only update if dimensions actually changed to prevent loops
          setSvgDimensions(prev =>
            prev.width !== width || prev.height !== height
              ? { width, height }
              : prev
          );
        } else {
          console.log('[Preview] Could not find SVG element in wrapper');
        }
      });
    }
  }, [svg]);

  // Measure compare preview dimensions
  useEffect(() => {
    if (compareWrapperRef.current && (beforeSvg || afterSvg)) {
      requestAnimationFrame(() => {
        if (compareWrapperRef.current) {
          const width = compareWrapperRef.current.scrollWidth;
          const height = compareWrapperRef.current.scrollHeight;
          setCompareDimensions(prev =>
            prev.width !== width || prev.height !== height
              ? { width, height }
              : prev
          );
        }
      });
    }
  }, [beforeSvg, afterSvg]);

  const { containerRef, state, isPanning, handlers, reset } = usePanZoom({
    minScale: 0.25,
    maxScale: 2,
    scaleStep: 0.25,
    initialScale: previewZoom / 100,
    onScaleChange: setPreviewZoom,
  });

  // Create background style for single preview mode with aspect ratio support
  const backgroundStyle = useMemo(() => {
    const aspectRatio = background.imageAspectRatio;
    const padding = background.padding;

    console.log('[Preview backgroundStyle] aspectRatio:', aspectRatio, 'padding:', padding, 'svgDimensions:', svgDimensions);

    // Calculate expanded dimensions if we have measured the SVG and have a non-auto aspect ratio
    let expandedStyle: React.CSSProperties = {};
    if (aspectRatio !== 'auto' && svgDimensions.width > 0 && svgDimensions.height > 0) {
      const { width, height, paddingX, paddingY } = calculateExpandedDimensions(
        svgDimensions.width,
        svgDimensions.height,
        aspectRatio,
        padding
      );
      console.log('[Preview backgroundStyle] Calculated:', { width, height, paddingX, paddingY });
      expandedStyle = {
        width,
        height,
        padding: `${paddingY}px ${paddingX}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    } else {
      console.log('[Preview backgroundStyle] Using default padding (no aspect ratio expansion)');
      expandedStyle = { padding };
    }

    // Handle no background - show dashed border for aspect ratio indicator
    if (background.type === 'none') {
      if (aspectRatio !== 'auto' && svgDimensions.width > 0) {
        return {
          ...expandedStyle,
          border: '2px dashed rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-lg)',
        };
      }
      return {};
    }

    switch (background.type) {
      case 'solid':
        return {
          ...expandedStyle,
          backgroundColor: background.color,
          borderRadius: 'var(--radius-lg)',
        };
      case 'gradient': {
        const isRadialReverse = background.gradientDirection === 'radial-reverse';
        const isRadial = background.gradientDirection === 'radial' || isRadialReverse;
        const fromColor = isRadialReverse ? background.gradientTo : background.gradientFrom;
        const toColor = isRadialReverse ? background.gradientFrom : background.gradientTo;
        return {
          ...expandedStyle,
          background: isRadial
            ? `radial-gradient(circle, ${fromColor}, ${toColor})`
            : `linear-gradient(${GRADIENT_DIRECTIONS[background.gradientDirection]}, ${background.gradientFrom}, ${background.gradientTo})`,
          borderRadius: 'var(--radius-lg)',
        };
      }
      case 'image':
        return background.image
          ? {
              ...expandedStyle,
              backgroundImage: `url(${background.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-lg)',
            }
          : {};
      default:
        return {};
    }
  }, [background, svgDimensions]);

  // Create background style for compare preview mode with aspect ratio support
  const compareBackgroundStyle = useMemo(() => {
    const aspectRatio = background.imageAspectRatio;
    const padding = background.padding;

    // Calculate expanded dimensions if we have measured and have a non-auto aspect ratio
    let expandedStyle: React.CSSProperties = {};
    if (aspectRatio !== 'auto' && compareDimensions.width > 0 && compareDimensions.height > 0) {
      const { width, height, paddingX, paddingY } = calculateExpandedDimensions(
        compareDimensions.width,
        compareDimensions.height,
        aspectRatio,
        padding
      );
      expandedStyle = {
        width,
        height,
        padding: `${paddingY}px ${paddingX}px`,
        alignItems: 'center',
        justifyContent: 'center',
      };
    } else {
      expandedStyle = { padding };
    }

    // Handle no background - show dashed border for aspect ratio indicator
    if (background.type === 'none') {
      if (aspectRatio !== 'auto' && compareDimensions.width > 0) {
        return {
          ...expandedStyle,
          border: '2px dashed rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-lg)',
        };
      }
      return {};
    }

    switch (background.type) {
      case 'solid':
        return {
          ...expandedStyle,
          backgroundColor: background.color,
        };
      case 'gradient': {
        const isRadialReverse = background.gradientDirection === 'radial-reverse';
        const isRadial = background.gradientDirection === 'radial' || isRadialReverse;
        const fromColor = isRadialReverse ? background.gradientTo : background.gradientFrom;
        const toColor = isRadialReverse ? background.gradientFrom : background.gradientTo;
        return {
          ...expandedStyle,
          background: isRadial
            ? `radial-gradient(circle, ${fromColor}, ${toColor})`
            : `linear-gradient(${GRADIENT_DIRECTIONS[background.gradientDirection]}, ${background.gradientFrom}, ${background.gradientTo})`,
        };
      }
      case 'image':
        return background.image
          ? {
              ...expandedStyle,
              backgroundImage: `url(${background.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {};
      default:
        return {};
    }
  }, [background, compareDimensions]);

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
        fontWeight: compareLabelConfig.fontWeight,
        color: compareLabelConfig.color,
        textAlign: compareLabelConfig.alignment,
      };

      // Calculate empty pane style to match the other terminal's width
      const emptyPaneStyle: React.CSSProperties = sharedWidth > 0 ? { width: sharedWidth, minWidth: sharedWidth } : {};

      return (
        <div className={styles.comparePreview} style={compareBackgroundStyle}>
          <div ref={compareWrapperRef} className={styles.comparePanes}>
            <div className={styles.comparePane}>
              <span className={styles.compareLabel} style={labelStyle}>{beforeLabel}</span>
              {beforeSvg ? (
                <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: beforeSvg }} suppressHydrationWarning />
              ) : (
                <div className={styles.emptyPane} style={emptyPaneStyle}>
                  <p>No content</p>
                </div>
              )}
            </div>
            <div className={styles.comparePane}>
              <span className={styles.compareLabel} style={labelStyle}>{afterLabel}</span>
              {afterSvg ? (
                <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: afterSvg }} suppressHydrationWarning />
              ) : (
                <div className={styles.emptyPane} style={emptyPaneStyle}>
                  <p>No content</p>
                </div>
              )}
            </div>
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
