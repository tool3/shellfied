'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore, useExportSettings, useExportActions, useCompareState } from '@/store';
import { useExport } from '@/hooks/useExport';
import { Button, Icon, Input, Toggle, Slider, Select, NumberSlider } from '@/components/common';
import { PresetSelector } from '@/components/features/Settings/PresetSelector';
import { ThemeSelector } from '@/components/features/Settings/ThemeSelector';
import { BackgroundSection } from '@/components/features/Settings/BackgroundSection';
import { TemplateSelector } from '@/components/features/Settings/TemplateSelector';
import { WatermarkEditor } from '@/components/features/Settings/WatermarkEditor';
import { HeaderSection, FooterSection } from '@/components/features/Settings/HeaderFooterSection';
import type { PaddingTuple, ExportFormat, ExportScale } from '@/types';
import {
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  PADDING_MIN,
  PADDING_MAX,
  BORDER_RADIUS_MIN,
  BORDER_RADIUS_MAX,
  FONT_FAMILY_OPTIONS,
} from '@/constants/defaults';
import { ShareModal, type ShortUrls } from '@/components/features/Share';
import { generateShareUrlLZ, generateCompressedData } from '@/utils/urlParams';
import styles from './Toolbar.module.scss';

type ToolbarTab = 'preset' | 'theme' | 'background' | 'window' | 'padding' | 'export' | null;

// All menu items (export is part of the menu, not separate)
const MENU_ITEMS: { id: ToolbarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'preset', label: 'Preset', icon: <PaletteIcon /> },
  { id: 'theme', label: 'Theme', icon: <PaintbrushIcon /> },
  { id: 'background', label: 'BG', icon: <ImageIcon /> },
  { id: 'window', label: 'Window', icon: <MonitorIcon /> },
  { id: 'padding', label: 'Padding', icon: <PaddingIcon /> },
  { id: 'export', label: 'Export', icon: <DownloadIcon /> },
];

// Mobile pages: 3 per page
const MOBILE_PAGES: ToolbarTab[][] = [
  ['preset', 'theme', 'background'],
  ['window', 'padding', 'export'],
];

const FORMAT_OPTIONS = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
];

const SCALE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

