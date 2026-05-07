import { memo } from 'react';
import { useStore } from '@/store';
import { PARTNER_PRESETS, GENERIC_PRESETS, type PresetConfig } from '@/constants/presets';
import styles from './PresetSelector.module.scss';

function PresetCard({ preset, isSelected, onClick }: { preset: PresetConfig; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.presetCard} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      aria-label={`Apply ${preset.name} preset`}
      aria-pressed={isSelected}
    >
      <div
        className={styles.preview}
        style={{
          background: preset.previewBg,
          color: preset.previewFg,
        }}
      >
        <span className={styles.previewText}>{preset.name}</span>
      </div>
    </button>
  );
}

export const PresetSelector = memo(function PresetSelector() {
  const applyPreset = useStore((s) => s.applyPreset);
  const activePreset = useStore((s) => s.activePreset);

  return (
    <div className={styles.presetSelector}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Vendor</h4>
        <div className={styles.grid}>
          {PARTNER_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={activePreset === preset.id}
              onClick={() => applyPreset(preset.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Classic</h4>
        <div className={styles.grid}>
          {GENERIC_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={activePreset === preset.id}
              onClick={() => applyPreset(preset.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
