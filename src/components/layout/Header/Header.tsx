import { memo, useCallback } from 'react';
import { useStore } from '@/store';
import { Button, Icon, Logo } from '@/components/common';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
  const colorMode = useStore((s) => s.colorMode);
  const toggleColorMode = useStore((s) => s.toggleColorMode);
  const isSettingsPanelOpen = useStore((s) => s.isSettingsPanelOpen);
  const setSettingsPanelOpen = useStore((s) => s.setSettingsPanelOpen);

  const scrollToExport = useCallback(() => {
    const exportPane = document.querySelector('[data-export-pane]');
    if (exportPane) {
      exportPane.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo size={32} />
        <div className={styles.title}>
          <h1>Shellfied</h1>
          <span className={styles.tagline}>Create and share beautiful code</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <Button
          variant="ghost"
          icon="share"
          onClick={scrollToExport}
          aria-label="Share"
          className={styles.mobileShare}
        />

        <a
          href="https://github.com/tool3/shellfied"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
          aria-label="View on GitHub"
        >
          <Icon name="github" size={20} />
          <span className={styles.navLinkText} />
        </a>

        <div className={styles.divider} />

        <Button
          variant="ghost"
          icon={colorMode === 'dark' ? 'sun' : 'moon'}
          onClick={toggleColorMode}
          aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
        />

        <Button
          variant="ghost"
          icon="panelLeft"
          onClick={() => setSettingsPanelOpen(!isSettingsPanelOpen)}
          aria-label={isSettingsPanelOpen ? 'Hide settings' : 'Show settings'}
          className={styles.settingsToggle}
        />
      </nav>
    </header>
  );
});
