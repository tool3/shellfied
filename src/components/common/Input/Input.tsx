import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, fullWidth = false, className = '', id, value, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  // Ensure value is never undefined to prevent uncontrolled->controlled switch
  // Only apply default if value is explicitly passed (controlled mode)
  const safeValue = value !== undefined ? (value ?? '') : undefined;

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${styles.input} ${error ? styles.hasError : ''}`}
        value={safeValue}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});
