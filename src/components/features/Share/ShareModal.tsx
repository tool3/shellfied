import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Button, Icon } from '@/components/common';
import { validateUrlLength } from '@/utils/urlParams';
import styles from './ShareModal.module.scss';

export interface ShortUrls {
  shortUrl: string;
  svgUrl: string;
}

type UrlTab = 'short' | 'long';

interface ShareModalProps {
  viewUrl: string;
  editUrl: string;
  compressedData: string; // LZ-compressed data for shortening
  shortUrls: ShortUrls | null;
  onShortUrlsChange: (urls: ShortUrls | null) => void;
  onClose: () => void;
}

export const ShareModal = memo(function ShareModal({
  viewUrl,
  editUrl,
  compressedData,
  shortUrls,
  onShortUrlsChange,
  onClose,
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<UrlTab>('short');
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // Track the compressedData that was used to create current shortUrls
  // Initialize with current compressedData if we already have shortUrls (from parent state)
  const lastShortenedDataRef = useRef<string | null>(shortUrls ? compressedData : null);
  const hasAttemptedAutoCreate = useRef(!!shortUrls);

  const viewValidation = validateUrlLength(viewUrl);
  const editValidation = validateUrlLength(editUrl);

  const copyToClipboard = useCallback(
    async (url: string, type: 'view' | 'edit' | 'short' | 'svg') => {
      try {
        await navigator.clipboard.writeText(url);
        const setters = {
          view: setCopiedView,
          edit: setCopiedEdit,
          short: setCopiedShort,
          svg: setCopiedSvg,
        };
        setters[type](true);
        setTimeout(() => setters[type](false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    },
    []
  );

  const openInNewTab = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const createShortUrl = useCallback(async () => {
    // Don't create if already shortening or if we already have URLs for this data
    if (isShortening) return;
    if (shortUrls && lastShortenedDataRef.current === compressedData) return;

    setIsShortening(true);
    setShortenError(null);

    try {
      const response = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: compressedData }),
      });

      const result = await response.json();

      if (!result.success) {
        setShortenError(result.error || 'Failed to create short URL');
        return;
      }

      lastShortenedDataRef.current = compressedData;
      onShortUrlsChange({
        shortUrl: result.shortUrl,
        svgUrl: result.svgUrl,
      });
    } catch (err) {
      setShortenError('Failed to create short URL. Please try again.');
      console.error('Error creating short URL:', err);
    } finally {
      setIsShortening(false);
    }
  }, [compressedData, onShortUrlsChange, isShortening, shortUrls]);

  // Auto-create short URL when modal opens (only once per unique content)
  useEffect(() => {
    // Skip if already have URLs for this content or already attempted
    if (shortUrls && lastShortenedDataRef.current === compressedData) return;
    if (hasAttemptedAutoCreate.current) return;

    hasAttemptedAutoCreate.current = true;
    createShortUrl();
  }, [createShortUrl, shortUrls, compressedData]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const warning = viewValidation.warning || editValidation.warning;
  const isInvalid = !viewValidation.isValid || !editValidation.isValid;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Share Your Shellfie</h3>
          <Button variant="ghost" size="sm" icon="close" onClick={onClose} aria-label="Close" />
        </div>

        <div className={styles.content}>
          {/* Tab Toggle */}
          <div className={styles.tabToggle}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'short' ? styles.active : ''}`}
              onClick={() => setActiveTab('short')}
            >
              <Icon name="link" size={14} />
              Short URLs
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'long' ? styles.active : ''}`}
              onClick={() => setActiveTab('long')}
            >
              <Icon name="code" size={14} />
              Full URLs
            </button>
          </div>

          {/* Short URLs Tab Content */}
          {activeTab === 'short' && (
            <div className={styles.tabContent}>
              {isShortening ? (
                <div className={styles.loadingSection}>
                  <div className={styles.spinner} />
                  <p className={styles.loadingText}>Creating short links...</p>
                </div>
              ) : shortenError ? (
                <div className={styles.createShortSection}>
                  <div className={`${styles.warning} ${styles.error}`}>
                    <Icon name="warning" size={16} />
                    <span>{shortenError}</span>
                  </div>
                  <Button
                    variant="primary"
                    onClick={createShortUrl}
                    className={styles.shortenButton}
                  >
                    Try Again
                  </Button>
                </div>
              ) : !shortUrls ? (
                <div className={styles.loadingSection}>
                  <div className={styles.spinner} />
                  <p className={styles.loadingText}>Creating short links...</p>
                </div>
              ) : (
                <>
                  <div className={styles.urlSection}>
                    <label className={styles.label}>
                      <Icon name="link" size={14} />
                      <span>Share Page</span>
                    </label>
                    <div className={styles.urlInput}>
                      <input type="text" value={shortUrls.shortUrl} readOnly />
                      <div className={styles.urlActions}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={copiedShort ? 'check' : 'copy'}
                          onClick={() => copyToClipboard(shortUrls.shortUrl, 'short')}
                          aria-label={copiedShort ? 'Copied!' : 'Copy URL'}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="externalLink"
                          onClick={() => openInNewTab(shortUrls.shortUrl)}
                          aria-label="Open in new tab"
                        />
                      </div>
                    </div>
                    <p className={styles.hint}>Opens a branded page with download options</p>
                  </div>

                  <div className={styles.urlSection}>
                    <label className={styles.label}>
                      <Icon name="image" size={14} />
                      <span>Embed URL</span>
                    </label>
                    <div className={styles.urlInput}>
                      <input type="text" value={shortUrls.svgUrl} readOnly />
                      <div className={styles.urlActions}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={copiedSvg ? 'check' : 'copy'}
                          onClick={() => copyToClipboard(shortUrls.svgUrl, 'svg')}
                          aria-label={copiedSvg ? 'Copied!' : 'Copy URL'}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="externalLink"
                          onClick={() => openInNewTab(shortUrls.svgUrl)}
                          aria-label="Open in new tab"
                        />
                      </div>
                    </div>
                    <p className={styles.hint}>
                      Direct image link for markdown: <code>![img]({shortUrls.svgUrl})</code>
                    </p>
                  </div>

                  <p className={styles.persistNote}>
                    <Icon name="check" size={12} />
                    Short links persist as long as content doesn&apos;t change
                  </p>
                </>
              )}
            </div>
          )}

          {/* Full URLs Tab Content */}
          {activeTab === 'long' && (
            <div className={styles.tabContent}>
              <div className={styles.urlSection}>
                <label className={styles.label}>
                  <Icon name="eye" size={14} />
                  <span>Share Page</span>
                </label>
                <div className={styles.urlInput}>
                  <input type="text" value={viewUrl} readOnly />
                  <div className={styles.urlActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copiedView ? 'check' : 'copy'}
                      onClick={() => copyToClipboard(viewUrl, 'view')}
                      aria-label={copiedView ? 'Copied!' : 'Copy URL'}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="externalLink"
                      onClick={() => openInNewTab(viewUrl)}
                      aria-label="Open in new tab"
                    />
                  </div>
                </div>
                <p className={styles.hint}>Opens a branded page with download options</p>
              </div>

              <div className={styles.urlSection}>
                <label className={styles.label}>
                  <Icon name="edit" size={14} />
                  <span>Editor Link</span>
                </label>
                <div className={styles.urlInput}>
                  <input type="text" value={editUrl} readOnly />
                  <div className={styles.urlActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copiedEdit ? 'check' : 'copy'}
                      onClick={() => copyToClipboard(editUrl, 'edit')}
                      aria-label={copiedEdit ? 'Copied!' : 'Copy URL'}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="externalLink"
                      onClick={() => openInNewTab(editUrl)}
                      aria-label="Open in new tab"
                    />
                  </div>
                </div>
                <p className={styles.hint}>Opens the editor with all settings pre-filled</p>
              </div>

              {(warning || isInvalid) && (
                <div className={`${styles.warning} ${isInvalid ? styles.error : ''}`}>
                  <Icon name="warning" size={16} />
                  <span>
                    {isInvalid
                      ? 'URL exceeds maximum length. Consider using shorter content.'
                      : warning}
                  </span>
                </div>
              )}

              <div className={styles.urlLength}>
                <span>URL Length: {viewUrl.length.toLocaleString()} / 8,000 characters</span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{
                      width: `${Math.min((viewUrl.length / 8000) * 100, 100)}%`,
                      backgroundColor: isInvalid
                        ? 'var(--color-error)'
                        : viewUrl.length > 2000
                          ? 'var(--color-warning)'
                          : 'var(--color-success)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
