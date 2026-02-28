import { memo } from 'react';
import { useStore } from '@/store';
import { Button, Input, Toggle, Slider } from '@/components/common';
import { ThemeSelector } from './ThemeSelector';
import { TemplateSelector } from './TemplateSelector';
import { ExportPanel } from '../Export';
import {
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  PADDING_MIN,
  PADDING_MAX,
} from '@/constants/defaults';
import styles from './SettingsPanel.module.scss';

export const SettingsPanel = memo(function SettingsPanel() {
  const isSettingsPanelOpen = useStore((s) => s.isSettingsPanelOpen);
  const setSettingsPanelOpen = useStore((s) => s.setSettingsPanelOpen);

  const title = useStore((s) => s.title);
  const setTitle = useStore((s) => s.setTitle);
  const showControls = useStore((s) => s.showControls);
  const setShowControls = useStore((s) => s.setShowControls);
  const watermark = useStore((s) => s.watermark);
  const setWatermark = useStore((s) => s.setWatermark);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const setLineHeight = useStore((s) => s.setLineHeight);
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const resetSettings = useStore((s) => s.resetSettings);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as [number, number, number, number];
    newPadding[index] = value;
    setPadding(newPadding);
  };

  if (!isSettingsPanelOpen) return null;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <Button
          variant="ghost"
          size="sm"
          icon="x"
          onClick={() => setSettingsPanelOpen(false)}
          aria-label="Close settings"
          className={styles.closeButton}
        />
      </div>

      <div className={styles.content}>
        {/* Template Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Template</h3>
          <TemplateSelector />
        </section>

        {/* Theme Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Theme</h3>
          <ThemeSelector />
        </section>

        {/* Window Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Window</h3>
          <div className={styles.fields}>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Terminal"
              fullWidth
            />
            <Toggle
              checked={showControls}
              onChange={setShowControls}
              label="Show window controls"
            />
            <Input
              label="Watermark"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              placeholder="Optional watermark text"
              fullWidth
            />
          </div>
        </section>

        {/* Typography Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Typography</h3>
          <div className={styles.fields}>
            <Slider
              label="Font Size"
              value={fontSize}
              onChange={setFontSize}
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              step={1}
              formatValue={(v) => `${v}px`}
            />
            <Slider
              label="Line Height"
              value={lineHeight}
              onChange={setLineHeight}
              min={LINE_HEIGHT_MIN}
              max={LINE_HEIGHT_MAX}
              step={0.1}
              formatValue={(v) => v.toFixed(1)}
            />
          </div>
        </section>

        {/* Padding Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Padding</h3>
          <div className={styles.paddingGrid}>
            <Input
              label="Top"
              type="number"
              value={padding[0]}
              onChange={(e) => handlePaddingChange(0, Number(e.target.value))}
              min={PADDING_MIN}
              max={PADDING_MAX}
            />
            <Input
              label="Right"
              type="number"
              value={padding[1]}
              onChange={(e) => handlePaddingChange(1, Number(e.target.value))}
              min={PADDING_MIN}
              max={PADDING_MAX}
            />
            <Input
              label="Bottom"
              type="number"
              value={padding[2]}
              onChange={(e) => handlePaddingChange(2, Number(e.target.value))}
              min={PADDING_MIN}
              max={PADDING_MAX}
            />
            <Input
              label="Left"
              type="number"
              value={padding[3]}
              onChange={(e) => handlePaddingChange(3, Number(e.target.value))}
              min={PADDING_MIN}
              max={PADDING_MAX}
            />
          </div>
        </section>

        {/* Export Section - Desktop only */}
        <div className={styles.exportSection}>
          <ExportPanel />
        </div>

        {/* Reset Button */}
        <div className={styles.footer}>
          <Button variant="ghost" icon="reset" onClick={resetSettings} fullWidth>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </aside>
  );
});
