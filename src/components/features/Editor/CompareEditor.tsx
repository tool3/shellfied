import { memo, useRef, useCallback, useMemo } from 'react';
import Prism from 'prismjs';
import { Select } from '@/components/common';
import { LANGUAGE_OPTIONS, detectLanguage } from '@/constants/languages';
import '@/utils/syntaxHighlight';
import styles from './CompareEditor.module.scss';

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
          const beforeSelection = value.substring(0, selectionStart);
          const afterSelection = value.substring(selectionEnd);
          const lineStart = beforeSelection.lastIndexOf('\n') + 1;
          const beforeLine = value.substring(0, lineStart);
          const selectedWithLineStart = value.substring(lineStart, selectionEnd);

          if (e.shiftKey) {
            const unindented = selectedWithLineStart.replace(/^[ ]{2}/gm, '');
            const diff = selectedWithLineStart.length - unindented.length;
            const newValue = beforeLine + unindented + afterSelection;
            onContentChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = Math.max(lineStart, selectionStart - (beforeSelection.substring(lineStart).startsWith(indent) ? 2 : 0));
              textarea.selectionEnd = selectionEnd - diff;
            });
          } else {
            const indented = selectedWithLineStart.replace(/^/gm, indent);
            const lineCount = (selectedWithLineStart.match(/\n/g) || []).length + 1;
            const newValue = beforeLine + indented + afterSelection;
            onContentChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = selectionStart + indent.length;
              textarea.selectionEnd = selectionEnd + lineCount * indent.length;
            });
          }
        } else {
          const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
          onContentChange(newValue);
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

        if (hasSelection) {
          e.preventDefault();
          const selectedText = value.substring(selectionStart, selectionEnd);
          const newValue =
            value.substring(0, selectionStart) +
            e.key +
            selectedText +
            closingBracket +
            value.substring(selectionEnd);
          onContentChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = selectionStart + 1;
            textarea.selectionEnd = selectionEnd + 1;
          });
          return;
        }

        if (e.key === '"' || e.key === "'" || e.key === '`') {
          if (charAfterCursor === e.key) {
            e.preventDefault();
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
            });
            return;
          }
        }

        e.preventDefault();
        const newValue =
          value.substring(0, selectionStart) + e.key + closingBracket + value.substring(selectionEnd);
        onContentChange(newValue);
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
          onContentChange(newValue);
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
          onContentChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length;
          });
          return;
        }

        if (indent) {
          e.preventDefault();
          const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
          onContentChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length;
          });
          return;
        }
      }
    },
    [onContentChange]
  );

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
