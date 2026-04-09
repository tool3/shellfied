import type { ExportFormat, BackgroundConfig, CompareExportOptions, ImageAspectRatio } from '@/types';

// Cache for fetched font data - keyed by "fontFamily-weight"
const fontCache: Map<string, { data: string; family: string; format: string }> = new Map();

/**
 * Google Fonts API base URL for fetching font files
 */
const GOOGLE_FONTS_CSS_API = 'https://fonts.googleapis.com/css2';

/**
 * Map of supported Google Fonts to their font family names
 * Includes both label fonts and terminal/monospace fonts
 */
const SUPPORTED_GOOGLE_FONTS: Record<string, string> = {
  // Label fonts (sans-serif, serif)
  'Inter': 'Inter',
  'Roboto': 'Roboto',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Open Sans': 'Open+Sans',
  'Lato': 'Lato',
  'Oswald': 'Oswald',
  'Raleway': 'Raleway',
  'Nunito': 'Nunito',
  'Ubuntu': 'Ubuntu',
  'Rubik': 'Rubik',
  'Work Sans': 'Work+Sans',
  'Quicksand': 'Quicksand',
  'Bebas Neue': 'Bebas+Neue',
  'Playfair Display': 'Playfair+Display',
  'Merriweather': 'Merriweather',
  // Terminal/monospace fonts
  'JetBrains Mono': 'JetBrains+Mono',
  'Fira Code': 'Fira+Code',
  'Source Code Pro': 'Source+Code+Pro',
  'IBM Plex Mono': 'IBM+Plex+Mono',
  'Roboto Mono': 'Roboto+Mono',
  'Ubuntu Mono': 'Ubuntu+Mono',
  'Space Mono': 'Space+Mono',
};

/**
 * Extract primary font family name from a CSS font-family string
 */
function extractPrimaryFontFamily(fontFamily: string): string {
  // Handle formats like "Inter, sans-serif" or "'JetBrains Mono', monospace"
  const primary = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  return primary;
}

/**
 * Map of bundled font files available at /fonts/ (served from /public/fonts/)
 * These are fetched locally instead of from Google Fonts for reliability.
 */
const BUNDLED_FONTS: Record<string, Record<number, string>> = {
  'JetBrains Mono': {
    400: '/fonts/JetBrainsMono-Regular.ttf',
    500: '/fonts/JetBrainsMono-Medium.ttf',
    600: '/fonts/JetBrainsMono-SemiBold.ttf',
    700: '/fonts/JetBrainsMono-Bold.ttf',
  },
};

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fetch font from Google Fonts and return as base64 for embedding in SVG.
 * For bundled fonts (JetBrains Mono), fetches from local /fonts/ directory.
 * For Google Fonts, fetches the latin subset (last @font-face in CSS) which covers ASCII.
 * Returns null for system fonts.
 */
async function fetchGoogleFontAsBase64(fontFamily: string, weight: number): Promise<{ data: string; family: string; format: string } | null> {
  const primaryFont = extractPrimaryFontFamily(fontFamily);
  const cacheKey = `${primaryFont}-${weight}`;

  // Check cache first
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  // For bundled fonts, fetch from local /fonts/ directory (more reliable, no subset issues)
  const bundledPaths = BUNDLED_FONTS[primaryFont];
  if (bundledPaths) {
    const fontPath = bundledPaths[weight] || bundledPaths[400];
    if (fontPath) {
      try {
        const response = await fetch(fontPath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          const result = { data: base64, family: primaryFont, format: 'truetype' };
          fontCache.set(cacheKey, result);
          return result;
        }
      } catch {
        // Fall through to Google Fonts
      }
    }
  }

  // Check if it's a supported Google Font
  const googleFontName = SUPPORTED_GOOGLE_FONTS[primaryFont];
  if (!googleFontName) {
    return null;
  }

  try {
    // Fetch CSS from Google Fonts API
    const cssUrl = `${GOOGLE_FONTS_CSS_API}?family=${googleFontName}:wght@${weight}&display=swap`;
    const cssResponse = await fetch(cssUrl);

    if (!cssResponse.ok) {
      return null;
    }

    const cssText = await cssResponse.text();

    // Google Fonts returns multiple @font-face blocks for different unicode subsets.
    // The LAST block is typically the latin subset which covers ASCII characters
    // needed for code. We use matchAll to get all URLs and pick the last one.
    let fontUrl: string | undefined;
    let format = 'woff2';

    const woff2Matches = [...cssText.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/g)];
    if (woff2Matches.length > 0) {
      fontUrl = woff2Matches[woff2Matches.length - 1][1]; // Last = latin subset
      format = 'woff2';
    } else {
      const woffMatches = [...cssText.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"]woff['"]\)/g)];
      if (woffMatches.length > 0) {
        fontUrl = woffMatches[woffMatches.length - 1][1];
        format = 'woff';
      } else {
        const ttfMatches = [...cssText.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"]truetype['"]\)/g)];
        if (ttfMatches.length > 0) {
          fontUrl = ttfMatches[ttfMatches.length - 1][1];
          format = 'truetype';
        }
      }
    }

    if (!fontUrl) {
      return null;
    }

    // Fetch the actual font file
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      return null;
    }

    const arrayBuffer = await fontResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    const result = { data: base64, family: primaryFont, format };
    fontCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Embeds a font into an existing SVG by adding @font-face to the style section.
 * Extracts the font-family from the SVG and fetches/embeds it if it's a Google Font.
 */
