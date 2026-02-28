import { memo } from 'react';
import { useStore } from '@/store';
import { DARK_THEMES, LIGHT_THEMES } from '@/constants/themes';
import type { TerminalThemeName } from '@/types';
import styles from './ThemeSelector.module.scss';

export const ThemeSelector = memo(function ThemeSelector() {
  const terminalTheme = useStore((s) => s.terminalTheme);
  const setTerminalTheme = useStore((s) => s.setTerminalTheme);

  const handleSelect = (theme: TerminalThemeName) => {
    setTerminalTheme(theme);
  };

  return (
    <div className={styles.themeSelector}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Dark Themes</h4>
        <div className={styles.grid}>
          {DARK_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`${styles.themeCard} ${terminalTheme === theme.id ? styles.selected : ''}`}
              onClick={() => handleSelect(theme.id)}
              aria-label={`Select ${theme.label} theme`}
              aria-pressed={terminalTheme === theme.id}
            >
              <div
                className={styles.preview}
                style={{
                  backgroundColor: theme.previewBg,
                  color: theme.previewFg,
                }}
              >
                <span className={styles.previewText}>$ ls</span>
              </div>
              <span className={styles.label}>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Light Themes</h4>
        <div className={styles.grid}>
          {LIGHT_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`${styles.themeCard} ${terminalTheme === theme.id ? styles.selected : ''}`}
              onClick={() => handleSelect(theme.id)}
              aria-label={`Select ${theme.label} theme`}
              aria-pressed={terminalTheme === theme.id}
            >
              <div
                className={styles.preview}
                style={{
                  backgroundColor: theme.previewBg,
                  color: theme.previewFg,
                }}
              >
                <span className={styles.previewText}>$ ls</span>
              </div>
              <span className={styles.label}>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
