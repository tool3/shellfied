export const SAMPLE_CODES = {
  default: `$ npm install shellfie
added 1 package in 0.5s

$ shellfie --version
shellfie v1.0.0`,

  gitStatus: `$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  \x1b[32m(use "git restore --staged <file>..." to unstage)\x1b[0m
        \x1b[32mmodified:   src/components/Editor.tsx\x1b[0m
        \x1b[32mnew file:   src/hooks/useShellfie.ts\x1b[0m

Changes not staged for commit:
  \x1b[31m(use "git add <file>..." to update what will be committed)\x1b[0m
        \x1b[31mmodified:   package.json\x1b[0m`,

  npmTest: `$ npm test

\x1b[1m PASS \x1b[0m \x1b[2msrc/\x1b[22m\x1b[1mparser.test.ts\x1b[22m
  \x1b[32m✓\x1b[39m \x1b[2mparses basic ANSI codes (3 ms)\x1b[22m
  \x1b[32m✓\x1b[39m \x1b[2mhandles 256 colors (1 ms)\x1b[22m
  \x1b[32m✓\x1b[39m \x1b[2msupports true color (1 ms)\x1b[22m

\x1b[1m PASS \x1b[0m \x1b[2msrc/\x1b[22m\x1b[1mrender.test.ts\x1b[22m
  \x1b[32m✓\x1b[39m \x1b[2mrenders SVG correctly (5 ms)\x1b[22m
  \x1b[32m✓\x1b[39m \x1b[2mapplies theme colors (2 ms)\x1b[22m

\x1b[1mTest Suites:\x1b[22m \x1b[32m2 passed\x1b[39m, 2 total
\x1b[1mTests:\x1b[22m       \x1b[32m5 passed\x1b[39m, 5 total
\x1b[1mTime:\x1b[22m        0.892 s`,

  colorDemo: `\x1b[1;4mANSI Color Demo\x1b[0m

\x1b[30m███\x1b[31m███\x1b[32m███\x1b[33m███\x1b[34m███\x1b[35m███\x1b[36m███\x1b[37m███\x1b[0m
\x1b[90m███\x1b[91m███\x1b[92m███\x1b[93m███\x1b[94m███\x1b[95m███\x1b[96m███\x1b[97m███\x1b[0m

\x1b[1mBold\x1b[0m \x1b[2mDim\x1b[0m \x1b[3mItalic\x1b[0m \x1b[4mUnderline\x1b[0m \x1b[9mStrikethrough\x1b[0m

\x1b[32m✓\x1b[0m Success  \x1b[33m⚠\x1b[0m Warning  \x1b[31m✗\x1b[0m Error  \x1b[34mℹ\x1b[0m Info`,

  typescript: `import shellfie from 'shellfie';

interface Options {
  theme: 'dracula' | 'nord';
  template: 'macos' | 'windows';
}

const createScreenshot = (
  input: string,
  options: Options
): string => {
  return shellfie(input, {
    ...options,
    fontSize: 14,
    padding: [16, 24],
  });
};

export default createScreenshot;`,

  neofetch: `\x1b[32m                    'c.          \x1b[0m  \x1b[32muser\x1b[0m@\x1b[32mmacbook\x1b[0m
\x1b[32m                 ,xNMM.          \x1b[0m  \x1b[32m-----------\x1b[0m
\x1b[32m               .OMMMMo           \x1b[0m  \x1b[33mOS:\x1b[0m macOS 14.0 Sonoma
\x1b[32m               OMMM0,            \x1b[0m  \x1b[33mHost:\x1b[0m MacBook Pro (16-inch)
\x1b[32m     .;loddo:' loolloddol;.     \x1b[0m  \x1b[33mKernel:\x1b[0m Darwin 23.0.0
\x1b[32m   cKMMMMMMMMMMNWMMMMMMMMMM0:   \x1b[0m  \x1b[33mUptime:\x1b[0m 2 days, 5 hours
\x1b[33m .KMMMMMMMMMMMMMMMMMMMMMMMWd.   \x1b[0m  \x1b[33mPackages:\x1b[0m 245 (brew)
\x1b[33m XMMMMMMMMMMMMMMMMMMMMMMMX.     \x1b[0m  \x1b[33mShell:\x1b[0m zsh 5.9
\x1b[31m;MMMMMMMMMMMMMMMMMMMMMMMM:      \x1b[0m  \x1b[33mTerminal:\x1b[0m iTerm2
\x1b[31m:MMMMMMMMMMMMMMMMMMMMMMMM:      \x1b[0m  \x1b[33mCPU:\x1b[0m Apple M2 Pro
\x1b[31m.MMMMMMMMMMMMMMMMMMMMMMMMX.     \x1b[0m  \x1b[33mMemory:\x1b[0m 8192MB / 16384MB
\x1b[31m kMMMMMMMMMMMMMMMMMMMMMMMMWd.   \x1b[0m
\x1b[35m .XMMMMMMMMMMMMMMMMMMMMMMMMMMk  \x1b[0m  \x1b[30m███\x1b[31m███\x1b[32m███\x1b[33m███\x1b[34m███\x1b[35m███\x1b[36m███\x1b[37m███\x1b[0m
\x1b[35m  .XMMMMMMMMMMMMMMMMMMMMMMMMK.  \x1b[0m  \x1b[90m███\x1b[91m███\x1b[92m███\x1b[93m███\x1b[94m███\x1b[95m███\x1b[96m███\x1b[97m███\x1b[0m`,

  errorLog: `\x1b[90m2024-01-15 10:23:45\x1b[0m \x1b[34m[INFO]\x1b[0m  Server starting on port 3000
\x1b[90m2024-01-15 10:23:46\x1b[0m \x1b[34m[INFO]\x1b[0m  Connected to database
\x1b[90m2024-01-15 10:24:12\x1b[0m \x1b[33m[WARN]\x1b[0m  Slow query detected (1.2s)
\x1b[90m2024-01-15 10:25:33\x1b[0m \x1b[31m[ERROR]\x1b[0m Connection refused: ECONNREFUSED
\x1b[90m2024-01-15 10:25:34\x1b[0m \x1b[31m[ERROR]\x1b[0m Retry attempt 1/3 failed
\x1b[90m2024-01-15 10:25:35\x1b[0m \x1b[32m[INFO]\x1b[0m  Retry attempt 2/3 succeeded
\x1b[90m2024-01-15 10:26:00\x1b[0m \x1b[34m[INFO]\x1b[0m  Health check: \x1b[32mOK\x1b[0m`,
} as const;

export type SampleCodeKey = keyof typeof SAMPLE_CODES;

export const SAMPLE_CODE_OPTIONS: Array<{ id: SampleCodeKey; label: string }> = [
  { id: 'default', label: 'npm install' },
  { id: 'gitStatus', label: 'git status' },
  { id: 'npmTest', label: 'npm test' },
  { id: 'colorDemo', label: 'Color Demo' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'neofetch', label: 'neofetch' },
  { id: 'errorLog', label: 'Error Log' },
];
