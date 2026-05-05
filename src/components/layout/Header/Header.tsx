import { memo } from 'react';
import { Icon, Logo } from '@/components/common';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* <Logo size={24} /> */}
        <span className={styles.title}>Shellfied</span>
      </div>
      <nav className={styles.nav}>
        <a
          href="https://github.com/tool3/shellfied"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Icon name="github" size={20} />
        </a>
      </nav>
    </header>
  );
});
