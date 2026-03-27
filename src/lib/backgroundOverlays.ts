import type { BackgroundOverlay } from '@/types';

/**
 * Generates SVG overlay content that adapts to the actual terminal dimensions.
 * These are always-on preset decorations (not toggled like animations).
 * Returns raw SVG elements (no outer <svg> wrapper).
 */
export function generateOverlaySvg(
  overlay: BackgroundOverlay | null,
  width: number,
  height: number,
  padding = 0,
  borderRadius = 8
): string {
  if (!overlay) return '';

  switch (overlay) {
    case 'prisma-glow': return prismaGlow(width, height, padding, borderRadius);
    case 'nuxt-glow': return nuxtGlow(width, height, padding, borderRadius);
    case 'vercel-grid': return vercelGrid(width, height, padding);
    case 'elevenlabs-grid': return elevenlabsGrid(width, height, padding, borderRadius);
    case 'cloudflare-grid': return cloudflareGrid(width, height);
    case 'tailwind-beams': return tailwindBeams(width, height, padding);
    case 'clerk-halftone': return clerkHalftone(width, height);
    case 'mintlify-lines': return mintlifyLines(width, height);
    case 'resend-topo': return resendTopo(width, height);
    case 'triggerdev-lines': return triggerdevGrid(width, height, padding);
    case 'firecrawl-grid': return firecrawlGrid(width, height);
    case 'browserbase-lines': return browserbaseLines(width, height);
    case 'stripe-lines': return stripeLines(width, height);
    case 'gemini-stars': return geminiStars(width, height);
    case 'noir-noise': return noirNoise(width, height);
    case 'ice-dots': return iceDots(width, height);
    default: return '';
  }
}

/**
 * Wraps overlay content in a full <svg> element for preview rendering.
 */
export function generateOverlaySvgElement(
  overlay: BackgroundOverlay | null,
  width: number,
  height: number,
  padding = 0,
  borderRadius = 8
): string {
  const content = generateOverlaySvg(overlay, width, height, padding, borderRadius);
  if (!content) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="position:absolute;inset:0;pointer-events:none;width:100%;height:100%">${content}</svg>`;
}

// ============================================================
// VERCEL — Grid lines (#1a1a1a) + corner brackets (#515356)
// Ray.so: gridlines extend full frame, L-brackets with white dot vertices
// ============================================================
function vercelGrid(w: number, h: number, p: number): string {
  const sp = 48;
  const els: string[] = [];

  // Full grid
  for (let x = sp; x < w; x += sp) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1a1a1a" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1a1a1a" stroke-width="1"/>`);
  }

  // L-brackets at corners of the terminal area
  const bLen = 24;
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const corners = [
    { x: tx, y: ty, dx: 1, dy: 1 },
    { x: tx + tw, y: ty, dx: -1, dy: 1 },
    { x: tx, y: ty + th, dx: 1, dy: -1 },
    { x: tx + tw, y: ty + th, dx: -1, dy: -1 },
  ];
  for (const c of corners) {
    els.push(`<line x1="${c.x}" y1="${c.y}" x2="${c.x + c.dx * bLen}" y2="${c.y}" stroke="#515356" stroke-width="1.5"/>`);
    els.push(`<line x1="${c.x}" y1="${c.y}" x2="${c.x}" y2="${c.y + c.dy * bLen}" stroke="#515356" stroke-width="1.5"/>`);
    els.push(`<circle cx="${c.x}" cy="${c.y}" r="3" fill="white"/>`);
  }

  return els.join('');
}

