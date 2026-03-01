import { memo } from 'react';
import { useStore } from '@/store';
import styles from './Logo.module.scss';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = memo(function Logo({ size = 24, className = '' }: LogoProps) {
  const colorMode = useStore((s) => s.colorMode);
  const faviconSrc = colorMode === 'light' ? '/favicon-light.svg' : '/favicon-dark.svg';

  return (
    <img
      src={faviconSrc}
      alt="Shellfied"
      width={size}
      height={size}
      className={`${styles.logo} ${className}`}
    />
  );
});
