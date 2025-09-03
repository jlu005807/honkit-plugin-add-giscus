# 排查 Giscus 评论未显示的解决方案

通过诊断测试，我们已经确认插件本身工作正常。下面是排查 Giscus 评论未显示问题的步骤：

## 1. 配置正确的 GitHub 仓库信息

修改 `book.json` 文件，确保使用真实有效的 GitHub 仓库信息而不是占位符：

```json
"add-giscus": {
  "repo": "你的用户名/你的仓库名",
  "repoId": "R_开头的真实ID",
  "category": "Announcements",
  "categoryId": "DIC_开头的真实ID",
  ...
}
```

## 2. 确保 GitHub 仓库设置正确

- 仓库必须是**公开的**（private 仓库不支持）
- 必须在仓库的 Settings -> Features -> Discussions 中**启用 Discussions 功能**
- 在 [giscus.app](https://giscus.app/) 上确认你的仓库已被 Giscus 应用程序授权访问

## 3. 检查浏览器控制台错误

在浏览器中打开你的 HonKit 页面，按 F12 打开开发者工具，查看 Console 选项卡中的错误信息。常见问题包括：

- **跨域问题**：如果看到 CORS 相关错误，这可能是由于 CSP 策略限制
- **网络错误**：检查是否有指向 giscus.app 的请求失败
- **JavaScript 错误**：检查 giscus-theme-switcher.js 是否正确加载和执行

## 4. 查看生成的 HTML

检查生成的 HTML 页面源代码，确认是否包含以下元素：

1. `window.giscusThemeMapping` 的定义
2. `<div id="giscus-container">` 元素
3. 指向 giscus.app 的 script 标签，包含正确的 data-* 属性

## 5. 验证 Giscus API 访问

通过 GitHub GraphQL API 确认你是否有权访问所配置仓库的 Discussions：

```bash
curl -H "Authorization: bearer YOUR_GITHUB_TOKEN" -X POST -d '{"query": "query { repository(owner: \"用户名\", name: \"仓库名\") { discussions(first: 1) { nodes { id } } } }"}' https://api.github.com/graphql
```

## 6. 尝试简化配置

临时使用最小配置测试：

```json
"add-giscus": {
  "repo": "你的用户名/你的仓库名",
  "repoId": "你的仓库ID",
  "category": "Announcements",
  "categoryId": "你的分类ID",
  "debug": true
}
```

## 7. 检查网络连接

确认你的环境能够正常访问 giscus.app 服务。在某些环境中，可能需要配置代理或网络设置。

## 8. 查看页面布局和样式

检查是否有 CSS 样式覆盖或影响了 Giscus 容器的显示。尝试使用浏览器开发者工具检查 `#giscus-container` 元素是否可见。

---

如果按照上述步骤操作后问题仍然存在，请在浏览器控制台执行以下脚本并分享输出结果，这将帮助进一步诊断：

```javascript
console.log("Giscus 诊断信息:");
console.log("容器存在:", !!document.querySelector("#giscus-container"));
console.log("主题映射:", window.giscusThemeMapping || "未定义");
console.log("iframe存在:", !!document.querySelector("iframe.giscus-frame"));
```