// ============================================================
// PRISMA — Concentric glowing gradient borders
// Ray.so: linear-gradient(140deg, #3e4083, #16544f) on border
// Purple top-left → teal bottom-right, multi-layer glow
// ============================================================
function prismaGlow(w: number, h: number, p: number, r: number): string {
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const cr = Math.min(r, tw / 2, th / 2);
  const els: string[] = [];

  // 140deg ≈ x1="0%" y1="0%" x2="70%" y2="100%" (top-left to bottom-right, slightly rotated)
  const defs = `<defs>
    <linearGradient id="ovl-prisma-grad" x1="0%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#3e4083"/>
      <stop offset="100%" stop-color="#16544f"/>
    </linearGradient>
  </defs>`;

  const layers = [
    { offset: 1, opacity: 0.6, sw: 1.5, rx: cr },
    { offset: 6, opacity: 0.35, sw: 1, rx: cr + 1 },
    { offset: 11, opacity: 0.18, sw: 0.8, rx: cr + 2 },
    { offset: 16, opacity: 0.08, sw: 0.6, rx: cr + 3 },
  ];

  for (const l of layers) {
    els.push(`<rect x="${tx - l.offset}" y="${ty - l.offset}" width="${tw + l.offset * 2}" height="${th + l.offset * 2}" rx="${l.rx}" fill="none" stroke="url(#ovl-prisma-grad)" stroke-width="${l.sw}" opacity="${l.opacity}"/>`);
  }

  return defs + els.join('');
}

// ============================================================
// NUXT — Green glow borders + radial glow + corner dots + stars
// Ray.so: #0b0c11 bg, green (#00dc82) multi-layer border, stars, 10px radius
// ============================================================
function nuxtGlow(w: number, h: number, p: number, r: number): string {
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;
  const cr = Math.min(r, tw / 2, th / 2);
  const els: string[] = [];

  // Concentric green glow borders
  const layers = [
    { offset: 1, color: '#00dc82', opacity: 0.4, sw: 1.5, rx: cr },
    { offset: 5, color: '#00dc82', opacity: 0.2, sw: 1, rx: cr + 1 },
    { offset: 11, color: '#00a86b', opacity: 0.1, sw: 0.8, rx: cr + 2 },
    { offset: 18, color: '#006644', opacity: 0.05, sw: 0.6, rx: cr + 3 },
  ];

  for (const l of layers) {
    els.push(`<rect x="${tx - l.offset}" y="${ty - l.offset}" width="${tw + l.offset * 2}" height="${th + l.offset * 2}" rx="${l.rx}" fill="none" stroke="${l.color}" stroke-width="${l.sw}" opacity="${l.opacity}"/>`);
  }

  // Radial green glow spots at top-left and bottom-right
  els.push(`<circle cx="${tx}" cy="${ty}" r="${Math.min(tw, th) * 0.18}" fill="#00dc82" opacity="0.04"/>`);
  els.push(`<circle cx="${tx + tw}" cy="${ty + th}" r="${Math.min(tw, th) * 0.18}" fill="#00dc82" opacity="0.04"/>`);

  // Stars scattered across background
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 60; i++) {
    const x = rand() * w, y = rand() * h;
    const sr = 0.3 + rand() * 1;
    const o = 0.1 + rand() * 0.4;
    els.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${sr.toFixed(1)}" fill="white" opacity="${o.toFixed(2)}"/>`);
  }

  // Corner dots
  const dotOff = 16;
  const dotCorners = [
    { x: tx - dotOff, y: ty - dotOff },
    { x: tx + tw + dotOff, y: ty - dotOff },
    { x: tx - dotOff, y: ty + th + dotOff },
    { x: tx + tw + dotOff, y: ty + th + dotOff },
  ];
  for (const d of dotCorners) {
    if (d.x > 2 && d.x < w - 2 && d.y > 2 && d.y < h - 2) {
      els.push(`<circle cx="${d.x}" cy="${d.y}" r="2.5" fill="white" opacity="0.6"/>`);
    }
  }

  return els.join('');
}

