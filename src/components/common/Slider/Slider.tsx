import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Slider.module.scss';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    onChange,
    min,
    max,
    step = 1,
    label,
    showValue = true,
    formatValue = (v) => String(v),
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const sliderId = id || generatedId;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showValue) && (
        <div className={styles.header}>
          {label && (
            <label htmlFor={sliderId} className={styles.label}>
              {label}
            </label>
          )}
          {showValue && <span className={styles.value}>{formatValue(value)}</span>}
        </div>
      )}
      <input
        ref={ref}
        type="range"
        id={sliderId}
        className={styles.slider}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{ '--progress': `${percentage}%` } as React.CSSProperties}
        {...props}
      />
    </div>
  );
});