// --- Popover Component ---
interface ToolbarPopoverProps {
  anchorEl: HTMLElement;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

function ToolbarPopover({
  anchorEl,
  onClose,
  wide = false,
  children,
}: ToolbarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover so its bottom edge sits just above the toolbar.
  // Find the toolbar container (parent with glass styling) to get its top edge.
  const toolbarEl = anchorEl.closest(`.${styles.toolbar}`) || anchorEl.closest(`.${styles.mobilePill}`) || anchorEl.parentElement;
  const toolbarRect = toolbarEl ? toolbarEl.getBoundingClientRect() : anchorEl.getBoundingClientRect();
  const anchorRect = anchorEl.getBoundingClientRect();
  const gap = 12;
  const pad = 16;
  const popoverWidth = wide ? 360 : 320;

  // bottom = distance from viewport bottom to toolbar's top edge + gap
  const bottom = window.innerHeight - toolbarRect.top + gap;

  // center horizontally on the clicked button, clamped to viewport
  let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - pad - popoverWidth));

  // Click outside to close (deferred by one frame to skip opening click)
  useEffect(() => {
    let listening = false;
    const frame = requestAnimationFrame(() => { listening = true; });

    const onMouseDown = (e: MouseEvent) => {
      if (!listening) return;
      if (popoverRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className={`${styles.popover} ${wide ? styles.popoverWide : ''}`}
      style={{ bottom, left, top: 'auto' }}
    >
      {children}
    </div>,
    document.body
  );
}

// --- Popover Content Components ---

const PresetPopoverContent = memo(function PresetPopoverContent() {
  return <PresetSelector />;
});

const ThemePopoverContent = memo(function ThemePopoverContent() {
  return <ThemeSelector />;
});

const BackgroundPopoverContent = memo(function BackgroundPopoverContent() {
  return <BackgroundSection />;
});

const WindowPopoverContent = memo(function WindowPopoverContent() {
  const template = useStore((s) => s.template);
  const title = useStore((s) => s.title);
  const setTitle = useStore((s) => s.setTitle);
  const compareMode = useStore((s) => s.compareMode);
  const beforeTitle = useStore((s) => s.beforeTitle);
  const setBeforeTitle = useStore((s) => s.setBeforeTitle);
  const afterTitle = useStore((s) => s.afterTitle);
  const setAfterTitle = useStore((s) => s.setAfterTitle);
  const showControls = useStore((s) => s.showControls);
  const setShowControls = useStore((s) => s.setShowControls);
  const controlsPosition = useStore((s) => s.controlsPosition);
  const setControlsPosition = useStore((s) => s.setControlsPosition);
  const borderRadius = useStore((s) => s.borderRadius);
  const setBorderRadius = useStore((s) => s.setBorderRadius);
  const width = useStore((s) => s.width);
  const setWidth = useStore((s) => s.setWidth);
  const fontFamily = useStore((s) => s.fontFamily);
  const setFontFamily = useStore((s) => s.setFontFamily);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const lineHeight = useStore((s) => s.lineHeight);
  const setLineHeight = useStore((s) => s.setLineHeight);

  return (
    <>
      <div className={styles.popoverSection}>
        <div className={styles.popoverSectionTitle}>Template</div>
        <TemplateSelector />
      </div>
      <div className={styles.popoverSection}>
        <div className={styles.popoverSectionTitle}>Window</div>
        <div className={styles.fields}>
          {compareMode ? (
            <>
              <Input label="Title #1" value={beforeTitle} onChange={(e) => setBeforeTitle(e.target.value)} placeholder="Terminal" fullWidth />
              <Input label="Title #2" value={afterTitle} onChange={(e) => setAfterTitle(e.target.value)} placeholder="Terminal" fullWidth />
            </>
          ) : (
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Terminal" fullWidth />
          )}
          {template !== 'minimal' && (
            <>
              <Toggle checked={showControls} onChange={setShowControls} label="Show window controls" />
              {showControls && (
                <Select label="Controls Position" options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} value={controlsPosition} onChange={(v) => setControlsPosition(v as 'left' | 'right')} fullWidth />
              )}
            </>
          )}
          <Slider label="Border Radius" value={borderRadius} onChange={setBorderRadius} min={BORDER_RADIUS_MIN} max={BORDER_RADIUS_MAX} step={1} formatValue={(v) => `${v}px`} />
          <Slider label="Width" value={width ?? 0} onChange={(v) => setWidth(v === 0 ? null : v)} min={0} max={1200} step={10} formatValue={(v) => (v === 0 ? 'Auto' : `${v}px`)} />
        </div>
      </div>
      <div className={styles.popoverSection}>
        <div className={styles.popoverSectionTitle}>Typography</div>
        <div className={styles.fields}>
          <Select label="Font Family" options={FONT_FAMILY_OPTIONS} value={fontFamily} onChange={setFontFamily} fullWidth />
          <Slider label="Font Size" value={fontSize} onChange={setFontSize} min={FONT_SIZE_MIN} max={FONT_SIZE_MAX} step={1} formatValue={(v) => `${v}px`} />
          <Slider label="Line Height" value={lineHeight} onChange={setLineHeight} min={LINE_HEIGHT_MIN} max={LINE_HEIGHT_MAX} step={0.1} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>
      {template !== 'minimal' && (
        <>
          <div className={styles.popoverSection}><HeaderSection /></div>
          <div className={styles.popoverSection}><FooterSection /></div>
        </>
      )}
      <div className={styles.popoverSection}>
        <div className={styles.popoverSectionTitle}>Watermark</div>
        <WatermarkEditor />
      </div>
    </>
  );
});

const PaddingPopoverContent = memo(function PaddingPopoverContent() {
  const padding = useStore((s) => s.padding);
  const setPadding = useStore((s) => s.setPadding);
  const [showIndividualPadding, setShowIndividualPadding] = useState(false);

  const handlePaddingChange = (index: number, value: number) => {
    const newPadding = [...padding] as PaddingTuple;
    newPadding[index] = value;
    setPadding(newPadding);
  };

  const handleUniformPaddingChange = (value: number) => {
    setPadding([value, value, value, value]);
  };

  const isUniformPadding = padding[0] === padding[1] && padding[1] === padding[2] && padding[2] === padding[3];
  const uniformPaddingValue = isUniformPadding ? padding[0] : Math.round((padding[0] + padding[1] + padding[2] + padding[3]) / 4);

  return (
    <div className={styles.fields}>
      <NumberSlider label="All" value={uniformPaddingValue} onChange={handleUniformPaddingChange} min={PADDING_MIN} max={PADDING_MAX} />
      <button type="button" className={styles.individualToggle} onClick={() => setShowIndividualPadding(!showIndividualPadding)}>
        <span>{showIndividualPadding ? 'Hide' : 'Individual'}</span>
        {!isUniformPadding && !showIndividualPadding && <span className={styles.mixedBadge}>Mixed</span>}
      </button>
      {showIndividualPadding && (
        <div className={styles.sliderGrid}>
          <NumberSlider label="Top" value={padding[0]} onChange={(v) => handlePaddingChange(0, v)} min={PADDING_MIN} max={PADDING_MAX} />
          <NumberSlider label="Right" value={padding[1]} onChange={(v) => handlePaddingChange(1, v)} min={PADDING_MIN} max={PADDING_MAX} />
          <NumberSlider label="Bottom" value={padding[2]} onChange={(v) => handlePaddingChange(2, v)} min={PADDING_MIN} max={PADDING_MAX} />
          <NumberSlider label="Left" value={padding[3]} onChange={(v) => handlePaddingChange(3, v)} min={PADDING_MIN} max={PADDING_MAX} />
        </div>
      )}
    </div>
  );
});

const ShareModalWrapper = memo(function ShareModalWrapper({ onClose }: { onClose: () => void }) {
  const [shortUrls, setShortUrls] = useState<ShortUrls | null>(null);
  const store = useStore.getState();
  const shareUrl = generateShareUrlLZ({
    content: store.content,
    language: store.language,
    template: store.template,
    terminalTheme: store.terminalTheme,
    title: store.title,
    showControls: store.showControls,
    controlsPosition: store.controlsPosition,
    borderRadius: store.borderRadius,
    fontFamily: store.fontFamily,
    fontSize: store.fontSize,
    lineHeight: store.lineHeight,
    padding: store.padding,
    background: store.background,
    width: store.width,
  }, 'view');
  const compressedData = generateCompressedData({
    content: store.content,
    language: store.language,
    template: store.template,
    terminalTheme: store.terminalTheme,
    title: store.title,
    showControls: store.showControls,
    controlsPosition: store.controlsPosition,
    borderRadius: store.borderRadius,
    fontFamily: store.fontFamily,
    fontSize: store.fontSize,
    lineHeight: store.lineHeight,
    padding: store.padding,
    background: store.background,
    width: store.width,
  });

  return (
    <ShareModal
      viewUrl={shareUrl}
      editUrl={generateShareUrlLZ({
        content: store.content,
        language: store.language,
        template: store.template,
        terminalTheme: store.terminalTheme,
        title: store.title,
        showControls: store.showControls,
        controlsPosition: store.controlsPosition,
        borderRadius: store.borderRadius,
        fontFamily: store.fontFamily,
        fontSize: store.fontSize,
        lineHeight: store.lineHeight,
        padding: store.padding,
        background: store.background,
        width: store.width,
      }, 'edit')}
      compressedData={compressedData}
      shortUrls={shortUrls}
      onShortUrlsChange={setShortUrls}
      onClose={onClose}
    />
  );
});

const ExportPopoverContent = memo(function ExportPopoverContent() {
  const content = useStore((s) => s.content);
  const { compareMode, beforeContent, afterContent } = useCompareState();
  const { exportFormat, exportScale, jpegQuality } = useExportSettings();
  const { setExportFormat, setExportScale, setJpegQuality } = useExportActions();
  const { download, copyToClipboard, isExporting, isDownloadSuccess, isCopySuccess } = useExport();
  const [showShareModal, setShowShareModal] = useState(false);

  const hasContent = compareMode ? Boolean(beforeContent.trim() || afterContent.trim()) : Boolean(content.trim());
  const isRasterFormat = exportFormat !== 'svg';
  const isJpeg = exportFormat === 'jpeg';

  return (
    <div className={styles.fields}>
      <div className={styles.optionsRow}>
        <Select label="Format" options={FORMAT_OPTIONS} value={exportFormat} onChange={(v) => setExportFormat(v as ExportFormat)} />
        {isRasterFormat && <Select label="Scale" options={SCALE_OPTIONS} value={String(exportScale)} onChange={(v) => setExportScale(Number(v) as ExportScale)} />}
      </div>
      {isJpeg && <Slider label="Quality" value={jpegQuality} onChange={setJpegQuality} min={0.6} max={1.0} step={0.1} formatValue={(v) => `${Math.round(v * 100)}%`} />}
      <div className={styles.exportButtons}>
        <Button variant="primary" icon="share" onClick={() => setShowShareModal(true)} disabled={!hasContent} fullWidth>Share</Button>
        <Button variant="primary" icon={isDownloadSuccess ? 'check' : 'download'} onClick={() => download()} disabled={!hasContent || isExporting} isLoading={isExporting} fullWidth>Download</Button>
        <Button variant="ghost" icon={isCopySuccess ? 'check' : 'copy'} onClick={() => copyToClipboard()} disabled={!hasContent || isExporting} fullWidth>{isCopySuccess ? 'Copied!' : 'Copy'}</Button>
      </div>
      {showShareModal && (
        <ShareModalWrapper onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
});

// --- SVG Icons ---
function PaletteIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12" r="0.5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>;
}
function PaintbrushIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" /><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" /><path d="M14.5 17.5 4.5 15" /></svg>;
}
function ImageIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
}
function MonitorIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>;
}
function PaddingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="m12 12 4 10 1.7-4.3L22 16Z" /></svg>;
}
function DownloadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
}