// ============================================================
// ELEVENLABS — Grid + concentric circles + corner dots
// Ray.so: #111 bg, gridlines #353535, circles, corner dots, 24px radius
// ============================================================
function elevenlabsGrid(w: number, h: number, p: number, r: number): string {
  const cx = w / 2, cy = h / 2;
  const els: string[] = [];
  const tx = p, ty = p, tw = w - 2 * p, th = h - 2 * p;

  // 3 horizontal gridlines + 3 vertical gridlines (through terminal edges and center)
  const hLines = [ty, cy, ty + th]; // top, center, bottom of terminal
  const vLines = [tx, cx, tx + tw]; // left, center, right of terminal

  for (const y of hLines) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#353535" stroke-width="1"/>`);
  }
  for (const x of vLines) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#353535" stroke-width="1"/>`);
  }

  // Concentric circles centered on terminal
  const maxR = Math.max(w, h) * 0.5;
  for (let ri = 60; ri <= maxR; ri += 60) {
    els.push(`<circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="#353535" stroke-width="0.5"/>`);
  }

  // Corner gridline brackets (small L-shapes at terminal corners)
  const bLen = 16;
  const corners = [
    { x: tx, y: ty, dx: -1, dy: -1 },
    { x: tx + tw, y: ty, dx: 1, dy: -1 },
    { x: tx, y: ty + th, dx: -1, dy: 1 },
    { x: tx + tw, y: ty + th, dx: 1, dy: 1 },
  ];
  for (const c of corners) {
    els.push(`<line x1="${c.x}" y1="${c.y}" x2="${c.x + c.dx * bLen}" y2="${c.y}" stroke="#353535" stroke-width="1"/>`);
    els.push(`<line x1="${c.x}" y1="${c.y}" x2="${c.x}" y2="${c.y + c.dy * bLen}" stroke="#353535" stroke-width="1"/>`);
  }

  // Corner dots (outside terminal corners)
  for (const c of corners) {
    const dx = c.x + c.dx * bLen;
    const dy = c.y + c.dy * bLen;
    els.push(`<circle cx="${dx}" cy="${c.y}" r="3" fill="white" opacity="0.7"/>`);
    els.push(`<circle cx="${c.x}" cy="${dy}" r="3" fill="white" opacity="0.7"/>`);
  }

  return els.join('');
}

// ============================================================
// CLOUDFLARE — Full grid (#1a1a1a)
// Ray.so: gridlines extend full frame, 0px radius
// ============================================================
function cloudflareGrid(w: number, h: number): string {
  const sp = 48;
  const els: string[] = [];

  for (let x = sp; x < w; x += sp) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1a1a1a" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1a1a1a" stroke-width="1"/>`);
  }

  return els.join('');
}

// ============================================================
// TAILWIND — Grid (white 10%) + gradient line + light beams
// Ray.so: grid color display-p3 white 10%, pink-to-cyan gradient line
// ============================================================
function tailwindBeams(w: number, h: number, p: number): string {
  const sp = 48;
  const els: string[] = [];

  // Grid (white 10% opacity, matching display-p3 1 1 1 / 0.1)
  for (let x = sp; x < w; x += sp) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`);
  }

  // Gradient line just below terminal
  const ty = p, th = h - 2 * p;
  const lineY = ty + th + p * 0.35;
  const lineX1 = p * 0.3, lineX2 = w - p * 0.3;

  els.push(`
    <defs>
      <linearGradient id="ovl-tw-line" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0"/>
        <stop offset="32%" stop-color="#0ea5e9"/>
        <stop offset="67%" stop-color="#ec4899" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="ovl-tw-beam" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
    </defs>`);

  if (lineY < h) {
    els.push(`<line x1="${lineX1}" y1="${lineY}" x2="${lineX2}" y2="${lineY}" stroke="url(#ovl-tw-line)" stroke-width="1.5"/>`);
  }

  // Light beams above terminal
  const beamTop = 0;
  const beamBottom = Math.max(ty * 0.5, 10);
  els.push(`<polygon points="${w * 0.35},${beamTop} ${w * 0.44},${beamBottom} ${w * 0.56},${beamBottom} ${w * 0.65},${beamTop}" fill="url(#ovl-tw-beam)" opacity="0.04"/>`);

  return els.join('');
}

