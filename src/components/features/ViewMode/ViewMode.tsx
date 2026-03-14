import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '@/store';
import { useShellfie, useShellfieCompare } from '@/hooks/useShellfie';
import { useExport } from '@/hooks/useExport';
import { Button, Logo } from '@/components/common';
import type { ImageAspectRatio } from '@/types';
import styles from './ViewMode.module.scss';

const GRADIENT_DIRECTIONS: Record<string, string> = {
  'to-right': 'to right',
  'to-left': 'to left',
  'to-bottom': 'to bottom',
  'to-top': 'to top',
  'to-bottom-right': '135deg',
  'to-top-left': '315deg',
  'to-bottom-left': '225deg',
  'to-top-right': '45deg',
  'radial-reverse': 'radial',
};

function calculateExpandedDimensions(
  contentWidth: number,
  contentHeight: number,
  aspectRatio: ImageAspectRatio,
  padding: number
): { width: number; height: number; paddingX: number; paddingY: number } {
  const baseWidth = contentWidth + padding * 2;
  const baseHeight = contentHeight + padding * 2;

  if (aspectRatio === 'auto') {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

  const [w, h] = aspectRatio.split(':').map(Number);
  const targetRatio = w / h;
  const currentRatio = baseWidth / baseHeight;

  let totalWidth: number;
  let totalHeight: number;
  let paddingX: number;
  let paddingY: number;

  if (currentRatio > targetRatio) {
    totalWidth = baseWidth;
    totalHeight = baseWidth / targetRatio;
    paddingX = padding;
    paddingY = (totalHeight - contentHeight) / 2;
  } else {
    totalHeight = baseHeight;
    totalWidth = baseHeight * targetRatio;
    paddingX = (totalWidth - contentWidth) / 2;
    paddingY = padding;
  }

  return { width: totalWidth, height: totalHeight, paddingX, paddingY };
}

export const ViewMode = memo(function ViewMode() {
  const background = useStore((s) => s.background);
  const compareMode = useStore((s) => s.compareMode);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);
  const exitViewMode = useStore((s) => s.exitViewMode);
  const colorMode = useStore((s) => s.colorMode);

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

  const { download, copyToClipboard, isExporting, isCopySuccess } = useExport();

  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const compareWrapperRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [compareDimensions, setCompareDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (svgWrapperRef.current && svg) {
      requestAnimationFrame(() => {
        const svgEl = svgWrapperRef.current?.querySelector('svg');
        if (svgEl) {
          const width = svgEl.clientWidth || svgEl.getBoundingClientRect().width;
          const height = svgEl.clientHeight || svgEl.getBoundingClientRect().height;
          setSvgDimensions((prev) =>
            prev.width !== width || prev.height !== height ? { width, height } : prev
          );
        }
      });
    }
  }, [svg]);

  useEffect(() => {
    if (compareWrapperRef.current && (beforeSvg || afterSvg)) {
      requestAnimationFrame(() => {
        if (compareWrapperRef.current) {
          const width = compareWrapperRef.current.scrollWidth;
          const height = compareWrapperRef.current.scrollHeight;
          setCompareDimensions((prev) =>
            prev.width !== width || prev.height !== height ? { width, height } : prev
          );
        }
      });
    }
  }, [beforeSvg, afterSvg]);

  const backgroundStyle = useMemo(() => {
    const aspectRatio = background.imageAspectRatio;
    const padding = background.padding;

    let expandedStyle: React.CSSProperties = {};
    if (aspectRatio !== 'auto' && svgDimensions.width > 0 && svgDimensions.height > 0) {
      const { width, height, paddingX, paddingY } = calculateExpandedDimensions(
        svgDimensions.width,
        svgDimensions.height,
        aspectRatio,
        padding
      );
      expandedStyle = {
        width,
        height,
        padding: `${paddingY}px ${paddingX}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    } else {
      expandedStyle = { padding };
    }

    if (background.type === 'none') {
      return expandedStyle;
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
          : expandedStyle;
      default:
        return expandedStyle;
    }
  }, [background, svgDimensions]);

  const compareBackgroundStyle = useMemo(() => {
    const aspectRatio = background.imageAspectRatio;
    const padding = background.padding;

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

    if (background.type === 'none') {
      return expandedStyle;
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
          : expandedStyle;
      default:
        return expandedStyle;
    }
  }, [background, compareDimensions]);

  const handleEdit = () => {
    exitViewMode();
  };

  const displayError = error || compareError;

  if (displayError) {
    return (
      <div className={styles.viewMode} data-theme={colorMode}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Something went wrong</h2>
            <p>The shared link may be invalid or corrupted.</p>
            <code>{displayError}</code>
            <Button variant="primary" onClick={handleEdit}>
              Open in Editor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = (hasContent && !svg) || (hasCompareContent && !beforeSvg && !afterSvg);

  if (isLoading) {
    return (
      <div className={styles.viewMode} data-theme={colorMode}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderComparePreview = () => {
    if (!beforeSvg && !afterSvg) {
      return (
        <div className={styles.empty}>
          <p>No content to display</p>
        </div>
      );
    }

    const labelStyle: React.CSSProperties = {
      fontSize: compareLabelConfig.fontSize,
      fontFamily: compareLabelConfig.fontFamily,
      color: compareLabelConfig.color,
      textAlign: compareLabelConfig.alignment,
    };

    const emptyPaneStyle: React.CSSProperties =
      sharedWidth > 0 ? { width: sharedWidth, minWidth: sharedWidth } : {};

    return (
      <div className={styles.backgroundWrapper} style={compareBackgroundStyle}>
        <div ref={compareWrapperRef} className={styles.comparePanes}>
          <div className={styles.comparePane}>
            <span className={styles.compareLabel} style={labelStyle}>
              {beforeLabel}
            </span>
            {beforeSvg ? (
              <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: beforeSvg }} />
            ) : (
              <div className={styles.emptyPane} style={emptyPaneStyle}>
                <p>No content</p>
              </div>
            )}
          </div>
          <div className={styles.comparePane}>
            <span className={styles.compareLabel} style={labelStyle}>
              {afterLabel}
            </span>
            {afterSvg ? (
              <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: afterSvg }} />
            ) : (
              <div className={styles.emptyPane} style={emptyPaneStyle}>
                <p>No content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSinglePreview = () => {
    if (!svg) {
      return (
        <div className={styles.empty}>
          <p>No content to display</p>
        </div>
      );
    }

    return (
      <div className={styles.backgroundWrapper} style={backgroundStyle}>
        <div ref={svgWrapperRef} className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    );
  };

  return (
    <div className={styles.viewMode} data-theme={colorMode}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          {compareMode ? renderComparePreview() : renderSinglePreview()}
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            icon="download"
            onClick={() => download()}
            disabled={isExporting}
          >
            {isExporting ? 'Downloading...' : 'Download'}
          </Button>
          <Button
            variant="secondary"
            icon={isCopySuccess ? 'check' : 'copy'}
            onClick={copyToClipboard}
            disabled={isExporting}
          >
            {isCopySuccess ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" icon="edit" onClick={handleEdit}>
            Edit
          </Button>
        </div>

        <footer className={styles.footer}>
          <span>Created with </span>
          <a href="https://shellfied.dev" target="_blank" rel="noopener noreferrer">
            <Logo size={16} />
            <span>Shellfied</span>
          </a>
        </footer>
      </div>
    </div>
  );
});
