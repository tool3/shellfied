import { memo } from 'react';
import { icons, type IconName } from './icons';
import styles from './Icon.module.scss';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  'aria-label'?: string;
}

export const Icon = memo(function Icon({
  name,
  size = 20,
  className = '',
  'aria-label': ariaLabel,
}: IconProps) {
  const iconPath = icons[name];

  return (
    <svg
      className={`${styles.icon} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: iconPath }}
    />
  );
});
