import { memo, useCallback, useState } from 'react';
import { Button, Icon } from '@/components/common';
import { validateUrlLength } from '@/utils/urlParams';
import styles from './ShareModal.module.scss';

interface ShareModalProps {
  viewUrl: string;
  editUrl: string;
  compressedData: string; // LZ-compressed data for shortening
  onClose: () => void;
}

interface ShortUrls {
  shortUrl: string;
  svgUrl: string;
}

export const ShareModal = memo(function ShareModal({
  viewUrl,
  editUrl,
  compressedData,
  onClose,
}: ShareModalProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [shortUrls, setShortUrls] = useState<ShortUrls | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

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

  const handleCreateShortUrl = useCallback(async () => {
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

      setShortUrls({
        shortUrl: result.shortUrl,
        svgUrl: result.svgUrl,
      });
    } catch (err) {
      setShortenError('Failed to create short URL. Please try again.');
      console.error('Error creating short URL:', err);
    } finally {
      setIsShortening(false);
    }
  }, [compressedData]);

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
          {/* Shortened URLs Section */}
          <div className={styles.shortSection}>
            {!shortUrls ? (
              <Button
                variant="primary"
                icon="link"
                onClick={handleCreateShortUrl}
                disabled={isShortening}
                className={styles.shortenButton}
              >
                {isShortening ? 'Creating...' : 'Create Short URL'}
              </Button>
            ) : (
              <>
                <div className={styles.urlSection}>
                  <label className={styles.label}>
                    <Icon name="link" size={14} />
                    <span>Short Link</span>
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
                  <p className={styles.hint}>Share this link for the view page</p>
                </div>

                <div className={styles.urlSection}>
                  <label className={styles.label}>
                    <Icon name="image" size={14} />
                    <span>Embed URL (Markdown)</span>
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
                    Use in markdown: <code>![img]({shortUrls.svgUrl})</code>
                  </p>
                </div>
              </>
            )}

            {shortenError && (
              <div className={`${styles.warning} ${styles.error}`}>
                <Icon name="warning" size={16} />
                <span>{shortenError}</span>
              </div>
            )}
          </div>

          <div className={styles.divider}>
            <span>or use full URLs</span>
          </div>

          {/* Original Long URLs Section */}
          <div className={styles.urlSection}>
            <label className={styles.label}>
              <Icon name="eye" size={14} />
              <span>View-only Link</span>
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
            <p className={styles.hint}>Recipients see only the rendered image</p>
          </div>

          <div className={styles.urlSection}>
            <label className={styles.label}>
              <Icon name="edit" size={14} />
              <span>Editable Link</span>
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
            <p className={styles.hint}>Recipients can modify settings and content</p>
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
      </div>
    </div>
  );
});
