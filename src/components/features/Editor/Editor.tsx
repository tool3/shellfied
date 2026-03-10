import { memo, useRef, useCallback, useMemo } from 'react';
import Prism from 'prismjs';
import { useStore } from '@/store';
import { Button, Select } from '@/components/common';
import { SAMPLE_CODE_OPTIONS, SAMPLE_CODES, type SampleCodeKey } from '@/constants/sampleCode';
import { LANGUAGE_OPTIONS, detectLanguage } from '@/constants/languages';
import '@/utils/syntaxHighlight'; // Imports all Prism languages
import styles from './Editor.module.scss';

// Bracket pairs for auto-completion
const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

const CLOSING_BRACKETS = new Set(Object.values(BRACKET_PAIRS));

export const Editor = memo(function Editor() {
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const clearContent = useStore((s) => s.clearContent);
  const setTitle = useStore((s) => s.setTitle);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

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

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle special keys: Tab, bracket auto-completion, etc.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const hasSelection = selectionStart !== selectionEnd;

      // Handle Tab key - insert 2 spaces instead of losing focus
      if (e.key === 'Tab') {
        e.preventDefault();
        const indent = '  ';

        if (hasSelection) {
          // Indent/unindent selected lines
          const beforeSelection = value.substring(0, selectionStart);
          const afterSelection = value.substring(selectionEnd);

          const lineStart = beforeSelection.lastIndexOf('\n') + 1;
          const beforeLine = value.substring(0, lineStart);
          const selectedWithLineStart = value.substring(lineStart, selectionEnd);

          if (e.shiftKey) {
            // Unindent: remove leading spaces from each line
            const unindented = selectedWithLineStart.replace(/^[ ]{2}/gm, '');
            const diff = selectedWithLineStart.length - unindented.length;
            const newValue = beforeLine + unindented + afterSelection;
            setContent(newValue);
            // Adjust selection
            requestAnimationFrame(() => {
              textarea.selectionStart = Math.max(lineStart, selectionStart - (beforeSelection.substring(lineStart).startsWith(indent) ? 2 : 0));
              textarea.selectionEnd = selectionEnd - diff;
            });
          } else {
            // Indent: add spaces to beginning of each line
            const indented = selectedWithLineStart.replace(/^/gm, indent);
            const lineCount = (selectedWithLineStart.match(/\n/g) || []).length + 1;
            const newValue = beforeLine + indented + afterSelection;
            setContent(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = selectionStart + indent.length;
              textarea.selectionEnd = selectionEnd + lineCount * indent.length;
            });
          }
        } else {
          // Simple tab insertion at cursor
          const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
          setContent(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length;
          });
        }
        return;
      }

      // Handle bracket auto-completion
      const closingBracket = BRACKET_PAIRS[e.key];
      if (closingBracket) {
        const charAfterCursor = value[selectionStart];

        // If there's a selection, wrap it with brackets
        if (hasSelection) {
          e.preventDefault();
          const selectedText = value.substring(selectionStart, selectionEnd);
          const newValue =
            value.substring(0, selectionStart) +
            e.key +
            selectedText +
            closingBracket +
            value.substring(selectionEnd);
          setContent(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = selectionStart + 1;
            textarea.selectionEnd = selectionEnd + 1;
          });
          return;
        }

        // For quotes, only auto-complete if not already inside a string
        if (e.key === '"' || e.key === "'" || e.key === '`') {
          // Skip if the next character is the same quote (typing over closing quote)
          if (charAfterCursor === e.key) {
            e.preventDefault();
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
            });
            return;
          }
        }

        // Auto-insert closing bracket
        e.preventDefault();
        const newValue =
          value.substring(0, selectionStart) + e.key + closingBracket + value.substring(selectionEnd);
        setContent(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        });
        return;
      }

      // Handle typing over closing brackets
      if (CLOSING_BRACKETS.has(e.key)) {
        const charAtCursor = value[selectionStart];
        if (charAtCursor === e.key) {
          e.preventDefault();
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          });
          return;
        }
      }

      // Handle Backspace to delete matching brackets
      if (e.key === 'Backspace' && !hasSelection) {
        const charBefore = value[selectionStart - 1];
        const charAfter = value[selectionStart];
        if (charBefore && BRACKET_PAIRS[charBefore] === charAfter) {
          e.preventDefault();
          const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
          setContent(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
          });
          return;
        }
      }

      // Handle Enter to auto-indent
      if (e.key === 'Enter') {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = value.substring(lineStart, selectionStart);
        const indent = currentLine.match(/^(\s*)/)?.[1] || '';
        const charBefore = value[selectionStart - 1];
        const charAfter = value[selectionStart];

        // Check if we're between brackets
        if (charBefore === '{' && charAfter === '}') {
          e.preventDefault();
          const newIndent = indent + '  ';
          const newValue =
            value.substring(0, selectionStart) +
            '\n' +
            newIndent +
            '\n' +
            indent +
            value.substring(selectionStart);
          setContent(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length;
          });
          return;
        }

        // Auto-indent on new line
        if (indent) {
          e.preventDefault();
          const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
          setContent(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length;
          });
          return;
        }
      }
    },
    [setContent]
  );

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
