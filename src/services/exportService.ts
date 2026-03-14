import type { ExportFormat, BackgroundConfig, CompareExportOptions, ImageAspectRatio } from '@/types';

/**
 * Calculate dimensions with aspect ratio constraint for image backgrounds
 */
function calculateAspectRatioDimensions(
  contentWidth: number,
  contentHeight: number,
  aspectRatio: ImageAspectRatio,
  padding: number
): { totalWidth: number; totalHeight: number; offsetX: number; offsetY: number } {
  const baseWidth = contentWidth + padding * 2;
  const baseHeight = contentHeight + padding * 2;

  if (aspectRatio === 'auto') {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }

  // Parse aspect ratio string (e.g., "16:9" -> 16/9)
  const [w, h] = aspectRatio.split(':').map(Number);
  const targetRatio = w / h;
  const currentRatio = baseWidth / baseHeight;

  let totalWidth: number;
  let totalHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (currentRatio > targetRatio) {
    // Content is wider than target ratio - expand height
    totalWidth = baseWidth;
    totalHeight = baseWidth / targetRatio;
    offsetX = padding;
    offsetY = (totalHeight - contentHeight) / 2;
  } else {
    // Content is taller than target ratio - expand width
    totalHeight = baseHeight;
    totalWidth = baseHeight * targetRatio;
    offsetX = (totalWidth - contentWidth) / 2;
    offsetY = padding;
  }

  return { totalWidth, totalHeight, offsetX, offsetY };
}

/**
 * Check if we're on a mobile device
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if Web Share API is available with file support
 */
function canShareFiles(): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}

/**
 * Share a file using the Web Share API (for mobile save to gallery)
 */
async function shareFile(blob: Blob, filename: string, mimeType: string): Promise<boolean> {
  if (!canShareFiles()) return false;

  try {
    const file = new File([blob], filename, { type: mimeType });
    const shareData = { files: [file] };

    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
  } catch (err) {
    // User cancelled or share failed - fall back to download
    if (err instanceof Error && err.name === 'AbortError') {
      return true; // User cancelled, don't fall back
    }
  }
  return false;
}

/**
 * Downloads an SVG string as a file
 */
export function downloadSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

interface RasterExportOptions {
  scale?: number;
  quality?: number;
  background?: BackgroundConfig;
}

/**
 * Draws background on canvas context
 */
async function drawBackground(
  ctx: CanvasRenderingContext2D,
  background: BackgroundConfig,
  totalWidth: number,
  totalHeight: number
): Promise<void> {
  if (background.type === 'none') return;

  switch (background.type) {
    case 'solid':
      ctx.fillStyle = background.color;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 12);
      ctx.fill();
      break;

    case 'gradient': {
      const direction = background.gradientDirection;
      const isRadialReverse = direction === 'radial-reverse';
      const isRadial = direction === 'radial' || isRadialReverse;
      const fromColor = isRadialReverse ? background.gradientTo : background.gradientFrom;
      const toColor = isRadialReverse ? background.gradientFrom : background.gradientTo;
      let gradient: CanvasGradient;

      if (isRadial) {
        // Create radial gradient from center
        const centerX = totalWidth / 2;
        const centerY = totalHeight / 2;
        const radius = Math.max(totalWidth, totalHeight) / 2;
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      } else if (direction === 'to-right') {
        gradient = ctx.createLinearGradient(0, 0, totalWidth, 0);
      } else if (direction === 'to-left') {
        gradient = ctx.createLinearGradient(totalWidth, 0, 0, 0);
      } else if (direction === 'to-bottom') {
        gradient = ctx.createLinearGradient(0, 0, 0, totalHeight);
      } else if (direction === 'to-top') {
        gradient = ctx.createLinearGradient(0, totalHeight, 0, 0);
      } else if (direction === 'to-bottom-right') {
        gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      } else if (direction === 'to-top-left') {
        gradient = ctx.createLinearGradient(totalWidth, totalHeight, 0, 0);
      } else if (direction === 'to-top-right') {
        gradient = ctx.createLinearGradient(0, totalHeight, totalWidth, 0);
      } else {
        // to-bottom-left
        gradient = ctx.createLinearGradient(totalWidth, 0, 0, totalHeight);
      }

      gradient.addColorStop(0, fromColor);
      gradient.addColorStop(1, toColor);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 12);
      ctx.fill();
      break;
    }

    case 'image': {
      if (!background.image) return;

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load background image'));
        img.src = background.image!;
      });

      // Draw with cover behavior
      const imgRatio = img.width / img.height;
      const canvasRatio = totalWidth / totalHeight;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      if (imgRatio > canvasRatio) {
        drawHeight = totalHeight;
        drawWidth = totalHeight * imgRatio;
        drawX = (totalWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = totalWidth;
        drawHeight = totalWidth / imgRatio;
        drawX = 0;
        drawY = (totalHeight - drawHeight) / 2;
      }

      // Clip to rounded rectangle
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 12);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      break;
    }
  }
}

