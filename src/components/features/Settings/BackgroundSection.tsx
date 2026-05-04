import { memo, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { Button, Slider, Select, ColorPicker, Icon } from '@/components/common';
import {
  BACKGROUND_PADDING_MIN,
  BACKGROUND_PADDING_MAX,
  GRADIENT_PRESETS,
  PATTERN_SIZE_MIN,
  PATTERN_SIZE_MAX,
  PATTERN_THICKNESS_MIN,
  PATTERN_THICKNESS_MAX,
} from '@/constants/defaults';
import type { BackgroundType, BackgroundAnimation, GradientDirection, ImageAspectRatio, PatternType, PatternBaseType } from '@/types';
import styles from './SettingsPanel.module.scss';

// Direction mapping: base direction -> reversed direction
const DIRECTION_PAIRS: Record<string, GradientDirection> = {
  'to-right': 'to-left',
  'to-left': 'to-right',
  'to-bottom': 'to-top',
  'to-top': 'to-bottom',
  'to-bottom-right': 'to-top-left',
  'to-top-left': 'to-bottom-right',
  'to-bottom-left': 'to-top-right',
  'to-top-right': 'to-bottom-left',
  'radial': 'radial-reverse',
  'radial-reverse': 'radial',
};

// Get the base direction for a direction (e.g., 'to-left' -> 'to-right')
function getBaseDirection(direction: GradientDirection): GradientDirection {
  const baseDirections: GradientDirection[] = ['to-right', 'to-bottom', 'to-bottom-right', 'to-bottom-left', 'radial'];
  if (baseDirections.includes(direction)) return direction;
  return DIRECTION_PAIRS[direction] as GradientDirection;
}

// Check if a direction is reversed
function isReversedDirection(direction: GradientDirection): boolean {
  const reversedDirections: GradientDirection[] = ['to-left', 'to-top', 'to-top-left', 'to-top-right', 'radial-reverse'];
  return reversedDirections.includes(direction);
}

export const BackgroundSection = memo(function BackgroundSection({ bare = false }: { bare?: boolean }) {
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);

  // Check if current direction is reversed
  const isReversed = useMemo(
    () => isReversedDirection(background.gradientDirection),
    [background.gradientDirection]
  );

  // Get the base direction for the current direction
  const currentBaseDirection = useMemo(
    () => getBaseDirection(background.gradientDirection),
    [background.gradientDirection]
  );

  const handleDirectionClick = useCallback((baseDirection: GradientDirection) => {
    const currentBase = getBaseDirection(background.gradientDirection);
    const currentIsReversed = isReversedDirection(background.gradientDirection);

    if (currentBase === baseDirection) {
      // Same direction clicked - toggle reversed state
      const newDirection = currentIsReversed ? baseDirection : DIRECTION_PAIRS[baseDirection];
      setBackground({ gradientDirection: newDirection as GradientDirection });
    } else {
      // Different direction clicked - set to base (non-reversed) direction
      setBackground({ gradientDirection: baseDirection });
    }
  }, [background.gradientDirection, setBackground]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBackground({ image: dataUrl, type: 'image' });
    };
    reader.readAsDataURL(file);
  }, [setBackground]);

  const handleRemoveImage = useCallback(() => {
    setBackground({ image: null, type: 'none' });
  }, [setBackground]);

  const controls = (
    <>
          <Select
            label="Type"
            options={[
              { value: 'none', label: 'None' },
              { value: 'solid', label: 'Solid Color' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'pattern', label: 'Pattern' },
              { value: 'image', label: 'Image' },
            ]}
            value={background.type}
            onChange={(v) => setBackground({ type: v as BackgroundType })}
            fullWidth
          />

          {(background.type === 'solid' ||
            (background.type === 'pattern' && background.patternBaseType === 'solid')) && (
            <ColorPicker
              label={background.type === 'pattern' ? 'Base Color' : 'Color'}
              value={background.color}
              onChange={(color) => setBackground({ color })}
              placeholder="#6366f1"
              fullWidth
            />
          )}

          {(background.type === 'gradient' ||
            (background.type === 'pattern' && background.patternBaseType === 'gradient')) && (
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
                label={background.type === 'pattern' ? 'Base From' : 'From'}
                value={background.gradientFrom}
                onChange={(gradientFrom) => setBackground({ gradientFrom })}
                placeholder="#6366f1"
                fullWidth
              />
              <ColorPicker
                label={background.type === 'pattern' ? 'Base To' : 'To'}
                value={background.gradientTo}
                onChange={(gradientTo) => setBackground({ gradientTo })}
                placeholder="#ec4899"
                fullWidth
              />
              <div className={styles.directionField}>
                <label className={styles.directionLabel}>Direction</label>
                <div className={styles.directionButtons}>
                  {[
                    { value: 'to-right', icon: 'arrowRight', label: 'Left to Right', reversedLabel: 'Right to Left' },
                    { value: 'to-bottom', icon: 'arrowDown', label: 'Top to Bottom', reversedLabel: 'Bottom to Top' },
                    { value: 'to-bottom-right', icon: 'arrowDownRight', label: 'Diagonal Down-Right', reversedLabel: 'Diagonal Up-Left' },
                    { value: 'to-bottom-left', icon: 'arrowDownLeft', label: 'Diagonal Down-Left', reversedLabel: 'Diagonal Up-Right' },
                    { value: 'radial', icon: 'circle', label: 'Radial', reversedLabel: 'Radial (Reversed)' },
                  ].map((dir) => {
                    const isSelected = currentBaseDirection === dir.value;
                    const isThisReversed = isSelected && isReversed;
                    return (
                      <button
                        key={dir.value}
                        type="button"
                        className={`${styles.directionButton} ${isSelected ? styles.active : ''} ${isThisReversed ? styles.reversed : ''}`}
                        onClick={() => handleDirectionClick(dir.value as GradientDirection)}
                        title={isThisReversed ? dir.reversedLabel : dir.label}
                        aria-label={isThisReversed ? dir.reversedLabel : dir.label}
                      >
                        <Icon name={dir.icon as 'arrowRight' | 'arrowDown' | 'arrowDownRight' | 'arrowDownLeft' | 'circle'} size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {background.type === 'pattern' && (
            <>
              <Select
                label="Pattern"
                options={[
                  { value: 'dotted', label: 'Dotted' },
                  { value: 'grid', label: 'Grid' },
                  { value: 'noise', label: 'Noise' },
                  { value: 'topographic', label: 'Topographic' },
                ]}
                value={background.patternType}
                onChange={(v) => setBackground({ patternType: v as PatternType })}
                fullWidth
              />
              <Select
                label="Base"
                options={[
                  { value: 'solid', label: 'Solid Color' },
                  { value: 'gradient', label: 'Gradient' },
                ]}
                value={background.patternBaseType}
                onChange={(v) => setBackground({ patternBaseType: v as PatternBaseType })}
                fullWidth
              />
              <ColorPicker
                label="Pattern Color"
                value={background.patternColor}
                onChange={(patternColor) => setBackground({ patternColor })}
                placeholder="rgba(255,255,255,0.35)"
                fullWidth
              />
              <Slider
                label={
                  background.patternType === 'grid'
                    ? 'Cell Size'
                    : background.patternType === 'topographic'
                      ? 'Spacing'
                      : background.patternType === 'noise'
                        ? 'Grain'
                        : 'Spacing'
                }
                value={background.patternSize}
                onChange={(patternSize) => setBackground({ patternSize })}
                min={PATTERN_SIZE_MIN}
                max={PATTERN_SIZE_MAX}
                step={1}
                formatValue={(v) => `${v}px`}
              />
              {background.patternType !== 'noise' && (
                <Slider
                  label={background.patternType === 'dotted' ? 'Dot Size' : 'Thickness'}
                  value={background.patternThickness}
                  onChange={(patternThickness) => setBackground({ patternThickness })}
                  min={PATTERN_THICKNESS_MIN}
                  max={PATTERN_THICKNESS_MAX}
                  step={0.5}
                  formatValue={(v) => `${v}px`}
                />
              )}
              <Slider
                label="Opacity"
                value={background.patternOpacity}
                onChange={(patternOpacity) => setBackground({ patternOpacity })}
                min={0}
                max={1}
                step={0.05}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
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

          {/* Animation — always available, independent of background type */}
          <Select
            label="Animation"
            options={[
              { value: 'none', label: 'None' },
              { value: 'particles', label: 'Particles' },
              { value: 'border-pulse', label: 'Pulsing Border' },
              { value: 'waves', label: 'Waves' },
              { value: 'border-gradient', label: 'Border Gradient' },
              { value: 'border-shimmer', label: 'Border Shimmer' },
              { value: 'aurora', label: 'Aurora' },
              { value: 'grid', label: 'Drifting Grid' },
            ]}
            value={background.animation || 'none'}
            onChange={(v) => setBackground({ animation: v === 'none' ? null : v as BackgroundAnimation })}
            fullWidth
          />
          {background.animation && (
            <ColorPicker
              label="Animation Color"
              value={background.animationColor || 'rgba(255,255,255,0.15)'}
              onChange={(animationColor) => setBackground({ animationColor })}
              placeholder="rgba(255,255,255,0.15)"
              fullWidth
            />
          )}

          {background.type !== 'none' && (
            <>
              <Slider
                label="Padding"
                value={background.padding}
                onChange={(padding) => setBackground({ padding })}
                min={BACKGROUND_PADDING_MIN}
                max={BACKGROUND_PADDING_MAX}
                step={1}
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
    </>
  );

  if (bare) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{controls}</div>;
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Background</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.fields}>
          {controls}
        </div>
      </div>
    </section>
  );
});

