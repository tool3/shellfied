import { memo, useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Button, Select, ColorPicker, NumberSlider } from '@/components/common';
import type { CompareLabelAlignment, FontWeight } from '@/types';
import styles from './LabelSettings.module.scss';

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
];

const FONT_FAMILY_OPTIONS = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Ubuntu, sans-serif', label: 'Ubuntu' },
  { value: 'Rubik, sans-serif', label: 'Rubik' },
  { value: 'Work Sans, sans-serif', label: 'Work Sans' },
  { value: 'Quicksand, sans-serif', label: 'Quicksand' },
  { value: 'Bebas Neue, sans-serif', label: 'Bebas Neue' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
];

export const LabelSettings = memo(function LabelSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const compareLabelConfig = useStore((s) => s.compareLabelConfig);
  const setCompareLabelConfig = useStore((s) => s.setCompareLabelConfig);

  // Position dropdown when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      const viewportWidth = window.innerWidth;
      const padding = 16;

      // Calculate left position, ensuring dropdown stays within viewport
      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - padding) {
        left = Math.max(padding, viewportWidth - dropdownWidth - padding);
      }

      setDropdownPosition({
        top: rect.bottom + 4,
        left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <Button
        variant="ghost"
        icon="settings"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Label settings"
        aria-expanded={isOpen}
      >
        Label Style
      </Button>

      {isOpen && (
        <div
          className={styles.dropdown}
          ref={dropdownRef}
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <div className={styles.header}>
            <span>Label Settings</span>
          </div>

          <div className={styles.content}>
            <div className={styles.field}>
              <label className={styles.label}>Font Size</label>
              <NumberSlider
                value={compareLabelConfig.fontSize}
                onChange={(value) => setCompareLabelConfig({ fontSize: value })}
                min={12}
                max={64}
                step={1}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Font Family</label>
              <Select
                options={FONT_FAMILY_OPTIONS}
                value={compareLabelConfig.fontFamily}
                onChange={(value) => setCompareLabelConfig({ fontFamily: value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Font Weight</label>
              <Select
                options={FONT_WEIGHT_OPTIONS}
                value={String(compareLabelConfig.fontWeight)}
                onChange={(value) => setCompareLabelConfig({ fontWeight: Number(value) as FontWeight })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Color</label>
              <ColorPicker
                value={compareLabelConfig.color}
                onChange={(value) => setCompareLabelConfig({ color: value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Alignment</label>
              <Select
                options={ALIGNMENT_OPTIONS}
                value={compareLabelConfig.alignment}
                onChange={(value) => setCompareLabelConfig({ alignment: value as CompareLabelAlignment })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
