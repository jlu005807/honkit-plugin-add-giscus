# HonKit Plugin: Add Giscus

English version: [README.en.md](README.en.md)

这是一个为 HonKit 书籍添加 Giscus（基于 GitHub Discus## 验证

1. 构建或预览你的 HonKit 书籍。
2. 在页面源代码中确认存在注入的 `window.giscusThemeMapping` 脚本。
3. 切换主题并在浏览器控制台观察是否发送了 postMessage 给 `https://giscus.app`（或观察 iframe 的主题切换）。
4. 若需调试匹配逻辑，可临时在 `pluginsConfig.add-giscus` 中添加 `"debug": true`。

### 使用演示项目快速测试

项目包含一个简单的演示项目，可以用于快速测试插件功能：

```bash
# 在插件目录中链接本地插件
npm link

# 进入演示目录
cd example

# 链接到本地插件
npm link honkit-plugin-add-giscus

# 更新 book.json 中的 GitHub 仓库配置（替换为你自己的仓库信息）

# 启动 HonKit 服务器
npx honkit serve
```

然后在浏览器中访问 http://localhost:4000 查看演示。

### 排查问题

如果评论区没有正确显示，请查看 [troubleshooting.md](troubleshooting.md) 获取详细的故障排除指南。

主要特性
- 为每个页面注入独立的 Giscus 评论区（基于页面路径并支持严格匹配）
- 支持通过 `theme_config` 将 HonKit 主题映射到 Giscus 主题并在运行时同步
- 可选调试开关（在 `book.json` 的 `pluginsConfig.add-giscus.debug` 中启用）

## 快速验证

## 配置项逐条说明（映射到 Giscus data-*）


下面为插件支持的主要配置项逐条说明，包含类型、是否必需以及对应的 Giscus `data-*` 属性：具体请查看[Giscus](https://giscus.app/)

- repo (string) — 必需
  - 描述：GitHub 仓库，格式 `OWNER/REPO`
  - 对应：`data-repo`

- repoId (string) — 强烈建议提供（Giscus 通常要求）
  - 描述：GitHub 仓库的内部 ID（通常以 `R_` 开头的字符串）
  - 对应：`data-repo-id`

- category (string) — 推荐提供
  - 描述：Discussions 分类名称
  - 对应：`data-category`

- categoryId (string) — 当需要指定 Discussions 分类时必需
  - 描述：分类 ID（通常以 `DIC_` 开头的字符串）
  - 对应：`data-category-id`

- mapping (string) — 可选（默认推荐 `pathname`）
  - 值示例：`pathname`, `url`, `title`, `og:title`, `specific`, `number`
  - 对应：`data-mapping`
  - 说明：插件默认把当前页面路径写入 `data-term`（以保证每页独立讨论）；若使用 `specific` 或 `number`，请同时指定所需的 `term`。

- theme (string) — 可选
  - 描述：Giscus 初始主题（如 `light` / `dark` / `preferred_color_scheme` / `github_light` / `dark_dimmed` 等）
  - 对应：`data-theme`（初始值，运行时可由 `theme_config` 覆盖）

- reactionsEnabled (boolean) — 可选
  - 对应：`data-reactions-enabled`（Giscus 接受 `1`/`0`，插件会进行转换）

- emitMetadata (boolean) — 可选
  - 对应：`data-emit-metadata`

- inputPosition (string) — 可选（`top` / `bottom`）
  - 对应：`data-input-position`

- lang (string) — 可选（例如 `zh-CN` / `en` / `ja`）
  - 对应：`data-lang`

- strict (boolean) — 可选
  - 对应：`data-strict`（开启严格匹配时只有精确匹配的讨论会被展示）

- loading (string) — 可选：`eager` / `lazy`
  - 对应：`data-loading`

- theme_config (object) — 可选但强烈建议使用
  - 作用：将 HonKit 页面或主题类名映射为 Giscus 的主题名（在页面端运行时生效）
  - 结构：`{ "<honkit-class>": "<giscus-theme>" }`
  - 例如：`{ "color-theme-1": "light", "night": "dark_dimmed" }`

- debug (boolean)
  - 作用：在构建产物中注入简要的调试信息（便于在浏览器控制台检查 `window.giscusThemeMapping` 与匹配结果）

注意：插件会把大多数布尔值转换为 Giscus 期望的格式（`1`/`0`），并且默认自动将当前页面路径写入 `data-term`，以保证每页独立讨论，除非你使用 `mapping: "specific"` 或 `mapping: "number"` 并明确指定 `term`。

## 获取 `repoId` 与 `categoryId`（命令行示例）

如果你偏好使用命令行获取仓库或 Discussions 分类的 ID，可以参考下面的示例（需要一个有权限的 GitHub 个人访问令牌）。在 PowerShell 中，你可以使用 `Invoke-RestMethod`：

```powershell
# 在 PowerShell 中设置临时变量（或使用环境变量 $env:GITHUB_TOKEN）
$token = 'YOUR_TOKEN'
# 获取仓库信息（包含数字 id）
Invoke-RestMethod -Uri "https://api.github.com/repos/OWNER/REPO" -Headers @{ Authorization = "token $token" } | Select-Object id
```

使用 GraphQL 查询 Discussions 分类 ID（返回的 id 通常是类似 `DIC_...` 的字符串）：

```powershell
$token = 'YOUR_TOKEN'
$query = '{ "query": "query { repository(owner: \"OWNER\", name: \"REPO\") { discussionCategories(first: 100) { nodes { id name } } } }" }'
Invoke-RestMethod -Uri 'https://api.github.com/graphql' -Method Post -Headers @{ Authorization = "bearer $token" } -Body $query
```

如果你习惯使用 curl（例如 WSL 或其他环境），相应命令如下：

```bash
# 示例命令省略
```

备注：giscus.app 的可视化界面通常会直接显示或生成带 `R_...` / `DIC_...` 的 id，使用 giscus.app UI 是最简单的方式；命令行仅在你需要自动化或脚本化时有用。

## 快速配置（最小示例）

在 `book.json` 中添加：

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
        "default": "light",
        "color-theme-1": "gruvbox",
        "color-theme-2": "dark_dimmed"
      }
    }
  }
}
```

## 快速验证

1. 构建或预览你的 HonKit 书籍。
2. 在页面源代码中确认存在注入的 `window.giscusThemeMapping` 脚本。
3. 切换主题并在浏览器控制台观察是否发送了 postMessage 给 `https://giscus.app`（或观察 iframe 的主题切换）。
4. 若需调试匹配逻辑，可临时在 `pluginsConfig.add-giscus` 中添加 `"debug": true`。

