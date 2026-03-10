import { memo, useState } from 'react';
import { useStore } from '@/store';
import { Button, Input } from '@/components/common';
import type { CustomTheme } from '@/types';
import styles from './CustomThemeEditor.module.scss';

interface CustomThemeEditorProps {
  theme: CustomTheme | null;
  onClose: () => void;
}

const DEFAULT_CUSTOM_THEME: Omit<CustomTheme, 'id'> = {
  name: 'My Theme',
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#ffffff',
  selection: '#264f78',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

const COLOR_GROUPS = [
  {
    label: 'Base',
    colors: [
      { key: 'background', label: 'Background' },
      { key: 'foreground', label: 'Foreground' },
      { key: 'cursor', label: 'Cursor' },
      { key: 'selection', label: 'Selection' },
    ],
  },
  {
    label: 'Normal',
    colors: [
      { key: 'black', label: 'Black' },
      { key: 'red', label: 'Red' },
      { key: 'green', label: 'Green' },
      { key: 'yellow', label: 'Yellow' },
      { key: 'blue', label: 'Blue' },
      { key: 'magenta', label: 'Magenta' },
      { key: 'cyan', label: 'Cyan' },
      { key: 'white', label: 'White' },
    ],
  },
  {
    label: 'Bright',
    colors: [
      { key: 'brightBlack', label: 'Black' },
      { key: 'brightRed', label: 'Red' },
      { key: 'brightGreen', label: 'Green' },
      { key: 'brightYellow', label: 'Yellow' },
      { key: 'brightBlue', label: 'Blue' },
      { key: 'brightMagenta', label: 'Magenta' },
      { key: 'brightCyan', label: 'Cyan' },
      { key: 'brightWhite', label: 'White' },
    ],
  },
];

export const CustomThemeEditor = memo(function CustomThemeEditor({
  theme,
  onClose,
}: CustomThemeEditorProps) {
  const addCustomTheme = useStore((s) => s.addCustomTheme);
  const updateCustomTheme = useStore((s) => s.updateCustomTheme);
  const setTerminalTheme = useStore((s) => s.setTerminalTheme);

  const [formData, setFormData] = useState<Omit<CustomTheme, 'id'>>(() => {
    if (theme) {
      const { id, ...rest } = theme;
      return rest;
    }
    return DEFAULT_CUSTOM_THEME;
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (theme) {
      // Update existing theme
      updateCustomTheme(theme.id, formData);
    } else {
      // Create new theme
      const newTheme: CustomTheme = {
        ...formData,
        id: `custom-${Date.now()}`,
      };
      addCustomTheme(newTheme);
      setTerminalTheme(newTheme.id);
    }
    onClose();
  };

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h4 className={styles.title}>{theme ? 'Edit Theme' : 'Create Theme'}</h4>
        <Button variant="ghost" size="sm" icon="x" onClick={onClose} />
      </div>

      <div className={styles.content}>
        <Input
          label="Theme Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="My Theme"
          fullWidth
        />

        <div
          className={styles.preview}
          style={{
            backgroundColor: formData.background,
            color: formData.foreground,
          }}
        >
          <span style={{ color: formData.green }}>$</span>{' '}
          <span style={{ color: formData.foreground }}>echo</span>{' '}
          <span style={{ color: formData.yellow }}>"Hello World"</span>
          <br />
          <span style={{ color: formData.cyan }}>Hello World</span>
        </div>

        {COLOR_GROUPS.map((group) => (
          <div key={group.label} className={styles.colorGroup}>
            <h5 className={styles.groupTitle}>{group.label}</h5>
            <div className={styles.colorGrid}>
              {group.colors.map((color) => (
                <div key={color.key} className={styles.colorItem}>
                  <div
                    className={styles.colorSwatch}
                    style={{
                      backgroundColor: formData[color.key as keyof typeof formData] as string,
                    }}
                    onClick={() => {
                      const input = document.getElementById(`color-${color.key}`) as HTMLInputElement;
                      input?.click();
                    }}
                  />
                  <input
                    type="color"
                    id={`color-${color.key}`}
                    value={formData[color.key as keyof typeof formData] as string}
                    onChange={(e) => handleChange(color.key, e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorLabel}>{color.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {theme ? 'Save Changes' : 'Create Theme'}
        </Button>
      </div>
    </div>
  );
});
