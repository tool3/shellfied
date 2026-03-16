import { memo, useCallback, useState } from 'react';
import { Button, Icon } from '@/components/common';
import { validateUrlLength } from '@/utils/urlParams';
import styles from './ShareModal.module.scss';

interface ShareModalProps {
  viewUrl: string;
  editUrl: string;
  onClose: () => void;
}

export const ShareModal = memo(function ShareModal({ viewUrl, editUrl, onClose }: ShareModalProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const viewValidation = validateUrlLength(viewUrl);
  const editValidation = validateUrlLength(editUrl);

  const copyToClipboard = useCallback(async (url: string, type: 'view' | 'edit') => {
    try {
      await navigator.clipboard.writeText(url);
      if (type === 'view') {
        setCopiedView(true);
        setTimeout(() => setCopiedView(false), 2000);
      } else {
        setCopiedEdit(true);
        setTimeout(() => setCopiedEdit(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, []);

  const openInNewTab = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

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
