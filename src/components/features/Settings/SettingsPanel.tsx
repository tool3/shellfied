import { memo } from 'react';
import { useStore } from '@/store';
import { Button, Input, Toggle, Slider, Select, ColorPicker, NumberSlider } from '@/components/common';
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
  HEADER_HEIGHT_MIN,
  HEADER_HEIGHT_MAX,
  BORDER_WIDTH_MIN,
  BORDER_WIDTH_MAX,
  FONT_FAMILY_OPTIONS,
} from '@/constants/defaults';
import type { PaddingTuple } from '@/types';
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
  const watermarkPadding = useStore((s) => s.watermarkPadding);
  const setWatermarkPadding = useStore((s) => s.setWatermarkPadding);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const setLineHeight = useStore((s) => s.setLineHeight);
  const fontFamily = useStore((s) => s.fontFamily);
  const setFontFamily = useStore((s) => s.setFontFamily);
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const header = useStore((s) => s.header);
  const setHeader = useStore((s) => s.setHeader);
  const footer = useStore((s) => s.footer);
  const setFooter = useStore((s) => s.setFooter);
  const resetSettings = useStore((s) => s.resetSettings);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as PaddingTuple;
    newPadding[index] = value;
    setPadding(newPadding);
  };

  const handleWatermarkPaddingChange = (index: number, value: number) => {
    const newPadding = [...watermarkPadding] as PaddingTuple;
    newPadding[index] = value;
    setWatermarkPadding(newPadding);
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
              <Input
                label="Watermark"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                placeholder="Optional watermark text"
                fullWidth
              />
              {watermark && (
                <div className={styles.sliderGrid}>
                  <NumberSlider
                    label="Top"
                    value={watermarkPadding[0]}
                    onChange={(v) => handleWatermarkPaddingChange(0, v)}
                    min={PADDING_MIN}
                    max={PADDING_MAX}
                  />
                  <NumberSlider
                    label="Right"
                    value={watermarkPadding[1]}
                    onChange={(v) => handleWatermarkPaddingChange(1, v)}
                    min={PADDING_MIN}
                    max={PADDING_MAX}
                  />
                  <NumberSlider
                    label="Bottom"
                    value={watermarkPadding[2]}
                    onChange={(v) => handleWatermarkPaddingChange(2, v)}
                    min={PADDING_MIN}
                    max={PADDING_MAX}
                  />
                  <NumberSlider
                    label="Left"
                    value={watermarkPadding[3]}
                    onChange={(v) => handleWatermarkPaddingChange(3, v)}
                    min={PADDING_MIN}
                    max={PADDING_MAX}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

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

        {/* Header Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Header</h3>
            <Toggle
              checked={header.enabled}
              onChange={(enabled) => setHeader({ enabled })}
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

        {/* Footer Section */}
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
                  value={footer.backgroundColor}
                  onChange={(value) => setFooter({ backgroundColor: value })}
                  placeholder="#333333"
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
