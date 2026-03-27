'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useIsViewMode, useStore } from '@/store';
import { rehydrateCompressedContent, getShortId, resolveShortId } from '@/utils/urlParams';
import { Header } from '@/components/layout';
import { Editor, Preview, SettingsPanel, ExportPanel, ViewMode } from '@/components/features';
import styles from './page.module.scss';

// SSR-safe mount detection without useEffect + setState
const emptySubscribe = () => () => {};
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export function HomeClient() {
  useTheme();
  const isViewMode = useIsViewMode();
  const [shortIdResolved, setShortIdResolved] = useState(!getShortId());
  const mounted = useIsMounted();

  // Resolve short URL ID if present (?sid=SHORT_ID)
  useEffect(() => {
    const sid = getShortId();
    if (!sid) return;

    resolveShortId(sid).then((urlState) => {
      if (urlState) {
        const store = useStore.getState();
        // Apply all resolved state to the store
        if (urlState.content !== undefined) store.setContent(urlState.content);
        if (urlState.language !== undefined) store.setLanguage(urlState.language);
        if (urlState.template !== undefined) store.setTemplate(urlState.template);
        if (urlState.terminalTheme !== undefined) store.setTerminalTheme(urlState.terminalTheme);
        if (urlState.fontSize !== undefined) store.setFontSize(urlState.fontSize);
        if (urlState.lineHeight !== undefined) store.setLineHeight(urlState.lineHeight);
        if (urlState.padding !== undefined) store.setPadding(urlState.padding);
        if (urlState.title !== undefined) store.setTitle(urlState.title);
        if (urlState.showControls !== undefined) store.setShowControls(urlState.showControls);
        if (urlState.controlsPosition !== undefined) store.setControlsPosition(urlState.controlsPosition);
        if (urlState.borderRadius !== undefined) store.setBorderRadius(urlState.borderRadius);
        if (urlState.width !== undefined) store.setWidth(urlState.width);
        if (urlState.fontFamily !== undefined) store.setFontFamily(urlState.fontFamily);
        if (urlState.compareMode !== undefined) store.setCompareMode(urlState.compareMode);
        if (urlState.beforeContent !== undefined) store.setBeforeContent(urlState.beforeContent);
        if (urlState.afterContent !== undefined) store.setAfterContent(urlState.afterContent);
        if (urlState.beforeLabel !== undefined) store.setBeforeLabel(urlState.beforeLabel);
        if (urlState.afterLabel !== undefined) store.setAfterLabel(urlState.afterLabel);
        if (urlState.beforeLanguage !== undefined) store.setBeforeLanguage(urlState.beforeLanguage);
        if (urlState.beforeTitle !== undefined) store.setBeforeTitle(urlState.beforeTitle);
        if (urlState.afterTitle !== undefined) store.setAfterTitle(urlState.afterTitle);
        if (urlState.afterLanguage !== undefined) store.setAfterLanguage(urlState.afterLanguage);
        if (urlState.compareLabelConfig) store.setCompareLabelConfig(urlState.compareLabelConfig as Parameters<typeof store.setCompareLabelConfig>[0]);
        if (urlState.watermark) store.setWatermark(urlState.watermark);
        if (urlState.header) store.setHeader(urlState.header);
        if (urlState.footer) store.setFooter(urlState.footer);
        if (urlState.background) store.setBackground(urlState.background);
        if (urlState.brand) store.setBrand(urlState.brand);
      }
      setShortIdResolved(true);
    });
  }, []);

  // Rehydrate compressed URL content after initial mount (legacy ?d= and individual params)
  useEffect(() => {
    rehydrateCompressedContent().then((updates) => {
      if (updates) {
        if (updates.content) useStore.getState().setContent(updates.content);
        if (updates.beforeContent) useStore.getState().setBeforeContent(updates.beforeContent);
        if (updates.afterContent) useStore.getState().setAfterContent(updates.afterContent);
      }
    });
  }, []);

  // Wait for client mount before branching on isViewMode to avoid SSR hydration mismatch.
  // Server has no access to URL params (window), so server always renders with isViewMode=false.
  if (!mounted) {
    return null;
  }

  // Wait for short URL data to load before rendering view mode
  if (isViewMode && !shortIdResolved) {
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
          <SettingsPanel />
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
