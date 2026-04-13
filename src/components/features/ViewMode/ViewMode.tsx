import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useStore, useStaticOutput } from '@/store';
import { useShellfie, useShellfieCompare, useShellfieSync, useShellfieCompareSync } from '@/hooks/useShellfie';
import { useExport } from '@/hooks/useExport';
import { Button, Logo } from '@/components/common';
import { svgToRasterBlob, compareToRasterBlob, createCompareSvgWithEmbeddedFonts } from '@/services/exportService';
import { generateStaticUrl } from '@/utils/urlParams';
import type { OutputFormat, ExportFormat } from '@/types';
import styles from './ViewMode.module.scss';

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
            // SVG already has background from shellfie — no wrapping needed
            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          } else {
            // For raster formats, convert to blob
            const quality = format === 'jpeg' ? jpegQuality : 1.0;
            // SVG already has background from shellfie
            const blob = await svgToRasterBlob(svg, format, {
              scale: exportScale,
              quality,
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

  // Check if static URL is available (not available for image backgrounds)
  const hasImageBackground = background.type === 'image' && !!background.image;

  const handleOpenStaticUrl = useCallback(() => {
    const state = useStore.getState();
    const format = state.exportFormat;
    const url = generateStaticUrl(state, format);
    window.open(url, '_blank');
  }, []);

  // backgroundStyle/compareBackgroundStyle removed — shellfie renders backgrounds natively

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

    return (
      <div className={styles.backgroundWrapper}>
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

    // SVG from shellfie already has background/overlays/animations baked in
    return (
      <div className={styles.backgroundWrapper}>
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
