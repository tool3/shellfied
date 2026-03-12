import { memo } from 'react';
import { useStore } from '@/store';
import { Button, Input, Toggle, Slider, Select, ColorPicker, NumberSlider, Icon } from '@/components/common';
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
  BORDER_RADIUS_MIN,
  BORDER_RADIUS_MAX,
  FONT_FAMILY_OPTIONS,
  BACKGROUND_PADDING_MIN,
  BACKGROUND_PADDING_MAX,
  GRADIENT_PRESETS,
} from '@/constants/defaults';
import type { PaddingTuple, BackgroundType, GradientDirection, ImageAspectRatio } from '@/types';
import styles from './SettingsPanel.module.scss';

export const SettingsPanel = memo(function SettingsPanel() {
  const isSettingsPanelOpen = useStore((s) => s.isSettingsPanelOpen);
  const setSettingsPanelOpen = useStore((s) => s.setSettingsPanelOpen);

  const title = useStore((s) => s.title);
  const setTitle = useStore((s) => s.setTitle);
  const showControls = useStore((s) => s.showControls);
  const setShowControls = useStore((s) => s.setShowControls);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const setControlsPosition = useStore((s) => s.setControlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const setBorderRadius = useStore((s) => s.setBorderRadius);
  const watermark = useStore((s) => s.watermark);
  const setWatermark = useStore((s) => s.setWatermark);
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
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);
  const resetSettings = useStore((s) => s.resetSettings);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as PaddingTuple;
    newPadding[index] = value;
    setPadding(newPadding);
  };

  const handleWatermarkPaddingChange = (index: number, value: number) => {
    const newPadding = [...watermark.padding] as PaddingTuple;
    newPadding[index] = value;
    setWatermark({ padding: newPadding });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBackground({ image: dataUrl, type: 'image' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBackground({ image: null, type: 'none' });
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
              <Input
                label="Watermark"
                value={watermark.text}
                onChange={(e) => setWatermark({ text: e.target.value })}
                placeholder="Optional watermark text"
                fullWidth
              />
              {watermark.text && (
                <>
                  <ColorPicker
                    label="Watermark Color"
                    value={watermark.color}
                    onChange={(color) => setWatermark({ color })}
                    placeholder="#888888"
                    fullWidth
                  />
                  <div className={styles.sliderGrid}>
                    <NumberSlider
                      label="Top"
                      value={watermark.padding[0]}
                      onChange={(v) => handleWatermarkPaddingChange(0, v)}
                      min={PADDING_MIN}
                      max={PADDING_MAX}
                    />
                    <NumberSlider
                      label="Right"
                      value={watermark.padding[1]}
                      onChange={(v) => handleWatermarkPaddingChange(1, v)}
                      min={PADDING_MIN}
                      max={PADDING_MAX}
                    />
                    <NumberSlider
                      label="Bottom"
                      value={watermark.padding[2]}
                      onChange={(v) => handleWatermarkPaddingChange(2, v)}
                      min={PADDING_MIN}
                      max={PADDING_MAX}
                    />
                    <NumberSlider
                      label="Left"
                      value={watermark.padding[3]}
                      onChange={(v) => handleWatermarkPaddingChange(3, v)}
                      min={PADDING_MIN}
                      max={PADDING_MAX}
                    />
                  </div>
                </>
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
              onChange={(enabled) => {
                // Set default background color when enabling header
                if (enabled && !header.backgroundColor) {
                  setHeader({ enabled, backgroundColor: '#373837' });
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

        {/* Footer Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Footer</h3>
            <Toggle
              checked={footer.enabled}
              onChange={(enabled) => {
                // Set default background color when enabling footer
                if (enabled && !footer.backgroundColor) {
                  setFooter({ enabled, backgroundColor: '#373837' });
                } else {
                  setFooter({ enabled });
                }
              }}
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

        {/* Background Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Background</h3>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.fields}>
              <Select
                label="Type"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Solid Color' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'image', label: 'Image' },
                ]}
                value={background.type}
                onChange={(v) => setBackground({ type: v as BackgroundType })}
                fullWidth
              />

              {background.type === 'solid' && (
                <ColorPicker
                  label="Color"
                  value={background.color}
                  onChange={(color) => setBackground({ color })}
                  placeholder="#6366f1"
                  fullWidth
                />
              )}

              {background.type === 'gradient' && (
                <>
                  <div className={styles.gradientPresets}>
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className={styles.gradientPreset}
                        style={{
                          background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                        }}
                        onClick={() =>
                          setBackground({
                            gradientFrom: preset.from,
                            gradientTo: preset.to,
                          })
                        }
                        title={preset.label}
                      />
                    ))}
                  </div>
                  <ColorPicker
                    label="From"
                    value={background.gradientFrom}
                    onChange={(gradientFrom) => setBackground({ gradientFrom })}
                    placeholder="#6366f1"
                    fullWidth
                  />
                  <ColorPicker
                    label="To"
                    value={background.gradientTo}
                    onChange={(gradientTo) => setBackground({ gradientTo })}
                    placeholder="#ec4899"
                    fullWidth
                  />
                  <div className={styles.directionField}>
                    <label className={styles.directionLabel}>Direction</label>
                    <div className={styles.directionButtons}>
                      {[
                        { value: 'to-right', icon: 'arrowRight', label: 'Left to Right' },
                        { value: 'to-bottom', icon: 'arrowDown', label: 'Top to Bottom' },
                        { value: 'to-bottom-right', icon: 'arrowDownRight', label: 'Diagonal Down-Right' },
                        { value: 'to-bottom-left', icon: 'arrowDownLeft', label: 'Diagonal Down-Left' },
                        { value: 'radial', icon: 'circle', label: 'Radial' },
                      ].map((dir) => (
                        <button
                          key={dir.value}
                          type="button"
                          className={`${styles.directionButton} ${background.gradientDirection === dir.value ? styles.active : ''}`}
                          onClick={() => setBackground({ gradientDirection: dir.value as GradientDirection })}
                          title={dir.label}
                          aria-label={dir.label}
                        >
                          <Icon name={dir.icon as 'arrowRight' | 'arrowDown' | 'arrowDownRight' | 'arrowDownLeft' | 'circle'} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {background.type === 'image' && (
                <>
                  <div className={styles.imageUpload}>
                    {background.image ? (
                      <div className={styles.imagePreview}>
                        <img src={background.image} alt="Background" />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="x"
                          onClick={handleRemoveImage}
                          className={styles.removeImage}
                        />
                      </div>
                    ) : (
                      <label className={styles.uploadButton}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          hidden
                        />
                        <span>Upload Image</span>
                      </label>
                    )}
                  </div>
                </>
              )}

              {background.type !== 'none' && (
                <>
                  <Slider
                    label="Padding"
                    value={background.padding}
                    onChange={(padding) => setBackground({ padding })}
                    min={BACKGROUND_PADDING_MIN}
                    max={BACKGROUND_PADDING_MAX}
                    step={4}
                    formatValue={(v) => `${v}px`}
                  />
                  <Select
                    label="Export Ratio"
                    options={[
                      { value: 'auto', label: 'Auto (fit content)' },
                      { value: '1:1', label: '1:1 (Square)' },
                      { value: '4:3', label: '4:3' },
                      { value: '3:2', label: '3:2' },
                      { value: '16:9', label: '16:9 (Widescreen)' },
                      { value: '9:16', label: '9:16 (Portrait)' },
                      { value: '3:4', label: '3:4' },
                      { value: '2:3', label: '2:3' },
                    ]}
                    value={background.imageAspectRatio}
                    onChange={(value) => setBackground({ imageAspectRatio: value as ImageAspectRatio })}
                  />
                </>
              )}
            </div>
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
