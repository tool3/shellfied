/**
 * Generic Header/Footer configuration section
 * Eliminates duplication between HeaderSection and FooterSection
 */

import { memo } from 'react';
import { useStore } from '@/store';
import { Toggle, Slider, ColorPicker } from '@/components/common';
import {
  HEADER_HEIGHT_MIN,
  HEADER_HEIGHT_MAX,
  BORDER_WIDTH_MIN,
  BORDER_WIDTH_MAX,
} from '@/constants/defaults';
import styles from './SettingsPanel.module.scss';

interface Props {
  type: 'header' | 'footer';
}

export const HeaderFooterSection = memo(function HeaderFooterSection({ type }: Props) {
  const isHeader = type === 'header';
  const title = isHeader ? 'Header' : 'Footer';

  const config = useStore((s) => (isHeader ? s.header : s.footer));
  const setConfig = useStore((s) => (isHeader ? s.setHeader : s.setFooter));

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <Toggle
          checked={config.enabled}
          onChange={(enabled) => setConfig({ enabled })}
        />
      </div>
      {config.enabled && (
        <div className={styles.sectionContent}>
          <div className={styles.fields}>
            <ColorPicker
              label="Background Color"
              value={config.backgroundColor}
              onChange={(value) => setConfig({ backgroundColor: value })}
              placeholder="#242526"
              fullWidth
            />
            <Slider
              label="Height"
              value={config.height}
              onChange={(height) => setConfig({ height })}
              min={HEADER_HEIGHT_MIN}
              max={HEADER_HEIGHT_MAX}
              step={1}
              formatValue={(v) => `${v}px`}
            />
            <Toggle
              checked={config.border}
              onChange={(border) => setConfig({ border })}
              label="Show border"
            />
            {config.border && (
              <>
                <ColorPicker
                  label="Border Color"
                  value={config.borderColor}
                  onChange={(value) => setConfig({ borderColor: value })}
                  placeholder="#333333"
                  fullWidth
                />
                <Slider
                  label="Border Width"
                  value={config.borderWidth}
                  onChange={(borderWidth) => setConfig({ borderWidth })}
                  min={BORDER_WIDTH_MIN}
                  max={BORDER_WIDTH_MAX}
                  step={1}
                  formatValue={(v) => `${v}px`}
                />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

// Export convenience components for backwards compatibility
export const HeaderSection = memo(function HeaderSection() {
  return <HeaderFooterSection type="header" />;
});

export const FooterSection = memo(function FooterSection() {
  return <HeaderFooterSection type="footer" />;
});