// --- Main Toolbar ---
export const Toolbar = memo(function Toolbar() {
  const [activeTab, setActiveTab] = useState<ToolbarTab>(null);
  const [mobilePage, setMobilePage] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [showMobileShare, setShowMobileShare] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const handleTabClick = useCallback((tab: ToolbarTab, el: HTMLButtonElement) => {
    setActiveTab((prev) => {
      if (prev === tab) {
        setAnchorEl(null);
        return null;
      }
      setAnchorEl(el);
      return tab;
    });
  }, []);

  const handleClose = useCallback(() => {
    setActiveTab(null);
    setAnchorEl(null);
  }, []);

  const handleMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const page = Math.round(el.scrollLeft / el.offsetWidth);
    setMobilePage(page);
  }, []);

  const renderItem = (item: { id: ToolbarTab; label: string; icon: React.ReactNode }) => (
    <button
      key={item.id}
      className={`${styles.item} ${activeTab === item.id ? styles.itemActive : ''}`}
      onClick={(e) => handleTabClick(item.id, e.currentTarget)}
      type="button"
    >
      <span className={styles.itemIcon}>{item.icon}</span>
      <span className={styles.itemLabel}>{item.label}</span>
    </button>
  );

  return (
    <>
      {/* Desktop: single centered pill with all items + share */}
      <div className={styles.desktopBar}>
        <div className={styles.toolbar}>
          {MENU_ITEMS.map(renderItem)}
          <div className={styles.divider} />
          <button
            type="button"
            className={styles.item}
            onClick={() => setShowMobileShare(true)}
          >
            <span className={styles.itemIcon}><Icon name="share" size={18} /></span>
            <span className={styles.itemLabel}>Share</span>
          </button>
        </div>
      </div>

      {/* Mobile: scrollable pill + share aligned to the right */}
      <div className={styles.mobileBar}>
        <div className={styles.mobileColumn}>
          <div className={styles.mobilePill} ref={mobileScrollRef} onScroll={handleMobileScroll}>
            <div className={styles.mobileTrack}>
              {MOBILE_PAGES.map((page, pageIdx) => (
                <div key={pageIdx} className={styles.mobilePage}>
                  {page.map((tabId) => {
                    const item = MENU_ITEMS.find((i) => i.id === tabId);
                    if (!item) return null;
                    return renderItem(item);
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.dots}>
            {MOBILE_PAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === mobilePage ? styles.dotActive : ''}`}
                onClick={() => {
                  setMobilePage(i);
                  mobileScrollRef.current?.scrollTo({ left: i * mobileScrollRef.current.offsetWidth, behavior: 'smooth' });
                }}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className={styles.mobileShare}
          onClick={() => setShowMobileShare(true)}
          aria-label="Share"
        >
          <Icon name="share" size={18} />
        </button>
      </div>

      {/* Popovers */}
      {activeTab && anchorEl && (
        <ToolbarPopover
          anchorEl={anchorEl}
          onClose={handleClose}
          wide={activeTab === 'window' || activeTab === 'theme' || activeTab === 'background'}
        >
          {activeTab === 'preset' && <PresetPopoverContent />}
          {activeTab === 'theme' && <ThemePopoverContent />}
          {activeTab === 'background' && <BackgroundPopoverContent />}
          {activeTab === 'window' && <WindowPopoverContent />}
          {activeTab === 'padding' && <PaddingPopoverContent />}
          {activeTab === 'export' && <ExportPopoverContent />}
        </ToolbarPopover>
      )}

      {/* Share modal */}
      {showMobileShare && (
        <ShareModalWrapper onClose={() => setShowMobileShare(false)} />
      )}
    </>
  );
});
