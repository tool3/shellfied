// Comprehensive list of programming languages supported
// Based on Carbon and Prism.js language support

export interface LanguageOption {
  value: string;
  label: string;
  prismAlias?: string; // If Prism uses a different identifier
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  // Auto-detect first (default)
  { value: 'auto', label: 'Auto Detect' },
  // Most common
  { value: 'plain', label: 'Plain Text' },
  { value: 'bash', label: 'Shell / Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'scala', label: 'Scala' },

  // Web technologies
  { value: 'html', label: 'HTML', prismAlias: 'markup' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'sass', label: 'Sass' },
  { value: 'less', label: 'Less' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML', prismAlias: 'markup' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'graphql', label: 'GraphQL' },

  // Scripting & Config
  { value: 'yaml', label: 'YAML' },
  { value: 'toml', label: 'TOML' },
  { value: 'ini', label: 'INI' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'docker', label: 'Dockerfile', prismAlias: 'docker' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache', prismAlias: 'apacheconf' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'diff', label: 'Diff' },
  { value: 'git', label: 'Git' },

  // Database
  { value: 'sql', label: 'SQL' },

  // Functional
  { value: 'haskell', label: 'Haskell' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'fsharp', label: 'F#' },
  { value: 'ocaml', label: 'OCaml' },
  { value: 'elm', label: 'Elm' },
  { value: 'lisp', label: 'Lisp' },
  { value: 'scheme', label: 'Scheme' },

  // Systems
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'd', label: 'D' },
  { value: 'nim', label: 'Nim' },
  { value: 'zig', label: 'Zig' },
  { value: 'crystal', label: 'Crystal' },

  // Scientific
  { value: 'r', label: 'R' },
  { value: 'julia', label: 'Julia' },
  { value: 'fortran', label: 'Fortran' },
  { value: 'latex', label: 'LaTeX' },

  // Other popular
  { value: 'lua', label: 'Lua' },
  { value: 'perl', label: 'Perl' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'dart', label: 'Dart' },
  { value: 'coffeescript', label: 'CoffeeScript' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'pascal', label: 'Pascal' },

  // Hardware & Low-level
  { value: 'verilog', label: 'Verilog' },
  { value: 'vhdl', label: 'VHDL' },
  { value: 'nasm', label: 'Assembly (x86)' },
  { value: 'wasm', label: 'WebAssembly' },

  // Game Development
  { value: 'glsl', label: 'GLSL' },

  // Smart Contracts
  { value: 'solidity', label: 'Solidity' },

  // Template languages
  { value: 'pug', label: 'Pug' },

  // Infrastructure
  { value: 'hcl', label: 'HCL (Terraform)' },

  // Protocols
  { value: 'protobuf', label: 'Protocol Buffers' },
  { value: 'http', label: 'HTTP' },

  // Testing/Spec
  { value: 'gherkin', label: 'Gherkin (Cucumber)' },

  // Miscellaneous
  { value: 'regex', label: 'Regular Expression' },
  { value: 'vim', label: 'Vim Script' },
  { value: 'tcl', label: 'Tcl' },
  { value: 'prolog', label: 'Prolog' },
  { value: 'brainfuck', label: 'Brainfuck' },
];

// Language aliases for Prism (if different from value)
export const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'markup',
  xml: 'markup',
  apache: 'apacheconf',
  shell: 'bash',
};

/**
 * Auto-detect programming language from code content
 * Returns the detected language value or 'plain' if unknown
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) return 'plain';

  const trimmed = code.trim();
  const firstLine = trimmed.split('\n')[0].trim();

  // Shell/Bash patterns
  if (
    /^(\$|#!\/bin\/(ba)?sh|#!\/usr\/bin\/env (ba)?sh)/.test(firstLine) ||
    /^\s*(sudo|apt|npm|yarn|pnpm|brew|pip|git|docker|kubectl|curl|wget|chmod|chown|ls|cd|mkdir|rm|cp|mv|cat|echo|export)\s/.test(trimmed)
  ) {
    return 'bash';
  }

  // JavaScript/TypeScript patterns
  if (/^(import|export|const|let|var|function|class|interface|type)\s/.test(firstLine)) {
    // Check for TypeScript-specific
    if (/:\s*(string|number|boolean|any|void|never|unknown)\b|interface\s+\w+|type\s+\w+\s*=|<[A-Z]\w*>/.test(trimmed)) {
      // Check for JSX/TSX
      if (/<[A-Z][a-zA-Z]*[\s/>]|<\/[A-Z]/.test(trimmed)) {
        return 'tsx';
      }
      return 'typescript';
    }
    // Check for JSX
    if (/<[A-Z][a-zA-Z]*[\s/>]|<\/[A-Z]/.test(trimmed)) {
      return 'jsx';
    }
    return 'javascript';
  }

  // Python patterns
  if (
    /^(def|class|import|from|if __name__|print\(|async def)\s/.test(firstLine) ||
    /^\s*(def|class|import|from)\s/.test(trimmed) ||
    /#.*python/i.test(firstLine)
  ) {
    return 'python';
  }

  // HTML/XML patterns
  if (/^<!DOCTYPE\s+html/i.test(firstLine) || /^<html/i.test(firstLine)) {
    return 'html';
  }
  if (/^<\?xml/.test(firstLine)) {
    return 'xml';
  }

  // CSS/SCSS patterns
  if (/^(@import|@mixin|@include|\$[a-zA-Z]|\.[\w-]+\s*\{|#[\w-]+\s*\{)/.test(trimmed)) {
    if (/\$[a-zA-Z]|@mixin|@include/.test(trimmed)) {
      return 'scss';
    }
    return 'css';
  }

  // JSON pattern
  if (/^\s*[\[{]/.test(trimmed) && /[\]}]\s*$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // YAML patterns
  if (/^[a-zA-Z_][\w-]*:\s/.test(firstLine) && !trimmed.includes('{')) {
    return 'yaml';
  }

  // Markdown patterns
  if (/^#{1,6}\s/.test(firstLine) || /^\*{3,}$|^-{3,}$/.test(firstLine)) {
    return 'markdown';
  }

  // Go patterns
  if (/^package\s+\w+|^func\s|^import\s+\(/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(fn|pub fn|impl|struct|enum|use|mod)\s/.test(trimmed) || /^#\[derive/.test(trimmed)) {
    return 'rust';
  }

  // Java/Kotlin patterns
  if (/^(public|private|protected)?\s*(class|interface|enum)\s/.test(trimmed)) {
    if (/fun\s+\w+|val\s+\w+|var\s+\w+/.test(trimmed)) {
      return 'kotlin';
    }
    return 'java';
  }

  // SQL patterns
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql';
  }

  // Ruby patterns
  if (/^(require|def|class|module|end)\s/.test(trimmed) || /\.rb$/.test(firstLine)) {
    return 'ruby';
  }

  // PHP patterns
  if (/^<\?php/.test(trimmed)) {
    return 'php';
  }

  // C/C++ patterns
  if (/^#include\s*[<"]/.test(trimmed)) {
    if (/iostream|vector|string|std::/.test(trimmed)) {
      return 'cpp';
    }
    return 'c';
  }

  // Dockerfile
  if (/^FROM\s+\w+/.test(firstLine)) {
    return 'docker';
  }

  // Default to plain text
  return 'plain';
}
