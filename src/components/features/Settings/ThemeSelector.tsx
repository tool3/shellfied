import { memo, useState } from 'react';
import { useStore } from '@/store';
import { DARK_THEMES, LIGHT_THEMES } from '@/constants/themes';
import { Button } from '@/components/common';
import { CustomThemeEditor } from './CustomThemeEditor';
import type { CustomTheme } from '@/types';
import styles from './ThemeSelector.module.scss';

export const ThemeSelector = memo(function ThemeSelector() {
  const terminalTheme = useStore((s) => s.terminalTheme);
  const setTerminalTheme = useStore((s) => s.setTerminalTheme);
  const customThemes = useStore((s) => s.customThemes);
  const deleteCustomTheme = useStore((s) => s.deleteCustomTheme);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelect = (themeId: string) => {
    setTerminalTheme(themeId);
  };

  const handleEditTheme = (theme: CustomTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTheme(theme);
  };

  const handleDeleteTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTheme(id);
  };

  if (isCreating || editingTheme) {
    return (
      <CustomThemeEditor
        theme={editingTheme}
        onClose={() => {
          setIsCreating(false);
          setEditingTheme(null);
        }}
      />
    );
  }

  return (
    <div className={styles.themeSelector}>
      {customThemes.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Custom Themes</h4>
          <div className={styles.grid}>
            {customThemes.map((theme) => (
              <div
                key={theme.id}
                role="button"
                tabIndex={0}
                className={`${styles.themeCard} ${terminalTheme === theme.id ? styles.selected : ''}`}
                onClick={() => handleSelect(theme.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(theme.id);
                  }
                }}
                aria-label={`Select ${theme.name} theme`}
                aria-pressed={terminalTheme === theme.id}
              >
                <div
                  className={styles.preview}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.foreground,
                  }}
                >
                  <span className={styles.previewText}>$ ls</span>
                </div>
                <span className={styles.label}>{theme.name}</span>
                <div className={styles.themeActions}>
                  <button
                    type="button"
                    className={styles.themeAction}
                    onClick={(e) => handleEditTheme(theme, e)}
                    title="Edit theme"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={styles.themeAction}
                    onClick={(e) => handleDeleteTheme(theme.id, e)}
                    title="Delete theme"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <Button
        variant="ghost"
        icon="plus"
        onClick={() => setIsCreating(true)}
        fullWidth
      >
        Create Custom Theme
      </Button>
    </div>
  );
});
