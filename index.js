// honkit-plugin-add-giscus
// HonKit plugin to inject Giscus into every page and provide theme mapping

module.exports = {
  book: {
    assets: './assets',
    css: ['giscus.css'],
    js: ['giscus-theme-switcher.js']
  },
  
  hooks: {
    // 注意：使用 page:before 可能更可靠，确保在所有处理前注入内容
    "page:before": function(page) {
      try {
        // 仅在 website 输出时注入
        if (this.output && this.output.name && this.output.name !== 'website') {
          return page;
        }

        // 获取配置 (防护 this.config 为空)
        var config = this.config && this.config.get ? 
            this.config.get('pluginsConfig.add-giscus', {}) : {};
        var debug = !!config.debug;
        
        // 默认配置 + 用户配置
        var repo = config.repo || '';
        var repoId = config.repoId || '';
        var category = config.category || 'Announcements';
        var categoryId = config.categoryId || '';
        
        // 必需配置检查
        if (!repo || !repoId || !categoryId) {
          if (debug) {
            console.warn('[add-giscus] 缺少必要配置:', { repo, repoId, categoryId });
          }
          return page;
        }

        // 配置参数
        var theme = config.theme || 'light';
        var mapping = config.mapping || 'pathname';
        var reactionsEnabledFixed = typeof config.reactionsEnabled !== 'undefined' ? 
            (config.reactionsEnabled ? '1' : '0') : '1';
        var emitMetadataFixed = typeof config.emitMetadata !== 'undefined' ? 
            (config.emitMetadata ? '1' : '0') : '0';
        var inputPosition = config.inputPosition || 'bottom';
        var lang = config.lang || 'zh-CN';
        var strict = typeof config.strict !== 'undefined' ? 
            (config.strict ? '1' : '0') : '1';
        var loading = config.loading || 'lazy';

        // 主题映射配置
        var themeConfig = config.theme_config || config.themeConfig || {};
        var defaultThemeMapping = {
          'color-theme-1': 'light',
          'color-theme-2': 'dark_dimmed',
          'default': 'light',
          'sepia': 'preferred_color_scheme',
          'night': 'dark_dimmed',
          'white': 'light'
        };
        var themeMapping = Object.assign({}, defaultThemeMapping, themeConfig);
        var themeMappingJson = JSON.stringify(themeMapping);
        
        // 构建页面信息
        var pagePath = page.path || '';
        var pageTitle = page.title || pagePath;

        // 评论区标题
        var commentTitle = config.commentTitle || '评论区';

        // 构建主题映射脚本
        var themeConfigScript = '<script type="text/javascript">\n' + 
                              '/* Giscus Theme Mapping */\n' +
                              'window.giscusThemeMapping = ' + themeMappingJson + ';\n' +
                              (debug ? 'console.log("[add-giscus] 主题映射已加载:", window.giscusThemeMapping);\n' : '') +
                              '</script>';
        
        // 构建 Giscus 容器
        var containerStyle = 'margin-top: 50px; padding: 10px; border-top: 1px solid #eaecef;';
        if (debug) containerStyle += ' border-left: 3px solid #42b983;';
        
        var giscusContainer = '<div id="giscus-container" style="' + containerStyle + '">' +
                            '<div class="giscus-page-info" style="margin-bottom: 15px; font-size: 0.9em; color: #666;">' +
                             commentTitle + ' - ' + pageTitle + '</div>' +
                            '</div>';
        
        // 构建 Giscus 跳转重加载脚本
        var giscusScript = [
            '<script id="giscus-page-script">',
            '// Giscus配置和重加载实现',
            'window.giscusConfig = {',
            '  repo: "' + repo + '",',
            '  repoId: "' + repoId + '",',
            '  category: "' + category + '",',
            '  categoryId: "' + categoryId + '",',
            '  mapping: "' + mapping + '",',
            '  strict: "' + strict + '",',
            '  reactionsEnabled: "' + reactionsEnabledFixed + '",',
            '  emitMetadata: "' + emitMetadataFixed + '",',
            '  inputPosition: "' + inputPosition + '",',
            '  theme: "' + theme + '",',
            '  lang: "' + lang + '",',
            '  loading: "' + loading + '"',
            '};',
            '',
            '// 加载Giscus评论组件',
            'function loadGiscusForCurrentPage() {',
            '  var container = document.getElementById("giscus-container");',
            '  if (!container) return;',
            '',
            '  // 清除旧内容',
            '  var infoElement = container.querySelector(".giscus-page-info");',
            '  var oldScript = document.getElementById("giscus-script");',
            '  var oldIframe = document.querySelector("iframe.giscus-frame");',
            '',
            '  // 删除旧的giscus脚本和iframe',
            '  if (oldScript) oldScript.remove();',
            '  if (oldIframe) oldIframe.remove();',
            '',
            '  // 获取当前页面路径',
            '  var currentPath = window.location.pathname;',
            '  if (currentPath.endsWith("/index.html")) {',
            '    currentPath = currentPath.substring(0, currentPath.length - 11);',
            '  } else if (currentPath.endsWith(".html")) {',
            '    currentPath = currentPath.substring(0, currentPath.length - 5);',
            '  }',
            '',
            '  // 创建新的giscus脚本',
            '  var script = document.createElement("script");',
            '  script.id = "giscus-script";',
            '  script.className = "giscus-script";',
            '  script.src = "https://giscus.app/client.js";',
            '  script.setAttribute("data-repo", window.giscusConfig.repo);',
            '  script.setAttribute("data-repo-id", window.giscusConfig.repoId);',
            '  script.setAttribute("data-category", window.giscusConfig.category);',
            '  script.setAttribute("data-category-id", window.giscusConfig.categoryId);',
            '  script.setAttribute("data-mapping", window.giscusConfig.mapping);',
            '  script.setAttribute("data-term", currentPath);',
            '  script.setAttribute("data-strict", window.giscusConfig.strict);',
            '  script.setAttribute("data-reactions-enabled", window.giscusConfig.reactionsEnabled);',
            '  script.setAttribute("data-emit-metadata", window.giscusConfig.emitMetadata);',
            '  script.setAttribute("data-input-position", window.giscusConfig.inputPosition);',
            '  script.setAttribute("data-theme", window.giscusConfig.theme);',
            '  script.setAttribute("data-lang", window.giscusConfig.lang);',
            '  script.setAttribute("data-loading", window.giscusConfig.loading);',
            '  script.setAttribute("crossorigin", "anonymous");',
            '  script.async = true;',
            '',
            '  // 更新页面信息',
            '  if (infoElement) {',
            '    var pageTitle = document.title || currentPath;',
            '    infoElement.innerHTML = "' + commentTitle + ' - " + pageTitle;',
            '  }',
            '',
            '  // 添加脚本到容器',
            '  container.appendChild(script);',
            '  ',
            '  // 脚本加载后应用主题',
            '  script.onload = function() {',
            '    setTimeout(function() {',
            '      if (window.applyGiscusTheme) {',
            '        window.applyGiscusTheme();',
            '      }',
            '    }, 300);',
            '  };',
            '}',
            '',
            '// 初次加载',
            'document.addEventListener("DOMContentLoaded", function() {',
            '  loadGiscusForCurrentPage();',
            '',
            '  // 监听HonKit/GitBook页面切换事件',
            '  if (window.gitbook) {',
            '    window.gitbook.events.on("page.change", function() {',
            '      setTimeout(loadGiscusForCurrentPage, 100);',
            '    });',
            '  }',
            '});',
            '</script>'
        ].join('\n');
        
        // 添加验证脚本（调试模式下）
        var verificationScript = '';
        if (debug) {
            verificationScript = '<script>\n' +
                '  document.addEventListener("DOMContentLoaded", function() {\n' +
                '    setTimeout(function() {\n' +
                '      var isScriptLoaded = !!document.querySelector("#giscus-script");\n' +
                '      var isContainerExists = !!document.querySelector("#giscus-container");\n' +
                '      var isIframeExists = !!document.querySelector("iframe.giscus-frame");\n' +
                '      console.log("[add-giscus] 评论组件状态:", {\n' +
                '        页面: "' + pagePath + '",\n' +
                '        脚本加载: isScriptLoaded,\n' +
                '        容器存在: isContainerExists,\n' +
                '        iframe加载: isIframeExists,\n' +
                '        主题映射: window.giscusThemeMapping ? "已定义" : "未定义"\n' +
                '      });\n' +
                '      if (!isIframeExists && isScriptLoaded) {\n' +
                '        console.warn("[add-giscus] iframe未加载，请检查GitHub仓库配置");\n' +
                '      }\n' +
                '    }, 1500);\n' +
                '  });\n' +
                '</script>';
        }

        // 方法1：更简单直接地注入内容 - 直接追加到页面内容末尾
        if (debug) {
            console.log('[add-giscus] 正在处理页面:', pagePath);
        }
        
        // 添加调试标记（如果启用）
        var debugScript = '';
        if (debug) {
            debugScript = '<script>window.giscusDebug = true;</script>\n';
        }
        
        // 构造完整的注入内容
        var injectContent = '\n\n' +
            '<!-- Giscus 评论组件开始 - ' + new Date().toISOString() + ' -->\n' +
            debugScript +
            themeConfigScript + '\n' +
            giscusContainer + '\n' +
            giscusScript + '\n' +
            verificationScript + '\n' +
            '<!-- Giscus 评论组件结束 -->';
            
        // 直接将内容追加到页面末尾
        page.content = page.content + injectContent;
        
        if (debug) {
            console.log('[add-giscus] 已将评论组件注入到页面:', pagePath);
        }
        
        return page;
      } catch (err) {
        console.error('[add-giscus] 处理页面时出错:', err.message || err);
        if (debug) {
          // 在调试模式下添加错误标记到页面
          page.content += '\n<!-- Giscus 注入失败: ' + (err.message || '未知错误') + ' -->\n';
        }
        return page;
      }
    }
  },

  filters: {},
  
  blocks: {}
};
