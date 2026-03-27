import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useStore, useStaticOutput } from '@/store';
import { useShellfie, useShellfieCompare, useShellfieSync, useShellfieCompareSync } from '@/hooks/useShellfie';
import { useExport } from '@/hooks/useExport';
import { Button, Logo } from '@/components/common';
import { svgToRasterBlob, wrapSvgWithBackground, compareToRasterBlob, createCompareSvgWithEmbeddedFonts } from '@/services/exportService';
import { generateStaticUrl } from '@/utils/urlParams';
import { generateAnimationSvgElement } from '@/lib/backgroundAnimations';
import { generateOverlaySvgElement } from '@/lib/backgroundOverlays';
import type { ImageAspectRatio, OutputFormat, ExportFormat } from '@/types';
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

  // Handle auto, undefined, null, or empty string
  if (!aspectRatio || aspectRatio === 'auto') {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

  // Validate aspect ratio format
  if (!aspectRatio.includes(':')) {
    return { width: baseWidth, height: baseHeight, paddingX: padding, paddingY: padding };
  }

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

// Static image component - serves raw image without UI
const StaticImageView = memo(function StaticImageView({
  format,
}: {
  format: Exclude<OutputFormat, null>;
}) {
  const background = useStore((s) => s.background);
  const exportScale = useStore((s) => s.exportScale);
  const jpegQuality = useStore((s) => s.jpegQuality);
  const compareMode = useStore((s) => s.compareMode);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);
  const { generate } = useShellfieSync();
  const { generate: generateCompare } = useShellfieCompareSync();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createImage = async () => {
      try {
        if (compareMode) {
          // Handle compare mode
          const { beforeSvg, afterSvg, beforeLabel, afterLabel } = generateCompare();
          if (!beforeSvg && !afterSvg) {
            setError('No content to display');
            return;
          }

          const compareOptions = {
            scale: exportScale,
            quality: format === 'jpeg' ? jpegQuality : 1.0,
            background,
            gap: 32,
            labelHeight: compareLabelConfig.fontSize + 24,
            labelColor: compareLabelConfig.color,
            labelFont: `${compareLabelConfig.fontWeight} ${compareLabelConfig.fontSize}px ${compareLabelConfig.fontFamily}`,
            labelAlignment: compareLabelConfig.alignment,
          };

          if (format === 'svg') {
            // Create combined SVG with embedded fonts
            const combinedSvg = await createCompareSvgWithEmbeddedFonts(
              beforeSvg,
              afterSvg,
              beforeLabel,
              afterLabel,
              compareOptions
            );
            const blob = new Blob([combinedSvg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          } else {
            // Convert to raster blob
            const blob = await compareToRasterBlob(
              beforeSvg,
              afterSvg,
              beforeLabel,
              afterLabel,
              format,
              compareOptions
            );
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        } else {
          // Handle single mode
          const svg = generate();
          if (!svg) {
            setError('No content to display');
            return;
          }

          if (format === 'svg') {
            // For SVG, wrap with background and create a blob URL
            const wrappedSvg = wrapSvgWithBackground(svg, background);
            const blob = new Blob([wrappedSvg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          } else {
            // For raster formats, convert to blob
            const quality = format === 'jpeg' ? jpegQuality : 1.0;
            const blob = await svgToRasterBlob(svg, format, {
              scale: exportScale,
              quality,
              background,
            });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate image');
      }
    };

    createImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [format, generate, generateCompare, background, exportScale, jpegQuality, compareMode, compareLabelConfig]);

  if (error) {
    return (
      <div className={styles.staticError}>
        <p>{error}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={styles.staticLoading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.staticImage}>
      <img src={imageUrl} alt="Shellfie" />
    </div>
  );
});

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
];

export const ViewMode = memo(function ViewMode() {
  const background = useStore((s) => s.background);
  const borderRadius = useStore((s) => s.borderRadius);
  const compareMode = useStore((s) => s.compareMode);
  const compareLabelConfig = useStore((s) => s.compareLabelConfig);
  const exitViewMode = useStore((s) => s.exitViewMode);
  const colorMode = useStore((s) => s.colorMode);
  const brand = useStore((s) => s.brand);
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const staticOutput = useStaticOutput();

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

  // Sync generators for static image generation (used when background has an image)
  const { generate } = useShellfieSync();
  const { generate: generateCompare } = useShellfieCompareSync();

  const { download, copyToClipboard, isExporting, isCopySuccess, isDownloadSuccess, error: exportError } = useExport();

  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const compareWrapperRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [compareDimensions, setCompareDimensions] = useState({ width: 0, height: 0 });

  // Check if static URL is available (not available for image backgrounds)
  const hasImageBackground = background.type === 'image' && !!background.image;

  const handleOpenStaticUrl = useCallback(() => {
    const state = useStore.getState();
    const format = state.exportFormat;
    const url = generateStaticUrl(state, format);
    window.open(url, '_blank');
  }, []);

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

  // If static output is requested, render just the image without UI
  if (staticOutput) {
    return <StaticImageView format={staticOutput} />;
  }

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
      fontWeight: compareLabelConfig.fontWeight,
      color: compareLabelConfig.color,
      textAlign: compareLabelConfig.alignment,
    };

    const emptyPaneStyle: React.CSSProperties =
      sharedWidth > 0 ? { width: sharedWidth, minWidth: sharedWidth } : {};

    const vcTotalW = compareDimensions.width + background.padding * 2;
    const vcTotalH = compareDimensions.height + background.padding * 2;
    const compareOverlaySvg = background.overlay && background.type !== 'none' && compareDimensions.width > 0
      ? generateOverlaySvgElement(background.overlay, vcTotalW, vcTotalH, background.padding, borderRadius)
      : '';
    const compareAnimSvg = background.animation && background.type !== 'none' && compareDimensions.width > 0
      ? generateAnimationSvgElement(background.animation, vcTotalW, vcTotalH, background.padding, borderRadius)
      : '';
    return (
      <div className={styles.backgroundWrapper} style={compareBackgroundStyle}>
        {compareOverlaySvg && <div className={styles.bgAnimation} dangerouslySetInnerHTML={{ __html: compareOverlaySvg }} />}
        {compareAnimSvg && <div className={styles.bgAnimation} dangerouslySetInnerHTML={{ __html: compareAnimSvg }} />}
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

    const vTotalW = svgDimensions.width + background.padding * 2;
    const vTotalH = svgDimensions.height + background.padding * 2;
    const singleOverlaySvg = background.overlay && background.type !== 'none' && svgDimensions.width > 0
      ? generateOverlaySvgElement(background.overlay, vTotalW, vTotalH, background.padding, borderRadius)
      : '';
    const singleAnimSvg = background.animation && background.type !== 'none' && svgDimensions.width > 0
      ? generateAnimationSvgElement(background.animation, vTotalW, vTotalH, background.padding, borderRadius)
      : '';
    return (
      <div className={styles.backgroundWrapper} style={backgroundStyle}>
        {singleOverlaySvg && <div className={styles.bgAnimation} dangerouslySetInnerHTML={{ __html: singleOverlaySvg }} />}
        {singleAnimSvg && <div className={styles.bgAnimation} dangerouslySetInnerHTML={{ __html: singleAnimSvg }} />}
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
          <div className={styles.formatToggle}>
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.formatButton} ${exportFormat === option.value ? styles.active : ''}`}
                onClick={() => setExportFormat(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={styles.row}>
            <Button
              variant="secondary"
              icon={isCopySuccess ? 'check' : 'copy'}
              onClick={copyToClipboard}
              fullWidth
              disabled={isExporting}
            >
              {isCopySuccess ? 'Copied!' : 'Copy'}
            </Button>
            <Button fullWidth variant="secondary" icon="edit" onClick={handleEdit}>
              Edit
            </Button>
          </div>
          <Button
            variant="primary"
            fullWidth
            icon={isDownloadSuccess ? 'check' : 'download'}
            onClick={() => download()}
            disabled={isExporting}
          >
            {isExporting ? 'Downloading...' : isDownloadSuccess ? 'Downloaded!' : 'Download'}
          </Button>
          <Button
            variant="secondary"
            icon="externalLink"
            onClick={handleOpenStaticUrl}
            disabled={hasImageBackground}
            fullWidth
            title={
              hasImageBackground
                ? 'Static URLs not available for image backgrounds'
                : 'Open as static image'
            }
          >
            Static
          </Button>
          {exportError && (
            <div className={styles.exportError}>
              {exportError}
            </div>
          )}
        </div>
        <footer className={styles.footer}>
          <span>{brand.enabled ? brand.text : 'Created with'} </span>
          <a href={brand.enabled ? brand.url : '/'} rel="noopener noreferrer">
            {!brand.enabled && <Logo size={16} />}
            {brand.enabled && brand.showIcon && (
              brand.iconUrl ? (
                <img src={brand.iconUrl} alt="" className={styles.brandIcon} />
              ) : (
                <Logo size={16} />
              )
            )}
            <span>{brand.enabled ? brand.name : 'Shellfied'}</span>
          </a>
        </footer>
      </div>
    </div>
  );
});
