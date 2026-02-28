import Prism from 'prismjs';

// Import core/markup first (many languages depend on it)
import 'prismjs/components/prism-markup';

// Core languages (must be loaded before dependents)
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-ruby';

// Languages that depend on core
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-apacheconf';
import 'prismjs/components/prism-makefile';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-git';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-elixir';
import 'prismjs/components/prism-erlang';
import 'prismjs/components/prism-clojure';
import 'prismjs/components/prism-fsharp';
import 'prismjs/components/prism-ocaml';
import 'prismjs/components/prism-elm';
import 'prismjs/components/prism-lisp';
import 'prismjs/components/prism-scheme';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-d';
import 'prismjs/components/prism-nim';
import 'prismjs/components/prism-zig';
import 'prismjs/components/prism-crystal';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-julia';
import 'prismjs/components/prism-fortran';
import 'prismjs/components/prism-latex';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-groovy';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-coffeescript';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-pascal';
import 'prismjs/components/prism-verilog';
import 'prismjs/components/prism-vhdl';
import 'prismjs/components/prism-nasm';
import 'prismjs/components/prism-wasm';
import 'prismjs/components/prism-glsl';
import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-pug';
import 'prismjs/components/prism-hcl';
import 'prismjs/components/prism-protobuf';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-gherkin';
import 'prismjs/components/prism-regex';
import 'prismjs/components/prism-vim';
import 'prismjs/components/prism-tcl';
import 'prismjs/components/prism-prolog';
import 'prismjs/components/prism-brainfuck';

// Language alias mapping (for languages with different Prism identifiers)
const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'markup',
  xml: 'markup',
  apache: 'apacheconf',
  shell: 'bash',
};

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

// Check if text contains ANSI escape sequences
const ANSI_REGEX = /\x1b\[[0-9;]*m/;

export function containsAnsi(text: string): boolean {
  return ANSI_REGEX.test(text);
}

export function highlightWithAnsi(code: string, language: string): string {
  // If the code already contains ANSI codes, preserve them as-is
  if (containsAnsi(code)) {
    return code;
  }

  if (language === 'plain' || !code) {
    return code;
  }

  // Resolve language aliases
  const resolvedLanguage = LANGUAGE_ALIASES[language] || language;

  const grammar = Prism.languages[resolvedLanguage];
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