## 重要注意事项

- 你的 GitHub 仓库必须设置为 public（公开仓库）。Giscus 对公开 Discussions 的使用最为直接可靠。
- 请在仓库设置中启用 GitHub Discussions 功能，并在 https://giscus.app 上按指引配置你的仓库与分类（category）。
- 在 giscus.app 生成或复制配置时，请确认 `repoId`（R_...）与 `categoryId`（DIC_...）正确无误并填写到插件配置中。


## 主要配置项（摘要）

- `repo`, `repoId`, `category`, `categoryId`：Giscus 必需项（参见 giscus.app）
- `mapping`：讨论映射方式（默认 `pathname`）
- `theme`：初始 Giscus 主题（可由 `theme_config` 覆盖运行时切换）
- `theme_config`：HonKit 主题类 -> Giscus 主题 的映射对象
- `strict`, `reactionsEnabled`, `emitMetadata`, `inputPosition`, `lang`, `loading`：与 Giscus client 对应

建议：通常只需提供 `theme_config` 来实现页面主题与 Giscus 的一致性。

## 主题映射示例

```json
"theme_config": {
  "color-theme-1": "gruvbox",
  "color-theme-2": "dark_dimmed",
  "night": "dark_high_contrast",
  "sepia": "github_light"
}
```

插件在页面端会优先按照 `.book.font-size-2.font-family-1.<key>` 的选择器匹配映射键（便于基于页面类名的精确匹配），其次回退到 `color-theme-*` 或常见类名（`night`/`sepia`/`white`），最后基于 body/html 类或系统偏好回退到 `dark`/`light`。

## 调试

启用 `pluginsConfig.add-giscus.debug = true` 后，构建页面会包含简单的映射信息输出，便于在浏览器控制台校验匹配结果。

## 许可

Apache-2.0