export async function embedFontInSvg(svgContent: string, fontFamily: string): Promise<string> {
  const primaryFont = extractPrimaryFontFamily(fontFamily);

  // Check if it's a Google Font we can embed
  if (!SUPPORTED_GOOGLE_FONTS[primaryFont]) {
    console.log(`[embedFontInSvg] Font "${primaryFont}" is not a Google Font - returning SVG as-is`);
    return svgContent;
  }

  // Fetch the font (use weight 400 as base, shellfie uses normal weight)
  const fontResult = await fetchGoogleFontAsBase64(fontFamily, 400);
  if (!fontResult) {
    console.log(`[embedFontInSvg] Could not fetch font "${primaryFont}" - returning SVG as-is`);
    return svgContent;
  }

  // Create @font-face rule using the actual format from the fetch
  const mimeType = fontResult.format === 'truetype' ? 'font/ttf' : `font/${fontResult.format}`;
  const formatStr = fontResult.format === 'truetype' ? 'truetype' : fontResult.format;
  const fontFaceRule = `@font-face { font-family: '${fontResult.family}'; src: url('data:${mimeType};base64,${fontResult.data}') format('${formatStr}'); font-weight: normal; }`;

  // Check if SVG already has a <style> element inside <defs>
  const hasDefsStyle = /<defs[^>]*>[\s\S]*?<style/i.test(svgContent);
  const hasDefs = /<defs[^>]*>/i.test(svgContent);

  if (hasDefsStyle) {
    // Insert font-face at the beginning of existing style content
    return svgContent.replace(
      /(<style[^>]*><!\[CDATA\[)/i,
      `$1\n      ${fontFaceRule}\n`
    );
  } else if (hasDefs) {
    // Add style element inside existing defs
    return svgContent.replace(
      /(<defs[^>]*>)/i,
      `$1\n    <style><![CDATA[\n      ${fontFaceRule}\n    ]]></style>`
    );
  } else {
    // Add defs with style after opening svg tag
    return svgContent.replace(
      /(<svg[^>]*>)/i,
      `$1\n  <defs>\n    <style><![CDATA[\n      ${fontFaceRule}\n    ]]></style>\n  </defs>`
    );
  }
}

/**
 * Calculate dimensions with aspect ratio constraint for image backgrounds
 * Content is always centered within the expanded dimensions
 */
function calculateAspectRatioDimensions(
  contentWidth: number,
  contentHeight: number,
  aspectRatio: ImageAspectRatio,
  padding: number
): { totalWidth: number; totalHeight: number; offsetX: number; offsetY: number } {
  const baseWidth = contentWidth + padding * 2;
  const baseHeight = contentHeight + padding * 2;

  // Handle auto or invalid aspect ratio
  if (!aspectRatio || aspectRatio === 'auto') {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }

  // Validate aspect ratio format
  if (!aspectRatio.includes(':')) {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
  }

  // Parse aspect ratio string (e.g., "16:9" -> 16/9)
  const [w, h] = aspectRatio.split(':').map(Number);

  // Validate parsed values
  if (!w || !h || isNaN(w) || isNaN(h)) {
    return { totalWidth: baseWidth, totalHeight: baseHeight, offsetX: padding, offsetY: padding };
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
  const offsetX = (totalWidth - contentWidth) / 2;
  const offsetY = (totalHeight - contentHeight) / 2;

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
 * Map font family to Google Fonts URL for preloading
 */
const GOOGLE_FONTS: Record<string, string> = {
  'Inter': 'Inter',
  'Roboto': 'Roboto',
  'Poppins': 'Poppins',
  'Montserrat': 'Montserrat',
  'Open Sans': 'Open Sans',
  'Lato': 'Lato',
  'Oswald': 'Oswald',
  'Raleway': 'Raleway',
  'Nunito': 'Nunito',
  'Ubuntu': 'Ubuntu',
  'Rubik': 'Rubik',
  'Work Sans': 'Work Sans',
  'Quicksand': 'Quicksand',
  'Bebas Neue': 'Bebas Neue',
  'Playfair Display': 'Playfair Display',
  'Merriweather': 'Merriweather',
  'JetBrains Mono': 'JetBrains Mono',
};

/**
 * Preload a font for Canvas rendering using CSS Font Loading API.
 * Uses cached base64 font data from fetchGoogleFontAsBase64 when available
 * (already fetched during embedFontInSvg), falling back to stylesheet loading.
 */
async function preloadFont(fontString: string): Promise<void> {
  // Validate fontString - must have format "weight size family, fallback"
  // e.g., "600 16px Inter, sans-serif"
  if (!fontString || fontString.includes('undefined')) {
    return;
  }

  // Parse the font string to extract family
  const fontFamilyPart = fontString.includes('px ')
    ? fontString.split('px ')[1]
    : fontString;
  const primaryFont = fontFamilyPart?.split(',')[0]?.trim()?.replace(/['"]/g, '');

  // Check if it's a Google Font
  if (!primaryFont || !GOOGLE_FONTS[primaryFont]) {
    return; // System font or invalid, no need to preload
  }

  // Check if font is already loaded
  try {
    if (document.fonts.check(fontString)) {
      return;
    }
  } catch {
    return;
  }

  // Parse weight from font string
  const weightMatch = fontString.match(/^(\d+)\s/);
  const weight = weightMatch ? weightMatch[1] : '400';

  // Try using cached font data from fetchGoogleFontAsBase64 (already fetched during
  // embedFontInSvg earlier in the export flow). This is instant and reliable.
  const cacheKey = `${primaryFont}-${parseInt(weight)}`;
  const cached = fontCache.get(cacheKey);
  if (cached) {
    try {
      const mimeType = cached.format === 'truetype' ? 'font/ttf' : `font/${cached.format}`;
      const fontFace = new FontFace(
        primaryFont,
        `url('data:${mimeType};base64,${cached.data}')`,
        { weight }
      );
      await fontFace.load();
      document.fonts.add(fontFace);
      await document.fonts.ready;
      return;
    } catch {
      // Fall through to stylesheet loading
    }
  }

  // Fallback: fetch font and register, or load via stylesheet
  try {
    const fontResult = await fetchGoogleFontAsBase64(primaryFont, parseInt(weight));
    if (fontResult) {
      const mimeType = fontResult.format === 'truetype' ? 'font/ttf' : `font/${fontResult.format}`;
      const fontFace = new FontFace(
        primaryFont,
        `url('data:${mimeType};base64,${fontResult.data}')`,
        { weight }
      );
      await fontFace.load();
      document.fonts.add(fontFace);
      await document.fonts.ready;
      return;
    }
  } catch {
    // Fall through to stylesheet
  }

  // Last resort: stylesheet loading
  await loadFontViaStylesheet(primaryFont, weight);
}

/**
 * Load font via dynamically injected stylesheet link
 */
async function loadFontViaStylesheet(fontFamily: string, weight: string): Promise<void> {
  const fontName = fontFamily.replace(/\s+/g, '+');
  const linkId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;

  // Check if already loaded
  if (document.getElementById(linkId)) {
    await document.fonts.ready;
    return;
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}&display=swap`;
    link.onload = async () => {
      await document.fonts.ready;
      resolve();
    };
    link.onerror = () => resolve(); // Don't fail, just use fallback font
    document.head.appendChild(link);

    // Timeout fallback
    setTimeout(resolve, 2000);
  });
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
      // Only set crossOrigin for non-data URLs to avoid CORS issues with data URLs
      if (!background.image.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

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

      // Save context state before clipping
      ctx.save();
      // Clip to rounded rectangle
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 12);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      // Restore context to remove clip path for subsequent operations
      ctx.restore();
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
  console.log('[downloadRaster] called with format:', format, 'background:', options.background?.type);

  const { scale = 2, quality = 1.0, background } = options;

  // Get SVG dimensions from the SVG's declared width/height or viewBox
  // This ensures export matches the actual SVG dimensions
  const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgContent);

  console.log('[downloadRaster] SVG dimensions:', svgWidth, 'x', svgHeight);
  console.log('[downloadRaster] aspectRatio:', background?.imageAspectRatio, 'padding:', background?.padding);

  // Calculate total dimensions including background padding and aspect ratio
  const padding = background?.type !== 'none' ? (background?.padding ?? 0) : 0;
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';

  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    svgWidth,
    svgHeight,
    aspectRatio,
    padding
  );

  console.log('[downloadRaster] Calculated canvas:', { totalWidth, totalHeight, offsetX, offsetY, scale });

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
 * Converts compare mode SVGs to a raster blob (for static image serving)
 */
export async function compareToRasterBlob(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  format: Exclude<ExportFormat, 'svg'>,
  options: CompareExportOptions
): Promise<Blob> {
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

  // Preload font before drawing to ensure it's available for Canvas
  await preloadFont(labelFont);

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final canvas dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

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

  // Draw labels with alignment - offset by aspect ratio centering
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'top';

  // Calculate label x positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;

  if (labelAlignment === 'center') {
    ctx.textAlign = 'center';
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
  } else if (labelAlignment === 'right') {
    ctx.textAlign = 'right';
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(beforeLabel, beforeLabelX, offsetY);
  ctx.fillText(afterLabel, afterLabelX, offsetY);

  // Reset text align for any future operations
  ctx.textAlign = 'left';

  // Draw before SVG - offset by aspect ratio centering
  if (beforeSvg) {
    const beforeImg = await loadSvgAsImage(beforeSvg);
    ctx.drawImage(beforeImg, offsetX, offsetY + labelHeight);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(offsetX, offsetY + labelHeight, beforeDims.width, beforeDims.height);
  }

  // Draw after SVG - offset by aspect ratio centering
  if (afterSvg) {
    const afterImg = await loadSvgAsImage(afterSvg);
    ctx.drawImage(afterImg, offsetX + beforeDims.width + gap, offsetY + labelHeight);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(offsetX + beforeDims.width + gap, offsetY + labelHeight, afterDims.width, afterDims.height);
  }

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
 * Creates a combined compare mode SVG string (sync version for static serving)
 * Note: This uses Google Fonts import instead of embedded fonts for performance
 */
export function createCompareSvg(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  options: Pick<CompareExportOptions, 'gap' | 'labelHeight' | 'labelColor' | 'labelFont' | 'labelAlignment' | 'background'>
): string {
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

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

  // Parse the font to extract size and weight
  const fontSizeMatch = labelFont.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? fontSizeMatch[1] : '16';
  const fontWeightMatch = labelFont.match(/^(\d+)\s/);
  const fontWeight = fontWeightMatch ? fontWeightMatch[1] : '600';

  // Calculate label positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;
  let textAnchor = 'start';

  if (labelAlignment === 'center') {
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
    textAnchor = 'middle';
  } else if (labelAlignment === 'right') {
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);

  // Get font import URL if using a Google Font
  const fontImportUrl = getFontImportUrl(labelFont);
  const fontImportStyle = fontImportUrl
    ? `@import url('${fontImportUrl}');`
    : '';

  // Extract existing defs from inner SVGs (for fonts, etc.)
  const beforeDefs = beforeSvg ? (beforeSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';
  const afterDefs = afterSvg ? (afterSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';

  // Create combined SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style><![CDATA[
      ${fontImportStyle}
      .label {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        fill: ${labelColor};
        text-anchor: ${textAnchor};
      }
    ]]></style>
    ${beforeDefs}
    ${afterDefs}
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${offsetX}, ${offsetY + labelHeight})">
    ${beforeSvg ? extractSvgContent(beforeSvg) : `<rect width="${beforeDims.width}" height="${beforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${offsetX + beforeDims.width + gap}, ${offsetY + labelHeight})">
    ${afterSvg ? extractSvgContent(afterSvg) : `<rect width="${afterDims.width}" height="${afterDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>
</svg>`;
}

/**
 * Creates a combined compare mode SVG string with embedded fonts (async version)
 * This version embeds fonts as base64 for portable SVGs that work offline
 */
export async function createCompareSvgWithEmbeddedFonts(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  options: Pick<CompareExportOptions, 'gap' | 'labelHeight' | 'labelColor' | 'labelFont' | 'labelAlignment' | 'background'>
): Promise<string> {
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

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

  // Parse the font to extract size, weight, and family
  const fontSizeMatch = labelFont.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? fontSizeMatch[1] : '16';
  const fontWeightMatch = labelFont.match(/^(\d+)\s/);
  const fontWeight = fontWeightMatch ? fontWeightMatch[1] : '600';
  // Extract font family from shorthand like "600 16px Inter, sans-serif"
  const fontFamilyMatch = labelFont.match(/\d+px\s+(.+)$/);
  const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'system-ui, -apple-system, sans-serif';

  // Calculate label positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;
  let textAnchor = 'start';

  if (labelAlignment === 'center') {
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
    textAnchor = 'middle';
  } else if (labelAlignment === 'right') {
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);

  // Fetch and embed the user's selected font for SVG
  let fontFaceStyle = '';
  let effectiveFontFamily = fontFamily;
  try {
    const fontResult = await fetchGoogleFontAsBase64(fontFamily, parseInt(fontWeight));
    if (fontResult) {
      const fmtMime = fontResult.format === 'truetype' ? 'font/ttf' : `font/${fontResult.format}`;
      const fmtStr = fontResult.format === 'truetype' ? 'truetype' : fontResult.format;
      fontFaceStyle = `@font-face { font-family: '${fontResult.family}'; src: url('data:${fmtMime};base64,${fontResult.data}') format('${fmtStr}'); font-weight: ${fontWeight}; }`;
      effectiveFontFamily = `'${fontResult.family}', ${fontFamily}`;
    }
  } catch (e) {
    console.warn('Could not embed font:', e);
  }

  // Extract existing defs from inner SVGs (for fonts, etc.)
  const beforeDefs = beforeSvg ? (beforeSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';
  const afterDefs = afterSvg ? (afterSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';

  // Create combined SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style><![CDATA[
      ${fontFaceStyle}
      .label {
        font-family: ${effectiveFontFamily};
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        fill: ${labelColor};
        text-anchor: ${textAnchor};
      }
    ]]></style>
    ${beforeDefs}
    ${afterDefs}
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${offsetX}, ${offsetY + labelHeight})">
    ${beforeSvg ? extractSvgContent(beforeSvg) : `<rect width="${beforeDims.width}" height="${beforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${offsetX + beforeDims.width + gap}, ${offsetY + labelHeight})">
    ${afterSvg ? extractSvgContent(afterSvg) : `<rect width="${afterDims.width}" height="${afterDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>
</svg>`;
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

  console.log('[downloadCompareRaster] called with background:', background?.type, 'aspectRatio:', background?.imageAspectRatio, 'padding:', background?.padding);

  // Preload font before drawing to ensure it's available for Canvas
  await preloadFont(labelFont);

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  console.log('[downloadCompareRaster] beforeDims:', beforeDims, 'afterDims:', afterDims, 'gap:', gap, 'labelHeight:', labelHeight);

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final canvas dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

  console.log('[downloadCompareRaster] basePadding:', basePadding, 'contentWidth:', contentWidth, 'contentHeight:', contentHeight);
  console.log('[downloadCompareRaster] totalWidth:', totalWidth, 'totalHeight:', totalHeight, 'offsetX:', offsetX, 'offsetY:', offsetY);

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

  // Draw labels with alignment - offset by aspect ratio centering
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'top';

  // Calculate label x positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;

  if (labelAlignment === 'center') {
    ctx.textAlign = 'center';
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
  } else if (labelAlignment === 'right') {
    ctx.textAlign = 'right';
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(beforeLabel, beforeLabelX, offsetY);
  ctx.fillText(afterLabel, afterLabelX, offsetY);

  // Reset text align for any future operations
  ctx.textAlign = 'left';

  // Draw before SVG - offset by aspect ratio centering
  if (beforeSvg) {
    const beforeImg = await loadSvgAsImage(beforeSvg);
    ctx.drawImage(beforeImg, offsetX, offsetY + labelHeight);
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(offsetX, offsetY + labelHeight, beforeDims.width, beforeDims.height);
  }

  // Draw after SVG - offset by aspect ratio centering
  if (afterSvg) {
    const afterImg = await loadSvgAsImage(afterSvg);
    ctx.drawImage(afterImg, offsetX + beforeDims.width + gap, offsetY + labelHeight);
  } else {
    // Draw placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(offsetX + beforeDims.width + gap, offsetY + labelHeight, afterDims.width, afterDims.height);
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
        // Calculate radius to match CSS radial-gradient(circle, ...) behavior
        // CSS circle gradient extends to the farthest corner, but for simple 50% 50% position
        // it creates a circle that touches the nearest edge and extends beyond
        // We use a large enough radius to cover the entire rectangle
        const radius = Math.max(totalWidth, totalHeight);
        const cx = totalWidth / 2;
        const cy = totalHeight / 2;
        return `
          <defs>
            <radialGradient id="bgGradient" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${radius / 2}" fx="${cx}" fy="${cy}">
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
export async function downloadCompareSvg(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  filename: string,
  options: Pick<CompareExportOptions, 'gap' | 'labelHeight' | 'labelColor' | 'labelFont' | 'labelAlignment' | 'background'>
): Promise<void> {
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

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

  // Parse the font to extract size, weight, and family
  const fontSizeMatch = labelFont.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? fontSizeMatch[1] : '16';
  const fontWeightMatch = labelFont.match(/^(\d+)\s/);
  const fontWeight = fontWeightMatch ? fontWeightMatch[1] : '600';
  // Extract font family from shorthand like "600 16px Inter, sans-serif"
  const fontFamilyMatch = labelFont.match(/\d+px\s+(.+)$/);
  const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'system-ui, -apple-system, sans-serif';

  // Calculate label positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;
  let textAnchor = 'start';

  if (labelAlignment === 'center') {
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
    textAnchor = 'middle';
  } else if (labelAlignment === 'right') {
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);

  // Fetch and embed the user's selected font for SVG
  let fontFaceStyle = '';
  let effectiveFontFamily = fontFamily;
  try {
    const fontResult = await fetchGoogleFontAsBase64(fontFamily, parseInt(fontWeight));
    if (fontResult) {
      const fmtMime = fontResult.format === 'truetype' ? 'font/ttf' : `font/${fontResult.format}`;
      const fmtStr = fontResult.format === 'truetype' ? 'truetype' : fontResult.format;
      fontFaceStyle = `@font-face { font-family: '${fontResult.family}'; src: url('data:${fmtMime};base64,${fontResult.data}') format('${fmtStr}'); font-weight: ${fontWeight}; }`;
      effectiveFontFamily = `'${fontResult.family}', ${fontFamily}`;
    }
  } catch (e) {
    console.warn('Could not embed font:', e);
  }

  // Extract existing defs from inner SVGs (for fonts, etc.)
  const beforeDefs = beforeSvg ? (beforeSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';
  const afterDefs = afterSvg ? (afterSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i)?.[1] || '') : '';

  // Create combined SVG
  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style><![CDATA[
      ${fontFaceStyle}
      .label {
        font-family: ${effectiveFontFamily};
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        fill: ${labelColor};
        text-anchor: ${textAnchor};
      }
    ]]></style>
    ${beforeDefs}
    ${afterDefs}
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${offsetY + parseInt(fontSize)}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${offsetX}, ${offsetY + labelHeight})">
    ${beforeSvg ? extractSvgContent(beforeSvg) : `<rect width="${beforeDims.width}" height="${beforeDims.height}" fill="rgba(255,255,255,0.1)"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${offsetX + beforeDims.width + gap}, ${offsetY + labelHeight})">
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

  // Preload font before drawing to ensure it's available for Canvas
  await preloadFont(labelFont);

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  // Calculate base content dimensions (before aspect ratio adjustment)
  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const basePadding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;
  const contentWidth = beforeDims.width + gap + afterDims.width;
  const contentHeight = maxHeight + labelHeight;

  // Apply aspect ratio to get final canvas dimensions
  const aspectRatio = background?.type !== 'none' ? (background?.imageAspectRatio ?? 'auto') : 'auto';
  const { totalWidth, totalHeight, offsetX, offsetY } = calculateAspectRatioDimensions(
    contentWidth,
    contentHeight,
    aspectRatio,
    basePadding
  );

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

  // Draw labels with alignment - offset by aspect ratio centering
  ctx.font = labelFont;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'top';

  // Calculate label x positions based on alignment (using offset for centering)
  let beforeLabelX = offsetX;
  let afterLabelX = offsetX + beforeDims.width + gap;

  if (labelAlignment === 'center') {
    ctx.textAlign = 'center';
    beforeLabelX = offsetX + beforeDims.width / 2;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width / 2;
  } else if (labelAlignment === 'right') {
    ctx.textAlign = 'right';
    beforeLabelX = offsetX + beforeDims.width;
    afterLabelX = offsetX + beforeDims.width + gap + afterDims.width;
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(beforeLabel, beforeLabelX, offsetY);
  ctx.fillText(afterLabel, afterLabelX, offsetY);

  // Reset text align for any future operations
  ctx.textAlign = 'left';

  // Draw before SVG - offset by aspect ratio centering
  if (beforeSvg) {
    const beforeImg = await loadSvgAsImage(beforeSvg);
    ctx.drawImage(beforeImg, offsetX, offsetY + labelHeight);
  }

  // Draw after SVG - offset by aspect ratio centering
  if (afterSvg) {
    const afterImg = await loadSvgAsImage(afterSvg);
    ctx.drawImage(afterImg, offsetX + beforeDims.width + gap, offsetY + labelHeight);
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

  // Extract any existing defs (fonts, etc.) from the inner SVG
  const defsMatch = svgContent.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i);
  const existingDefs = defsMatch ? defsMatch[1] : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>${existingDefs}</defs>
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
 * Map font family to Google Fonts URL for embedding in SVG
 */
function getFontImportUrl(fontFamily: string): string | null {
  const fontMap: Record<string, string> = {
    'Inter': 'Inter:wght@400;500;600;700',
    'Roboto': 'Roboto:wght@400;500;700',
    'Poppins': 'Poppins:wght@400;500;600;700',
    'Montserrat': 'Montserrat:wght@400;500;600;700',
    'Open Sans': 'Open+Sans:wght@400;500;600;700',
    'Lato': 'Lato:wght@400;700',
    'Oswald': 'Oswald:wght@400;500;600;700',
    'Raleway': 'Raleway:wght@400;500;600;700',
    'Nunito': 'Nunito:wght@400;500;600;700',
    'Ubuntu': 'Ubuntu:wght@400;500;700',
    'Rubik': 'Rubik:wght@400;500;600;700',
    'Work Sans': 'Work+Sans:wght@400;500;600;700',
    'Quicksand': 'Quicksand:wght@400;500;600;700',
    'Bebas Neue': 'Bebas+Neue',
    'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
    'Merriweather': 'Merriweather:wght@400;700',
    'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
  };

  // Extract the primary font name from the font-family or font shorthand string
  // Handle both "Inter, sans-serif" and "600 16px Inter, sans-serif"
  const fontFamilyPart = fontFamily.includes('px ')
    ? fontFamily.split('px ')[1]
    : fontFamily;
  const primaryFont = fontFamilyPart.split(',')[0].trim().replace(/['"]/g, '');

  if (fontMap[primaryFont]) {
    // Use &amp; for XML/SVG compatibility
    return `https://fonts.googleapis.com/css2?family=${fontMap[primaryFont]}&amp;display=swap`;
  }
  return null;
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
