/**
 * Short URL Route: /s/[id] and /s/[id].svg
 *
 * Handles both:
 * - /s/abc1234 → Redirects to ViewMode landing page
 * - /s/abc1234.svg → Returns raw SVG for markdown embedding
 */

import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import LZString from 'lz-string';
import { resolveShortUrl } from '@/services/shortenerService';
import { generateSvg, wrapSvgWithBackground } from '@/lib/generateSvg';
import { DEFAULT_BACKGROUND, DEFAULT_SETTINGS, DEFAULT_HEADER, DEFAULT_FOOTER, DEFAULT_WATERMARK } from '@/constants/defaults';
import type { TemplateType, ControlsPosition, PaddingTuple, BackgroundType, GradientDirection, ImageAspectRatio } from '@/types';

// Compact state interface (matching urlParams.ts and /api/image)
interface CompactState {
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

    if (!opts.content) {
      return new NextResponse('Missing content in stored data', { status: 400 });
    }

    // Generate the SVG
    let svg = generateSvg({
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

    if (!svg) {
      return new NextResponse('Failed to generate SVG', { status: 500 });
    }

    // Wrap with background if configured
    if (opts.background.type !== 'none') {
      svg = wrapSvgWithBackground(svg, opts.background);
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
