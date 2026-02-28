// Comprehensive list of programming languages supported
// Based on Carbon and Prism.js language support

export interface LanguageOption {
  value: string;
  label: string;
  prismAlias?: string; // If Prism uses a different identifier
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  // Most common first
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