/**
 * Converts SVG to a raster image and downloads it
 */
export async function downloadRaster(
  svgContent: string,
  filename: string,
  format: Exclude<ExportFormat, 'svg'>,
  options: RasterExportOptions = {}
): Promise<void> {
  const { scale = 2, quality = 1.0, background } = options;
  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);

  // Calculate total dimensions including background padding and aspect ratio
  const padding = background?.type !== 'none' ? (background?.padding ?? 0) : 0;
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  // Draw background first if configured
  if (background && background.type !== 'none') {
    await drawBackground(ctx, background, totalWidth, totalHeight);
  }

  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Draw SVG with offset (centered for aspect ratio)
      ctx.drawImage(img, offsetX, offsetY);
      URL.revokeObjectURL(svgUrl);

      const mimeType = getMimeType(format);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
            return;
          }

          // On mobile, try to use share API for save to gallery
          if (isMobileDevice()) {
            const shared = await shareFile(blob, `${filename}.${format}`, mimeType);
            if (shared) {
              resolve();
              return;
            }
          }

          // Fall back to regular download
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${filename}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(blobUrl);
          resolve();
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG'));
    };

    img.src = svgUrl;
  });
}

/**
 * Legacy function for backward compatibility
 */
export async function downloadPng(
  svgContent: string,
  filename: string,
  scale: number = 2
): Promise<void> {
  return downloadRaster(svgContent, filename, 'png', { scale });
}

/**
 * Copies SVG content to clipboard as text
 */
export async function copySvgToClipboard(svgContent: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(svgContent);
  } catch {
    // Fallback for older browsers or permission issues
    const textarea = document.createElement('textarea');
    textarea.value = svgContent;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

interface ClipboardOptions {
  scale?: number;
  background?: BackgroundConfig;
}

/**
 * Copies image to clipboard as PNG
 */
export async function copyToClipboard(
  svgContent: string,
  scaleOrOptions: number | ClipboardOptions = 2
): Promise<void> {
  const options: ClipboardOptions = typeof scaleOrOptions === 'number'
    ? { scale: scaleOrOptions }
    : scaleOrOptions;
  const { scale = 2, background } = options;

  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);

  // Calculate total dimensions including background padding and aspect ratio
  const padding = background?.type !== 'none' ? (background?.padding ?? 0) : 0;
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  // Draw background first if configured
  if (background && background.type !== 'none') {
    await drawBackground(ctx, background, totalWidth, totalHeight);
  }

  // Convert SVG to data URL for better browser compatibility
  const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      // Draw SVG with offset (centered for aspect ratio)
      ctx.drawImage(img, offsetX, offsetY);

      try {
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/png', 1.0)
        );

        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }

        // Try the modern clipboard API first
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          resolve();
        } else {
          // Fallback: copy SVG as text since image clipboard isn't supported
          await copySvgToClipboard(svgContent);
          resolve();
        }
      } catch (err) {
        // If clipboard write fails, try SVG text fallback
        try {
          await copySvgToClipboard(svgContent);
          resolve();
        } catch {
          reject(err);
        }
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG for clipboard'));
    };

    img.src = svgDataUrl;
  });
}

/**
 * Legacy alias
 */
export const copyPngToClipboard = copyToClipboard;

/**
 * Gets MIME type for export format
 */
function getMimeType(format: Exclude<ExportFormat, 'svg'>): string {
  const mimeTypes: Record<Exclude<ExportFormat, 'svg'>, string> = {
    png: 'image/png',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
  };
  return mimeTypes[format];
}

/**
 * Extracts width and height from SVG content
 */
function getSvgDimensions(svgContent: string): { width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) throw new Error('Invalid SVG content');

  // Try to get dimensions from width/height attributes
  let width = parseFloat(svg.getAttribute('width') || '0');
  let height = parseFloat(svg.getAttribute('height') || '0');

  // Fallback to viewBox
  if (!width || !height) {
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(parseFloat);
      if (parts.length === 4) {
        width = width || parts[2];
        height = height || parts[3];
      }
    }
  }

  return { width: width || 800, height: height || 600 };
}

/**
 * Loads an SVG string as an Image element
 */
async function loadSvgAsImage(svgContent: string): Promise<HTMLImageElement> {
  const img = new Image();
  const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load SVG'));
    img.src = svgDataUrl;
  });
}

/**
 * Converts SVG to a raster blob (for static image serving)
 */
