import { memo } from 'react';
import { useStore } from '@/store';
import { Button, Icon, Logo } from '@/components/common';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
  const colorMode = useStore((s) => s.colorMode);
  const toggleColorMode = useStore((s) => s.toggleColorMode);
  const isSettingsPanelOpen = useStore((s) => s.isSettingsPanelOpen);
  const setSettingsPanelOpen = useStore((s) => s.setSettingsPanelOpen);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo size={32} />
        <div className={styles.title}>
          <h1>Shellfied</h1>
          <span className={styles.tagline}>Create beautiful SVGs from your code and terminal output</span>
        </div>
      </div>

      <nav className={styles.nav}>
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
          icon="panelRight"
          onClick={() => setSettingsPanelOpen(!isSettingsPanelOpen)}
          aria-label={isSettingsPanelOpen ? 'Hide settings' : 'Show settings'}
          className={styles.settingsToggle}
        />
      </nav>
    </header>
  );
});
