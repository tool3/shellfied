import { memo, useRef, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import { useStore } from '@/store';
import { Button, Select } from '@/components/common';
import { SAMPLE_CODE_OPTIONS, SAMPLE_CODES } from '@/constants/sampleCode';
import styles from './Editor.module.scss';

const LANGUAGE_OPTIONS = [
  { value: 'bash', label: 'Shell / Bash' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'plain', label: 'Plain Text' },
];

export const Editor = memo(function Editor() {
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const clearContent = useStore((s) => s.clearContent);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleSampleSelect = (sampleId: string) => {
    const sample = SAMPLE_CODES[sampleId as keyof typeof SAMPLE_CODES];
    if (sample) {
      setContent(sample);
    }
  };

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const getHighlightedCode = () => {
    if (language === 'plain' || !content) {
      return escapeHtml(content) || '&nbsp;';
    }
    try {
      const grammar = Prism.languages[language];
      if (grammar) {
        return Prism.highlight(content, grammar, language);
      }
    } catch {
      // fallback to plain text
    }
    return escapeHtml(content);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Select
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={setLanguage}
            aria-label="Select language"
          />
          <Select
            options={SAMPLE_CODE_OPTIONS.map((s) => ({ value: s.id, label: s.label }))}
            value=""
            onChange={handleSampleSelect}
            aria-label="Load sample code"
          />
        </div>
        <div className={styles.toolbarRight}>
          <Button variant="ghost" icon="trash" size="sm" onClick={clearContent} aria-label="Clear editor">
            Clear
          </Button>
        </div>
      </div>

      <div className={styles.inputWrapper}>
        <div className={styles.lineNumbers}>
          {content.split('\n').map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className={styles.codeContainer}>
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
            onChange={(e) => setContent(e.target.value)}
            onScroll={syncScroll}
            placeholder="Paste your terminal output or code here..."
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
