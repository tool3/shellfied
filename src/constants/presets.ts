import type { TemplateType, PaddingTuple, BackgroundConfig } from '@/types';
import {
  createVercelBg,
  createGridlinesBg,
  createDotGridBg,
  createStarFieldBg,
  createVerticalLinesBg,
  createElevenLabsBg,
  createGlowBorderBg,
  createPatternOverlayBg,
  createNoiseTextureBg,
} from './presetBackgrounds';

export interface PresetConfig {
  id: string;
  name: string;
  category: 'partner' | 'generic';
  // Preview appearance
  previewBg: string; // CSS value for the preset card (can be gradient)
  previewFg: string;
  // Settings to apply
  settings: {
    template: TemplateType;
    terminalTheme: string;
    showControls: boolean;
    borderRadius: number;
    fontFamily: string;
    padding: PaddingTuple;
    background: Partial<BackgroundConfig>;
  };
}

// Font family constants matching FONT_FAMILY_OPTIONS
const FONT_JETBRAINS = "'JetBrains Mono', monospace";
const FONT_FIRA = "'Fira Code', monospace";
const FONT_SOURCE_CODE = "'Source Code Pro', monospace";
const FONT_IBM_PLEX = "'IBM Plex Mono', monospace";
const FONT_ROBOTO = "'Roboto Mono', monospace";
const FONT_SPACE = "'Space Mono', monospace";
const FONT_DEFAULT = "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace";

// ============================================================
// PARTNER PRESETS
// ============================================================

const vercel: PresetConfig = {
  id: 'preset-vercel',
  name: 'Vercel',
  category: 'partner',
  previewBg: '#000000',
  previewFg: '#ededed',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetVercel',
    showControls: false,
    borderRadius: 0,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createVercelBg(),
      padding: 64,
    },
  },
};

const supabase: PresetConfig = {
  id: 'preset-supabase',
  name: 'Supabase',
  category: 'partner',
  previewBg: '#121212',
  previewFg: '#3ecf8e',
  settings: {
    template: 'macos',
    terminalTheme: 'presetSupabase',
    showControls: false,
    borderRadius: 6,
    fontFamily: FONT_JETBRAINS,
    padding: [16, 24, 16, 24],
    background: {
      type: 'solid',
      color: '#121212',
      padding: 64,
    },
  },
};

const tailwind: PresetConfig = {
  id: 'preset-tailwind',
  name: 'Tailwind',
  category: 'partner',
  previewBg: '#0f172a',
  previewFg: '#38bdf8',
  settings: {
    template: 'macos',
    terminalTheme: 'presetTailwind',
    showControls: true,
    borderRadius: 8,
    fontFamily: FONT_FIRA,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createGridlinesBg('#1e293b', '#0f172a', 800, 600, 40),
      padding: 64,
    },
  },
};

const openai: PresetConfig = {
  id: 'preset-openai',
  name: 'OpenAI',
  category: 'partner',
  previewBg: 'linear-gradient(135deg, #121a29, #1a2940)',
  previewFg: '#00a67d',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetOpenAI',
    showControls: false,
    borderRadius: 8,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#121a29',
      gradientTo: '#1a2940',
      gradientDirection: 'to-bottom',
      padding: 64,
    },
  },
};

const clerk: PresetConfig = {
  id: 'preset-clerk',
  name: 'Clerk',
  category: 'partner',
  previewBg: '#222222',
  previewFg: '#bab1ff',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetClerk',
    showControls: false,
    borderRadius: 8,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createPatternOverlayBg('#111111', '#555555'),
      padding: 64,
    },
  },
};

const prisma: PresetConfig = {
  id: 'preset-prisma',
  name: 'Prisma',
  category: 'partner',
  previewBg: 'linear-gradient(135deg, #0c1d26, #0a0c17)',
  previewFg: '#71e8df',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetPrisma',
    showControls: false,
    borderRadius: 10,
    fontFamily: FONT_JETBRAINS,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createGlowBorderBg('#0c1d26', '#3e4083', '#16544f'),
      padding: 64,
    },
  },
};

const mintlify: PresetConfig = {
  id: 'preset-mintlify',
  name: 'Mintlify',
  category: 'partner',
  previewBg: '#121212',
  previewFg: '#55d799',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetMintlify',
    showControls: false,
    borderRadius: 12,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createPatternOverlayBg('#121212', '#333333'),
      padding: 64,
    },
  },
};

