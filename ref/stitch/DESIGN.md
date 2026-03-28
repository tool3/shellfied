# Design System Specification: Obsidian Minimalist Editorial

## 1. Overview & Creative North Star: "The Silent Curator"
This design system is built upon the concept of **The Silent Curator**. It rejects the noisy, hyper-segmented layouts of traditional SaaS dashboards in favor of an elite, editorial experience. The goal is to create a UI that feels less like a software interface and more like a high-end physical gallery at night.

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. Instead of rigid grids, we use the spacing scale to create breathing room that guides the eye. Luxury is defined here by what is *absent*: no harsh borders, no aggressive shadows, and no unnecessary chromatic noise. We rely on the "Midnight Obsidian" palette to provide a foundation of infinite depth, where content doesn't just sit on the screen—it emerges from it.

---

## 2. Colors & Tonal Architecture
The palette is a sophisticated study in near-blacks and monochromatic slate tones. 

### The Palette (Core Tokens)
- **Base Surface:** `#0e0e0e` (Surface / Background)
- **Deepest Void:** `#000000` (Surface Container Lowest)
- **Layering Tones:** 
    - `#131313` (Surface Container Low)
    - `#1a1919` (Surface Container)
    - `#262626` (Surface Variant)
- **Accents:** 
    - Primary: `#c6c6c8` (Cool Silver)
    - Secondary: `#909fb5` (Muted Slate)

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Structural boundaries must be defined exclusively through:
1. **Background Color Shifts:** Use `surface-container-low` for a sidebar sitting against a `surface` background.
2. **Negative Space:** Use the `8` (2.75rem) or `10` (3.5rem) spacing tokens to separate logical blocks.
3. **Tonal Transitions:** Use soft, expansive gradients (e.g., `#0e0e0e` to `#1a1919`) to imply a change in region without a hard edge.

### The Glass & Gradient Rule
To achieve "Apple-like" elegance without the blue tint, utilize high-quality glassmorphism for floating elements (modals, navigation bars).
- **Glass Formula:** `surface-container-high` at 60% opacity with a `backdrop-blur` of 20px to 40px.
- **Signature Texture:** For Hero CTAs, use a linear gradient from `primary` (`#c6c6c8`) to `primary-dim` (`#b8b9bb`) at a 135-degree angle. This adds a "metallic" soul to the interface.

---

## 3. Typography: The Manrope Scale
Manrope is chosen for its geometric balance and modern legibility. In this system, typography is the primary driver of hierarchy.

*   **Display (Lg/Md):** 3.5rem / 2.75rem. Reserved for moments of high impact. Use low letter-spacing (-0.02em) to create a "compact luxury" feel.
*   **Headlines:** 2rem to 1.5rem. Use `on-surface` (`#e7e5e4`) for maximum crispness.
*   **Body:** 1rem (`body-lg`) is the workhorse. Use `on-surface-variant` (`#acabaa`) for long-form text to reduce eye strain against the deep black background.
*   **Labels:** 0.75rem. Always uppercase with +0.05em letter spacing for a technical, high-end "tag" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are a fallback, not a standard. We achieve elevation through the **Layering Principle**.

### The Layering Principle
Stack containers to create natural lift. 
- **Level 0 (Floor):** `surface` (`#0e0e0e`)
- **Level 1 (Card/Section):** `surface-container-low` (`#131313`)
- **Level 2 (Floating/Active):** `surface-container-high` (`#202020`)

### Ambient Shadows & Ghost Borders
If a floating effect is required (e.g., a popover):
- **Ambient Shadow:** Use a shadow with a 40px-60px blur, 0% spread, and only 6% opacity. The color should be `#000000`.
- **The Ghost Border:** For accessibility in forms, use the `outline-variant` (`#484848`) at **15% opacity**. This creates a "suggestion" of a boundary that only appears when the user focuses on the element.

---

## 5. Components

### Buttons
- **Primary:** Background `primary` (`#c6c6c8`), Text `on-primary` (`#3e4042`). Radius: `full`. Use for the single most important action.
- **Secondary (Glass):** Background `surface-container-highest` at 40% opacity, `backdrop-blur`. Radius: `md`.
- **Tertiary:** Pure text using `secondary` (`#909fb5`) with a subtle underline on hover.

### Cards & Lists
- **Forbid Dividers:** Never use a line to separate list items. Use spacing token `3` (1rem) or a hover state that shifts the background to `surface-bright` (`#2c2c2c`).
- **Card Styling:** Use `surface-container-lowest` (`#000000`) for card backgrounds on top of a `surface` (`#0e0e0e`) background to create a "sunken" editorial look.

### Input Fields
- **Base State:** Background `surface-container-low`, Ghost Border at 10% opacity, Radius `md`.
- **Focus State:** Increase Ghost Border opacity to 40% and change border color to `secondary` (`#909fb5`). No "glow" effects.

### Adaptive Overlays (Signature Component)
Use for navigation or tooltips. A `surface-container-highest` background with 70% opacity and a subtle `outline-variant` ghost border. This component should appear to "float" above the content like a piece of smoked glass.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Align a headline to the left but push the body text to a 60% width container to create an editorial "white space" feel.
- **Embrace Pure Black:** Use `#000000` for deep containers to create a sense of infinite depth.
- **Tighten Roundness:** Use `xl` (1.5rem) for large containers but `md` (0.75rem) for internal components to create a sophisticated nested rhythm.

### Don't:
- **No Pure White Text:** Never use `#ffffff` for body text. Use `on-surface` (`#e7e5e4`) to prevent "haloing" and visual vibration on OLED screens.
- **No 100% Opaque Borders:** This destroys the "Obsidian" feel. If you need a line, use a background color shift.
- **No Blue Tints:** Ensure all slate tones (`secondary`) stay in the grey/steel family. Avoid anything approaching a primary blue.