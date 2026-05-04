/**
 * Shared SVG pattern overlay generator.
 *
 * Returns a single block of SVG markup (defs + rect) that paints the
 * configured pattern across a (w × h) region. Used by both the client
 * preview overlay (via shellfie's `overlays` option) and the server-side
 * static render path.
 */

import type { BackgroundConfig } from '@/types';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Build SVG markup that renders the pattern across (w, h).
 * Returns an empty string when no pattern should be drawn.
 *
 * `idPrefix` should be unique per containing SVG document so element ids
 * don't collide across multiple inline SVGs in the same page. `borderRadius`
 * clips the pattern rect so it doesn't paint into the rounded corners of
 * the underlying background (shellfie's default is 12).
 */
export function buildPatternOverlay(
  bg: BackgroundConfig,
  w: number,
  h: number,
  idPrefix: string = 'sfp',
  borderRadius: number = 12,
): string {
  if (bg.type !== 'pattern') return '';
  const opacity = clamp(bg.patternOpacity ?? 1, 0, 1);
  if (opacity === 0) return '';

  const color = bg.patternColor || 'rgba(255,255,255,0.35)';
  const size = clamp(bg.patternSize ?? 24, 1, 512);
  const thickness = clamp(bg.patternThickness ?? 2, 0, 64);
  const r = clamp(borderRadius, 0, Math.min(w, h) / 2);
  const rectAttrs = `width="${w}" height="${h}" rx="${r}" ry="${r}"`;

  switch (bg.patternType) {
    case 'dotted':
      return dottedPattern(rectAttrs, color, size, thickness, opacity, idPrefix);
    case 'grid':
      return gridPattern(rectAttrs, color, size, thickness, opacity, idPrefix);
    case 'noise':
      return noisePattern(rectAttrs, color, size, opacity, idPrefix);
    case 'topographic':
      return topographicPattern(rectAttrs, color, size, thickness, opacity, idPrefix);
    default:
      return '';
  }
}

function dottedPattern(
  rectAttrs: string, color: string, size: number, thickness: number, opacity: number, prefix: string,
): string {
  const id = `${prefix}-dot`;
  const c = size / 2;
  const r = clamp(thickness / 2, 0.25, size / 2 - 0.5);
  return [
    '<defs>',
    `<pattern id="${id}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">`,
    `<circle cx="${c}" cy="${c}" r="${r}" fill="${escapeAttr(color)}"/>`,
    '</pattern>',
    '</defs>',
    `<rect ${rectAttrs} fill="url(#${id})" opacity="${opacity}"/>`,
  ].join('');
}

function gridPattern(
  rectAttrs: string, color: string, size: number, thickness: number, opacity: number, prefix: string,
): string {
  const id = `${prefix}-grid`;
  const stroke = clamp(thickness, 0.25, size / 2);
  // Draw the top + left edges of each cell so adjacent tiles line up cleanly.
  return [
    '<defs>',
    `<pattern id="${id}" x="0" y="0" width="${size}" height="${size}" patternUnits="userSpaceOnUse">`,
    `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${escapeAttr(color)}" stroke-width="${stroke}"/>`,
    '</pattern>',
    '</defs>',
    `<rect ${rectAttrs} fill="url(#${id})" opacity="${opacity}"/>`,
  ].join('');
}

function noisePattern(
  rectAttrs: string, color: string, size: number, opacity: number, prefix: string,
): string {
  const id = `${prefix}-noise`;
  // Smaller patternSize → finer grain (higher frequency).
  const freq = clamp(2 / size, 0.02, 1.5);
  return [
    '<defs>',
    `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${freq.toFixed(4)}" numOctaves="2" stitchTiles="stitch" result="n"/>`,
    // Convert the turbulence's red channel to alpha; zero out RGB.
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="na"/>',
    // Tint via feFlood + feComposite — accepts any CSS color string.
    `<feFlood flood-color="${escapeAttr(color)}" result="c"/>`,
    '<feComposite in="c" in2="na" operator="in"/>',
    '</filter>',
    '</defs>',
    `<rect ${rectAttrs} filter="url(#${id})" opacity="${opacity}"/>`,
  ].join('');
}

function topographicPattern(
  rectAttrs: string, color: string, size: number, thickness: number, opacity: number, prefix: string,
): string {
  const id = `${prefix}-topo`;
  // Larger patternSize → lower frequency → broader contour rings.
  const freq = clamp(0.6 / size, 0.003, 0.06);
  // Discrete bands across [0..1]; the "1" entries are the contour lines.
  // Each "1" represents a contour band; spacing the 1s controls density.
  const tableValues = '0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0';
  // Morphology radius gives line thickness (subpixel allowed via radius<1).
  const dilate = clamp((thickness - 0.5) / 2, 0, 4);
  return [
    '<defs>',
    `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${freq.toFixed(4)}" numOctaves="3" seed="4" stitchTiles="stitch" result="n"/>`,
    // Move noise value into alpha channel.
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="na"/>',
    // Threshold alpha into discrete bands → contour-line silhouette.
    `<feComponentTransfer in="na" result="bands"><feFuncA type="discrete" tableValues="${tableValues}"/></feComponentTransfer>`,
    ...(dilate > 0 ? [`<feMorphology in="bands" operator="dilate" radius="${dilate.toFixed(2)}" result="bands"/>`] : []),
    `<feFlood flood-color="${escapeAttr(color)}" result="c"/>`,
    '<feComposite in="c" in2="bands" operator="in"/>',
    '</filter>',
    '</defs>',
    `<rect ${rectAttrs} filter="url(#${id})" opacity="${opacity}"/>`,
  ].join('');
}
