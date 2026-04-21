import { templates } from 'shellfie';
import type { WatermarkStyle, WatermarkConfig as ShellfieWatermarkConfig } from 'shellfie';
import { TERMINAL_THEMES } from '@/constants/themes';
import type {
  HeaderConfig,
  FooterConfig,
  ControlsPosition,
  TemplateType,
  CustomTheme,
  WatermarkConfig,
} from '@/types';

export const CSS_COLORS: Record<string, string> = {
  black: '#000000', silver: '#c0c0c0', gray: '#808080', grey: '#808080',
  white: '#ffffff', maroon: '#800000', red: '#ff0000', purple: '#800080',
  fuchsia: '#ff00ff', green: '#008000', lime: '#00ff00', olive: '#808000',
  yellow: '#ffff00', navy: '#000080', blue: '#0000ff', teal: '#008080',
  aqua: '#00ffff', orange: '#ffa500', aliceblue: '#f0f8ff', antiquewhite: '#faebd7',
  aquamarine: '#7fffd4', azure: '#f0ffff', beige: '#f5f5dc', bisque: '#ffe4c4',
  blanchedalmond: '#ffebcd', blueviolet: '#8a2be2', brown: '#a52a2a',
  burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
  chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff', darkblue: '#00008b',
  darkcyan: '#008b8b', darkgoldenrod: '#b8860b', darkgray: '#a9a9a9',
  darkgreen: '#006400', darkgrey: '#a9a9a9', darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00',
  darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f', darkturquoise: '#00ced1', darkviolet: '#9400d3',
  deeppink: '#ff1493', deepskyblue: '#00bfff', dimgray: '#696969',
  dimgrey: '#696969', dodgerblue: '#1e90ff', firebrick: '#b22222',
  floralwhite: '#fffaf0', forestgreen: '#228b22', gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff', gold: '#ffd700', goldenrod: '#daa520',
  greenyellow: '#adff2f', honeydew: '#f0fff0', hotpink: '#ff69b4',
  indianred: '#cd5c5c', indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c',
  lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd', lightblue: '#add8e6', lightcoral: '#f08080',
  lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
  lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa',
  lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0', limegreen: '#32cd32', linen: '#faf0e6',
  magenta: '#ff00ff', mediumaquamarine: '#66cdaa', mediumblue: '#0000cd',
  mediumorchid: '#ba55d3', mediumpurple: '#9370db', mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee', mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc', mediumvioletred: '#c71585', midnightblue: '#191970',
  mintcream: '#f5fffa', mistyrose: '#ffe4e1', moccasin: '#ffe4b5',
  navajowhite: '#ffdead', oldlace: '#fdf5e6', olivedrab: '#6b8e23',
  orangered: '#ff4500', orchid: '#da70d6', palegoldenrod: '#eee8aa',
  palegreen: '#98fb98', paleturquoise: '#afeeee', palevioletred: '#db7093',
  papayawhip: '#ffefd5', peachpuff: '#ffdab9', peru: '#cd853f', pink: '#ffc0cb',
  plum: '#dda0dd', powderblue: '#b0e0e6', rosybrown: '#bc8f8f',
  royalblue: '#4169e1', saddlebrown: '#8b4513', salmon: '#fa8072',
  sandybrown: '#f4a460', seagreen: '#2e8b57', seashell: '#fff5ee',
  sienna: '#a0522d', skyblue: '#87ceeb', slateblue: '#6a5acd',
  slategray: '#708090', slategrey: '#708090', snow: '#fffafa',
  springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c',
  thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0', violet: '#ee82ee',
  wheat: '#f5deb3', whitesmoke: '#f5f5f5', yellowgreen: '#9acd32',
};

export const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
} as const;

export const TOKEN_COLORS: Record<string, string> = {
  comment: ANSI.brightBlack,
  prolog: ANSI.brightBlack,
  doctype: ANSI.brightBlack,
  cdata: ANSI.brightBlack,
  punctuation: ANSI.white,
  operator: ANSI.cyan,
  property: ANSI.cyan,
  tag: ANSI.red,
  'attr-name': ANSI.yellow,
  'attr-value': ANSI.green,
  string: ANSI.green,
  'template-string': ANSI.green,
  char: ANSI.green,
  number: ANSI.magenta,
  boolean: ANSI.magenta,
  constant: ANSI.magenta,
  keyword: ANSI.red,
  atrule: ANSI.red,
  selector: ANSI.red,
  important: ANSI.red,
  function: ANSI.blue,
  'function-variable': ANSI.blue,
  'class-name': ANSI.yellow,
  builtin: ANSI.cyan,
  variable: ANSI.brightCyan,
  symbol: ANSI.brightMagenta,
  regex: ANSI.brightGreen,
  shebang: ANSI.brightBlack,
  command: ANSI.brightBlue,
  parameter: ANSI.brightCyan,
  assign: ANSI.white,
};

export const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'markup',
  xml: 'markup',
  apache: 'apacheconf',
  shell: 'bash',
};

