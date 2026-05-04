/**
 * Composes two bare terminal SVGs into a single SVG with a unified background.
 * Used by compare mode to show before/after with one shared background + animation.
 */

import shellfie from 'shellfie';
import type { AppStore } from '@/store/types';
import { buildShellfieArgsCompare } from './shellfieOptionsBuilder';
import { getSvgWidth, getSvgDimensions, extractSvgContent } from './svgHelpers';
import { buildPatternOverlay } from './backgroundPatterns';


// Try to import shellfie's animation generator
let generateAnimation: ((type: string, w: number, h: number, padding: number, borderRadius: number, color?: string) => string) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  generateAnimation = require('shellfie/dist/animations').generateAnimation;
} catch {
  // Not available — animations won't render in compare mode
}

const GAP = 32;

interface CompareResult {
  svg: string;
  beforeWidth: number;
  afterWidth: number;
}

/**
 * Generate a compare SVG with both terminals inside a single background.
 */
export function generateCompareSvg(
  state: AppStore,
  beforeContent: string,
  afterContent: string,
  beforeLang: string,
  afterLang: string,
  beforeTitle: string,
  afterTitle: string,
): CompareResult {
  const empty = { svg: '', beforeWidth: 0, afterWidth: 0 };
  if (!beforeContent.trim() && !afterContent.trim()) return empty;

  // Generate bare terminal SVGs (no background/animation)
  const generateTerminal = (content: string, lang: string, title: string, overrideWidth?: number) => {
    if (!content.trim()) return '';
    const { content: processed, options } = buildShellfieArgsCompare(
      { ...state, content, language: lang, title }
    );
    if (!processed.trim()) return '';
    return shellfie(processed, { ...options, width: overrideWidth || options.width });
  };

  // First pass: generate to get natural widths
  const beforeInitial = generateTerminal(beforeContent, beforeLang, beforeTitle);
  const afterInitial = generateTerminal(afterContent, afterLang, afterTitle);

  const bw = getSvgWidth(beforeInitial);
  const aw = getSvgWidth(afterInitial);
  const maxWidth = Math.max(bw, aw);

  // Second pass: match widths
  const beforeSvg = (bw < maxWidth && beforeContent.trim())
    ? generateTerminal(beforeContent, beforeLang, beforeTitle, maxWidth)
    : beforeInitial;
  const afterSvg = (aw < maxWidth && afterContent.trim())
    ? generateTerminal(afterContent, afterLang, afterTitle, maxWidth)
    : afterInitial;

  if (!beforeSvg && !afterSvg) return empty;

  // Now compose into a single SVG with unified background
  // Get dimensions of the matched terminals
  const beforeDim = beforeSvg ? getSvgDimensions(beforeSvg) : { width: maxWidth || 400, height: 200 };
  const afterDim = afterSvg ? getSvgDimensions(afterSvg) : { width: maxWidth || 400, height: 200 };

  const terminalWidth = Math.max(beforeDim.width, afterDim.width);
  const terminalHeight = Math.max(beforeDim.height, afterDim.height);

  // Labels
  const labelConfig = state.compareLabelConfig;
  const beforeLabel = state.beforeLabel || 'Before';
  const afterLabel = state.afterLabel || 'After';
  const labelHeight = labelConfig.fontSize + 16; // font size + padding
  const hasLabels = !!(beforeLabel || afterLabel);

  // Layout: two terminals side by side, labels above
  const contentWidth = terminalWidth * 2 + GAP;
  const contentHeight = terminalHeight + (hasLabels ? labelHeight : 0);

  // Build background + animation SVG elements
  const bgResult = buildBackgroundSvg(state, contentWidth, contentHeight);

  // Total SVG dimensions (background padding included)
  const bgPadding = state.background.type !== 'none' ? state.background.padding : 0;
  const totalWidth = contentWidth + bgPadding * 2;
  const totalHeight = contentHeight + bgPadding * 2;

  // Extract inner content from terminal SVGs
  const beforeInner = beforeSvg ? extractSvgContent(beforeSvg) : '';
  const afterInner = afterSvg ? extractSvgContent(afterSvg) : '';

  // Extract defs from terminals (fonts, etc.)
  const beforeDefs = extractDefs(beforeSvg);
  const afterDefs = extractDefs(afterSvg);

  // Compose final SVG
  const leftX = bgPadding;
  const rightX = bgPadding + terminalWidth + GAP;
  const labelY = bgPadding + labelConfig.fontSize + 4; // baseline position
  const terminalY = bgPadding + (hasLabels ? labelHeight : 0);

  // Label text-anchor based on alignment
  const anchorMap: Record<string, string> = { left: 'start', center: 'middle', right: 'end' };
  const textAnchor = anchorMap[labelConfig.alignment] || 'start';
  const labelXOffset = labelConfig.alignment === 'center'
    ? terminalWidth / 2
    : labelConfig.alignment === 'right'
      ? terminalWidth
      : 0;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`,
  ];

  // Merge defs
  const allDefs = [beforeDefs, afterDefs].filter(Boolean).join('\n');
  if (allDefs || bgResult.defs) {
    parts.push(`<defs>${bgResult.defs || ''}${allDefs}</defs>`);
  }

  // Background
  if (bgResult.background) {
    parts.push(bgResult.background);
  }

  // Animation (if any)
  if (bgResult.animation) {
    parts.push(bgResult.animation);
  }

  // Labels
  if (hasLabels) {
    const labelStyle = `font-family:${escapeAttr(labelConfig.fontFamily)};font-size:${labelConfig.fontSize}px;font-weight:${labelConfig.fontWeight};fill:${labelConfig.color}`;
    if (beforeLabel) {
      parts.push(`<text x="${leftX + labelXOffset}" y="${labelY}" text-anchor="${textAnchor}" style="${labelStyle}">${escapeXml(beforeLabel)}</text>`);
    }
    if (afterLabel) {
      parts.push(`<text x="${rightX + labelXOffset}" y="${labelY}" text-anchor="${textAnchor}" style="${labelStyle}">${escapeXml(afterLabel)}</text>`);
    }
  }

  // Before terminal
  if (beforeInner) {
    parts.push(`<g transform="translate(${leftX},${terminalY})"><svg width="${beforeDim.width}" height="${beforeDim.height}" viewBox="0 0 ${beforeDim.width} ${beforeDim.height}">${beforeInner}</svg></g>`);
  }

  // After terminal
  if (afterInner) {
    parts.push(`<g transform="translate(${rightX},${terminalY})"><svg width="${afterDim.width}" height="${afterDim.height}" viewBox="0 0 ${afterDim.width} ${afterDim.height}">${afterInner}</svg></g>`);
  }

  parts.push('</svg>');

  return { svg: parts.join('\n'), beforeWidth: beforeDim.width, afterWidth: afterDim.width };
}

/**
 * Build background + animation SVG elements for the compare wrapper.
 */
function buildBackgroundSvg(
  state: AppStore,
  contentWidth: number,
  contentHeight: number,
): { background: string; animation: string; defs: string } {
  const bg = state.background;
  const bgPadding = bg.type !== 'none' ? bg.padding : 0;
  const totalWidth = contentWidth + bgPadding * 2;
  const totalHeight = contentHeight + bgPadding * 2;

  let background = '';
  let defs = '';

  // For 'pattern', render the user's selected base (solid/gradient) and then
  // overlay the pattern markup. Treat the base as if the type were that base.
  const baseType: 'solid' | 'gradient' | 'image' | 'none' =
    bg.type === 'pattern'
      ? bg.patternBaseType
      : (bg.type as 'solid' | 'gradient' | 'image' | 'none');

  if (baseType === 'solid') {
    background = `<rect width="${totalWidth}" height="${totalHeight}" fill="${bg.color}" rx="12"/>`;
  } else if (baseType === 'gradient') {
    const isRadial = bg.gradientDirection === 'radial' || bg.gradientDirection === 'radial-reverse';
    if (isRadial) {
      const isReverse = bg.gradientDirection === 'radial-reverse';
      const innerColor = isReverse ? bg.gradientTo : bg.gradientFrom;
      const outerColor = isReverse ? bg.gradientFrom : bg.gradientTo;
      const r = Math.max(totalWidth, totalHeight);
      const cx = totalWidth / 2;
      const cy = totalHeight / 2;
      defs = `<radialGradient id="cmp-bg-grad" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r / 2}" fx="${cx}" fy="${cy}"><stop offset="0%" stop-color="${innerColor}"/><stop offset="100%" stop-color="${outerColor}"/></radialGradient>`;
      background = `<rect width="${totalWidth}" height="${totalHeight}" fill="url(#cmp-bg-grad)" rx="12"/>`;
    } else {
      const GRADIENT_DIR_MAP: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
        'to-right': { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
        'to-left': { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
        'to-bottom': { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
        'to-top': { x1: '0%', y1: '100%', x2: '0%', y2: '0%' },
        'to-bottom-right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
        'to-top-left': { x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
        'to-bottom-left': { x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
        'to-top-right': { x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
      };
      const dir = GRADIENT_DIR_MAP[bg.gradientDirection] || GRADIENT_DIR_MAP['to-bottom-right'];
      defs = `<linearGradient id="cmp-bg-grad" x1="${dir.x1}" y1="${dir.y1}" x2="${dir.x2}" y2="${dir.y2}"><stop offset="0%" stop-color="${bg.gradientFrom}"/><stop offset="100%" stop-color="${bg.gradientTo}"/></linearGradient>`;
      background = `<rect width="${totalWidth}" height="${totalHeight}" fill="url(#cmp-bg-grad)" rx="12"/>`;
    }
  }

  if (bg.type === 'pattern') {
    background += buildPatternOverlay(bg, totalWidth, totalHeight, 'cmp-pat');
  }

  // Animation — use shellfie's animation generator if available
  let animation = '';
  if (bg.animation && generateAnimation) {
    const animSvg = generateAnimation(bg.animation, totalWidth, totalHeight, bgPadding, 12, bg.animationColor || undefined);
    if (animSvg) animation = animSvg;
  }

  return { background, animation, defs };
}

/** Extract <defs>...</defs> content from SVG string */
function extractDefs(svg: string): string {
  if (!svg) return '';
  const match = svg.match(/<defs>([\s\S]*?)<\/defs>/);
  return match ? match[1] : '';
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}
