import { forwardRef, useId } from 'react';
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

  const displayValue = value || placeholder;
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
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          type="text"
          id={id}
          className={styles.textInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
});