export async function svgToRasterBlob(
  svgContent: string,
  format: Exclude<ExportFormat, 'svg'>,
  options: RasterExportOptions = {}
): Promise<Blob> {
  const { scale = 2, quality = 1.0, background } = options;
  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);

  const padding = background?.type !== 'none' ? (background?.padding ?? 0) : 0;
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  if (background && background.type !== 'none') {
    await drawBackground(ctx, background, totalWidth, totalHeight);
  }

  const img = await loadSvgAsImage(svgContent);
  ctx.drawImage(img, offsetX, offsetY);

  const mimeType = getMimeType(format);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Downloads a compare mode image (two SVGs side by side with labels)
 */
export async function downloadCompareRaster(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  filename: string,
  format: Exclude<ExportFormat, 'svg'>,
  options: CompareExportOptions
): Promise<void> {
  const {
    scale = 2,
    quality = 1.0,
    background,
    gap = 32,
    labelHeight = 40,
    labelColor = '#ffffff',
    labelFont = '600 16px system-ui, -apple-system, sans-serif',
    labelAlignment = 'left',
  } = options;

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  // Calculate total canvas size
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const padding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const totalWidth = beforeDims.width + gap + afterDims.width + padding * 2;
  const totalHeight = maxHeight + labelHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  // Draw background
  if (background && background.type !== 'none') {
    await drawBackground(ctx, background, totalWidth, totalHeight);
  }

  // Draw labels with alignment
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'top';

  // Calculate label x positions based on alignment
  let beforeLabelX = padding;
  let afterLabelX = padding + beforeDims.width + gap;

  if (labelAlignment === 'center') {
    ctx.textAlign = 'center';
    beforeLabelX = padding + beforeDims.width / 2;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width / 2;
  } else if (labelAlignment === 'right') {
    ctx.textAlign = 'right';
    beforeLabelX = padding + beforeDims.width;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width;
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(beforeLabel, beforeLabelX, padding);
  ctx.fillText(afterLabel, afterLabelX, padding);

  // Reset text align for any future operations
  ctx.textAlign = 'left';

  // Draw before SVG
  if (beforeSvg) {
    const beforeImg = await loadSvgAsImage(beforeSvg);
    ctx.drawImage(beforeImg, padding, padding + labelHeight);
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(padding, padding + labelHeight, beforeDims.width, beforeDims.height);
  }

  // Draw after SVG
  if (afterSvg) {
    const afterImg = await loadSvgAsImage(afterSvg);
    ctx.drawImage(afterImg, padding + beforeDims.width + gap, padding + labelHeight);
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(padding + beforeDims.width + gap, padding + labelHeight, afterDims.width, afterDims.height);
  }

  const mimeType = getMimeType(format);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
          return;
        }

        // On mobile, try to use share API for save to gallery
        if (isMobileDevice()) {
          const shared = await shareFile(blob, `${filename}.${format}`, mimeType);
          if (shared) {
            resolve();
            return;
          }
        }

        // Fall back to regular download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);
        resolve();
      },
      mimeType,
      quality
    );
  });
}

/**
 * Generates SVG background element based on config
 */
