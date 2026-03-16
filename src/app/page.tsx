import type { Metadata } from 'next';
import { HomeClient } from './HomeClient';

// Generate dynamic OG images for shared links
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;

  // Check if this is a shared link (has mode or content params)
  const hasShareParams = params.m || params.c || params.ti;

  if (!hasShareParams) {
    // Default metadata
    return {
      title: 'Shellfied - beautiful code',
      description: 'Create beautiful SVGs from your code and terminal output',
    };
  }

  // Build dynamic OG image URL
  const ogParams = new URLSearchParams();

  // Pass relevant params for OG image generation
  if (params.c) ogParams.set('c', String(params.c));
  if (params.ti) ogParams.set('ti', String(params.ti));
  if (params.th) ogParams.set('th', String(params.th));
  if (params.lg) ogParams.set('lg', String(params.lg));

  const ogImageUrl = `/api/og?${ogParams.toString()}`;
  const title = params.ti ? `${String(params.ti)} - Shellfied` : 'Shellfied - Beautiful code screenshot';

  return {
    title,
    description: 'Create beautiful SVGs from your code and terminal output',
    openGraph: {
      title,
      description: 'Code screenshot created with Shellfied',
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
      description: 'Code screenshot created with Shellfied',
      images: [ogImageUrl],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
