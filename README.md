# PR Finance

A personal finance application built with Electron, React, Vite, Tailwind CSS, and SQLite.

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **SQLite (better-sqlite3)** - Embedded database

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
pr-finance/
├── src/
│   ├── main/          # Electron main process
│   ├── preload/       # Preload scripts
│   └── renderer/      # React frontend
├── electron.vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## License

MIT
