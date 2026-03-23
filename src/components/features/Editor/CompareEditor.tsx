import { memo, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import { Select } from '@/components/common';
import { LANGUAGE_OPTIONS, detectLanguage } from '@/constants/languages';
import { useEditorBehavior, escapeHtml } from '@/hooks/useEditorBehavior';
import '@/utils/syntaxHighlight';
import styles from './CompareEditor.module.scss';

interface CompareEditorProps {
  content: string;
  language: string;
  label: string;
  onContentChange: (content: string) => void;
  onLanguageChange: (language: string) => void;
  onLabelChange: (label: string) => void;
  placeholder?: string;
}

export const CompareEditor = memo(function CompareEditor({
  content,
  language,
  label,
  onContentChange,
  onLanguageChange,
  onLabelChange,
  placeholder = 'Paste your code here...',
}: CompareEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const { syncScroll, handleKeyDown } = useEditorBehavior({
    textareaRef,
    highlightRef,
    onContentChange,
  });

  const effectiveLanguage = useMemo(() => {
    if (language === 'auto') {
      return detectLanguage(content);
    }
    return language;
  }, [language, content]);

  const getHighlightedCode = () => {
    if (effectiveLanguage === 'plain' || !content) {
      return escapeHtml(content) || '&nbsp;';
    }
    try {
      const grammar = Prism.languages[effectiveLanguage];
      if (grammar) {
        return Prism.highlight(content, grammar, effectiveLanguage);
      }
    } catch {
      // fallback to plain text
    }
    return escapeHtml(content);
  };

  return (
    <div className={styles.compareEditor}>
      <div className={styles.header}>
        <input
          type="text"
          className={styles.labelInput}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Label..."
          aria-label="Editor label"
        />
        <Select
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={onLanguageChange}
          aria-label="Select language"
        />
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.lineNumbers}>
          {content.split('\n').map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className={styles.codeArea}>
          <pre
            ref={highlightRef}
            className={styles.highlight}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: getHighlightedCode() + '\n' }}
          />
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
});
