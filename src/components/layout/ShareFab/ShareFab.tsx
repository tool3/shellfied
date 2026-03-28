'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { Icon } from '@/components/common';
import { ShareModal, type ShortUrls } from '@/components/features/Share';
import { generateShareUrlLZ, generateCompressedData } from '@/utils/urlParams';
import styles from './ShareFab.module.scss';

// Generate a simple hash of the state that affects share URLs
function getStateHash(state: ReturnType<typeof useStore.getState>): string {
  return JSON.stringify({
    content: state.content,
    language: state.language,
    template: state.template,
    terminalTheme: state.terminalTheme,
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
    padding: state.padding,
    title: state.title,
    showControls: state.showControls,
    controlsPosition: state.controlsPosition,
    borderRadius: state.borderRadius,
    width: state.width,
    fontFamily: state.fontFamily,
    watermark: state.watermark,
    header: state.header,
    footer: state.footer,
    background: state.background,
    compareMode: state.compareMode,
    beforeContent: state.beforeContent,
    afterContent: state.afterContent,
    beforeLabel: state.beforeLabel,
    afterLabel: state.afterLabel,
    beforeTitle: state.beforeTitle,
    afterTitle: state.afterTitle,
    beforeLanguage: state.beforeLanguage,
    afterLanguage: state.afterLanguage,
    compareLabelConfig: state.compareLabelConfig,
    brand: state.brand,
  });
}

export const ShareFab = memo(function ShareFab() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrls, setShareUrls] = useState({ viewUrl: '', editUrl: '', compressedData: '' });
  const [shortUrls, setShortUrls] = useState<ShortUrls | null>(null);
  const lastStateHashRef = useRef<string>('');

  const handleShare = useCallback(() => {
    const state = useStore.getState();
    const currentHash = getStateHash(state);

    if (currentHash !== lastStateHashRef.current || !shareUrls.viewUrl) {
      const viewUrl = generateShareUrlLZ(state, 'view');
      const editUrl = generateShareUrlLZ(state, 'edit');
      const compressedData = generateCompressedData(state, 'view');
      setShareUrls({ viewUrl, editUrl, compressedData });
      setShortUrls(null);
      lastStateHashRef.current = currentHash;
    }

    setShowShareModal(true);
  }, [shareUrls.viewUrl]);

  return (
    <>
      <button
        className={styles.fab}
        onClick={handleShare}
        type="button"
        aria-label="Share"
      >
        <Icon name="share" size={22} />
      </button>

      {showShareModal && (
        <ShareModal
          viewUrl={shareUrls.viewUrl}
          editUrl={shareUrls.editUrl}
          compressedData={shareUrls.compressedData}
          shortUrls={shortUrls}
          onShortUrlsChange={setShortUrls}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
});
