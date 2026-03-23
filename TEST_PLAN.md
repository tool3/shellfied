# Shellfied Visual Test Plan

Quick visual verification checklist for all app features.

---

## 1. Editor Functionality

- [ ] **Type code** - Editor accepts text input with syntax highlighting
- [ ] **Line numbers** - Line numbers display correctly and update
- [ ] **Language selection** - Dropdown shows languages, selection changes highlighting
- [ ] **Demo content** - "Load Demo" loads sample code correctly
- [ ] **Clear button** - Clears editor content
- [ ] **Compare mode** - Toggle splits into two editors (Before/After)
- [ ] **Compare labels** - Custom labels appear above each pane

---

## 2. Preview & Zoom

- [ ] **Real-time preview** - SVG updates as you type
- [ ] **Zoom in/out** - Buttons adjust preview scale (25%-200%)
- [ ] **Fit to view** - Reset button centers and fits preview
- [ ] **Pan/drag** - Preview is pannable at higher zoom levels
- [ ] **Compare preview** - Shows both panes side-by-side

---

## 3. Templates & Themes

- [ ] **macOS template** - Traffic lights on left, rounded corners
- [ ] **Windows template** - Square buttons on right
- [ ] **Minimal template** - No window chrome, just content
- [ ] **Theme selector** - Themes apply correct syntax colors
- [ ] **Custom theme** - Create, edit, and delete custom themes

---

## 4. Window Appearance

- [ ] **Title** - Title text appears in titlebar
- [ ] **Show controls** - Toggle hides/shows window buttons
- [ ] **Controls position** - Left/right moves buttons accordingly
- [ ] **Border radius** - Slider adjusts corner rounding (0-32px)

---

## 5. Typography

- [ ] **Font family** - Different fonts render correctly
- [ ] **Font size** - Size slider adjusts code font (8-32px)
- [ ] **Line height** - Slider adjusts spacing (1.0-2.0)

---

## 6. Spacing & Padding

- [ ] **Padding controls** - Individual T/R/B/L padding works
- [ ] **Linked padding** - Lock icon syncs all padding values

---

## 7. Background Options

- [ ] **None** - No background (transparent or theme bg only)
- [ ] **Solid** - Color picker sets uniform background
- [ ] **Gradient** - From/to colors with direction selection
- [ ] **Gradient presets** - Quick gradient options work
- [ ] **Image** - Upload custom background image
- [ ] **Background padding** - Space around terminal window
- [ ] **Aspect ratio** - Lock to specific ratios for export

---

## 8. Watermark

- [ ] **Text watermark** - Custom text displays in preview
- [ ] **Watermark styling** - CSS styles apply (color, opacity, etc.)
- [ ] **Markup watermark** - Custom SVG markup renders
- [ ] **Reset** - Reset button restores default watermark

---

## 9. Header & Footer (non-minimal templates)

- [ ] **Enable/disable** - Toggles show/hide header/footer
- [ ] **Background color** - Color picker changes header bg
- [ ] **Height** - Slider adjusts header height
- [ ] **Border** - Toggle and style the separator line

---

## 10. Export Functions

- [ ] **SVG download** - Exports valid SVG file
- [ ] **PNG download** - Exports PNG at selected scale
- [ ] **WebP download** - Exports WebP at selected scale
- [ ] **JPEG download** - Exports JPEG with quality setting
- [ ] **Scale options** - 1x/2x/3x affects raster output size
- [ ] **JPEG quality** - Slider affects compression (60-100%)
- [ ] **Copy to clipboard** - Image copies to system clipboard

---

## 11. Share Modal

- [ ] **Open modal** - Share button opens modal
- [ ] **Tab switching** - Short URLs / Full URLs tabs work
- [ ] **Create short link** - Button creates shortened URLs
- [ ] **Short URL copy** - Copy buttons work for short URLs
- [ ] **Full URL copy** - Copy buttons work for view/edit URLs
- [ ] **Open in new tab** - External link buttons work
- [ ] **URL length indicator** - Shows character count and warning
- [ ] **Persistence note** - Shows for created short links

---

## 12. View Mode (open a shared link)

- [ ] **View-only display** - No editor, just rendered image
- [ ] **Download button** - Downloads in selected format
- [ ] **Copy button** - Copies image to clipboard
- [ ] **Edit button** - Transitions to full editor with settings
- [ ] **Format selector** - Change output format in view mode
- [ ] **Branding footer** - Shows Shellfied attribution

---

## 13. Static Image URLs

- [ ] **SVG route** - `/s/[id]` returns raw SVG
- [ ] **PNG route** - `/s/[id].png` returns PNG image
- [ ] **Format params** - `?fmt=webp&scale=2` works

---

## 14. Persistence & State

- [ ] **Refresh retains settings** - Reload keeps customizations
- [ ] **URL loads state** - Shared URLs restore all settings
- [ ] **Light/dark mode** - Theme toggle persists

---

## 15. UI Responsiveness

- [ ] **Settings panel collapse** - Toggle hides/shows sidebar
- [ ] **Mobile layout** - App usable on smaller screens
- [ ] **Keyboard navigation** - Tab through interactive elements

---

## Quick Smoke Test (5 min)

1. Load app, verify default preview renders
2. Type some code, confirm live preview updates
3. Change template to Windows, verify button position changes
4. Change theme to Nord, verify colors update
5. Export as PNG, verify download works
6. Click Share, create short URL, copy it
7. Open short URL in new tab, verify view mode works
8. Click Edit in view mode, verify editor loads with settings
9. Toggle compare mode, verify dual editors appear
10. Toggle dark/light mode, verify theme switches