const elevenLabs: PresetConfig = {
  id: 'preset-elevenlabs',
  name: 'ElevenLabs',
  category: 'partner',
  previewBg: '#111111',
  previewFg: '#8f8fff',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetElevenLabs',
    showControls: false,
    borderRadius: 24,
    fontFamily: FONT_ROBOTO,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createElevenLabsBg(),
      padding: 64,
    },
  },
};

const resend: PresetConfig = {
  id: 'preset-resend',
  name: 'Resend',
  category: 'partner',
  previewBg: 'linear-gradient(135deg, #B1B1B1, #181818)',
  previewFg: '#e0e0e0',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetResend',
    showControls: false,
    borderRadius: 8,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#B1B1B1',
      gradientTo: '#181818',
      gradientDirection: 'to-bottom',
      padding: 64,
    },
  },
};

const triggerDev: PresetConfig = {
  id: 'preset-triggerdev',
  name: 'Trigger.dev',
  category: 'partner',
  previewBg: '#121317',
  previewFg: '#9684ff',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetTriggerDev',
    showControls: false,
    borderRadius: 0,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createDotGridBg('#aaaaaa', '#121317', 20, 1),
      padding: 64,
    },
  },
};

const nuxt: PresetConfig = {
  id: 'preset-nuxt',
  name: 'Nuxt',
  category: 'partner',
  previewBg: '#0b0c11',
  previewFg: '#00dc82',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetNuxt',
    showControls: false,
    borderRadius: 10,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createStarFieldBg('#0b0c11', '#ffffff', 120, 0.15),
      padding: 64,
    },
  },
};

const browserbase: PresetConfig = {
  id: 'preset-browserbase',
  name: 'Browserbase',
  category: 'partner',
  previewBg: 'linear-gradient(180deg, #FF4500, #000000)',
  previewFg: '#ffffff',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetBrowserbase',
    showControls: false,
    borderRadius: 0,
    fontFamily: FONT_SPACE,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createVerticalLinesBg('#ffffff', '#000000', 7, true),
      padding: 64,
    },
  },
};

const cloudflare: PresetConfig = {
  id: 'preset-cloudflare',
  name: 'Cloudflare',
  category: 'partner',
  previewBg: '#0c0c0c',
  previewFg: '#ff7f4d',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetCloudflare',
    showControls: false,
    borderRadius: 0,
    fontFamily: FONT_IBM_PLEX,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createGridlinesBg('#262626', '#0c0c0c', 800, 600, 50),
      padding: 64,
    },
  },
};

const gemini: PresetConfig = {
  id: 'preset-gemini',
  name: 'Gemini',
  category: 'partner',
  previewBg: '#0e1016',
  previewFg: '#98c379',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetGemini',
    showControls: false,
    borderRadius: 24,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createStarFieldBg('#0e1016', '#ffffff', 200, 0.8),
      padding: 64,
    },
  },
};

const stripe: PresetConfig = {
  id: 'preset-stripe',
  name: 'Stripe',
  category: 'partner',
  previewBg: '#0a2540',
  previewFg: '#00d4ff',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetStripe',
    showControls: false,
    borderRadius: 8,
    fontFamily: FONT_SOURCE_CODE,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createVerticalLinesBg('#0f395e', '#0a2540', 5, false),
      padding: 64,
    },
  },
};

const firecrawl: PresetConfig = {
  id: 'preset-firecrawl',
  name: 'Firecrawl',
  category: 'partner',
  previewBg: '#000000',
  previewFg: '#f97316',
  settings: {
    template: 'minimal',
    terminalTheme: 'presetFirecrawl',
    showControls: false,
    borderRadius: 0,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createGridlinesBg('#222', '#000000', 800, 600, 60),
      padding: 64,
    },
  },
};

// ============================================================
// GENERIC PRESETS
// ============================================================