function generateSvgBackground(
  background: BackgroundConfig | undefined,
  totalWidth: number,
  totalHeight: number,
  borderRadius: number = 12
): string {
  if (!background || background.type === 'none') return '';

  const GRADIENT_DIRECTIONS: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
    'to-right': { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
    'to-left': { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
    'to-bottom': { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
    'to-top': { x1: '0%', y1: '100%', x2: '0%', y2: '0%' },
    'to-bottom-right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
    'to-top-left': { x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
    'to-bottom-left': { x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
    'to-top-right': { x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
  };

  switch (background.type) {
    case 'solid':
      return `<rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="${background.color}"/>`;

    case 'gradient': {
      const isRadialReverse = background.gradientDirection === 'radial-reverse';
      const isRadial = background.gradientDirection === 'radial' || isRadialReverse;
      const fromColor = isRadialReverse ? background.gradientTo : background.gradientFrom;
      const toColor = isRadialReverse ? background.gradientFrom : background.gradientTo;

      if (isRadial) {
        return `
          <defs>
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stop-color="${fromColor}"/>
              <stop offset="100%" stop-color="${toColor}"/>
            </radialGradient>
          </defs>
          <rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="url(#bgGradient)"/>`;
      }
      const dir = GRADIENT_DIRECTIONS[background.gradientDirection] || GRADIENT_DIRECTIONS['to-right'];
      return `
        <defs>
          <linearGradient id="bgGradient" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}">
            <stop offset="0%" stop-color="${background.gradientFrom}"/>
            <stop offset="100%" stop-color="${background.gradientTo}"/>
          </linearGradient>
        </defs>
        <rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}" fill="url(#bgGradient)"/>`;
    }

    case 'image':
      // For SVG export, we can embed the image if it's a data URL
      if (background.image) {
        return `
          <defs>
            <clipPath id="bgClip">
              <rect width="${totalWidth}" height="${totalHeight}" rx="${borderRadius}"/>
            </clipPath>
          </defs>
          <image href="${background.image}" width="${totalWidth}" height="${totalHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#bgClip)"/>`;
      }
      return '';

    default:
      return '';
  }
}

/**
 * Downloads compare mode as SVG (creates a combined SVG)
 */
export function downloadCompareSvg(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  filename: string,
  options: Pick<CompareExportOptions, 'gap' | 'labelHeight' | 'labelColor' | 'labelFont' | 'labelAlignment' | 'background'>
): void {
  const {
    gap = 32,
    labelHeight = 40,
    labelColor = '#ffffff',
    labelFont = '600 16px system-ui',
    labelAlignment = 'left',
    background,
  } = options;

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const padding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const totalWidth = beforeDims.width + gap + afterDims.width + padding * 2;
  const totalHeight = maxHeight + labelHeight + padding * 2;

  // Parse the font to extract size
  const fontSizeMatch = labelFont.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? fontSizeMatch[1] : '16';

  // Calculate label positions based on alignment
  let beforeLabelX = padding;
  let afterLabelX = padding + beforeDims.width + gap;
  let textAnchor = 'start';

  if (labelAlignment === 'center') {
    beforeLabelX = padding + beforeDims.width / 2;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width / 2;
    textAnchor = 'middle';
  } else if (labelAlignment === 'right') {
    beforeLabelX = padding + beforeDims.width;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);

  // Create combined SVG
  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style>
      .label { font: ${labelFont}; fill: ${labelColor}; text-anchor: ${textAnchor}; }
    </style>
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${padding + parseInt(fontSize)}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${padding + parseInt(fontSize)}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${padding}, ${padding + labelHeight})">
    ${beforeSvg ? extractSvgContent(beforeSvg) : `<rect width="${beforeDims.width}" height="${beforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${padding + beforeDims.width + gap}, ${padding + labelHeight})">
    ${afterSvg ? extractSvgContent(afterSvg) : `<rect width="${afterDims.width}" height="${afterDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>
</svg>`;

  downloadSvg(combinedSvg, filename);
}

/**
 * Copy compare mode to clipboard as PNG
 */
export async function copyCompareToClipboard(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  options: CompareExportOptions
): Promise<void> {
  const {
    scale = 2,
    background,
    gap = 32,
    labelHeight = 40,
    labelColor = '#ffffff',
    labelFont = '600 16px system-ui, -apple-system, sans-serif',
    labelAlignment = 'left',
  } = options;

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const padding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const totalWidth = beforeDims.width + gap + afterDims.width + padding * 2;
  const totalHeight = maxHeight + labelHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  // Draw background
  if (background && background.type !== 'none') {
    await drawBackground(ctx, background, totalWidth, totalHeight);
  }

  // Draw labels with alignment
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'top';

  // Calculate label x positions based on alignment
  let beforeLabelX = padding;
  let afterLabelX = padding + beforeDims.width + gap;

  if (labelAlignment === 'center') {
    ctx.textAlign = 'center';
    beforeLabelX = padding + beforeDims.width / 2;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width / 2;
  } else if (labelAlignment === 'right') {
    ctx.textAlign = 'right';
    beforeLabelX = padding + beforeDims.width;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width;
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(beforeLabel, beforeLabelX, padding);
  ctx.fillText(afterLabel, afterLabelX, padding);

  // Reset text align for any future operations
  ctx.textAlign = 'left';

  // Draw before SVG
  if (beforeSvg) {
    const beforeImg = await loadSvgAsImage(beforeSvg);
    ctx.drawImage(beforeImg, padding, padding + labelHeight);
  }

  // Draw after SVG
  if (afterSvg) {
    const afterImg = await loadSvgAsImage(afterSvg);
    ctx.drawImage(afterImg, padding + beforeDims.width + gap, padding + labelHeight);
  }

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/png', 1.0)
  );

  if (!blob) {
    throw new Error('Failed to create PNG blob');
  }

  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
  } else {
    throw new Error('Clipboard API not supported');
  }
}

/**
 * Wraps an SVG with a background (for static SVG output)
 */
export function wrapSvgWithBackground(
  svgContent: string,
  background: BackgroundConfig
): string {
  if (background.type === 'none') {
    return svgContent;
  }

  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);
  const padding = background.padding ?? 0;
  const aspectRatio = background.imageAspectRatio ?? 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);
  const innerContent = extractSvgContent(svgContent);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  ${backgroundSvg}
  <g transform="translate(${offsetX}, ${offsetY})">
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${innerContent}
    </svg>
  </g>
</svg>`;
}

/**
 * Escapes XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extracts the inner content of an SVG (everything inside the <svg> tags)
 */
function extractSvgContent(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return '';
  return svg.innerHTML;
}
