import { memo, useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useStore } from '@/store';
import { Input } from '@/components/common';
import { DEFAULT_WATERMARK_STYLE, getDefaultWatermarkMarkup, BRAND_COLOR_DARK, BRAND_COLOR_LIGHT } from '@/constants/defaults';
import type { WatermarkType } from '@/types';
import styles from './WatermarkEditor.module.scss';

// Check if text contains ANSI escape codes
function hasAnsiCodes(text: string): boolean {
  // Match actual escape character or escaped representations
  // eslint-disable-next-line no-control-regex
  return /\x1b\[|\\x1b\[|\\033\[|\\e\[/.test(text);
}

// Named CSS colors set for validation
const CSS_COLOR_NAMES = new Set([
  'black', 'silver', 'gray', 'grey', 'white', 'maroon', 'red', 'purple',
  'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal',
  'aqua', 'orange', 'aliceblue', 'antiquewhite', 'aquamarine', 'azure',
  'beige', 'bisque', 'blanchedalmond', 'blueviolet', 'brown', 'burlywood',
  'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
  'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
  'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray',
  'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'greenyellow', 'honeydew',
  'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightslategrey', 'lightsteelblue', 'lightyellow', 'limegreen', 'linen',
  'magenta', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
  'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
  'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
  'navajowhite', 'oldlace', 'olivedrab', 'orangered', 'orchid', 'palegoldenrod',
  'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
  'peru', 'pink', 'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown',
  'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'skyblue',
  'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue',
  'tan', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke',
  'yellowgreen', 'transparent', 'currentcolor', 'inherit',
]);

// Check if a value is a valid CSS color
function isValidColor(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  // Named color
  if (CSS_COLOR_NAMES.has(trimmed)) return true;
  // Hex color (3, 4, 6, or 8 digits)
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) return true;
  if (/^#[0-9a-f]{4}$/i.test(trimmed)) return true;
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return true;
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return true;
  // rgb/rgba/hsl/hsla
  if (/^(rgb|hsl)a?\s*\(/.test(trimmed)) return true;
  return false;
}

// Validate CSS-like style string
function isValidStyle(styleStr: string): boolean {
  if (!styleStr.trim()) return true;

  const declarations = styleStr.split(/[;\n]/).filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;

    const property = decl.slice(0, colonIndex).trim().toLowerCase();
    const value = decl.slice(colonIndex + 1).trim();

    if (!property || !value) return false;

    // Validate color property
    if (property === 'color') {
      if (!isValidColor(value)) return false;
    } else if (property === 'padding' || property === 'margin') {
      const parts = value.split(/\s+/);
      if (parts.length < 1 || parts.length > 4) return false;
      for (const part of parts) {
        if (!/^-?\d+(\.\d+)?(px|em|rem|%)?$/.test(part)) return false;
      }
    } else if (property === 'opacity') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) return false;
    }
    // Allow other properties without strict validation
  }

  return true;
}

// Common named colors to hex mapping for color picker sync
const NAMED_COLOR_TO_HEX: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
  gray: '#808080', grey: '#808080', orange: '#ffa500', pink: '#ffc0cb',
  purple: '#800080', brown: '#a52a2a', navy: '#000080', teal: '#008080',
  maroon: '#800000', olive: '#808000', lime: '#00ff00', aqua: '#00ffff',
  silver: '#c0c0c0', fuchsia: '#ff00ff',
};

// Extract color value from style string
function extractColor(styleStr: string | undefined): string | null {
  if (!styleStr) return null;
  const match = styleStr.match(/color\s*:\s*([^;\n]+)/i);
  if (match) {
    const value = match[1].trim().toLowerCase();
    // If it's a hex color, return it for the color picker
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    if (/^#[0-9a-f]{3}$/i.test(value)) {
      // Expand 3-digit hex to 6-digit
      const r = value[1], g = value[2], b = value[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    // Check for named colors
    if (NAMED_COLOR_TO_HEX[value]) {
      return NAMED_COLOR_TO_HEX[value];
    }
  }
  return null;
}

// Update color in style string
function updateColorInStyle(styleStr: string | undefined, newColor: string): string {
  const str = styleStr || '';
  const colorRegex = /color\s*:\s*[^;\n]+/i;
  if (colorRegex.test(str)) {
    return str.replace(colorRegex, `color: ${newColor}`);
  }
  // Add color if not present
  const trimmed = str.trim();
  if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('\n')) {
    return `${trimmed};\ncolor: ${newColor};`;
  }
  return `${trimmed}\ncolor: ${newColor};`.trim();
}

export const WatermarkEditor = memo(function WatermarkEditor() {
  const watermark = useStore((s) => s.watermark);
  const setWatermark = useStore((s) => s.setWatermark);
  const colorMode = useStore((s) => s.colorMode);

  const [localStyle, setLocalStyle] = useState(watermark.style || DEFAULT_WATERMARK_STYLE);
  const [localMarkup, setLocalMarkup] = useState(watermark.markup || getDefaultWatermarkMarkup(colorMode));
  const [isValid, setIsValid] = useState(true);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorSwatchRef = useRef<HTMLSpanElement>(null);
  const pendingColorRef = useRef<string | null>(null);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect if watermark text has ANSI codes
  const hasAnsi = useMemo(() => hasAnsiCodes(watermark.text), [watermark.text]);

  // Sync local state when store changes externally (e.g., reset)
  useEffect(() => {
    if (watermark.style !== localStyle) {
      setLocalStyle(watermark.style);
      setIsValid(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watermark.style]);

  useEffect(() => {
    if (watermark.markup !== localMarkup) {
      setLocalMarkup(watermark.markup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watermark.markup]);

  // Swap brand color in markup when color mode changes
  useEffect(() => {
    const oldColor = colorMode === 'dark' ? BRAND_COLOR_LIGHT : BRAND_COLOR_DARK;
    const newColor = colorMode === 'dark' ? BRAND_COLOR_DARK : BRAND_COLOR_LIGHT;

    if (localMarkup.includes(oldColor)) {
      const updatedMarkup = localMarkup.replace(new RegExp(oldColor, 'gi'), newColor);
      setLocalMarkup(updatedMarkup);
      setWatermark({ markup: updatedMarkup });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorMode]);

  // Extract current color from style for the color picker
  const currentColor = useMemo(() => extractColor(localStyle) || '#888888', [localStyle]);

  // Sync color picker when style changes externally (via ref, no re-render)
  useLayoutEffect(() => {
    if (colorInputRef.current) {
      colorInputRef.current.value = currentColor;
    }
    if (colorSwatchRef.current) {
      colorSwatchRef.current.style.backgroundColor = currentColor;
    }
  }, [currentColor]);


  const handleTypeChange = useCallback(
    (type: WatermarkType) => {
      setWatermark({ type });
    },
    [setWatermark]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWatermark({ text: e.target.value });
    },
    [setWatermark]
  );

  const handleMarkupChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMarkup = e.target.value;
      setLocalMarkup(newMarkup);
      setWatermark({ markup: newMarkup });
    },
    [setWatermark]
  );

  const handleStyleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newStyle = e.target.value;
      setLocalStyle(newStyle);

      const valid = isValidStyle(newStyle);
      setIsValid(valid);

      if (valid) {
        setWatermark({ style: newStyle });
      }
    },
    [setWatermark]
  );

  // Commit pending color after drag stops
  const commitColor = useCallback((color: string) => {
    const newStyle = updateColorInStyle(localStyle, color);
    setLocalStyle(newStyle);
    setIsValid(true);
    setWatermark({ style: newStyle });
    pendingColorRef.current = null;
  }, [localStyle, setWatermark]);

  // Handle color picker input (fires during drag) - debounced commit
  const handleColorInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const newColor = (e.target as HTMLInputElement).value;
      pendingColorRef.current = newColor;

      // Update swatch directly via DOM - no React re-render
      if (colorSwatchRef.current) {
        colorSwatchRef.current.style.backgroundColor = newColor;
      }

      // Clear previous timeout and set new one - commits 150ms after last input
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
      commitTimeoutRef.current = setTimeout(() => {
        if (pendingColorRef.current) {
          commitColor(pendingColorRef.current);
        }
      }, 150);
    },
    [commitColor]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
    };
  }, []);

  const handleResetStyle = useCallback(() => {
    setLocalStyle(DEFAULT_WATERMARK_STYLE);
    setIsValid(true);
    setWatermark({ style: DEFAULT_WATERMARK_STYLE });
  }, [setWatermark]);

  const handleResetMarkup = useCallback(() => {
    const defaultMarkup = getDefaultWatermarkMarkup(colorMode);
    setLocalMarkup(defaultMarkup);
    setWatermark({ markup: defaultMarkup });
  }, [setWatermark, colorMode]);

  return (
    <div className={styles.editor}>
      <div className={styles.typeToggle}>
        <span className={styles.label}>Watermark</span>
        <div className={styles.toggleButtons}>
          <button
            type="button"
            className={`${styles.toggleButton} ${watermark.type === 'text' ? styles.active : ''}`}
            onClick={() => handleTypeChange('text')}
          >
            Text
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${watermark.type === 'markup' ? styles.active : ''}`}
            onClick={() => handleTypeChange('markup')}
          >
            Markup
          </button>
        </div>
      </div>

      {watermark.type === 'text' ? (
        <>
          <Input
            value={watermark.text}
            onChange={handleTextChange}
            placeholder="Optional watermark text"
            fullWidth
          />

          {watermark.text && (
            <div className={styles.styleSection}>
              {hasAnsi ? (
                <div className={styles.ansiNotice}>
                  <span className={styles.ansiIcon}>⚡</span>
                  <span>ANSI codes detected - styling applied via escape sequences</span>
                </div>
              ) : (
                <>
                  <div className={styles.styleHeader}>
                    <span className={styles.styleLabel}>Style</span>
                    <div className={styles.colorPickerWrapper}>
                      <input
                        ref={colorInputRef}
                        type="color"
                        defaultValue={currentColor}
                        onInput={handleColorInput}
                        className={styles.colorInput}
                        title="Pick color"
                      />
                      <span
                        ref={colorSwatchRef}
                        className={styles.colorSwatch}
                        style={{ backgroundColor: currentColor }}
                        onClick={() => colorInputRef.current?.click()}
                        title="Pick color"
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.resetButton}
                      onClick={handleResetStyle}
                      title="Reset to defaults"
                    >
                      Reset
                    </button>
                  </div>

                  <div className={styles.styleEditor}>
                    <textarea
                      className={`${styles.textarea} ${!isValid ? styles.invalid : ''}`}
                      value={localStyle}
                      onChange={handleStyleChange}
                      placeholder="color: #888888;&#10;padding: 8px;"
                      rows={3}
                      spellCheck={false}
                    />
                    {!isValid && (
                      <span className={styles.errorHint}>Invalid CSS syntax</span>
                    )}
                    <div className={styles.hints}>
                      <span className={styles.hint}>color: red</span>
                      <span className={styles.hint}>padding: 8px</span>
                      <span className={styles.hint}>opacity: 0.5</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.markupSection}>
          <div className={styles.markupHeader}>
            <span className={styles.styleLabel}>SVG Markup</span>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleResetMarkup}
              title="Reset to default markup"
            >
              Reset
            </button>
          </div>
          <textarea
            className={styles.textarea}
            value={localMarkup}
            onChange={handleMarkupChange}
            placeholder="<g>...</g>"
            rows={8}
            spellCheck={false}
          />
          <div className={styles.hints}>
            <span className={styles.hint}>&lt;text&gt;</span>
            <span className={styles.hint}>&lt;rect&gt;</span>
            <span className={styles.hint}>&lt;a href&gt;</span>
          </div>
        </div>
      )}
    </div>
  );
});
