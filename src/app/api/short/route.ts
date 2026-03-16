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
import { createShortUrl } from '@/services/shortenerService';

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
