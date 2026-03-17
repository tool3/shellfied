'use client';

import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useIsViewMode, useStore, useHasHydrated } from '@/store';
import { rehydrateCompressedContent } from '@/utils/urlParams';
import { Header } from '@/components/layout';
import { Editor, Preview, SettingsPanel, ExportPanel, ViewMode } from '@/components/features';
import styles from './page.module.scss';

export function HomeClient() {
  useTheme();
  const isViewMode = useIsViewMode();
  const hasHydrated = useHasHydrated();

  // Rehydrate compressed URL content after initial mount
  useEffect(() => {
    rehydrateCompressedContent().then((updates) => {
      if (updates) {
        if (updates.content) useStore.getState().setContent(updates.content);
        if (updates.beforeContent) useStore.getState().setBeforeContent(updates.beforeContent);
        if (updates.afterContent) useStore.getState().setAfterContent(updates.afterContent);
      }
    });
  }, []);

  // Wait for store hydration before rendering view mode
  // This ensures URL params are applied before ViewMode tries to use them
  if (isViewMode && !hasHydrated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // Render view-only mode for shared links
  if (isViewMode) {
    return <ViewMode />;
  }

  // Render full editor
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <div className={styles.workspace}>
          <div className={styles.editorPane}>
            <Editor />
          </div>
          <div className={styles.previewPane}>
            <Preview />
            <div className={styles.exportPane} data-export-pane>
              <ExportPanel />
            </div>
          </div>
        </div>
        <SettingsPanel />
      </main>
      <footer className={styles.footer}>
        <span>Powered by </span>
        <a
          href="https://github.com/tool3/shellfie"
          target="_blank"
          rel="noopener noreferrer"
        >
          shellfie
        </a>
      </footer>
    </div>
  );
}
