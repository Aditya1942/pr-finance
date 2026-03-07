# PR Finance

A personal finance tracker built with Electron, React, Vite, Tailwind CSS, and SQLite.

## Features (MVP)

- Expense & Income Tracking
- Budget Management
- Reports & Analytics
- Category-based transaction system

## Tech Stack

- **Electron** — Desktop application shell
- **React** — UI library
- **Vite** — Bundler (via electron-vite)
- **Tailwind CSS** — Utility-first CSS framework
- **better-sqlite3** — SQLite driver (main process)
- **React Router** — Client-side navigation

## Getting Started

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Project Structure

```
pr-finance/
├── src/
│   ├── main/           # Electron main process (SQLite, IPC)
│   ├── preload/        # Preload scripts (context bridge)
│   └── renderer/       # React frontend
│       ├── index.html
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           └── index.css
├── electron.vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.renderer.json
└── package.json
```

## Architecture

- **Main process**: All SQLite operations via better-sqlite3
- **Renderer process**: Pure React UI communicating via IPC
- **Single SQLite database** stored in the user's app data directory

## License

MIT
