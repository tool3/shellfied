import { memo, useRef, useCallback, useMemo } from 'react';
import Prism from 'prismjs';
import { useStore, useCompareState, useCompareActions } from '@/store';
import { Button, Select } from '@/components/common';
import { SAMPLE_CODE_OPTIONS, SAMPLE_CODES, type SampleCodeKey } from '@/constants/sampleCode';
import { LANGUAGE_OPTIONS, detectLanguage } from '@/constants/languages';
import { useEditorBehavior, escapeHtml } from '@/hooks/useEditorBehavior';
import { CompareEditor } from './CompareEditor';
import { LabelSettings } from './LabelSettings';
import '@/utils/syntaxHighlight'; // Imports all Prism languages
import styles from './Editor.module.scss';

export const Editor = memo(function Editor() {
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const clearContent = useStore((s) => s.clearContent);
  const setTitle = useStore((s) => s.setTitle);

  // Compare mode state - using compound selectors
  const {
    compareMode, beforeContent, afterContent,
    beforeLabel, afterLabel, beforeLanguage, afterLanguage,
  } = useCompareState();
  const {
    setCompareMode, setBeforeContent, setAfterContent,
    setBeforeLabel, setAfterLabel, setBeforeLanguage, setAfterLanguage,
  } = useCompareActions();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const { syncScroll, handleKeyDown } = useEditorBehavior({
    textareaRef,
    highlightRef,
    onContentChange: setContent,
  });

  // Find which demo matches current content (if any)
  const currentDemo = useMemo(() => {
    const match = Object.entries(SAMPLE_CODES).find(([, code]) => code === content);
    return match ? (match[0] as SampleCodeKey) : '';
  }, [content]);

  const handleSampleSelect = (sampleId: string) => {
    const sample = SAMPLE_CODES[sampleId as keyof typeof SAMPLE_CODES];
    const sampleOption = SAMPLE_CODE_OPTIONS.find((s) => s.id === sampleId);
    if (sample) {
      setContent(sample);
      if (sampleOption) {
        setTitle(sampleOption.label);
      }
    }
  };

  // Resolve the actual language to use for highlighting
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

  const handleClearCompare = useCallback(() => {
    setBeforeContent('');
    setAfterContent('');
  }, [setBeforeContent, setAfterContent]);

  // Compare mode view
  if (compareMode) {
    return (
      <div className={styles.editor}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Button
              variant="primary"
              icon="x"
              size="sm"
              onClick={() => setCompareMode(false)}
              aria-label="Exit compare mode"
            >
              Exit Compare
            </Button>
            <LabelSettings />
          </div>
          <div className={styles.toolbarRight}>
            <Button variant="ghost" icon="trash" size="sm" onClick={handleClearCompare} aria-label="Clear both editors">
              Clear
            </Button>
          </div>
        </div>

        <div className={styles.compareContainer}>
          <div className={styles.editorPane}>
            <CompareEditor
              content={beforeContent}
              language={beforeLanguage}
              label={beforeLabel}
              onContentChange={setBeforeContent}
              onLanguageChange={setBeforeLanguage}
              onLabelChange={setBeforeLabel}
              placeholder="Paste 'before' code here..."
            />
          </div>
          <div className={styles.editorPane}>
            <CompareEditor
              content={afterContent}
              language={afterLanguage}
              label={afterLabel}
              onContentChange={setAfterContent}
              onLanguageChange={setAfterLanguage}
              onLabelChange={setAfterLabel}
              placeholder="Paste 'after' code here..."
            />
          </div>
        </div>
      </div>
    );
  }

  // Single editor view
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
            value={currentDemo}
            onChange={handleSampleSelect}
            placeholder="Load Demo..."
            aria-label="Load sample code"
          />
          <Button
            variant="ghost"
            icon="play"
            size="sm"
            onClick={() => {
              // Preserve current content in the "before" editor when entering compare mode
              if (content && !beforeContent) {
                setBeforeContent(content);
                setBeforeLanguage(language);
              }
              setCompareMode(true);
            }}
            aria-label="Enter compare mode"
          >
            Compare
          </Button>
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
            onKeyDown={handleKeyDown}
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
