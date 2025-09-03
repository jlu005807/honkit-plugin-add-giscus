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

This plugin includes a simple demo project to quickly test its functionality:

```bash
# Link the local plugin
npm link

# Go to the example directory
cd example

# Link to the local plugin
npm link honkit-plugin-add-giscus

# Update the GitHub repository configuration in book.json (replace with your own repo info)

# Start the HonKit server
npx honkit serve
```

Then visit http://localhost:4000 in your browser to view the demo.

Obtaining `repoId` and `categoryId` (CLI examples)

You can use the GitHub API to fetch repository and discussion category IDs. These examples require a GitHub personal access token with appropriate scopes.

PowerShell (get repo numeric id):

```powershell
$token = 'YOUR_TOKEN'
Invoke-RestMethod -Uri "https://api.github.com/repos/OWNER/REPO" -Headers @{ Authorization = "token $token" } | Select-Object id
```

PowerShell (GraphQL to list discussion categories):

```powershell
$token = 'YOUR_TOKEN'
$query = '{ "query": "query { repository(owner: \"OWNER\", name: \"REPO\") { discussionCategories(first: 100) { nodes { id name } } } }" }'
Invoke-RestMethod -Uri 'https://api.github.com/graphql' -Method Post -Headers @{ Authorization = "bearer $token" } -Body $query
```

curl examples:

```bash
# repo info
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/repos/OWNER/REPO

# GraphQL categories
curl -H "Authorization: bearer YOUR_TOKEN" -X POST -d '{"query":"query { repository(owner: \"OWNER\", name: \"REPO\") { discussionCategories(first: 100) { nodes { id name } } } }"}' https://api.github.com/graphql
```

Note: giscus.app UI normally provides `R_...` and `DIC_...` identifiers directly; using the UI is the simplest option for most users.

Important notes

- Your GitHub repository should be public. Giscus works most straightforwardly with public repositories and Discussions.
- Enable GitHub Discussions in your repository settings and configure the repository/category on https://giscus.app.
- When copying configuration from giscus.app, verify the `repoId` (R_...) and `categoryId` (DIC_...) values and paste them into your plugin configuration.



## Configuration reference (mapping to Giscus data-*)

Detailed explanation of supported options and how they map to Giscus `data-*` attributes:For details, please check [Giscus](https://giscus.app/)

- repo (string) — required
  - Description: GitHub repository in the form `OWNER/REPO`
  - Maps to: `data-repo`

- repoId (string) — strongly recommended (often required by Giscus)
  - Description: internal repository ID used by Giscus (often prefixed with `R_`)
  - Maps to: `data-repo-id`

- category (string) — recommended
  - Description: Discussions category name
  - Maps to: `data-category`

- categoryId (string) — required when specifying a Discussions category
  - Description: category ID (usually prefixed with `DIC_`)
  - Maps to: `data-category-id`

- mapping (string) — optional (recommended `pathname`)
  - Examples: `pathname`, `url`, `title`, `og:title`, `specific`, `number`
  - Maps to: `data-mapping`
  - Note: the plugin writes the current page path into `data-term` by default to ensure per-page discussions; if using `specific` or `number`, provide the `term`.

- theme (string) — optional
  - Description: initial Giscus theme (e.g. `light`, `dark`, `preferred_color_scheme`, `github_light`, `dark_dimmed`)
  - Maps to: `data-theme` (initial only; runtime updates come from `theme_config`)

- reactionsEnabled (boolean) — optional
  - Maps to: `data-reactions-enabled` (`1`/`0`)

- emitMetadata (boolean) — optional
  - Maps to: `data-emit-metadata`

- inputPosition (string) — optional (`top` / `bottom`)
  - Maps to: `data-input-position`

- lang (string) — optional (e.g. `zh-CN`, `en`, `ja`)
  - Maps to: `data-lang`

- strict (boolean) — optional
  - Maps to: `data-strict` (strict matching mode)

- loading (string) — optional: `eager` / `lazy`
  - Maps to: `data-loading`

- theme_config (object) — optional but recommended
  - Purpose: map HonKit page/theme class names to Giscus theme names at runtime
  - Structure: `{ "<honkit-class>": "<giscus-theme>" }`
  - Example: `{ "color-theme-1": "light", "night": "dark_dimmed" }`

- debug (boolean)
  - Purpose: inject small debug output into built pages to inspect `window.giscusThemeMapping` and matching behavior

Note: boolean values will be converted to the format expected by Giscus (`1`/`0`) and the plugin will automatically write the current page path to `data-term` by default to enable per-page independent discussions (unless you use `mapping: "specific"` or `mapping: "number"` and supply a `term`).

Theme mapping example

```json
"theme_config": {
  "color-theme-1": "light",
  "color-theme-2": "dark_dimmed",
  "default": "light",
  "sepia": "preferred_color_scheme",
  "night": "dark_high_contrast",
  "white": "light"
}
```

Behavior

The plugin will first attempt to detect a class matching `.book.font-size-2.font-family-1.<key>` for precise mapping. If not found, it will look for `color-theme-*` classes, then common names like `night`/`sepia`/`white`. If none apply, it falls back to detecting `dark` on `body`/`html` or the system `prefers-color-scheme`.

Debugging

Enable `pluginsConfig.add-giscus.debug = true` to include a small mapping debug output in built pages.

License

Apache-2.0
