/**
 * API Route: /api/image
 *
 * Generates static images from URL parameters.
 * This enables embedding shellfied images directly in markdown, GitHub READMEs, etc.
 *
 * Usage:
 *   /api/image?d=<lz-compressed-data>
 *   /api/image?c=<base64-content>&tp=macos&th=dracula
 *
 * Parameters:
 *   - d: LZ-compressed state data (new format)
 *   - o: Output format (svg, png, webp, jpeg) - defaults to svg
 *   - c (content): Base64-encoded code content (legacy format)
 *   - All other URL parameters from urlParams.ts are supported
 *
 * Supported formats:
 *   - SVG: Vector format, scalable, best for web embedding
 *   - PNG: Raster format with transparency, good for general use
 *   - WebP: Modern raster format, smaller file size
 *   - JPEG: Raster format, no transparency, smaller file size
 */

import { NextRequest, NextResponse } from 'next/server';
import LZString from 'lz-string';
import sharp from 'sharp';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { generateSvg, generateCompareSvg, wrapSvgWithBackground } from '@/lib/generateSvg';
import { DEFAULT_BACKGROUND, DEFAULT_SETTINGS, DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_WATERMARK, DEFAULT_COMPARE_LABEL_CONFIG } from '@/constants/defaults';
import type { TemplateType, ControlsPosition, PaddingTuple, BackgroundType, GradientDirection, ImageAspectRatio, CompareLabelAlignment } from '@/types';

// Track WASM initialization
let wasmInitialized = false;

// Initialize resvg WASM
async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return;

  try {
    // Initialize with WASM binary from node_modules
    const wasmPath = join(process.cwd(), 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm');
    const wasmBuffer = await readFile(wasmPath);
    await initWasm(wasmBuffer);
    wasmInitialized = true;
  } catch (error) {
    // May already be initialized
    if (error instanceof Error && error.message.includes('Already initialized')) {
      wasmInitialized = true;
    } else {
      throw error;
    }
  }
}

// Load font for resvg
async function loadFontBuffer(): Promise<Buffer> {
  const fontPath = join(process.cwd(), 'public', 'fonts', 'JetBrainsMono-Regular.ttf');
  return readFile(fontPath);
}

// Output format type
type OutputFormat = 'svg' | 'png' | 'webp' | 'jpeg';

// Convert SVG to raster format using resvg-wasm (proper font support) + sharp (format conversion)
async function svgToRaster(
  svg: string,
  format: Exclude<OutputFormat, 'svg'>,
  scale: number = 2,
  quality: number = 90
): Promise<Buffer> {
  // Initialize WASM if needed
  await ensureWasmInitialized();

  // Load font for proper text rendering
  const fontBuffer = await loadFontBuffer();

  // Use resvg for SVG to PNG conversion (handles embedded fonts properly)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'zoom', value: scale },
    font: {
      fontBuffers: [fontBuffer],
      loadSystemFonts: false,
      defaultFontFamily: 'JetBrains Mono',
    },
  });

  const pngData = resvg.render();
  const pngBuffer = Buffer.from(pngData.asPng());

  // If PNG is requested, return directly
  if (format === 'png') {
    return pngBuffer;
  }

  // Use sharp for format conversion (webp, jpeg)
  let pipeline = sharp(pngBuffer);

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
  }

  return pipeline.toBuffer();
}

// Get content type for format
function getContentType(format: OutputFormat): string {
  switch (format) {
    case 'svg': return 'image/svg+xml';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'jpeg': return 'image/jpeg';
  }
}