export function colorToAnsi(color: string): string {
  const trimmed = color.trim().toLowerCase();
  const hex = CSS_COLORS[trimmed] || trimmed;

  // Try 6-digit hex
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  // Try 3-digit hex
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (short) {
    const r = parseInt(short[1] + short[1], 16);
    const g = parseInt(short[2] + short[2], 16);
    const b = parseInt(short[3] + short[3], 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  return '';
}

export function hasAnsiCodes(text: string): boolean {
  return /\x1b\[|\\x1b\[|\\033\[|\\e\[/.test(text);
}

export function parseAnsiEscapes(text: string): string {
  return text
    .replace(/\\x1b\[/gi, '\x1b[')
    .replace(/\\033\[/g, '\x1b[')
    .replace(/\\e\[/g, '\x1b[');
}

export function parseStyleString(styleStr: string): { color?: string; style: WatermarkStyle } {
  const style: WatermarkStyle = {};
  let color: string | undefined;

  if (!styleStr) return { color, style };

  const declarations = styleStr.split(/[;\n]/).filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;

    const property = decl.slice(0, colonIndex).trim().toLowerCase();
    const value = decl.slice(colonIndex + 1).trim();

    if (!property || !value) continue;

    if (property === 'color') {
      color = value;
      continue;
    }

    if (property === 'padding' || property === 'margin') {
      const parts = value.split(/\s+/).map((v) => parseFloat(v) || 0);
      if (parts.length === 1) {
        style[property] = parts[0];
      } else if (parts.length === 2) {
        style[property] = [parts[0], parts[1]] as [number, number];
      } else if (parts.length >= 4) {
        style[property] = [parts[0], parts[1], parts[2], parts[3]] as [number, number, number, number];
      }
    } else if (property === 'opacity') {
      style.opacity = parseFloat(value) || 1;
    } else {
      style[property] = value;
    }
  }

  return { color, style };
}

export function buildWatermarkConfig(watermark: WatermarkConfig): ShellfieWatermarkConfig | undefined {
  if (watermark.type === 'markup') {
    if (!watermark.markup) return undefined;
    return { content: watermark.markup, type: 'markup' as const };
  }

  if (!watermark.text) return undefined;

  if (hasAnsiCodes(watermark.text)) {
    return { content: parseAnsiEscapes(watermark.text), type: 'text' as const };
  }

  const { color, style } = parseStyleString(watermark.style);
  const colorCode = colorToAnsi(color || '#888888');
  const content = `${colorCode}${watermark.text}${ANSI.reset}`;

  return { content, type: 'text' as const, style };
}

export function buildTemplate(
  templateType: TemplateType,
  controlsPosition: ControlsPosition,
  borderRadius: number,
  borderColor?: string,
  borderWidth?: number,
) {
  const baseTemplate = templates[templateType];
  if (!baseTemplate) return templateType;

  const defaultPosition = templateType === 'windows' ? 'right' : 'left';
  const defaultRadius = baseTemplate.shell.borderRadius;
  const hasBorder = !!borderColor;

  if (controlsPosition === defaultPosition && borderRadius === defaultRadius && !hasBorder) {
    return templateType;
  }

  return {
    ...baseTemplate,
    shell: {
      ...baseTemplate.shell,
      controlsPosition,
      borderRadius,
      ...(hasBorder ? { border: true, borderColor, borderWidth: borderWidth || 1 } : {}),
    },
  };
}

export function getTheme(themeName: string, customThemes: CustomTheme[] = []) {
  const customTheme = customThemes.find((t) => t.id === themeName);
  if (customTheme) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...themeWithoutId } = customTheme;
    return themeWithoutId;
  }
  return TERMINAL_THEMES[themeName as keyof typeof TERMINAL_THEMES]?.theme;
}

export function buildHeaderOptions(header: HeaderConfig) {
  if (!header.enabled) return undefined;
  return {
    backgroundColor: header.backgroundColor || undefined,
    height: header.height,
    border: header.border,
    borderColor: header.borderColor || undefined,
    borderWidth: header.borderWidth,
  };
}

export function buildFooterOptions(footer: FooterConfig) {
  if (!footer.enabled) return undefined;
  return {
    backgroundColor: footer.backgroundColor || undefined,
    height: footer.height,
    border: footer.border,
    borderColor: footer.borderColor || undefined,
    borderWidth: footer.borderWidth,
  };
}

export function getSvgWidth(svg: string): number {
  const match = svg.match(/width="(\d+(?:\.\d+)?)"/);
  return match ? parseFloat(match[1]) : 0;
}

export function getSvgDimensions(svgContent: string): { width: number; height: number } {
  const widthMatch = svgContent.match(/width="(\d+(?:\.\d+)?)"/);
  const heightMatch = svgContent.match(/height="(\d+(?:\.\d+)?)"/);

  let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 0;

  // Fallback to viewBox
  if (!width || !height) {
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/).map(parseFloat);
      if (parts.length === 4) {
        width = width || parts[2];
        height = height || parts[3];
      }
    }
  }

  return { width: width || 800, height: height || 600 };
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function extractSvgContent(svgString: string): string {
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : '';
}
