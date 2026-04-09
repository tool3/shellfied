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
import { generateSvg, generateCompareSvg as generateCompareSvgFromLib, wrapSvgWithBackground, fetchServerFont } from '@/lib/generateSvg';
import { DEFAULT_BACKGROUND, DEFAULT_SETTINGS, DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_WATERMARK } from '@/constants/defaults';
import type { TemplateType, ControlsPosition, PaddingTuple, BackgroundType, BackgroundConfig, GradientDirection, ImageAspectRatio, CompareLabelAlignment } from '@/types';

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
  ban?: string; // bgAnimation
  bov?: string; // bgOverlay
  sfp?: string; // shellfiePreset
  ln?: boolean; // lineNumbers
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
      animation: (compact.ban as BackgroundConfig['animation']) || null,
      overlay: (compact.bov as BackgroundConfig['overlay']) || null,
    },
    shellfiePreset: compact.sfp || undefined,
    lineNumbers: compact.ln ?? false,
  };
}

// Escape XML/HTML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

    // Pre-fetch the user's selected terminal font for embedding
    const customFontData = await fetchServerFont(opts.fontFamily);

    let svg: string;

    // Check if compare mode
    if (opts.compareMode) {
      // Pre-fetch label font if it's a Google Font
      const labelFontData = await fetchServerFont(opts.compareLabelConfig.fontFamily, opts.compareLabelConfig.fontWeight);

      // generateCompareSvgFromLib handles width matching and SVG generation internally
      svg = generateCompareSvgFromLib({
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
        width: opts.width,
        fontFamily: opts.fontFamily,
        header: opts.header,
        footer: opts.footer,
        watermark: opts.watermark,
        background: opts.background,
        customFontData,
        labelFontData,
      });
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
        customFontData,
        lineNumbers: opts.lineNumbers,
        shellfiePreset: opts.shellfiePreset,
      }) || '';

      if (!svg) {
        return new NextResponse('Failed to generate SVG', { status: 500 });
      }

      // Wrap with background if configured (skip when shellfie preset handles it)
      if (opts.background.type !== 'none' && !opts.shellfiePreset) {
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

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateLandingPage(
  redirectUrl: string,
  compact: CompactState,
  baseUrl: string
): string {
  // Extract metadata for OG tags
  const isCompareMode = compact.cmp ?? false;
  const title = isCompareMode
    ? (compact.bl || 'Code Comparison')
    : (compact.ti || 'Code Snippet');
  const pageTitle = `${title} - Shellfied`;

  // Build OG image URL
  const ogParams = new URLSearchParams();
  if (isCompareMode) {
    if (compact.bc) ogParams.set('c', base64Encode(compact.bc));
    if (compact.bl) ogParams.set('ti', compact.bl);
  } else {
    if (compact.c) ogParams.set('c', base64Encode(compact.c));
    if (compact.ti) ogParams.set('ti', compact.ti);
  }
  if (compact.th) ogParams.set('th', compact.th);
  if (compact.lg) ogParams.set('lg', compact.lg);

  const ogImageUrl = ogParams.toString()
    ? `${baseUrl}/api/og?${ogParams.toString()}`
    : `${baseUrl}/api/og`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(pageTitle)}</title>
  <meta name="description" content="Code screenshot created with Shellfied">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeXml(pageTitle)}">
  <meta property="og:description" content="Code screenshot created with Shellfied">
  <meta property="og:image" content="${escapeXml(ogImageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeXml(baseUrl + redirectUrl)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeXml(pageTitle)}">
  <meta name="twitter:description" content="Code screenshot created with Shellfied">
  <meta name="twitter:image" content="${escapeXml(ogImageUrl)}">

  <!-- Redirect after a brief delay for crawlers to read meta tags -->
  <meta http-equiv="refresh" content="0;url=${escapeXml(redirectUrl)}">

  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f0f0f;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #34D399;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #34D399; }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading your code snippet...</p>
    <p><a href="${escapeXml(redirectUrl)}">Click here if not redirected</a></p>
  </div>
  <script>window.location.replace("${redirectUrl.replace(/"/g, '\\"')}");</script>
</body>
</html>`;
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

  const slug = slugParts[0];

  // Handle .svg requests - return raw SVG
  if (slug.endsWith('.svg')) {
    const id = slug.slice(0, -4);
    return generateSvgResponse(id);
  }

  // Handle landing page requests - return HTML with OG metadata
  const result = await resolveShortUrl(slug);

  if (!result.success) {
    return new NextResponse('Short URL not found', { status: 404 });
  }

  try {
    const json = LZString.decompressFromEncodedURIComponent(result.data);
    if (!json) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const compact = JSON.parse(json) as CompactState;
    const redirectUrl = `/?sid=${encodeURIComponent(slug)}`;
    const baseUrl = new URL(request.url).origin;

    const html = generateLandingPage(redirectUrl, compact, baseUrl);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating landing page:', error);
    // Fallback to redirect
    const redirectUrl = `/?sid=${encodeURIComponent(slug)}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
