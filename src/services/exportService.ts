import type { ExportFormat } from '@/types';

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
  const { scale = 2, quality = 1.0 } = options;
  const { width, height } = getSvgDimensions(svgContent);

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
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

/**
 * Copies image to clipboard as PNG
 */
export async function copyToClipboard(
  svgContent: string,
  scale: number = 2
): Promise<void> {
  const { width, height } = getSvgDimensions(svgContent);

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.scale(scale, scale);

  // Convert SVG to data URL for better browser compatibility
  const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      ctx.drawImage(img, 0, 0);

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
