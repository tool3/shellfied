import { forwardRef, useId, useState, useEffect, useCallback } from 'react';
import styles from './ColorPicker.module.scss';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
}

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(function ColorPicker(
  { label, value, onChange, placeholder = '#000000', fullWidth = false, className = '' },
  ref
) {
  const id = useId();
  const [localColor, setLocalColor] = useState(value);

  // Sync local state when prop changes externally
  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  // Handle input during drag - only update local state, no store update
  const handleColorInput = useCallback((newColor: string) => {
    setLocalColor(newColor);
  }, []);

  // Handle final commit when picker closes (onChange event)
  const handleColorCommit = useCallback((newColor: string) => {
    setLocalColor(newColor);
    onChange(newColor);
  }, [onChange]);

  const displayValue = localColor || placeholder;
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(displayValue);

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputGroup}>
        <div
          className={styles.colorPreview}
          style={{ backgroundColor: isValidColor ? displayValue : '#000000' }}
        >
          <input
            ref={ref}
            type="color"
            id={`${id}-picker`}
            className={styles.colorInput}
            value={isValidColor ? displayValue : '#000000'}
            onInput={(e) => handleColorInput((e.target as HTMLInputElement).value)}
            onChange={(e) => handleColorCommit(e.target.value)}
          />
        </div>
        <input
          type="text"
          id={id}
          className={styles.textInput}
          value={localColor}
          onChange={(e) => handleColorCommit(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
});
