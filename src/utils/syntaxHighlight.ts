import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';

// ANSI escape codes for terminal colors
const ANSI = {
  reset: '\x1b[0m',
  // Standard colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  // Bright colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// Map Prism token types to ANSI colors
const TOKEN_COLORS: Record<string, string> = {
  // Comments
  comment: ANSI.brightBlack,
  prolog: ANSI.brightBlack,
  doctype: ANSI.brightBlack,
  cdata: ANSI.brightBlack,

  // Punctuation and operators
  punctuation: ANSI.white,
  operator: ANSI.cyan,

  // Properties and tags
  property: ANSI.cyan,
  tag: ANSI.red,
  'attr-name': ANSI.yellow,
  'attr-value': ANSI.green,

  // Strings
  string: ANSI.green,
  'template-string': ANSI.green,
  char: ANSI.green,

  // Numbers and booleans
  number: ANSI.magenta,
  boolean: ANSI.magenta,
  constant: ANSI.magenta,

  // Keywords
  keyword: ANSI.red,
  atrule: ANSI.red,
  selector: ANSI.red,
  important: ANSI.red,

  // Functions and classes
  function: ANSI.blue,
  'function-variable': ANSI.blue,
  'class-name': ANSI.yellow,
  builtin: ANSI.cyan,

  // Variables and symbols
  variable: ANSI.brightCyan,
  symbol: ANSI.brightMagenta,
  regex: ANSI.brightGreen,

  // Shell-specific
  shebang: ANSI.brightBlack,
  command: ANSI.brightBlue,
  parameter: ANSI.brightCyan,
  assign: ANSI.white,
};

type PrismToken = string | Prism.Token;

function processToken(token: PrismToken): string {
  if (typeof token === 'string') {
    return token;
  }

  const color = TOKEN_COLORS[token.type] || '';
  const content = Array.isArray(token.content)
    ? token.content.map(processToken).join('')
    : typeof token.content === 'string'
    ? token.content
    : processToken(token.content);

  if (color) {
    return `${color}${content}${ANSI.reset}`;
  }
  return content;
}

export function highlightWithAnsi(code: string, language: string): string {
  if (language === 'plain' || !code) {
    return code;
  }

  const grammar = Prism.languages[language];
  if (!grammar) {
    return code;
  }

  try {
    const tokens = Prism.tokenize(code, grammar);
    return tokens.map(processToken).join('');
  } catch {
    return code;
  }
}