const breeze: PresetConfig = {
  id: 'preset-breeze',
  name: 'Breeze',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #CF2F98, #6A3DEC)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetBreeze',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#CF2F98',
      gradientTo: '#6A3DEC',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const candy: PresetConfig = {
  id: 'preset-candy',
  name: 'Candy',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #A58EFB, #E9BFF8)',
  previewFg: '#1e1e2e',
  settings: {
    template: 'macos',
    terminalTheme: 'presetCandy',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#A58EFB',
      gradientTo: '#E9BFF8',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const crimson: PresetConfig = {
  id: 'preset-crimson',
  name: 'Crimson',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #FF6363, #733434)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetCrimson',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#FF6363',
      gradientTo: '#733434',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const falcon: PresetConfig = {
  id: 'preset-falcon',
  name: 'Falcon',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #BDE3EC, #363654)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetFalcon',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#BDE3EC',
      gradientTo: '#363654',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const meadow: PresetConfig = {
  id: 'preset-meadow',
  name: 'Meadow',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #59D499, #A0872D)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetMeadow',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#59D499',
      gradientTo: '#A0872D',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const midnight: PresetConfig = {
  id: 'preset-midnight',
  name: 'Midnight',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #4CC8C8, #202033)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetMidnight',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#4CC8C8',
      gradientTo: '#202033',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const raindrop: PresetConfig = {
  id: 'preset-raindrop',
  name: 'Raindrop',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #8EC7FB, #1C55AA)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetRaindrop',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#8EC7FB',
      gradientTo: '#1C55AA',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const sunset: PresetConfig = {
  id: 'preset-sunset',
  name: 'Sunset',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #FFCF73, #FF7A2F)',
  previewFg: '#1e1e2e',
  settings: {
    template: 'macos',
    terminalTheme: 'presetSunset',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#FFCF73',
      gradientTo: '#FF7A2F',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const noir: PresetConfig = {
  id: 'preset-noir',
  name: 'Noir',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #B1B1B1, #181818)',
  previewFg: '#ffffff',
  settings: {
    template: 'macos',
    terminalTheme: 'presetNoir',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createNoiseTextureBg('#1a1a1a'),
      padding: 64,
    },
  },
};

const ice: PresetConfig = {
  id: 'preset-ice',
  name: 'Ice',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #ffffff, #80deea)',
  previewFg: '#1e2030',
  settings: {
    template: 'macos',
    terminalTheme: 'presetIce',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'image',
      image: createDotGridBg('rgba(0,0,0,0.5)', '#e8f8fb', 17, 1),
      padding: 64,
    },
  },
};

const sand: PresetConfig = {
  id: 'preset-sand',
  name: 'Sand',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #EED5B6, #AF8856)',
  previewFg: '#2e2820',
  settings: {
    template: 'macos',
    terminalTheme: 'presetSand',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#EED5B6',
      gradientTo: '#AF8856',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const forest: PresetConfig = {
  id: 'preset-forest',
  name: 'Forest',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #506853, #213223)',
  previewFg: '#c9c8bc',
  settings: {
    template: 'macos',
    terminalTheme: 'presetForest',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#506853',
      gradientTo: '#213223',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

const mono: PresetConfig = {
  id: 'preset-mono',
  name: 'Mono',
  category: 'generic',
  previewBg: 'linear-gradient(135deg, #333333, #181818)',
  previewFg: '#e0e0e0',
  settings: {
    template: 'macos',
    terminalTheme: 'presetMono',
    showControls: true,
    borderRadius: 16,
    fontFamily: FONT_DEFAULT,
    padding: [16, 24, 16, 24],
    background: {
      type: 'gradient',
      gradientFrom: '#333333',
      gradientTo: '#181818',
      gradientDirection: 'to-bottom-right',
      padding: 64,
    },
  },
};

// ============================================================
// EXPORTS
// ============================================================

export const PARTNER_PRESETS: PresetConfig[] = [
  vercel,
  supabase,
  tailwind,
  openai,
  clerk,
  prisma,
  mintlify,
  elevenLabs,
  resend,
  triggerDev,
  nuxt,
  browserbase,
  cloudflare,
  gemini,
  stripe,
  firecrawl,
];

export const GENERIC_PRESETS: PresetConfig[] = [
  candy,
  breeze,
  crimson,
  falcon,
  meadow,
  midnight,
  raindrop,
  sunset,
  noir,
  ice,
  sand,
  forest,
  mono,
];

export const ALL_PRESETS: PresetConfig[] = [...PARTNER_PRESETS, ...GENERIC_PRESETS];

export const PRESET_MAP: Record<string, PresetConfig> = Object.fromEntries(
  ALL_PRESETS.map((p) => [p.id, p])
);
