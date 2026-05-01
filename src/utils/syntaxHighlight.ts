import Prism from 'prismjs';
import { ANSI, TOKEN_COLORS, LANGUAGE_ALIASES } from '@/lib/svgHelpers';

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

// PrismJS doesn't highlight custom type references in TypeScript (e.g. `x: MyType`).
// Add a grammar rule to catch capitalized identifiers after `:` or inside `<>` as class-name tokens.
if (Prism.languages.typescript) {
  Prism.languages.insertBefore('typescript', 'operator', {
    'class-name-inline': {
      pattern: /(?<=[\s:,<(])[A-Z]\w*(?=\s*[<>[\],;)=&|]|\s*$)/m,
      alias: 'class-name',
    },
  });
}
if (Prism.languages.tsx) {
  Prism.languages.insertBefore('tsx', 'operator', {
    'class-name-inline': {
      pattern: /(?<=[\s:,<(])[A-Z]\w*(?=\s*[<>[\],;)=&|]|\s*$)/m,
      alias: 'class-name',
    },
  });
}
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

type PrismToken = string | Prism.Token;

function processToken(token: PrismToken): string {
  if (typeof token === 'string') {
    return token;
  }

  // Check alias first (e.g. 'class-name-inline' has alias 'class-name')
  const alias = typeof token.alias === 'string' ? token.alias : Array.isArray(token.alias) ? token.alias[0] : undefined;
  const color = TOKEN_COLORS[token.type] || (alias && TOKEN_COLORS[alias]) || '';
  const content = Array.isArray(token.content)
    ? token.content.map(processToken).join('')
    : typeof token.content === 'string'
    ? token.content
    : processToken(token.content);

  return color ? `${color}${content}${ANSI.reset}` : content;
}

const ANSI_REGEX = /\x1b(?:\[[0-9;:]*[A-Za-z]|\][^\x07]*\x07|\(B|=|>|c)/;
const LITERAL_ESCAPE_REGEX = /\\u001[bB]|\\x1[bB]|\\033|\\e/g;
// Matches CSI (e.g. \x1b[31m) and OSC (e.g. \x1b]…\x07) sequences so we can
// passthrough pre-styled regions during highlighting instead of tokenizing them.
const ANSI_PASSTHROUGH_REGEX = /\x1b\[[0-9;:]*[A-Za-z]|\x1b\].*?(?:\x07|\x1b\\)/g;

export function normalizeAnsiEscapes(text: string): string {
  return text.replace(LITERAL_ESCAPE_REGEX, '\x1b');
}

export function containsAnsi(text: string): boolean {
  if (ANSI_REGEX.test(text)) return true;
  return LITERAL_ESCAPE_REGEX.test(text);
}

export function highlightWithAnsi(code: string, language: string): string {
  if (language === 'plain' || !code) {
    return code;
  }

  const resolvedLanguage = LANGUAGE_ALIASES[language] || language;
  const grammar = Prism.languages[resolvedLanguage];

  if (!grammar) {
    return code;
  }

  const tokenizeSegment = (segment: string): string => {
    if (!segment) return '';
    try {
      return Prism.tokenize(segment, grammar).map(processToken).join('');
    } catch {
      return segment;
    }
  };

  // Fast path: no embedded ANSI — tokenize the whole input.
  if (!code.includes('\x1b')) {
    return tokenizeSegment(code);
  }

  // Hybrid path: tokenize plain segments, passthrough ANSI sequences verbatim
  // so users can mix syntax-highlighted code with inline ANSI styling.
  let result = '';
  let lastIndex = 0;
  ANSI_PASSTHROUGH_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANSI_PASSTHROUGH_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += tokenizeSegment(code.slice(lastIndex, match.index));
    }
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) {
    result += tokenizeSegment(code.slice(lastIndex));
  }
  return result;
}