// Compact state interface (matching urlParams.ts)
interface CompactState {
  o?: string; // output format (svg, png, webp, jpeg) - only SVG supported server-side
  c?: string; // content
  tp?: string; // template
  th?: string; // terminalTheme
  fs?: number; // fontSize
  lh?: number; // lineHeight
  pd?: PaddingTuple; // padding
  ti?: string; // title
  sc?: boolean; // showControls
  cp?: string; // controlsPosition
  br?: number; // borderRadius
  wd?: number | null; // width
  ff?: string; // fontFamily
  lg?: string; // language
  // Compare mode
  cmp?: boolean; // compareMode
  bc?: string; // beforeContent
  ac?: string; // afterContent
  bl?: string; // beforeLabel
  al?: string; // afterLabel
  bti?: string; // beforeTitle
  ati?: string; // afterTitle
  blg?: string; // beforeLanguage
  alg?: string; // afterLanguage
  clf?: number; // compareLabelFontSize
  clff?: string; // compareLabelFontFamily
  clfw?: number; // compareLabelFontWeight
  clc?: string; // compareLabelColor
  cla?: string; // compareLabelAlignment
  // Watermark
  wt?: string; // watermarkType
  wtx?: string; // watermarkText
  wst?: string; // watermarkStyle
  wmk?: string; // watermarkMarkup
  // Header
  he?: boolean; // headerEnabled
  hbg?: string; // headerBgColor
  hh?: number; // headerHeight
  hbd?: boolean; // headerBorder
  hbc?: string; // headerBorderColor
  hbw?: number; // headerBorderWidth
  // Footer
  fe?: boolean; // footerEnabled
  fbg?: string; // footerBgColor
  fh?: number; // footerHeight
  fbd?: boolean; // footerBorder
  fbc?: string; // footerBorderColor
  fbw?: number; // footerBorderWidth
  // Background
  bt?: string; // bgType
  bgc?: string; // bgColor
  bgf?: string; // bgGradientFrom
  bgt?: string; // bgGradientTo
  bgd?: string; // bgGradientDirection
  bgp?: number; // bgPadding
  bga?: string; // bgImageAspectRatio
}

// Decompress LZ-string data
function decompressLZData(compressed: string): CompactState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as CompactState;
  } catch {
    return null;
  }
}

// URL parameter short names (matching urlParams.ts)
const URL_PARAM_MAP = {
  content: 'c',
  language: 'lg',
  template: 'tp',
  terminalTheme: 'th',
  fontSize: 'fs',
  lineHeight: 'lh',
  padding: 'pd',
  title: 'ti',
  showControls: 'sc',
  controlsPosition: 'cp',
  borderRadius: 'br',
  width: 'wd',
  fontFamily: 'ff',
  watermarkType: 'wt',
  watermarkText: 'wtx',
  watermarkStyle: 'wst',
  watermarkMarkup: 'wmk',
  headerEnabled: 'he',
  headerBgColor: 'hbg',
  headerHeight: 'hh',
  headerBorder: 'hbd',
  headerBorderColor: 'hbc',
  headerBorderWidth: 'hbw',
  footerEnabled: 'fe',
  footerBgColor: 'fbg',
  footerHeight: 'fh',
  footerBorder: 'fbd',
  footerBorderColor: 'fbc',
  footerBorderWidth: 'fbw',
  bgType: 'bt',
  bgColor: 'bgc',
  bgGradientFrom: 'bgf',
  bgGradientTo: 'bgt',
  bgGradientDirection: 'bgd',
  bgPadding: 'bgp',
  bgImageAspectRatio: 'bga',
} as const;

// URL-safe Base64 decoding
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

// Decode padding tuple
function decodePadding(str: string): PaddingTuple | null {
  const parts = str.split(',').map(Number);
  if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0)) {
    return parts as PaddingTuple;
  }
  return null;
}

// Decode boolean
function decodeBool(str: string | null, defaultValue: boolean = false): boolean {
  if (str === '1') return true;
  if (str === '0') return false;
  return defaultValue;
}

// Get param value (check both short and full names)
function getParam(params: URLSearchParams, key: keyof typeof URL_PARAM_MAP): string | null {
  return params.get(URL_PARAM_MAP[key]) ?? params.get(key);
}

