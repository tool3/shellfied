/**
 * Post-process an SVG to fit a target aspect ratio.
 * Modifies the SVG's viewBox/dimensions and wraps content in a centered group.
 */
export function applyAspectRatio(svg: string, aspectRatio: string): string {
  if (!aspectRatio || aspectRatio === 'auto') return svg;

  const parts = aspectRatio.split(':').map(Number);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return svg;
  const targetRatio = parts[0] / parts[1];

  // Parse current dimensions from the <svg> element
  const svgTagMatch = svg.match(/<svg\b[^>]*>/);
  if (!svgTagMatch) return svg;
  const svgTag = svgTagMatch[0];

  const wMatch = svgTag.match(/\bwidth="([^"]+)"/);
  const hMatch = svgTag.match(/\bheight="([^"]+)"/);
  if (!wMatch || !hMatch) return svg;

  const curW = parseFloat(wMatch[1]);
  const curH = parseFloat(hMatch[1]);
  if (!curW || !curH) return svg;

  const curRatio = curW / curH;
  if (Math.abs(curRatio - targetRatio) < 0.01) return svg;

  // Calculate new dimensions (expand to fit target ratio)
  let newW: number, newH: number;
  if (curRatio > targetRatio) {
    newW = curW;
    newH = Math.round(curW / targetRatio * 100) / 100;
  } else {
    newH = curH;
    newW = Math.round(curH * targetRatio * 100) / 100;
  }

  const offsetX = Math.round((newW - curW) / 2 * 100) / 100;
  const offsetY = Math.round((newH - curH) / 2 * 100) / 100;

  // Update the <svg> element's viewBox and dimensions
  let newSvgTag = svgTag;
  if (/viewBox="[^"]*"/.test(newSvgTag)) {
    newSvgTag = newSvgTag.replace(/viewBox="[^"]*"/, `viewBox="0 0 ${newW} ${newH}"`);
  } else {
    newSvgTag = newSvgTag.replace(/>$/, ` viewBox="0 0 ${newW} ${newH}">`);
  }
  newSvgTag = newSvgTag.replace(/\bwidth="[^"]*"/, `width="${newW}"`);
  newSvgTag = newSvgTag.replace(/\bheight="[^"]*"/, `height="${newH}"`);

  let result = svg.replace(svgTagMatch[0], newSvgTag);

  // Find the first <rect in the SVG body (background rect) and expand it
  // The background rect has width/height matching the original SVG dimensions
  const bgRectPattern = new RegExp(
    `(<rect\\b)([^>]*?)\\bwidth="${escapeRegex(String(curW))}"([^>]*?)\\bheight="${escapeRegex(String(curH))}"`,
  );
  const bgMatch = result.match(bgRectPattern);

  if (bgMatch) {
    // Replace the background rect with full-size rect at origin
    const replacement = `${bgMatch[1]}${bgMatch[2]}width="${newW}"${bgMatch[3]}height="${newH}"`;
    result = result.replace(bgMatch[0], replacement);
  }

  // Wrap all content AFTER the background rect group in a translate group
  // to center it. Find the closing tag of the background group and insert
  // a transform wrapper around everything after it.
  //
  // Shellfie SVG structure:
  //   <svg>
  //     <defs>...</defs>
  //     <rect .../> (background rect — already expanded above)
  //     ... (animation, overlays, terminal group)
  //   </svg>
  //
  // We need to offset the terminal content but NOT the background.
  // Insert a wrapping <g transform="translate(...)"> around everything
  // after the background rect up to </svg>.

  // Find the position right after the background rect
  if (offsetX > 0 || offsetY > 0) {
    // Find the first <rect.../> or <rect...></rect> in the body (after <svg> tag)
    const svgTagEnd = result.indexOf('>') + 1;
    const bodyStart = result.indexOf('>', result.indexOf('<svg')) + 1;

    // Find all top-level elements after defs and background rect
    // Strategy: find the background rect end, then wrap remaining content in a g transform
    const firstRectEnd = findFirstRectEnd(result, bodyStart);
    if (firstRectEnd > 0) {
      const closingSvg = result.lastIndexOf('</svg>');
      if (closingSvg > firstRectEnd) {
        const beforeContent = result.slice(0, firstRectEnd);
        const content = result.slice(firstRectEnd, closingSvg);
        const after = result.slice(closingSvg);

        result = `${beforeContent}<g transform="translate(${offsetX},${offsetY})">${content}</g>${after}`;
      }
    }
  }

  return result;
}

/**
 * Find the end position of the first <rect.../> element after startPos.
 */
function findFirstRectEnd(svg: string, startPos: number): number {
  // Skip past any <defs>...</defs> blocks
  let pos = startPos;

  // Skip whitespace
  while (pos < svg.length && /\s/.test(svg[pos])) pos++;

  // Skip <defs>...</defs> if present
  if (svg.slice(pos, pos + 5) === '<defs') {
    const defsEnd = svg.indexOf('</defs>', pos);
    if (defsEnd > 0) {
      pos = defsEnd + 7; // length of '</defs>'
    }
  }

  // Skip whitespace
  while (pos < svg.length && /\s/.test(svg[pos])) pos++;

  // Now find the first <rect
  if (svg.slice(pos, pos + 5) === '<rect') {
    // Self-closing: <rect ... />
    const selfClose = svg.indexOf('/>', pos);
    const openClose = svg.indexOf('</rect>', pos);

    if (selfClose > 0 && (openClose < 0 || selfClose < openClose)) {
      return selfClose + 2;
    }
    if (openClose > 0) {
      return openClose + 7;
    }
  }

  return -1;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
