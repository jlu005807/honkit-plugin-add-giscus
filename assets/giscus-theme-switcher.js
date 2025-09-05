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
        var iframeRef = null;
    var _pendingAttempts = 0;
    var _maxAttempts = 8;
    var _backoffBase = 150; // ms

        // 防抖工具
        function debounce(fn, wait) {
            var t = null;
            return function () {
                var args = arguments;
                if (t) clearTimeout(t);
                t = setTimeout(function () { t = null; fn.apply(null, args); }, wait);
            };
        }

        function findIframe() {
            try {
                if (iframeRef && document.contains(iframeRef)) return iframeRef;
            } catch (e) {}
            try {
                // Try several selectors to locate the giscus iframe in different page structures
                var selectors = [
                    'iframe.giscus-frame',
                    '#giscus-container iframe.giscus-frame',
                    '#giscus-container iframe',
                    '.giscus iframe',
                    'iframe[src*="giscus" i]',
                    'iframe[src*="giscus.app" i]',
                    'iframe[title*="giscus" i]'
                ];
                var f = null;
                for (var si = 0; si < selectors.length; si++) {
                    try {
                        f = document.querySelector(selectors[si]);
                        if (f) break;
                    } catch (e) { /* ignore selector errors */ }
                }
                // last resort: any iframe inside an element with id/class that hints giscus
                if (!f) {
                    try { f = document.querySelector('#giscus iframe'); } catch (e) {}
                }
                if (f) {
                    iframeRef = f;
                    // attach load handler to flush pending theme when iframe finishes loading
                    try { attachIframeLoadHandler(iframeRef); } catch (e) {}
                }
                return f;
            } catch (e) { return null; }
        }

        function attachIframeLoadHandler(iframe) {
            try {
                if (!iframe) return;
                // avoid duplicating listeners
                if (iframe.__giscusLoadHandlerAttached) return;
                iframe.__giscusLoadHandlerAttached = true;
                iframe.addEventListener('load', function () {
                    try {
                        if (pendingTheme) {
                            safePostMessage(iframe, { giscus: { setConfig: { theme: pendingTheme } } });
                            pendingTheme = null;
                        }
                    } catch (e) {}
                });
            } catch (e) {}
        }

        function safePostMessage(iframe, msg) {
            try {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(msg, '*');
                    return true;
                }
            } catch (e) {}
            return false;
        }

        var scheduleIframeCheck = debounce(function () {
            try {
                var f = findIframe();
                if (f && pendingTheme) {
                    if (safePostMessage(f, { giscus: { setConfig: { theme: pendingTheme } } })) {
                        pendingTheme = null;
                        _pendingAttempts = 0;
                    }
                }
            } catch (e) {}
        }, 150);

        function detectActiveThemeClass() {
            var book = document.querySelector('.book');
            if (!book) return 'default';
            
            // 调试日志，帮助诊断主题检测
            if (window.giscusDebug) {
                console.log('[giscus-theme] Book element classes:', Array.from(book.classList));
            }
            // 优先：如果页面注入了 themeMapping（来自 HonKit 的 book.json），按 mapping 中的 key检测子元素或类
            try {
                var injectedMap = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object') ? window.giscusThemeMapping : (themeMapping || null);
                if (injectedMap) {
                    for (var mapKey in injectedMap) {
                        if (!Object.prototype.hasOwnProperty.call(injectedMap, mapKey)) continue;
                        if (mapKey === 'default') continue; // default 作为回退
                        try {
                            // 优先在 .book 内查找带有该类的子元素
                            if (book.querySelector && book.querySelector('.' + mapKey)) return mapKey;
                            // 检查 .book 本身是否有该类
                            if (book.classList && book.classList.contains(mapKey)) return mapKey;
                            // 检查 data-theme / data-theme-* 属性
                            try {
                                if (book.getAttribute && book.getAttribute('data-theme') === mapKey) return mapKey;
                                if (document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-theme') === mapKey) return mapKey;
                                // 匹配 data-theme-<key> = "true" 或存在
                                if (book.querySelector && book.querySelector('[data-theme-' + mapKey + ']')) return mapKey;
                            } catch (e) {}
                            // 检查根元素（某些主题会在根元素打类）
                            if (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains(mapKey)) return mapKey;
                        } catch (e) {}
                    }
                }
            } catch (e) {}

            // 第一优先级：检查特定主题类名（兼容旧逻辑）
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

        // 从注入的 theme mapping 中检测并直接返回对应的 giscus 主题（值），否则返回 null
        function getGiscusThemeFromConfig() {
            try {
                var book = document.querySelector('.book');
                var mapping = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object') ? window.giscusThemeMapping : themeMapping;
                if (!mapping) return null;
                var defaultTheme = mapping['default'] || null;
                for (var k in mapping) {
                    if (!Object.prototype.hasOwnProperty.call(mapping, k)) continue;
                    if (k === 'default') continue;
                    try {
                        // 优先检查 root
                        if (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains(k)) return mapping[k];
                        // 检查 .book 自身
                        if (book && book.classList && book.classList.contains(k)) return mapping[k];
                        // 检查 .book 内部子元素
                        if (book && book.querySelector && book.querySelector('.' + k)) return mapping[k];
                    } catch (e) {}
                }
                return defaultTheme;
            } catch (e) { return null; }
        }

        function postThemeToIframe(theme) {
            var f = findIframe();
            if (f) {
                var ok = safePostMessage(f, { giscus: { setConfig: { theme: theme } } });
                if (ok) {
                    try { _lastSentTheme = theme; } catch (e) {}
                    try { window._giscusLastSentTheme = _lastSentTheme; } catch (e) {}
                } else {
                    pendingTheme = theme;
                }
            } else {
                pendingTheme = theme;
                _pendingAttempts = 0;
                scheduleIframeRetry();
            }
        }

        function scheduleIframeRetry() {
            try {
                if (!_pendingAttempts) _pendingAttempts = 0;
                if (_pendingAttempts >= _maxAttempts) return;
                _pendingAttempts++;
                var delay = Math.min(2000, _backoffBase * Math.pow(1.6, _pendingAttempts));
                setTimeout(function () {
                    try {
                        if (!pendingTheme) return;
                        var f = findIframe();
                        if (f) {
                            if (safePostMessage(f, { giscus: { setConfig: { theme: pendingTheme } } })) {
                                try { _lastSentTheme = pendingTheme; window._giscusLastSentTheme = _lastSentTheme; } catch (e) {}
                                pendingTheme = null;
                                _pendingAttempts = 0;
                                return;
                            }
                        }
                        // re-schedule if still pending
                        scheduleIframeRetry();
                    } catch (e) { }
                }, delay);
            } catch (e) {}
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
            // 先尝试根据注入的 mapping 查找具体的 giscus 主题值
            var activeClass = null;
            var gTheme = getGiscusThemeFromConfig();
            if (!gTheme) {
                activeClass = detectActiveThemeClass();
                gTheme = mapToGiscusTheme(activeClass);
            }
            postThemeToIframe(gTheme);
            ensureFontColorVar();
            
            if (window.giscusDebug) {
                console.log('[giscus-theme] 应用主题:', { class: activeClass, theme: gTheme });
            }
            
            return gTheme;
        };
        // 记录上次成功发送的主题与重载时间，避免重复快速重载
        var _lastSentTheme = null;
        var _lastReloadAt = 0;
        var _minReloadInterval = 800; // ms

        // 强制重载 giscus iframe（通过修改 src 的查询参数来避开缓存）
    function reloadGiscusIframe(iframe, newTheme) {
            try {
                var f = iframe || findIframe();
                if (!f) {
                    // iframe 不存在：记录期望主题并启动重试，等待 iframe 被插入
                    try { if (newTheme) pendingTheme = newTheme; } catch (e) {}
                    try { _pendingAttempts = 0; scheduleIframeRetry(); } catch (e) {}
                    return false;
                }
                var now = Date.now();
                if (now - _lastReloadAt < _minReloadInterval) return false;
                _lastReloadAt = now;
                var src = f.getAttribute('src') || f.src || '';
                try {
                    var u = new URL(src, location.href);
                    u.searchParams.set('_g_reload', String(now));
                    f.setAttribute('src', u.toString());
                } catch (e) {
                    // URL 构造失败时，退回到简单拼接参数
                    var sep = src.indexOf('?') === -1 ? '?' : '&';
                    f.setAttribute('src', src + sep + '_g_reload=' + now);
                }
                // 清除缓存的 iframe 引用，等待新的 iframe 加载并被重新发现
                try { iframeRef = null; } catch (e) {}
                // 设置 pendingTheme 以便在新的 iframe load 后能发送主题
                try { if (newTheme) pendingTheme = newTheme; } catch (e) {}
                return true;
            } catch (e) { return false; }
        }

        // 应用主题并在需要时重载 giscus（force = true 表示在导航后强制重载）
        function applyThemeAndMaybeReload(force) {
            try {
                var applied = window._internalApplyGiscusTheme();
                try { if (window.giscusDebug) console.log('[giscus-theme] applyThemeAndMaybeReload', { theme: applied, force: !!force }); } catch (e) {}
                // 若强制重载或当前页面尚未有 iframe，则尝试 reload
                var f = findIframe();
                // 如果主题实际发生变化（与上次发送的不同），则发送并在必要时重载
                if (applied && applied !== _lastSentTheme) {
                    // 如果没有 iframe，则设置 pendingTheme 并启动重试
                    if (!f) {
                        try { pendingTheme = applied; } catch (e) {}
                        try { _pendingAttempts = 0; scheduleIframeRetry(); } catch (e) {}
                    } else if (force) {
                        // 有 iframe 且为导航强制时，重载 iframe 并在新 iframe 上发送主题
                        reloadGiscusIframe(f, applied);
                    } else {
                        // 直接发送新主题到已存在的 iframe
                        postThemeToIframe(applied);
                    }
                } else {
                    // 主题无变化
                    if (!f) scheduleIframeCheck();
                    else if (force && f) {
                        // 若强制但主题相同，短路避免重复重载
                        // 不进行 reload，以减少不必要的重载
                    }
                }
                return applied;
            } catch (e) { return null; }
        }
        
        function updateAll() {
            if (scheduled) return;
            scheduled = setTimeout(function () {
                scheduled = null;
                window._internalApplyGiscusTheme();
            }, 80);
        }

        // 观察 iframe 出现并发送挂起主题
        var iframeObserver = new MutationObserver(function (mutations, obs) {
            // 轻量检测：只在新增节点时尝试查找 iframe
            var found = false;
            for (var mi = 0; mi < mutations.length; mi++) {
                if (mutations[mi].addedNodes && mutations[mi].addedNodes.length) { found = true; break; }
            }
            if (found) {
                scheduleIframeCheck();
                setTimeout(function () {
                    if (findIframe()) obs.disconnect();
                }, 300);
            }
        });
        try { iframeObserver.observe(document.body, { childList: true, subtree: true }); } catch (e) {}

        // 观察 .book 类名变化（如果 .book 尚未插入则观察 body 以等待插入）
        function observeBook() {
            var bookEl = document.querySelector('.book');
            if (bookEl) {
                try {
                    var bookObserver = new MutationObserver(function (mutations) {
                        // 只在 class 属性变化时触发
                        updateAll();
                    });
                    bookObserver.observe(bookEl, { attributes: true, attributeFilter: ['class'] });
                } catch (e) {}
            } else {
                // 监听 body 的子节点插入，寻找 .book
                try {
                    var insertObs = new MutationObserver(function (muts, obs) {
                        try {
                            var b = document.querySelector('.book');
                            if (b) {
                                obs.disconnect();
                                observeBook();
                                updateAll();
                            }
                        } catch (e) {}
                    });
                    insertObs.observe(document.body, { childList: true, subtree: true });
                } catch (e) {}
            }
        }
        observeBook();

        // 宽泛观察器：当根元素或子树发生替换时，尝试触发一次更新（兼容静态 html 替换 .book 的情况）
        try {
            // Observe attribute changes on <html> and <body> specifically (class and data-theme)
            var attrCb = debounce(function () { updateAll(); }, 120);
            try {
                var htmlObserver = new MutationObserver(attrCb);
                htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            } catch (e) {}
            try {
                var bodyObserver = new MutationObserver(attrCb);
                if (document.body) {
                    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
                } else {
                    // body may not exist yet; watch for insertion
                    var bodyInsertObs = new MutationObserver(function (muts, obs) {
                        try {
                            if (document.body) {
                                obs.disconnect();
                                try { bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] }); } catch (e) {}
                                updateAll();
                            }
                        } catch (e) {}
                    });
                    try { bodyInsertObs.observe(document.documentElement || document, { childList: true, subtree: true }); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {}

        // 监听常见的主题切换触发器（按钮、切换器） - 使用冒泡阶段
        document.addEventListener('click', function (e) {
            try {
                var t = e.target;
                if (t && t.closest && t.closest('.js-toggle-theme, .theme-toggler, [data-theme-toggle]')) {
                    updateAll();
                }
            } catch (e) {}
        }, false);

        // 监听系统主题变化
        if (window.matchMedia) {
            try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAll); } catch (e) {}
        }

    // 首次运行：应用并强制重载 giscus，确保非默认主题进入页面也能生效
    updateAll();
    try { setTimeout(function () { applyThemeAndMaybeReload(true); }, 50); } catch (e) {}
        
        // 为了确保正确应用主题（主题类可能在 JS 之后才添加），进行多次尝试
        var initialAttempts = [200, 600, 1200, 2500, 4000];
        initialAttempts.forEach(function (ms) { setTimeout(window._internalApplyGiscusTheme, ms); });

        // Hook history API (pushState/replaceState) to handle SPA-like navigations
        try {
            ['pushState', 'replaceState'].forEach(function (name) {
                var orig = history[name];
                history[name] = function () {
                    var rv = orig.apply(this, arguments);
                    try { window.dispatchEvent(new Event('giscus:nav')); } catch (e) {}
                    return rv;
                };
            });
            window.addEventListener('popstate', function () { try { window.dispatchEvent(new Event('giscus:nav')); } catch (e) {} });
            window.addEventListener('giscus:nav', function () { try { updateAll(); observeBook(); scheduleIframeCheck(); applyThemeAndMaybeReload(true); setTimeout(function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }, 300); setTimeout(function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }, 800); } catch (e) {} });
        } catch (e) {}

        // 监听路径变化（path/name/search/hash），用于不走 history hook 的场景或额外保险
        try {
            var _lastPathForGiscus = (location.pathname || '') + (location.search || '') + (location.hash || '');
            function _onPathChangeDetected(newPath) {
                try {
                    if (window.giscusDebug) console.log('[giscus-theme] path change detected:', newPath);
                    updateAll();
                    observeBook();
                    scheduleIframeCheck();
                    // 强制尝试重载/应用主题（短延迟做多次保障）
                    applyThemeAndMaybeReload(true);
                    setTimeout(function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }, 300);
                    setTimeout(function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }, 800);
                } catch (e) {}
            }

            // hashchange 立即处理（单页应用可能只变 hash）
            try { window.addEventListener('hashchange', function () { var cur = (location.pathname || '') + (location.search || '') + (location.hash || ''); if (cur !== _lastPathForGiscus) { _lastPathForGiscus = cur; _onPathChangeDetected(cur); } }); } catch (e) {}

            // 轻量轮询：在某些环境下 pushState/replaceState 未被触发或页面通过 location.assign 导航时也能捕获
            try {
                setInterval(function () {
                    try {
                        var cur = (location.pathname || '') + (location.search || '') + (location.hash || '');
                        if (cur !== _lastPathForGiscus) {
                            _lastPathForGiscus = cur;
                            _onPathChangeDetected(cur);
                        }
                    } catch (e) {}
                }, 300);
            } catch (e) {}
        } catch (e) {}

        // 在 window load 后再强制一次（某些页面主题在 load 后才会被应用）
        try { window.addEventListener('load', function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }); } catch (e) {}

        // 短期轮询：监测 body/html 类名或常见 localStorage 主题键的变化（仅在页面加载初期短时启用，避免长轮询）
        try {
            var watchedKeys = ['theme', 'color-scheme', 'color_mode', 'colorTheme', 'book-theme', 'honkit-theme'];
            var lastSnapshot = {
                htmlClass: document.documentElement ? document.documentElement.className : '',
                bodyClass: document.body ? document.body.className : ''
            };
            watchedKeys.forEach(function (k) { try { lastSnapshot[k] = window.localStorage.getItem(k); } catch (e) { lastSnapshot[k] = null; } });
            var pollCount = 0;
            var pollMax = 20; // check for ~4s (interval 200ms)
            var pollInterval = setInterval(function () {
                try {
                    pollCount++;
                    var changed = false;
                    var hc = document.documentElement ? document.documentElement.className : '';
                    var bc = document.body ? document.body.className : '';
                    if (hc !== lastSnapshot.htmlClass) { changed = true; lastSnapshot.htmlClass = hc; }
                    if (bc !== lastSnapshot.bodyClass) { changed = true; lastSnapshot.bodyClass = bc; }
                    for (var i = 0; i < watchedKeys.length; i++) {
                        var key = watchedKeys[i];
                        var v = null;
                        try { v = window.localStorage.getItem(key); } catch (e) { v = null; }
                        if (v !== lastSnapshot[key]) { changed = true; lastSnapshot[key] = v; }
                    }
                    if (changed) {
                        try { updateAll(); } catch (e) {}
                    }
                    if (pollCount >= pollMax) clearInterval(pollInterval);
                } catch (e) { clearInterval(pollInterval); }
            }, 200);
        } catch (e) {}
        
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
