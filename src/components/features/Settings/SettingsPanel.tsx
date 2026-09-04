import { memo, useState } from 'react';
import { useStore } from '@/store';
import { Button, Input, Toggle, Slider, Select, NumberSlider } from '@/components/common';
import { ThemeSelector } from './ThemeSelector';
import { TemplateSelector } from './TemplateSelector';
import { PresetSelector } from './PresetSelector';
import { WatermarkEditor } from './WatermarkEditor';
import { BackgroundSection } from './BackgroundSection';
import { EffectsSection } from './EffectsSection';
import { HeaderSection, FooterSection } from './HeaderFooterSection';
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
  const compareMode = useStore((s) => s.compareMode);
  const beforeTitle = useStore((s) => s.beforeTitle);
  const setBeforeTitle = useStore((s) => s.setBeforeTitle);
  const afterTitle = useStore((s) => s.afterTitle);
  const setAfterTitle = useStore((s) => s.setAfterTitle);
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
  const width = useStore((s) => s.width);
  const setWidth = useStore((s) => s.setWidth);
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const resetSettings = useStore((s) => s.resetSettings);

  const [showIndividualPadding, setShowIndividualPadding] = useState(false);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as PaddingTuple;
    newPadding[index] = value;
    setPadding(newPadding);
  };

  const handleUniformPaddingChange = (value: number) => {
    setPadding([value, value, value, value]);
  };

  const isUniformPadding = padding[0] === padding[1] && padding[1] === padding[2] && padding[2] === padding[3];
  const uniformPaddingValue = isUniformPadding ? padding[0] : Math.round((padding[0] + padding[1] + padding[2] + padding[3]) / 4);

  return (
    <aside className={`${styles.panel} ${!isSettingsPanelOpen ? styles.hidden : ''}`}>
      <div className={styles.header}>
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
        {/* Preset Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Preset</h3>
          </div>
          <div className={styles.sectionContent}>
            <PresetSelector />
          </div>
        </section>

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
              {compareMode ? (
                <>
                  <Input
                    label="Title #1"
                    value={beforeTitle}
                    onChange={(e) => setBeforeTitle(e.target.value)}
                    placeholder="Terminal"
                    fullWidth
                  />
                  <Input
                    label="Title #2"
                    value={afterTitle}
                    onChange={(e) => setAfterTitle(e.target.value)}
                    placeholder="Terminal"
                    fullWidth
                  />
                </>
              ) : (
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Terminal"
                  fullWidth
                />
              )}
              {template !== 'minimal' && (
                <>
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
                </>
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
              <Slider
                label="Width"
                value={width ?? 0}
                onChange={(v) => setWidth(v === 0 ? null : v)}
                min={0}
                max={1200}
                step={10}
                formatValue={(v) => v === 0 ? 'Auto' : `${v}px`}
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
            <NumberSlider
              label="All"
              value={uniformPaddingValue}
              onChange={handleUniformPaddingChange}
              min={PADDING_MIN}
              max={PADDING_MAX}
            />
            <button
              type="button"
              className={styles.individualToggle}
              onClick={() => setShowIndividualPadding(!showIndividualPadding)}
            >
              <span>{showIndividualPadding ? 'Hide' : 'Individual'}</span>
              {!isUniformPadding && !showIndividualPadding && (
                <span className={styles.mixedBadge}>Mixed</span>
              )}
            </button>
            {showIndividualPadding && (
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
            )}
          </div>
        </section>

        {/* Background Section */}
        <BackgroundSection />

        {/* Effects Section — post-processing applied to the finished SVG */}
        <EffectsSection />

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
