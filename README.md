<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Shellfied Logo">
</p>

<h1 align="center">Shellfied</h1>

<p align="center">
  <strong>Beautiful terminal screenshots in seconds</strong>
</p>

<p align="center">
  The official web companion to <a href="https://github.com/tool3/shellfie">shellfie</a> — create stunning SVG terminal screenshots on the fly.
</p>

<p align="center">
  <a href="https://shellfied.vercel.app">Live Demo</a> •
  <a href="https://github.com/tool3/shellfie">shellfie library</a> •
  <a href="https://github.com/tool3/shellfie-cli">shellfie CLI</a>
</p>

---

## What is Shellfied?

Shellfied is the go-to web application for creating beautiful terminal screenshots without any installation. Paste your code or terminal output, customize the appearance, and export as SVG or PNG — all from your browser.

**Powered by [shellfie](https://github.com/tool3/shellfie)** — the same engine that powers the CLI tool used by developers worldwide.

## Features

- **Real-time Preview** — See your terminal screenshot update as you type
- **Syntax Highlighting** — Automatic highlighting for Bash, JavaScript, TypeScript, Python, and JSON
- **15 Terminal Themes** — Including Dracula, Nord, Tokyo Night, One Dark, Monokai, and more
- **3 Window Styles** — macOS, Windows, or minimal
- **Full Customization** — Control font size, line height, padding, title, and watermark
- **Export Options** — Download as SVG or PNG (1x, 2x, 3x scale)
- **PWA Support** — Install as a native app, works offline
- **Dark/Light Mode** — Matches your system preference

## The Shellfie Ecosystem

| Package | Description |
|---------|-------------|
| [shellfie](https://github.com/tool3/shellfie) | Core library for generating SVG terminal screenshots |
| [shellfie-cli](https://github.com/tool3/shellfie-cli) | Command-line tool for terminal-to-image conversion |
| **shellfied** | This web app — shellfie as a service |

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — Lightning-fast builds
- **Zustand** — Lightweight state management
- **SCSS Modules** — Scoped styling
- **Prism.js** — Syntax highlighting
- **vite-plugin-pwa** — Progressive Web App support

## License

MIT © [tool3](https://github.com/tool3)

---

<p align="center">
  <sub>Built with shellfie</sub>
</p>
