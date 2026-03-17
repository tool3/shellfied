import { useCallback, type RefObject } from 'react';

export const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

export const CLOSING_BRACKETS = new Set(Object.values(BRACKET_PAIRS));

interface UseEditorBehaviorOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  highlightRef: RefObject<HTMLPreElement | null>;
  onContentChange: (content: string) => void;
}

export function useEditorBehavior({
  textareaRef,
  highlightRef,
  onContentChange,
}: UseEditorBehaviorOptions) {
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [textareaRef, highlightRef]);

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
            onContentChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = Math.max(
                lineStart,
                selectionStart - (beforeSelection.substring(lineStart).startsWith(indent) ? 2 : 0)
              );
              textarea.selectionEnd = selectionEnd - diff;
            });
          } else {
            // Indent: add spaces to start of each line
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
          // Simple tab insertion
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
        if (hasSelection) {
          // Wrap selection with brackets
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
        } else if (e.key === closingBracket) {
          // For quotes, auto-complete only if next char isn't the same quote
          const nextChar = value[selectionStart];
          if (nextChar !== e.key) {
            e.preventDefault();
            const newValue =
              value.substring(0, selectionStart) +
              e.key +
              closingBracket +
              value.substring(selectionEnd);
            onContentChange(newValue);
            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
            });
          }
        } else {
          // Auto-complete opening brackets
          e.preventDefault();
          const newValue =
            value.substring(0, selectionStart) +
            e.key +
            closingBracket +
            value.substring(selectionEnd);
          onContentChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          });
        }
        return;
      }

      // Handle closing bracket skip
      if (CLOSING_BRACKETS.has(e.key)) {
        const nextChar = value[selectionStart];
        if (nextChar === e.key) {
          e.preventDefault();
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          });
        }
      }

      // Handle Backspace for bracket pair deletion
      if (e.key === 'Backspace' && !hasSelection && selectionStart > 0) {
        const prevChar = value[selectionStart - 1];
        const nextChar = value[selectionStart];
        const expectedClosing = BRACKET_PAIRS[prevChar];

        if (expectedClosing && nextChar === expectedClosing) {
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

        // Check if between brackets
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

        // Auto-indent on new line
        if (indent) {
          e.preventDefault();
          const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
          onContentChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length;
          });
        }
      }
    },
    [textareaRef, onContentChange]
  );

  return { syncScroll, handleKeyDown };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
