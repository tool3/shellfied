import type { Metadata } from 'next';
import LZString from 'lz-string';
import { HomeClient } from './HomeClient';

interface CompactState {
  c?: string;
  ti?: string;
  th?: string;
  lg?: string;
  cmp?: boolean;
  bc?: string;
  ac?: string;
  bl?: string;
  al?: string;
}

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;

  // Check for LZ-compressed data from share URLs (/?d=...)
  const compressedData = params.d ? String(params.d) : null;

  // Also check for direct params (legacy support)
  const hasDirectParams = params.m || params.c || params.ti;

  if (!compressedData && !hasDirectParams) {
    return {
      title: 'Shellfied - Beautiful code',
      description: 'Create and share beautiful code',
    };
  }

  let title = 'Shellfied - Beautiful code';
  let ogImageUrl = '/api/og';

  // If we have LZ-compressed data, decompress and extract params for OG image
  if (compressedData) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(compressedData);
      if (json) {
        const state = JSON.parse(json) as CompactState;
        const ogParams = new URLSearchParams();

        if (state.cmp) {
          // Compare mode - use before content for preview
          if (state.bc) ogParams.set('c', base64Encode(state.bc));
          if (state.bl) ogParams.set('ti', state.bl);
        } else {
          // Single mode
          if (state.c) ogParams.set('c', base64Encode(state.c));
          if (state.ti) ogParams.set('ti', state.ti);
        }

        if (state.th) ogParams.set('th', state.th);
        if (state.lg) ogParams.set('lg', state.lg);

        if (ogParams.toString()) {
          ogImageUrl = `/api/og?${ogParams.toString()}`;
        }

        const displayTitle = state.cmp ? state.bl : state.ti;
        if (displayTitle) {
          title = `${displayTitle} - Shellfied`;
        }
      }
    } catch {
      // Fall back to default OG image on parse error
    }
  } else if (hasDirectParams) {
    // Legacy direct params
    const ogParams = new URLSearchParams();
    if (params.c) ogParams.set('c', String(params.c));
    if (params.ti) ogParams.set('ti', String(params.ti));
    if (params.th) ogParams.set('th', String(params.th));
    if (params.lg) ogParams.set('lg', String(params.lg));

    if (ogParams.toString()) {
      ogImageUrl = `/api/og?${ogParams.toString()}`;
    }

    if (params.ti) {
      title = `${String(params.ti)} - Shellfied`;
    }
  }

  return {
    title,
    description: 'Create beautiful SVGs from your code and terminal output',
    openGraph: {
      title,
      description: 'Share beautiful code',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'Share beautiful code',
      images: [ogImageUrl],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
