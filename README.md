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
﻿# HonKit 插件：Add Giscus

中文说明：此插件在每个页面注入 Giscus（基于 GitHub Discussions）的评论区，并在运行时同步 HonKit 主题到 Giscus 主题。

主要特性
- 为每页注入独立的 Giscus 评论区（默认按 pathname 映射）
- 运行时同步主题：通过 `theme_config` 将 HonKit 主题类映射为 Giscus 主题并在页面加载/导航时生效
- 支持单页应用（SPA）导航与受控重载，尽量以 postMessage 更新 iframe，必要时做受保护的 reload
- 可选调试开关（在 `book.json` 的 `pluginsConfig.add-giscus.debug` 中启用）

快速安装
```bash
npm install honkit-plugin-add-giscus --save-dev
```

最小配置示例（在 `book.json` 中）
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
      },
      "debug": false
    }
  }
}
```

使用说明（运行时行为概览）
- 插件会在页面中注入 `window.giscusThemeMapping` 与 `window.giscusConfig`，以及一个 `#giscus-container` 占位容器。
- 在页面加载或 SPA 导航时，`assets/giscus-theme-switcher.js` 会检测当前 HonKit 主题、映射到 Giscus 主题，并优先通过 postMessage 发送给已存在的 iframe。若 iframe 尚未加载，脚本会在合适时机创建 giscus client.js（data-theme 已设置为映射值）或进行受保护的 reload。

快速验证（调试建议）
1. 在构建/预览页面后，检查页面源代码是否包含 `window.giscusThemeMapping`。
2. 在浏览器控制台启用调试：`window.giscusDebug = true`，然后刷新页面并观察控制台日志。
3. 切换主题或导航页面时，观察是否有向 iframe 的 postMessage 调用或带 `_g_reload` 的 iframe 请求（Network 面板）。

常见问题与排查
- 无评论区或 iframe 未显示：确认 `repo`、`repoId`、`categoryId` 配置正确，仓库为公开并启用 Discussions（见 `troubleshooting.md`）。
- 主题不同步：可能来自 iframe 延迟加载或 lazy-loading；可将 `loading` 设置为 `eager` 或在控制台临时调整 `window.giscusEnsureReceiveTimeoutMs`（脚本中用于重试的超时，单位 ms）。
- 若需详细调试，请启用 `debug` 并贴回 Console/Network 输出，插件文档中包含常用诊断脚本。

调试小贴士（控制台命令）
```javascript
// 开启脚本内调试日志
window.giscusDebug = true;

// 快速查看容器与 iframe 状态
console.log('giscus:', { container: !!document.querySelector('#giscus-container'), iframe: !!document.querySelector('iframe.giscus-frame'), mapping: window.giscusThemeMapping });
```

相关文章与资源
- Giscus 官方：https://giscus.app/
- Troubleshooting：参见项目内的 `troubleshooting.md` 文件

许可证
Apache-2.0

