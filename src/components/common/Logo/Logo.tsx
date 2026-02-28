import { memo } from 'react';
import styles from './Logo.module.scss';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = memo(function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="Shellfied"
      width={size}
      height={size}
      className={`${styles.logo} ${className}`}
    />
  );
});
