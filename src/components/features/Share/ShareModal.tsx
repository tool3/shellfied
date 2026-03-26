import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Button, Icon, Toggle, Input } from '@/components/common';
import { useStore } from '@/store';
import { validateUrlLength, generateShareUrlLZ, generateCompressedData } from '@/utils/urlParams';
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
  const [isBrandExpanded, setIsBrandExpanded] = useState(false);
  const brand = useStore((s) => s.brand);
  const setBrand = useStore((s) => s.setBrand);
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

  // Track whether brand was modified since the link was created
  const [liveCompressedData, setLiveCompressedData] = useState(compressedData);
  const [liveViewUrl, setLiveViewUrl] = useState(viewUrl);
  const [liveEditUrl, setLiveEditUrl] = useState(editUrl);
  const brandAtLinkCreation = useRef(JSON.stringify(brand));
  const brandDirty = JSON.stringify(brand) !== brandAtLinkCreation.current;

  const regenerateLink = useCallback(() => {
    const state = useStore.getState();
    const newCompressed = generateCompressedData(state, 'view');
    setLiveViewUrl(generateShareUrlLZ(state, 'view'));
    setLiveEditUrl(generateShareUrlLZ(state, 'edit'));
    setLiveCompressedData(newCompressed);
    brandAtLinkCreation.current = JSON.stringify(state.brand);
    // Clear stale short URLs — auto-create will fire a new one
    onShortUrlsChange(null);
    hasAttemptedAutoCreate.current = false;
  }, [onShortUrlsChange]);

  const viewValidation = validateUrlLength(liveViewUrl);
  const editValidation = validateUrlLength(liveEditUrl);

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
    if (shortUrls && lastShortenedDataRef.current === liveCompressedData) return;

    setIsShortening(true);
    setShortenError(null);

    try {
      const response = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: liveCompressedData }),
      });

      const result = await response.json();

      if (!result.success) {
        setShortenError(result.error || 'Failed to create short URL');
        return;
      }

      lastShortenedDataRef.current = liveCompressedData;
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
  }, [liveCompressedData, onShortUrlsChange, isShortening, shortUrls]);

  // Auto-create short URL when modal opens or when data changes (brand update)
  useEffect(() => {
    // Skip if already have URLs for this content or already attempted
    if (shortUrls && lastShortenedDataRef.current === liveCompressedData) return;
    if (hasAttemptedAutoCreate.current) return;

    hasAttemptedAutoCreate.current = true;
    createShortUrl();
  }, [createShortUrl, shortUrls, liveCompressedData]);

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
                  <input type="text" value={liveViewUrl} readOnly />
                  <div className={styles.urlActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copiedView ? 'check' : 'copy'}
                      onClick={() => copyToClipboard(liveViewUrl, 'view')}
                      aria-label={copiedView ? 'Copied!' : 'Copy URL'}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="externalLink"
                      onClick={() => openInNewTab(liveViewUrl)}
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
                  <input type="text" value={liveEditUrl} readOnly />
                  <div className={styles.urlActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copiedEdit ? 'check' : 'copy'}
                      onClick={() => copyToClipboard(liveEditUrl, 'edit')}
                      aria-label={copiedEdit ? 'Copied!' : 'Copy URL'}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="externalLink"
                      onClick={() => openInNewTab(liveEditUrl)}
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
                <span>URL Length: {liveViewUrl.length.toLocaleString()} / 8,000 characters</span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{
                      width: `${Math.min((liveViewUrl.length / 8000) * 100, 100)}%`,
                      backgroundColor: isInvalid
                        ? 'var(--color-error)'
                        : liveViewUrl.length > 2000
                          ? 'var(--color-warning)'
                          : 'var(--color-success)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Brand Section - Collapsible */}
          <div className={styles.brandSection}>
            <div className={styles.brandSectionRow}>
              <button
                type="button"
                className={styles.brandSectionHeader}
                onClick={() => setIsBrandExpanded(!isBrandExpanded)}
              >
                <div className={styles.brandSectionTitle}>
                  <Icon name="share" size={14} />
                  <span>Brand Settings</span>
                  {brand.enabled && <span className={styles.brandBadge}>On</span>}
                </div>
                <Icon name={isBrandExpanded ? 'chevronUp' : 'chevronDown'} size={16} />
              </button>
              {brandDirty && shortUrls && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="refresh"
                  onClick={regenerateLink}
                  aria-label="Regenerate link with updated brand"
                  className={styles.brandRefreshButton}
                />
              )}
            </div>

            {isBrandExpanded && (
              <div className={styles.brandSectionContent}>
                <div className={styles.brandToggle}>
                  <span>Enable branding on share page</span>
                  <Toggle
                    checked={brand.enabled}
                    onChange={(enabled) => setBrand({ enabled })}
                  />
                </div>

                {brand.enabled && (
                  <div className={styles.brandFields}>
                    <Input
                      label="Text"
                      value={brand.text}
                      onChange={(e) => setBrand({ text: e.target.value })}
                      placeholder="Created with"
                      fullWidth
                    />
                    <Input
                      label="Name"
                      value={brand.name}
                      onChange={(e) => setBrand({ name: e.target.value })}
                      placeholder="Your Brand"
                      fullWidth
                    />
                    <Input
                      label="URL"
                      value={brand.url}
                      onChange={(e) => setBrand({ url: e.target.value })}
                      placeholder="https://yourbrand.com"
                      fullWidth
                    />
                    <div className={styles.brandToggle}>
                      <span>Show icon</span>
                      <Toggle
                        checked={brand.showIcon}
                        onChange={(showIcon) => setBrand({ showIcon })}
                      />
                    </div>
                    {brand.showIcon && (
                      <Input
                        label="Icon URL"
                        value={brand.iconUrl}
                        onChange={(e) => setBrand({ iconUrl: e.target.value })}
                        placeholder="https://yourbrand.com/icon.svg"
                        fullWidth
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
