// 优化的 Giscus 主题与字体颜色同步脚本
(function () {
    // 定义全局函数，以便在页面跳转后调用
    window.applyGiscusTheme = function() {
        if (window._internalApplyGiscusTheme) {
            window._internalApplyGiscusTheme();
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        // 精简优化版：保留选择器优先级、映射注入和 iframe postMessage；移除 themeColors 支持

        // 默认主题映射（可被 window.giscusThemeMapping 覆盖）
        var defaultThemeMapping = {
            'color-theme-1': 'light',
            'color-theme-2': 'dark_dimmed',
            'default': 'light',
            'sepia': 'preferred_color_scheme',
            'night': 'dark_dimmed',
            'white': 'light'
        };

        var themeMapping = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object')
            ? window.giscusThemeMapping
            : defaultThemeMapping;

        var iframeSelector = 'iframe.giscus-frame';
        var pendingTheme = null;
        var scheduled = null;

        function detectActiveThemeClass() {
            var book = document.querySelector('.book');
            if (!book) return 'default';
            
            // 调试日志，帮助诊断主题检测
            if (window.giscusDebug) {
                console.log('[giscus-theme] Book element classes:', Array.from(book.classList));
            }

            // 第一优先级：检查特定主题类名
            if (book.classList.contains('color-theme-1')) return 'color-theme-1';
            if (book.classList.contains('theme-color-1')) return 'color-theme-1'; // 别名处理
            
            if (book.classList.contains('color-theme-2')) return 'color-theme-2';
            if (book.classList.contains('theme-color-2')) return 'color-theme-2'; // 别名处理

            // 第二优先级：查找 color-theme-* 类
            for (var i = 0; i < book.classList.length; i++) {
                var c = book.classList[i];
                if (c.indexOf('color-theme-') === 0) return c;
                if (c.indexOf('theme-color-') === 0) {
                    // 将theme-color-X转换为color-theme-X
                    return 'color-theme-' + c.substring(12); 
                }
            }
            
            // 第三优先级：检查 .book.font-size-2.font-family-1.<key> 形式
            for (var key in themeMapping) {
                if (!Object.prototype.hasOwnProperty.call(themeMapping, key)) continue;
                if (book.classList.contains(key)) return key;
                var sel = '.book.font-size-2.font-family-1.' + key;
                if (document.querySelector(sel)) return key;
            }

            // 其它常见类名回退
            if (book.classList.contains('night')) return 'night';
            if (book.classList.contains('sepia')) return 'sepia';
            if (book.classList.contains('white')) return 'white';
            return 'default';
        }

        function mapToGiscusTheme(activeClass) {
            if (activeClass && themeMapping[activeClass]) return themeMapping[activeClass];
            // 回退：检测 body / document 或系统偏好
            if (
                document.body.classList.contains('dark') ||
                document.body.classList.contains('honkit-dark') ||
                document.documentElement.classList.contains('dark') ||
                (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ) {
                return 'dark';
            }
            return 'light';
        }

        function postThemeToIframe(theme) {
            var iframe = document.querySelector(iframeSelector);
            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, 'https://giscus.app');
                } catch (e) {
                    // ignore
                }
            } else {
                pendingTheme = theme;
            }
        }

        // 确保 --font-color 存在（不主动从外部注入颜色）
        function ensureFontColorVar() {
            try {
                var root = document.documentElement;
                var has = root.style.getPropertyValue('--font-color');
                if (!has) {
                    var computed = '#000000';
                    try { computed = (getComputedStyle(root).getPropertyValue('--font-color') || computed).trim(); } catch (e) {}
                    root.style.setProperty('--font-color', computed);
                }
            } catch (e) { /* ignore */ }
        }

        // 定义内部应用主题的函数
        window._internalApplyGiscusTheme = function() {
            var activeClass = detectActiveThemeClass();
            var gTheme = mapToGiscusTheme(activeClass);
            postThemeToIframe(gTheme);
            ensureFontColorVar();
            
            if (window.giscusDebug) {
                console.log('[giscus-theme] 应用主题:', { class: activeClass, theme: gTheme });
            }
            
            return gTheme;
        };
        
        function updateAll() {
            if (scheduled) return;
            scheduled = setTimeout(function () {
                scheduled = null;
                window._internalApplyGiscusTheme();
            }, 80);
        }

        // 观察 iframe 出现并发送挂起主题
        var iframeObserver = new MutationObserver(function () {
            var iframe = document.querySelector(iframeSelector);
            if (iframe) {
                if (pendingTheme) {
                    postThemeToIframe(pendingTheme);
                    pendingTheme = null;
                }
                iframeObserver.disconnect();
            }
        });
        iframeObserver.observe(document.body, { childList: true, subtree: true });

        // 观察 book 类名变化
        var bookEl = document.querySelector('.book');
        if (bookEl) {
            var bookObserver = new MutationObserver(function () { updateAll(); });
            bookObserver.observe(bookEl, { attributes: true, attributeFilter: ['class'] });
        }

        // 监听常见的主题切换触发器（按钮、切换器）
        document.addEventListener('click', function (e) {
            try {
                var t = e.target;
                if (t.closest && t.closest('.js-toggle-theme, .theme-toggler, [data-theme-toggle]')) {
                    setTimeout(updateAll, 120);
                }
            } catch (e) {}
        }, true);

        // 监听系统主题变化
        if (window.matchMedia) {
            try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAll); } catch (e) {}
        }

        // 首次运行
        updateAll();
        
        // 为了确保正确应用主题，特别是对于theme-color-1，进行多次尝试
        setTimeout(window._internalApplyGiscusTheme, 500);
        setTimeout(window._internalApplyGiscusTheme, 1000);
        
        // 为HonKit页面变化事件添加特殊处理
        if (window.gitbook) {
            window.gitbook.events.on("page.change", function() {
                // 页面变化后多次尝试应用主题
                setTimeout(window._internalApplyGiscusTheme, 200);
                setTimeout(window._internalApplyGiscusTheme, 500);
                setTimeout(window._internalApplyGiscusTheme, 1000);
            });
        }
    });
})();
