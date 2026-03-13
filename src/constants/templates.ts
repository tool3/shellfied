import type { TemplateType } from '@/types';

export interface TemplateConfig {
  id: TemplateType;
  label: string;
  description: string;
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'macos',
    label: 'macOS',
    description: 'Traffic light buttons, rounded corners',
  },
  {
    id: 'windows',
    label: 'Windows',
    description: 'Square buttons on right, sharp edges',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'No header, no footer, content focused',
  },
];
