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

export const HeaderSection = memo(function HeaderSection() {
  const header = useStore((s) => s.header);
  const setHeader = useStore((s) => s.setHeader);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Header</h3>
        <Toggle
          checked={header.enabled}
          onChange={(enabled) => {
            // Set default background color when enabling header
            if (enabled && !header.backgroundColor) {
              setHeader({ enabled, backgroundColor: '#242526' });
            } else {
              setHeader({ enabled });
            }
          }}
        />
      </div>
      {header.enabled && (
        <div className={styles.sectionContent}>
          <div className={styles.fields}>
            <ColorPicker
              label="Background Color"
              value={header.backgroundColor}
              onChange={(value) => setHeader({ backgroundColor: value })}
              placeholder="#333333"
              fullWidth
            />
            <Slider
              label="Height"
              value={header.height}
              onChange={(height) => setHeader({ height })}
              min={HEADER_HEIGHT_MIN}
              max={HEADER_HEIGHT_MAX}
              step={1}
              formatValue={(v) => `${v}px`}
            />
            <Toggle
              checked={header.border}
              onChange={(border) => setHeader({ border })}
              label="Show border"
            />
            {header.border && (
              <>
                <ColorPicker
                  label="Border Color"
                  value={header.borderColor}
                  onChange={(value) => setHeader({ borderColor: value })}
                  placeholder="#333333"
                  fullWidth
                />
                <Slider
                  label="Border Width"
                  value={header.borderWidth}
                  onChange={(borderWidth) => setHeader({ borderWidth })}
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