// ============================================================
// CLERK — Halftone dot pattern in bottom portion with radial fade
// Ray.so: #222 bg, dot pattern at bottom, 8px outer radius
// ============================================================
function clerkHalftone(w: number, h: number): string {
  const els: string[] = [];
  const sp = 8;
  for (let x = 0; x < w; x += sp) {
    for (let y = h * 0.55; y < h; y += sp) {
      const dist = Math.sqrt(Math.pow(x - w / 2, 2) + Math.pow(y - h * 0.75, 2));
      const maxDist = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h * 0.25, 2));
      const fade = Math.max(0, 1 - dist / maxDist);
      if (fade > 0.05) {
        const r = 1 + fade * 1.2;
        els.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="#444" opacity="${(fade * 0.5).toFixed(2)}"/>`);
      }
    }
  }
  return els.join('');
}

// ============================================================
// MINTLIFY — Diagonal lines + radial green tint
// Ray.so: #070a08 bg, diagonal lines, radial green gradient glow,
//         12px radius, heavy box shadow
// ============================================================
function mintlifyLines(w: number, h: number): string {
  const sp = 6;
  return `
    <defs>
      <pattern id="ovl-mint-lines" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse">
        <line x1="0" y1="${sp}" x2="${sp}" y2="0" stroke="#1e1e1e" stroke-width="0.6"/>
      </pattern>
      <radialGradient id="ovl-mint-glow" cx="59%" cy="-7%">
        <stop offset="39%" stop-color="rgba(13,147,115,0.1)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#ovl-mint-lines)"/>
    <rect width="${w}" height="${h}" fill="url(#ovl-mint-glow)"/>`;
}

// ============================================================
// RESEND — Warped topographic lines
// ============================================================
function resendTopo(w: number, h: number): string {
  const lines: string[] = [];
  const count = Math.max(20, Math.round(h / 12));
  for (let i = 0; i < count; i++) {
    const baseY = (i / count) * h;
    const pts: string[] = [];
    for (let x = 0; x <= w; x += 4) {
      const warp = Math.sin(x * 0.008 + i * 0.3) * 12 + Math.sin(x * 0.015 + i * 0.5) * 8;
      pts.push(`${x},${(baseY + warp).toFixed(1)}`);
    }
    lines.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#444" stroke-width="0.5" opacity="0.4"/>`);
  }
  return lines.join('');
}

// ============================================================
// TRIGGER.DEV — Gridlines + dot patterns at top/bottom
// Ray.so: #121317 bg, gridlines, radial dot patterns at top & bottom edges
// ============================================================
function triggerdevGrid(w: number, h: number, p: number): string {
  const sp = 48;
  const els: string[] = [];

  // Gridlines
  for (let x = sp; x < w; x += sp) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#272a2e" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#272a2e" stroke-width="1"/>`);
  }

  // Dot patterns at top and bottom (radial fade from center)
  const dotSp = 12;
  const topZone = p * 0.7;
  const bottomStart = h - p * 0.7;
  for (let x = dotSp / 2; x < w; x += dotSp) {
    // Top dots
    for (let y = dotSp / 2; y < topZone; y += dotSp) {
      const distFromCenter = Math.abs(x - w / 2) / (w / 2);
      const fade = Math.max(0, 1 - distFromCenter);
      if (fade > 0.1) {
        els.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="0.8" fill="#444" opacity="${(fade * 0.4).toFixed(2)}"/>`);
      }
    }
    // Bottom dots
    for (let y = bottomStart; y < h; y += dotSp) {
      const distFromCenter = Math.abs(x - w / 2) / (w / 2);
      const fade = Math.max(0, 1 - distFromCenter);
      if (fade > 0.1) {
        els.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="0.8" fill="#444" opacity="${(fade * 0.4).toFixed(2)}"/>`);
      }
    }
  }

  return els.join('');
}