// Parse compressed state into generation options
function parseCompressedState(compact: CompactState) {
  return {
    content: compact.c || '',
    language: compact.lg || 'auto',
    template: (compact.tp || DEFAULT_SETTINGS.template) as TemplateType,
    terminalTheme: compact.th || DEFAULT_SETTINGS.terminalTheme,
    fontSize: compact.fs ?? DEFAULT_SETTINGS.fontSize,
    lineHeight: compact.lh ?? DEFAULT_SETTINGS.lineHeight,
    padding: compact.pd || DEFAULT_SETTINGS.padding,
    title: compact.ti ?? DEFAULT_SETTINGS.title,
    showControls: compact.sc ?? DEFAULT_SETTINGS.showControls,
    controlsPosition: (compact.cp || DEFAULT_SETTINGS.controlsPosition) as ControlsPosition,
    borderRadius: compact.br ?? DEFAULT_SETTINGS.borderRadius,
    width: compact.wd ?? DEFAULT_SETTINGS.width,
    fontFamily: compact.ff || DEFAULT_SETTINGS.fontFamily,
    // Compare mode
    compareMode: compact.cmp ?? false,
    beforeContent: compact.bc || '',
    afterContent: compact.ac || '',
    beforeLabel: compact.bl || 'Before',
    afterLabel: compact.al || 'After',
    beforeTitle: compact.bti || DEFAULT_SETTINGS.title,
    afterTitle: compact.ati || DEFAULT_SETTINGS.title,
    beforeLanguage: compact.blg || 'auto',
    afterLanguage: compact.alg || 'auto',
    compareLabelConfig: {
      fontSize: compact.clf ?? DEFAULT_COMPARE_LABEL_CONFIG.fontSize,
      fontFamily: compact.clff || DEFAULT_COMPARE_LABEL_CONFIG.fontFamily,
      fontWeight: compact.clfw ?? DEFAULT_COMPARE_LABEL_CONFIG.fontWeight,
      color: compact.clc || DEFAULT_COMPARE_LABEL_CONFIG.color,
      alignment: (compact.cla || DEFAULT_COMPARE_LABEL_CONFIG.alignment) as CompareLabelAlignment,
    },
    watermark: (compact.wt || compact.wtx || compact.wmk) ? {
      type: (compact.wt || 'text') as 'text' | 'markup',
      text: compact.wtx || '',
      style: compact.wst || DEFAULT_WATERMARK.style,
      markup: compact.wmk || '',
    } : undefined,
    header: compact.he ? {
      enabled: true,
      backgroundColor: compact.hbg || '',
      height: compact.hh ?? DEFAULT_HEADER.height,
      border: compact.hbd ?? false,
      borderColor: compact.hbc || DEFAULT_HEADER.borderColor,
      borderWidth: compact.hbw ?? DEFAULT_HEADER.borderWidth,
    } : undefined,
    footer: compact.fe ? {
      enabled: true,
      backgroundColor: compact.fbg || '',
      height: compact.fh ?? DEFAULT_FOOTER.height,
      border: compact.fbd ?? false,
      borderColor: compact.fbc || DEFAULT_FOOTER.borderColor,
      borderWidth: compact.fbw ?? DEFAULT_FOOTER.borderWidth,
    } : undefined,
    background: {
      type: (compact.bt || 'none') as BackgroundType,
      color: compact.bgc || DEFAULT_BACKGROUND.color,
      gradientFrom: compact.bgf || DEFAULT_BACKGROUND.gradientFrom,
      gradientTo: compact.bgt || DEFAULT_BACKGROUND.gradientTo,
      gradientDirection: (compact.bgd || DEFAULT_BACKGROUND.gradientDirection) as GradientDirection,
      padding: compact.bgp ?? DEFAULT_BACKGROUND.padding,
      imageAspectRatio: (compact.bga || DEFAULT_BACKGROUND.imageAspectRatio) as ImageAspectRatio,
      image: null,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Check for LZ-compressed data first
  const compressedData = searchParams.get('d');
  if (compressedData) {
    const compact = decompressLZData(compressedData);
    if (compact) {
      const opts = parseCompressedState(compact);

      try {
        let svg: string;

        // Handle compare mode
        if (opts.compareMode) {
          if (!opts.beforeContent && !opts.afterContent) {
            return new NextResponse('Missing content in compare mode', { status: 400 });
          }

          svg = generateCompareSvg({
            beforeContent: opts.beforeContent,
            afterContent: opts.afterContent,
            beforeLabel: opts.beforeLabel,
            afterLabel: opts.afterLabel,
            beforeTitle: opts.beforeTitle,
            afterTitle: opts.afterTitle,
            beforeLanguage: opts.beforeLanguage,
            afterLanguage: opts.afterLanguage,
            compareLabelConfig: opts.compareLabelConfig,
            template: opts.template,
            terminalTheme: opts.terminalTheme,
            fontSize: opts.fontSize,
            lineHeight: opts.lineHeight,
            padding: opts.padding as PaddingTuple,
            showControls: opts.showControls,
            controlsPosition: opts.controlsPosition,
            borderRadius: opts.borderRadius,
            fontFamily: opts.fontFamily,
            header: opts.header,
            footer: opts.footer,
            watermark: opts.watermark,
            background: opts.background,
          });
        } else {
          // Handle single mode
          if (!opts.content) {
            return new NextResponse('Missing content in compressed data', { status: 400 });
          }

          svg = generateSvg({
            content: opts.content,
            language: opts.language,
            template: opts.template,
            terminalTheme: opts.terminalTheme,
            fontSize: opts.fontSize,
            lineHeight: opts.lineHeight,
            padding: opts.padding as PaddingTuple,
            title: opts.title,
            showControls: opts.showControls,
            controlsPosition: opts.controlsPosition,
            borderRadius: opts.borderRadius,
            width: opts.width,
            fontFamily: opts.fontFamily,
            header: opts.header,
            footer: opts.footer,
            watermark: opts.watermark,
          });

          // Only wrap with background for single mode (compare mode handles it internally)
          if (svg && opts.background.type !== 'none') {
            svg = wrapSvgWithBackground(svg, opts.background);
          }
        }

        if (!svg) {
          return new NextResponse('Failed to generate SVG', { status: 500 });
        }

        // Determine output format (default to svg)
        const outputFormat = (compact.o as OutputFormat) || 'svg';

        // Return SVG directly
        if (outputFormat === 'svg') {
          return new NextResponse(svg, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        // Convert to raster format
        const rasterBuffer = await svgToRaster(svg, outputFormat);
        return new NextResponse(new Uint8Array(rasterBuffer), {
          headers: {
            'Content-Type': getContentType(outputFormat),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('Error generating image:', error);
        return new NextResponse('Internal server error', { status: 500 });
      }
    }
  }

  // Fall back to legacy parameter parsing
  const encodedContent = getParam(searchParams, 'content');
  if (!encodedContent) {
    return new NextResponse('Missing content parameter', { status: 400 });
  }

  const content = decodeBase64(encodedContent);
  if (!content) {
    return new NextResponse('Invalid content encoding', { status: 400 });
  }

  // Parse all parameters
  const language = getParam(searchParams, 'language') || 'auto';

  const templateParam = getParam(searchParams, 'template');
  const template: TemplateType = templateParam && ['macos', 'windows', 'minimal'].includes(templateParam)
    ? templateParam as TemplateType
    : DEFAULT_SETTINGS.template;

  const terminalTheme = getParam(searchParams, 'terminalTheme') || DEFAULT_SETTINGS.terminalTheme;

  const fontSizeParam = getParam(searchParams, 'fontSize');
  const fontSize = fontSizeParam ? Number(fontSizeParam) : DEFAULT_SETTINGS.fontSize;

  const lineHeightParam = getParam(searchParams, 'lineHeight');
  const lineHeight = lineHeightParam ? Number(lineHeightParam) : DEFAULT_SETTINGS.lineHeight;

  const paddingParam = getParam(searchParams, 'padding');
  const padding = paddingParam ? decodePadding(paddingParam) || DEFAULT_SETTINGS.padding : DEFAULT_SETTINGS.padding;

  const title = getParam(searchParams, 'title') ?? DEFAULT_SETTINGS.title;

  const showControlsParam = getParam(searchParams, 'showControls');
  const showControls = showControlsParam !== null ? decodeBool(showControlsParam, true) : DEFAULT_SETTINGS.showControls;

  const controlsPositionParam = getParam(searchParams, 'controlsPosition');
  const controlsPosition: ControlsPosition = controlsPositionParam === 'right' ? 'right' : DEFAULT_SETTINGS.controlsPosition;

  const borderRadiusParam = getParam(searchParams, 'borderRadius');
  const borderRadius = borderRadiusParam ? Number(borderRadiusParam) : DEFAULT_SETTINGS.borderRadius;

  const widthParam = getParam(searchParams, 'width');
  const width = widthParam ? Number(widthParam) : DEFAULT_SETTINGS.width;

  const fontFamilyParam = getParam(searchParams, 'fontFamily');
  const fontFamily = fontFamilyParam ? decodeBase64(fontFamilyParam) : DEFAULT_SETTINGS.fontFamily;

  // Parse watermark
  const watermarkType = getParam(searchParams, 'watermarkType') as 'text' | 'markup' | null;
  const watermarkText = getParam(searchParams, 'watermarkText');
  const watermarkStyle = getParam(searchParams, 'watermarkStyle');
  const watermarkMarkup = getParam(searchParams, 'watermarkMarkup');

  const watermark = (watermarkType || watermarkText || watermarkMarkup) ? {
    type: watermarkType || 'text' as const,
    text: watermarkText ? decodeBase64(watermarkText) : '',
    style: watermarkStyle ? decodeBase64(watermarkStyle) : DEFAULT_WATERMARK.style,
    markup: watermarkMarkup ? decodeBase64(watermarkMarkup) : '',
  } : undefined;

  // Parse header
  const headerEnabled = getParam(searchParams, 'headerEnabled');
  const header = headerEnabled !== null ? {
    enabled: decodeBool(headerEnabled),
    backgroundColor: getParam(searchParams, 'headerBgColor') || '',
    height: Number(getParam(searchParams, 'headerHeight')) || DEFAULT_HEADER.height,
    border: decodeBool(getParam(searchParams, 'headerBorder')),
    borderColor: getParam(searchParams, 'headerBorderColor') || DEFAULT_HEADER.borderColor,
    borderWidth: Number(getParam(searchParams, 'headerBorderWidth')) || DEFAULT_HEADER.borderWidth,
  } : undefined;

  // Parse footer
  const footerEnabled = getParam(searchParams, 'footerEnabled');
  const footer = footerEnabled !== null ? {
    enabled: decodeBool(footerEnabled),
    backgroundColor: getParam(searchParams, 'footerBgColor') || '',
    height: Number(getParam(searchParams, 'footerHeight')) || DEFAULT_FOOTER.height,
    border: decodeBool(getParam(searchParams, 'footerBorder')),
    borderColor: getParam(searchParams, 'footerBorderColor') || DEFAULT_FOOTER.borderColor,
    borderWidth: Number(getParam(searchParams, 'footerBorderWidth')) || DEFAULT_FOOTER.borderWidth,
  } : undefined;

  // Parse background
  const bgTypeParam = getParam(searchParams, 'bgType');
  const bgType: BackgroundType = bgTypeParam && ['none', 'solid', 'gradient', 'image'].includes(bgTypeParam)
    ? bgTypeParam as BackgroundType
    : 'none';

  const bgColor = getParam(searchParams, 'bgColor') || DEFAULT_BACKGROUND.color;
  const bgGradientFrom = getParam(searchParams, 'bgGradientFrom') || DEFAULT_BACKGROUND.gradientFrom;
  const bgGradientTo = getParam(searchParams, 'bgGradientTo') || DEFAULT_BACKGROUND.gradientTo;
  const bgGradientDirectionParam = getParam(searchParams, 'bgGradientDirection');
  const bgGradientDirection: GradientDirection = bgGradientDirectionParam as GradientDirection || DEFAULT_BACKGROUND.gradientDirection;
  const bgPaddingParam = getParam(searchParams, 'bgPadding');
  const bgPadding = bgPaddingParam ? Number(bgPaddingParam) : DEFAULT_BACKGROUND.padding;
  const bgImageAspectRatioParam = getParam(searchParams, 'bgImageAspectRatio');
  const bgImageAspectRatio: ImageAspectRatio = bgImageAspectRatioParam as ImageAspectRatio || DEFAULT_BACKGROUND.imageAspectRatio;

  const background = {
    type: bgType,
    color: bgColor,
    gradientFrom: bgGradientFrom,
    gradientTo: bgGradientTo,
    gradientDirection: bgGradientDirection,
    padding: bgPadding,
    imageAspectRatio: bgImageAspectRatio,
    image: null, // Images are not supported in URL sharing (too large)
  };

  try {
    // Generate SVG
    let svg = generateSvg({
      content,
      language,
      template,
      terminalTheme,
      fontSize,
      lineHeight,
      padding: padding as PaddingTuple,
      title,
      showControls,
      controlsPosition,
      borderRadius,
      width,
      fontFamily,
      header,
      footer,
      watermark,
    });

    if (!svg) {
      return new NextResponse('Failed to generate SVG', { status: 500 });
    }

    // Wrap with background if configured
    if (background.type !== 'none') {
      svg = wrapSvgWithBackground(svg, background);
    }

    // Check for output format param (legacy URLs)
    const outputFormatParam = searchParams.get('o');
    const outputFormat: OutputFormat =
      outputFormatParam && ['svg', 'png', 'webp', 'jpeg'].includes(outputFormatParam)
        ? outputFormatParam as OutputFormat
        : 'svg';

    // Return SVG directly
    if (outputFormat === 'svg') {
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Convert to raster format
    const rasterBuffer = await svgToRaster(svg, outputFormat);
    return new NextResponse(new Uint8Array(rasterBuffer), {
      headers: {
        'Content-Type': getContentType(outputFormat),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export const runtime = 'nodejs';
export const revalidate = false;
