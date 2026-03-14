import { memo } from 'react';
import { useStore } from '@/store';
import { Toggle, Slider, ColorPicker } from '@/components/common';
import {
  HEADER_HEIGHT_MIN,
  HEADER_HEIGHT_MAX,
  BORDER_WIDTH_MIN,
  BORDER_WIDTH_MAX,
} from '@/constants/defaults';
import { TERMINAL_THEMES } from '@/constants/themes';
import styles from './SettingsPanel.module.scss';

export const FooterSection = memo(function FooterSection() {
  const footer = useStore((s) => s.footer);
  const setFooter = useStore((s) => s.setFooter);
  const terminalTheme = useStore((s) => s.terminalTheme);
  const customThemes = useStore((s) => s.customThemes);

  // Get the current theme's background color
  const getThemeBackground = () => {
    const customTheme = customThemes.find((t) => t.id === terminalTheme);
    if (customTheme) return customTheme.background;
    return TERMINAL_THEMES[terminalTheme]?.theme.background ?? '#242526';
  };

  // Display color: show theme background when no explicit color is set
  const themeBackground = getThemeBackground();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Footer</h3>
        <Toggle
          checked={footer.enabled}
          onChange={(enabled) => setFooter({ enabled })}
        />
      </div>
      {footer.enabled && (
        <div className={styles.sectionContent}>
          <div className={styles.fields}>
            <ColorPicker
              label="Background Color"
              value={footer.backgroundColor || themeBackground}
              onChange={(value) => setFooter({ backgroundColor: value })}
              placeholder={themeBackground}
              fullWidth
            />
            <Slider
              label="Height"
              value={footer.height}
              onChange={(height) => setFooter({ height })}
              min={HEADER_HEIGHT_MIN}
              max={HEADER_HEIGHT_MAX}
              step={1}
              formatValue={(v) => `${v}px`}
            />
            <Toggle
              checked={footer.border}
              onChange={(border) => setFooter({ border })}
              label="Show border"
            />
            {footer.border && (
              <>
                <ColorPicker
                  label="Border Color"
                  value={footer.borderColor}
                  onChange={(value) => setFooter({ borderColor: value })}
                  placeholder="#333333"
                  fullWidth
                />
                <Slider
                  label="Border Width"
                  value={footer.borderWidth}
                  onChange={(borderWidth) => setFooter({ borderWidth })}
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
