import { memo, type ReactNode } from 'react';
import styles from './Container.module.scss';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = memo(function Container({ children, className = '' }: ContainerProps) {
  return <div className={`${styles.container} ${className}`}>{children}</div>;
});
