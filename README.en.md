# HonKit Plugin: Add Giscus

中文版本: [README.md](README.md)

A lightweight HonKit plugin that injects Giscus (GitHub Discussions based comments) into each page of your book.

Features

- Per-page independent Giscus discussions (recommended: mapping by pathname)
- Runtime theme synchronization using `theme_config` mappings
- Optional debug mode (enable via `pluginsConfig.add-giscus.debug`)

Installation

```bash
npm install honkit-plugin-add-giscus --save-dev
```

Quick start (minimal config)

Add to your `book.json`:

```json
{
  "plugins": ["add-giscus"],
  "pluginsConfig": {
    "add-giscus": {
      "repo": "username/repo",
      "repoId": "R_kgD...",
      "category": "Announcements",
      "categoryId": "DIC_...",
      "theme_config": {
        "color-theme-1": "light",
        "color-theme-2": "dark_dimmed",
        "default": "light",
        "sepia": "preferred_color_scheme",
        "night": "dark_dimmed",
        "white": "light"
      }
    }
  }
}
```

Quick verification

1. Build or serve your HonKit book.
2. Confirm the injected `window.giscusThemeMapping` script exists in the page source.
3. Switch themes and observe the postMessage sent to `https://giscus.app` in the browser console (or watch the iframe theme change).
4. To debug mapping selection, temporarily enable `"debug": true` in `pluginsConfig.add-giscus`.
5. Serve locally with HonKit and open the book in your browser:

```powershell
npx honkit serve
```

### Using the demo project

﻿# HonKit Plugin: Add Giscus

Chinese version: [README.md](README.md)

A lightweight HonKit plugin that injects Giscus (GitHub Discussions based comments) into each page and synchronizes HonKit themes to Giscus at runtime.

Features

- Per-page independent Giscus discussions (recommended: mapping by pathname)
- Runtime theme synchronization via `theme_config`
- SPA navigation support with postMessage-first updates and guarded reloads
- Debug mode for easier troubleshooting

Installation

```bash
npm install honkit-plugin-add-giscus --save-dev
```

Quick start (minimal config)

Add to your `book.json`:

```json
{
  "plugins": ["add-giscus"],
  "pluginsConfig": {
    "add-giscus": {
      "repo": "username/repo",
      "repoId": "R_kgD...",
      "category": "Announcements",
      "categoryId": "DIC_...",
      "theme_config": {
        "color-theme-1": "light",
        "color-theme-2": "dark_dimmed",
        "default": "light",
        "sepia": "preferred_color_scheme",
        "night": "dark_dimmed",
        "white": "light"
      }
    }
  }
}
```

Quick verification

1. Build or serve your HonKit book.
2. Confirm that `window.giscusThemeMapping` is injected into the page source.
3. Enable debug in `pluginsConfig.add-giscus.debug = true` to get console hints.
4. Switch themes or navigate pages and observe postMessage calls to `https://giscus.app` or iframe theme changes in Network/Console.

Troubleshooting

If comments do not appear or the theme is not synchronized, see `troubleshooting.md` for detailed steps. Typical causes include incorrect `repoId`/`categoryId`, Discussions not enabled on the repo, or network/CSP restrictions.

Configuration reference (summary)

- `repo`, `repoId`, `category`, `categoryId` — Giscus required values
- `mapping` — how to map page -> discussion (default `pathname`)
- `theme` — initial giscus theme (runtime updates come from `theme_config`)
- `theme_config` — map HonKit theme class -> Giscus theme
- `strict`, `reactionsEnabled`, `emitMetadata`, `inputPosition`, `lang`, `loading` — map to corresponding `data-*` attributes
- `debug` — inject lightweight debug helpers in built pages

Debugging tips

Enable runtime debug:

```javascript
window.giscusDebug = true;
console.log('giscus mapping', window.giscusThemeMapping);
```

License

Apache-2.0
  - Maps to: `data-category-id`
