import { memo } from 'react';
import { useStore } from '@/store';
import { Toggle, Input } from '@/components/common';
import styles from './SettingsPanel.module.scss';

export const BrandSection = memo(function BrandSection() {
  const brand = useStore((s) => s.brand);
  const setBrand = useStore((s) => s.setBrand);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Brand</h3>
        <Toggle
          checked={brand.enabled}
          onChange={(enabled) => setBrand({ enabled })}
        />
      </div>
      {brand.enabled && (
        <div className={styles.sectionContent}>
          <div className={styles.fields}>
            <Input
              label="Text"
              value={brand.text}
              onChange={(value) => setBrand({ text: value })}
              placeholder="Created with"
              fullWidth
            />
            <Input
              label="Name"
              value={brand.name}
              onChange={(value) => setBrand({ name: value })}
              placeholder="Your Brand"
              fullWidth
            />
            <Input
              label="URL"
              value={brand.url}
              onChange={(value) => setBrand({ url: value })}
              placeholder="https://yourbrand.com"
              fullWidth
            />
            <Toggle
              checked={brand.showIcon}
              onChange={(showIcon) => setBrand({ showIcon })}
              label="Show icon"
            />
          </div>
        </div>
      )}
    </section>
  );
});
