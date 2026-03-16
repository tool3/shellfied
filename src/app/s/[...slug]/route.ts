/**
 * Short URL Route: /s/[id] and /s/[id].svg
 *
 * Handles both:
 * - /s/abc1234 → Redirects to ViewMode landing page
 * - /s/abc1234.svg → Returns raw SVG for markdown embedding
 *
 * Supports both single mode and compare mode
 */

import { NextRequest, NextResponse } from 'next/server';
import LZString from 'lz-string';
import { resolveShortUrl } from '@/services/shortenerService';
import { generateSvg, wrapSvgWithBackground } from '@/lib/generateSvg';
import { DEFAULT_BACKGROUND, DEFAULT_SETTINGS, DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_WATERMARK } from '@/constants/defaults';
import type { TemplateType, ControlsPosition, PaddingTuple, BackgroundType, GradientDirection, ImageAspectRatio, CompareLabelAlignment } from '@/types';

// Compact state interface (matching urlParams.ts and /api/image)
interface CompactState {
  m?: string; // mode
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
      fontSize: compact.clf ?? 16,
      fontFamily: compact.clff || 'system-ui, -apple-system, sans-serif',
      fontWeight: compact.clfw ?? 600,
      color: compact.clc || '#ffffff',
      alignment: (compact.cla || 'left') as CompareLabelAlignment,
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

// Get SVG dimensions from SVG string
function getSvgDimensions(svgContent: string): { width: number; height: number } {
  const widthMatch = svgContent.match(/width="(\d+(?:\.\d+)?)"/);
  const heightMatch = svgContent.match(/height="(\d+(?:\.\d+)?)"/);

  let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 0;

  // Fallback to viewBox
  if (!width || !height) {
    const viewBoxMatch = svgContent.match(/viewBox="[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)"/);
    if (viewBoxMatch) {
      width = width || parseFloat(viewBoxMatch[1]);
      height = height || parseFloat(viewBoxMatch[2]);
    }
  }

  return { width: width || 400, height: height || 300 };
}

// Extract inner content of SVG
function extractSvgContent(svgString: string): string {
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : '';
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Map font family to Google Fonts URL
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

  // Extract the primary font name from the font-family string
  const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');

  if (fontMap[primaryFont]) {
    return `https://fonts.googleapis.com/css2?family=${fontMap[primaryFont]}&display=swap`;
  }
  return null;
}

// Generate SVG background element
function generateSvgBackground(
  background: ReturnType<typeof parseCompressedState>['background'],
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

    default:
      return '';
  }
}

