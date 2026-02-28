import { memo } from 'react';
import { useStore } from '@/store';
import { TEMPLATES } from '@/constants/templates';
import type { TemplateType } from '@/types';
import styles from './TemplateSelector.module.scss';

export const TemplateSelector = memo(function TemplateSelector() {
  const template = useStore((s) => s.template);
  const setTemplate = useStore((s) => s.setTemplate);

  return (
    <div className={styles.templateSelector}>
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.templateCard} ${template === t.id ? styles.selected : ''}`}
          onClick={() => setTemplate(t.id)}
          aria-label={`Select ${t.label} template`}
          aria-pressed={template === t.id}
        >
          <div className={styles.preview}>
            <TemplatePreview type={t.id} />
          </div>
          <div className={styles.info}>
            <span className={styles.label}>{t.label}</span>
            <span className={styles.description}>{t.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

const TemplatePreview = memo(function TemplatePreview({ type }: { type: TemplateType }) {
  return (
    <svg viewBox="0 0 80 48" className={styles.previewSvg}>
      {/* Background */}
      <rect
        x="0"
        y="0"
        width="80"
        height="48"
        rx={type === 'windows' ? '0' : type === 'minimal' ? '4' : '6'}
        fill="var(--color-bg-tertiary)"
      />

      {/* Title bar */}
      {type !== 'minimal' && (
        <>
          <rect x="0" y="0" width="80" height="12" rx={type === 'windows' ? '0' : '6'} fill="var(--color-bg-secondary)" />
          {type === 'macos' ? (
            <>
              <circle cx="8" cy="6" r="2.5" fill="#ff5f57" />
              <circle cx="16" cy="6" r="2.5" fill="#febc2e" />
              <circle cx="24" cy="6" r="2.5" fill="#28c840" />
            </>
          ) : (
            <>
              <rect x="62" y="4" width="4" height="4" fill="var(--color-text-tertiary)" />
              <rect x="68" y="4" width="4" height="4" fill="var(--color-text-tertiary)" />
              <rect x="74" y="4" width="4" height="4" fill="var(--color-text-tertiary)" />
            </>
          )}
        </>
      )}

      {/* Content lines */}
      <rect x="6" y={type === 'minimal' ? '8' : '18'} width="40" height="4" rx="1" fill="var(--color-text-tertiary)" opacity="0.4" />
      <rect x="6" y={type === 'minimal' ? '16' : '26'} width="28" height="4" rx="1" fill="var(--color-text-tertiary)" opacity="0.4" />
      <rect x="6" y={type === 'minimal' ? '24' : '34'} width="52" height="4" rx="1" fill="var(--color-text-tertiary)" opacity="0.4" />
    </svg>
  );
});
