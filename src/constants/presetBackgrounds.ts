/**
 * SVG background patterns for presets, replicating ray.so theme backgrounds.
 * These are encoded as data URIs and used as background images.
 */

// Helper to create an SVG data URI
function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// --- Gridlines Pattern ---
// Used by: Tailwind, Cloudflare, Firecrawl
export function createGridlinesBg(lineColor: string, bgColor: string, width = 800, height = 600, spacing = 40): string {
  const lines: string[] = [];
  for (let x = spacing; x < width; x += spacing) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${lineColor}" stroke-width="1"/>`);
  }
  for (let y = spacing; y < height; y += spacing) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${lineColor}" stroke-width="1"/>`);
  }
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${bgColor}"/>${lines.join('')}</svg>`);
}

// --- Vercel Gridlines + Corner Brackets ---
export function createVercelBg(): string {
  const w = 800, h = 600, sp = 50;
  const lines: string[] = [];
  for (let x = sp; x < w; x += sp) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#2a2a2a" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#2a2a2a" stroke-width="1"/>`);
  }
  // Corner brackets (crosshair marks)
  const bLen = 24, bOff = 30, bColor = '#666';
  // Top-left
  lines.push(`<line x1="${bOff}" y1="${bOff}" x2="${bOff + bLen}" y2="${bOff}" stroke="${bColor}" stroke-width="2"/>`);
  lines.push(`<line x1="${bOff}" y1="${bOff}" x2="${bOff}" y2="${bOff + bLen}" stroke="${bColor}" stroke-width="2"/>`);
  // Top-right
  lines.push(`<line x1="${w - bOff}" y1="${bOff}" x2="${w - bOff - bLen}" y2="${bOff}" stroke="${bColor}" stroke-width="2"/>`);
  lines.push(`<line x1="${w - bOff}" y1="${bOff}" x2="${w - bOff}" y2="${bOff + bLen}" stroke="${bColor}" stroke-width="2"/>`);
  // Bottom-left
  lines.push(`<line x1="${bOff}" y1="${h - bOff}" x2="${bOff + bLen}" y2="${h - bOff}" stroke="${bColor}" stroke-width="2"/>`);
  lines.push(`<line x1="${bOff}" y1="${h - bOff}" x2="${bOff}" y2="${h - bOff - bLen}" stroke="${bColor}" stroke-width="2"/>`);
  // Bottom-right
  lines.push(`<line x1="${w - bOff}" y1="${h - bOff}" x2="${w - bOff - bLen}" y2="${h - bOff}" stroke="${bColor}" stroke-width="2"/>`);
  lines.push(`<line x1="${w - bOff}" y1="${h - bOff}" x2="${w - bOff}" y2="${h - bOff - bLen}" stroke="${bColor}" stroke-width="2"/>`);

  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#0a0a0a"/>${lines.join('')}</svg>`);
}

// --- Dot Grid Pattern ---
// Used by: Trigger.dev, Ice, Clerk
export function createDotGridBg(dotColor: string, bgColor: string, spacing = 17, dotRadius = 1): string {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}"><rect width="${spacing}" height="${spacing}" fill="${bgColor}"/><circle cx="${spacing / 2}" cy="${spacing / 2}" r="${dotRadius}" fill="${dotColor}" opacity="0.5"/></svg>`);
}

// --- Star Field ---
// Used by: Nuxt, Gemini
export function createStarFieldBg(bgColor: string, starColor: string, count = 120, starOpacity = 0.6): string {
  const w = 800, h = 600;
  const stars: string[] = [];
  // Deterministic pseudo-random using simple hash
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * w);
    const y = Math.round(rand() * h);
    const r = 0.5 + rand() * 1.5;
    const o = (0.3 + rand() * 0.7) * starOpacity;
    stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${starColor}" opacity="${o.toFixed(2)}"/>`);
  }
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${stars.join('')}</svg>`);
}

// --- Vertical Dashed Lines ---
// Used by: Browserbase, Stripe
export function createVerticalLinesBg(lineColor: string, bgColor: string, count = 7, dashed = true): string {
  const w = 800, h = 600;
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round((w / (count + 1)) * (i + 1));
    const dashAttr = dashed ? ' stroke-dasharray="6 4"' : '';
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${lineColor}" stroke-width="1" opacity="0.5"${dashAttr}/>`);
  }
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${lines.join('')}</svg>`);
}

// --- Concentric Circles Grid (ElevenLabs-style) ---
export function createElevenLabsBg(): string {
  const w = 800, h = 600;
  const cx = w / 2, cy = h / 2;
  const elements: string[] = [];
  const color = '#444';

  // Grid lines
  const sp = 50;
  for (let x = sp; x < w; x += sp) {
    elements.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${color}" stroke-width="0.5" opacity="0.5"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    elements.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${color}" stroke-width="0.5" opacity="0.5"/>`);
  }

  // Concentric circles
  for (let r = 60; r <= 300; r += 60) {
    elements.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`);
  }

  // Dot markers at grid intersections near center
  for (let x = cx - 150; x <= cx + 150; x += sp) {
    for (let y = cy - 150; y <= cy + 150; y += sp) {
      elements.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="${color}" opacity="0.6"/>`);
    }
  }

  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#111"/>${elements.join('')}</svg>`);
}

// --- Glowing Border Effect (Prisma/Nuxt style) ---
export function createGlowBorderBg(bgColor: string, glowColor1: string, glowColor2: string): string {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><radialGradient id="g1" cx="10%" cy="10%"><stop offset="0%" stop-color="${glowColor1}" stop-opacity="0.25"/><stop offset="70%" stop-color="${glowColor1}" stop-opacity="0"/></radialGradient><radialGradient id="g2" cx="90%" cy="90%"><stop offset="0%" stop-color="${glowColor2}" stop-opacity="0.25"/><stop offset="70%" stop-color="${glowColor2}" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="${bgColor}"/><rect width="800" height="600" fill="url(#g1)"/><rect width="800" height="600" fill="url(#g2)"/></svg>`);
}

// --- SVG Pattern Overlay (Clerk/Mintlify style) ---
export function createPatternOverlayBg(bgColor: string, patternColor: string): string {
  const w = 800, h = 600;
  const elements: string[] = [];

  // Diagonal line pattern across the lower third
  for (let i = -10; i < 60; i++) {
    const x = i * 20;
    elements.push(`<line x1="${x}" y1="${h}" x2="${x + 200}" y2="${h - 200}" stroke="${patternColor}" stroke-width="0.8" opacity="0.2"/>`);
  }

  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${elements.join('')}</svg>`);
}

// --- Noise/Distortion Texture (Noir style) ---
export function createNoiseTextureBg(bgColor: string): string {
  const w = 200, h = 200;
  const pixels: string[] = [];
  let seed = 123;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 600; i++) {
    const x = Math.round(rand() * w);
    const y = Math.round(rand() * h);
    const opacity = 0.02 + rand() * 0.1;
    const size = 1 + rand() * 2;
    pixels.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="white" opacity="${opacity.toFixed(2)}"/>`);
  }

  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${pixels.join('')}</svg>`);
}