// Generate combined compare mode SVG
function generateCompareSvg(
  beforeSvg: string,
  afterSvg: string,
  beforeLabel: string,
  afterLabel: string,
  labelConfig: ReturnType<typeof parseCompressedState>['compareLabelConfig'],
  background: ReturnType<typeof parseCompressedState>['background']
): string {
  const gap = 32;
  const labelHeight = labelConfig.fontSize + 24;
  const padding = background?.type !== 'none' ? (background?.padding ?? 32) : 32;

  // Get dimensions for both SVGs
  const beforeDims = beforeSvg ? getSvgDimensions(beforeSvg) : { width: 400, height: 300 };
  const afterDims = afterSvg ? getSvgDimensions(afterSvg) : { width: 400, height: 300 };

  const maxHeight = Math.max(beforeDims.height, afterDims.height);
  const totalWidth = beforeDims.width + gap + afterDims.width + padding * 2;
  const totalHeight = maxHeight + labelHeight + padding * 2;

  // Calculate label positions based on alignment
  let beforeLabelX = padding;
  let afterLabelX = padding + beforeDims.width + gap;
  let textAnchor = 'start';

  if (labelConfig.alignment === 'center') {
    beforeLabelX = padding + beforeDims.width / 2;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width / 2;
    textAnchor = 'middle';
  } else if (labelConfig.alignment === 'right') {
    beforeLabelX = padding + beforeDims.width;
    afterLabelX = padding + beforeDims.width + gap + afterDims.width;
    textAnchor = 'end';
  }

  // Generate background SVG element
  const backgroundSvg = generateSvgBackground(background, totalWidth, totalHeight);

  // Get font import URL if using a Google Font
  const fontImportUrl = getFontImportUrl(labelConfig.fontFamily);
  const fontImportStyle = fontImportUrl
    ? `@import url('${fontImportUrl}');`
    : '';

  // Create combined SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style>
      ${fontImportStyle}
      .label { font: ${labelConfig.fontWeight} ${labelConfig.fontSize}px ${labelConfig.fontFamily}; fill: ${labelConfig.color}; text-anchor: ${textAnchor}; }
    </style>
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Before label -->
  <text x="${beforeLabelX}" y="${padding + labelConfig.fontSize}" class="label">${escapeXml(beforeLabel)}</text>

  <!-- After label -->
  <text x="${afterLabelX}" y="${padding + labelConfig.fontSize}" class="label">${escapeXml(afterLabel)}</text>

  <!-- Before SVG -->
  <g transform="translate(${padding}, ${padding + labelHeight})">
    ${beforeSvg ? extractSvgContent(beforeSvg) : `<rect width="${beforeDims.width}" height="${beforeDims.height}" fill="rgba(255,255,255,0.1)" rx="8"/>`}
  </g>

  <!-- After SVG -->
  <g transform="translate(${padding + beforeDims.width + gap}, ${padding + labelHeight})">
    ${afterSvg ? extractSvgContent(afterSvg) : `<rect width="${afterDims.width}" height="${afterDims.height}" fill="rgba(255,255,255,0.1)" rx="8"/>`}
  </g>
</svg>`;
}

async function generateSvgResponse(id: string): Promise<NextResponse> {
  const result = await resolveShortUrl(id);

  if (!result.success) {
    return new NextResponse('Short URL not found', { status: 404 });
  }

  try {
    // Decompress the LZ-compressed data
    const json = LZString.decompressFromEncodedURIComponent(result.data);
    if (!json) {
      return new NextResponse('Invalid compressed data', { status: 400 });
    }

    const compact = JSON.parse(json) as CompactState;
    const opts = parseCompressedState(compact);

    let svg: string;

    // Check if compare mode
    if (opts.compareMode) {
      // Generate both terminal SVGs
      const sharedOptions = {
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
      };

      const beforeSvg = opts.beforeContent ? generateSvg({
        ...sharedOptions,
        content: opts.beforeContent,
        language: opts.beforeLanguage,
        title: opts.beforeTitle,
        width: opts.width,
      }) : '';

      const afterSvg = opts.afterContent ? generateSvg({
        ...sharedOptions,
        content: opts.afterContent,
        language: opts.afterLanguage,
        title: opts.afterTitle,
        width: opts.width,
      }) : '';

      // Match widths if both have content
      let finalBeforeSvg = beforeSvg;
      let finalAfterSvg = afterSvg;

      if (beforeSvg && afterSvg) {
        const beforeDims = getSvgDimensions(beforeSvg);
        const afterDims = getSvgDimensions(afterSvg);
        const maxWidth = Math.max(beforeDims.width, afterDims.width);

        if (beforeDims.width < maxWidth) {
          finalBeforeSvg = generateSvg({
            ...sharedOptions,
            content: opts.beforeContent,
            language: opts.beforeLanguage,
            title: opts.beforeTitle,
            width: maxWidth,
          }) || beforeSvg;
        }

        if (afterDims.width < maxWidth) {
          finalAfterSvg = generateSvg({
            ...sharedOptions,
            content: opts.afterContent,
            language: opts.afterLanguage,
            title: opts.afterTitle,
            width: maxWidth,
          }) || afterSvg;
        }
      }

      svg = generateCompareSvg(
        finalBeforeSvg,
        finalAfterSvg,
        opts.beforeLabel,
        opts.afterLabel,
        opts.compareLabelConfig,
        opts.background
      );
    } else {
      // Single mode
      if (!opts.content) {
        return new NextResponse('Missing content in stored data', { status: 400 });
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
      }) || '';

      if (!svg) {
        return new NextResponse('Failed to generate SVG', { status: 500 });
      }

      // Wrap with background if configured
      if (opts.background.type !== 'none') {
        svg = wrapSvgWithBackground(svg, opts.background);
      }
    }

    // Return SVG with appropriate headers
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating SVG from short URL:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug;

  if (!slugParts || slugParts.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Get the first (and should be only) part of the slug
  const slug = slugParts[0];

  // Check if it ends with .svg
  if (slug.endsWith('.svg')) {
    const id = slug.slice(0, -4); // Remove .svg extension
    return generateSvgResponse(id);
  }

  // Otherwise, redirect to the ViewMode landing page
  const result = await resolveShortUrl(slug);

  if (!result.success) {
    return new NextResponse('Short URL not found', { status: 404 });
  }

  // Redirect to the main page with the LZ-compressed data
  const redirectUrl = `/?d=${encodeURIComponent(result.data)}`;
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
