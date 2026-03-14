import { memo } from 'react';
import { useStore } from '@/store';
import { Button, Input, Toggle, Slider, Select, NumberSlider } from '@/components/common';
import { ThemeSelector } from './ThemeSelector';
import { TemplateSelector } from './TemplateSelector';
import { WatermarkEditor } from './WatermarkEditor';
import { BackgroundSection } from './BackgroundSection';
import { HeaderSection } from './HeaderSection';
import { FooterSection } from './FooterSection';
import { BrandSection } from './BrandSection';
import { ExportPanel } from '../Export';
import {
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  PADDING_MIN,
  PADDING_MAX,
  BORDER_RADIUS_MIN,
  BORDER_RADIUS_MAX,
  FONT_FAMILY_OPTIONS,
} from '@/constants/defaults';
import type { PaddingTuple } from '@/types';
import styles from './SettingsPanel.module.scss';

export const SettingsPanel = memo(function SettingsPanel() {
  const isSettingsPanelOpen = useStore((s) => s.isSettingsPanelOpen);
  const setSettingsPanelOpen = useStore((s) => s.setSettingsPanelOpen);

  const template = useStore((s) => s.template);
  const title = useStore((s) => s.title);
  const setTitle = useStore((s) => s.setTitle);
  const showControls = useStore((s) => s.showControls);
  const setShowControls = useStore((s) => s.setShowControls);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const setControlsPosition = useStore((s) => s.setControlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const setBorderRadius = useStore((s) => s.setBorderRadius);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const setLineHeight = useStore((s) => s.setLineHeight);
  const fontFamily = useStore((s) => s.fontFamily);
  const setFontFamily = useStore((s) => s.setFontFamily);
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const resetSettings = useStore((s) => s.resetSettings);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as PaddingTuple;
    newPadding[index] = value;
    setPadding(newPadding);
  };

  return (
    <aside className={`${styles.panel} ${!isSettingsPanelOpen ? styles.hidden : ''}`}>
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
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Template</h3>
          </div>
          <div className={styles.sectionContent}>
            <TemplateSelector />
          </div>
        </section>

        {/* Theme Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Theme</h3>
          </div>
          <div className={styles.sectionContent}>
            <ThemeSelector />
          </div>
        </section>

        {/* Window Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Window</h3>
          </div>
          <div className={styles.sectionContent}>
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
              {showControls && (
                <Select
                  label="Controls Position"
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                  ]}
                  value={controlsPosition}
                  onChange={(v) => setControlsPosition(v as 'left' | 'right')}
                  fullWidth
                />
              )}
              <Slider
                label="Border Radius"
                value={borderRadius}
                onChange={setBorderRadius}
                min={BORDER_RADIUS_MIN}
                max={BORDER_RADIUS_MAX}
                step={1}
                formatValue={(v) => `${v}px`}
              />
              <WatermarkEditor />
            </div>
          </div>
        </section>

        {/* Header Section - not available for minimal template */}
        {template !== 'minimal' && <HeaderSection />}

        {/* Footer Section - not available for minimal template */}
        {template !== 'minimal' && <FooterSection />}

        {/* Typography Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Typography</h3>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.fields}>
              <Select
                label="Font Family"
                options={FONT_FAMILY_OPTIONS}
                value={fontFamily}
                onChange={setFontFamily}
                fullWidth
              />
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
          </div>
        </section>

        {/* Padding Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Padding</h3>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sliderGrid}>
              <NumberSlider
                label="Top"
                value={padding[0]}
                onChange={(v) => handlePaddingChange(0, v)}
                min={PADDING_MIN}
                max={PADDING_MAX}
              />
              <NumberSlider
                label="Right"
                value={padding[1]}
                onChange={(v) => handlePaddingChange(1, v)}
                min={PADDING_MIN}
                max={PADDING_MAX}
              />
              <NumberSlider
                label="Bottom"
                value={padding[2]}
                onChange={(v) => handlePaddingChange(2, v)}
                min={PADDING_MIN}
                max={PADDING_MAX}
              />
              <NumberSlider
                label="Left"
                value={padding[3]}
                onChange={(v) => handlePaddingChange(3, v)}
                min={PADDING_MIN}
                max={PADDING_MAX}
              />
            </div>
          </div>
        </section>

        {/* Background Section */}
        <BackgroundSection />

        {/* Brand Section */}
        <BrandSection />

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