// ============================================================
// FIRECRAWL — Grid + SVG overlay frame + ASCII art
// Ray.so: black bg, grid, corner decorations, orange ASCII flame
// ============================================================
function firecrawlGrid(w: number, h: number): string {
  const sp = 48;
  const els: string[] = [];

  // Grid
  for (let x = sp; x < w; x += sp) {
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1a1a1a" stroke-width="1"/>`);
  }
  for (let y = sp; y < h; y += sp) {
    els.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1a1a1a" stroke-width="1"/>`);
  }

  // Corner cross decorations
  const crossLen = 12, margin = 16;
  const cPoints = [
    { x: margin, y: margin },
    { x: w - margin, y: margin },
    { x: margin, y: h - margin },
    { x: w - margin, y: h - margin },
  ];
  for (const c of cPoints) {
    els.push(`<line x1="${c.x - crossLen}" y1="${c.y}" x2="${c.x + crossLen}" y2="${c.y}" stroke="#333" stroke-width="1"/>`);
    els.push(`<line x1="${c.x}" y1="${c.y - crossLen}" x2="${c.x}" y2="${c.y + crossLen}" stroke="#333" stroke-width="1"/>`);
  }

  // ASCII flame art at bottom
  const flame = [
    '       .:. .:  .:.  . .:.',
    '   .+:+:+:.+:++++:+:+++:+:+:.',
    ' .:+:XXXXX+:+:+:+XXXXX:+:+.',
    '.+:XXXXXXXXX+:+XXXXXXXXX+.',
  ];
  const startY = h - 70;
  for (let i = 0; i < flame.length; i++) {
    els.push(`<text x="${w / 2}" y="${startY + i * 13}" font-family="monospace" font-size="9" fill="#f97316" text-anchor="middle" opacity="${(0.3 + i * 0.17).toFixed(2)}">${flame[i]}</text>`);
  }

  return els.join('');
}

// ============================================================
// BROWSERBASE — Vertical dashed gridlines
// Ray.so: black bg with orange-to-black gradient, 7 dashed vertical lines
// ============================================================
function browserbaseLines(w: number, h: number): string {
  const count = 7;
  const els: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round((w / (count + 1)) * (i + 1));
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="6 4"/>`);
  }
  return els.join('');
}

// ============================================================
// STRIPE — Vertical solid gridlines
// Ray.so: #0a2540 bg, vertical lines #0f395e
// ============================================================
function stripeLines(w: number, h: number): string {
  const count = 5;
  const els: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round((w / (count + 1)) * (i + 1));
    els.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#0f395e" stroke-width="1" opacity="0.5"/>`);
  }
  return els.join('');
}

// ============================================================
// GEMINI — Star field
// Ray.so: #0e1016 bg, scattered stars at ~80% opacity, 26px radius
// ============================================================
function geminiStars(w: number, h: number): string {
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const count = 200;
  const stars: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.5 + rand() * 1.5;
    const o = (0.3 + rand() * 0.7) * 0.8;
    stars.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="white" opacity="${o.toFixed(2)}"/>`);
  }
  return stars.join('');
}

// ============================================================
// NOIR — Noise texture (tiling pattern)
// ============================================================
function noirNoise(w: number, h: number): string {
  let seed = 123;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const tw = 200, th = 200;
  const px: string[] = [];
  for (let i = 0; i < 600; i++) {
    const x = Math.round(rand() * tw);
    const y = Math.round(rand() * th);
    const o = 0.02 + rand() * 0.1;
    const s = 1 + rand() * 2;
    px.push(`<rect x="${x}" y="${y}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="white" opacity="${o.toFixed(2)}"/>`);
  }
  return `<defs><pattern id="ovl-noir-noise" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${px.join('')}</pattern></defs><rect width="${w}" height="${h}" fill="url(#ovl-noir-noise)"/>`;
}

// ============================================================
// ICE — Dot grid (tiling pattern)
// ============================================================
function iceDots(w: number, h: number): string {
  const sp = 17;
  return `<defs><pattern id="ovl-ice-dots" width="${sp}" height="${sp}" patternUnits="userSpaceOnUse"><circle cx="${sp / 2}" cy="${sp / 2}" r="1" fill="rgba(0,0,0,0.15)"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#ovl-ice-dots)"/>`;
}
