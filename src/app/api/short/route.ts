/**
 * API Route: /api/short
 *
 * Creates shortened URLs for sharing shellfied images
 *
 * POST /api/short
 * Body: { data: string, format?: string }
 * Returns: { success: true, id, shortUrl, svgUrl } | { success: false, error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createShortUrl, resolveShortUrl } from '@/services/shortenerService';

/**
 * GET /api/short?id=abc1234
 * Resolves a short URL ID to its compressed data
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid id parameter' },
      { status: 400 }
    );
  }

  const result = await resolveShortUrl(id);

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, format } = body;

    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid data parameter' },
        { status: 400 }
      );
    }

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'shellfied.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    const result = await createShortUrl(data, baseUrl, format);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in /api/short:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
