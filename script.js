/**
 * echo-homepage - 个人主页脚本
 *
 * 功能：
 *  - 获取 Bing 每日壁纸与版权信息
 *  - 打字机效果 + 名字轮换（Echo / LoveEcho / L / 小回）
 *  - 共享头像跨屏过渡动画（第一屏 → 第二屏）
 *  - 首屏内容随滚动距离线性淡出
 */
(function () {
  'use strict';

  // ===================== DOM 引用 =====================
  const sharedAvatar    = document.getElementById('shared-avatar');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  const avatarTarget    = document.getElementById('avatar-target');
  const wallpaper       = document.getElementById('wallpaper');
  const copyright       = document.getElementById('copyright');
  const fadeLayer       = document.getElementById('first-fade-layer');
  const typewriterName  = document.getElementById('typewriter-name');

  // ===================== 配置 =====================
  var NAMES = ['Echo', 'LoveEcho', '菠萝'];
  var SWITCH_INTERVAL = 3000;   // 名字切换周期 ms
  var TYPE_SPEED      = 80;     // 打字速度 ms/字
  var DELETE_SPEED    = 40;     // 删除速度 ms/字
  var MIN_PAUSE       = 1500;   // 最短停留时间 ms

  var currentNameIndex = -1;
  var typewriterTimer  = null;

  // ===================== 壁纸获取 =====================
  function fetchWallpaper() {
    var url = 'https://bing.biturl.top/?resolution=UHD&format=json&index=0&mkt=zh-CN';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.url) {
          wallpaper.src = data.url;
          wallpaper.alt = data.copyright || 'Bing 每日壁纸';
          wallpaper.classList.add('loaded');
        }
        if (data && data.copyright) {
          copyright.textContent = data.copyright;
        } else {
          copyright.textContent = 'Bing 每日壁纸';
        }
      })
      .catch(function (err) {
        console.warn('壁纸获取失败:', err.message);
        copyright.textContent = 'Bing 每日壁纸';
        // 壁纸加载失败时移除 opacity 过渡以免空白
        wallpaper.classList.add('loaded');
      });
  }

  // ===================== 打字机效果 =====================
  function pickNextName() {
    var next;
    do {
      next = Math.floor(Math.random() * NAMES.length);
    } while (next === currentNameIndex && NAMES.length > 1);
    currentNameIndex = next;
    return NAMES[currentNameIndex];
  }

  /** 逐字打印 */
  function typeText(text, onDone) {
    var i = 0;
    typewriterName.textContent = '';
    function step() {
      if (i < text.length) {
        typewriterName.textContent += text[i];
        i += 1;
        typewriterTimer = setTimeout(step, TYPE_SPEED);
      } else if (onDone) {
        onDone();
      }
    }
    step();
  }

  /** 逐字删除 */
  function deleteText(onDone) {
    var text = typewriterName.textContent;
    function step() {
      if (text.length > 0) {
        text = text.slice(0, -1);
        typewriterName.textContent = text;
        typewriterTimer = setTimeout(step, DELETE_SPEED);
      } else if (onDone) {
        onDone();
      }
    }
    step();
  }

  /** 一轮打字 → 停留 → 删除 → 递归 */
  function runCycle() {
    var name = pickNextName();
    var typeMs   = name.length * TYPE_SPEED;
    var deleteMs = name.length * DELETE_SPEED;
    var pauseMs  = Math.max(SWITCH_INTERVAL - typeMs - deleteMs, MIN_PAUSE);

    typeText(name, function () {
      typewriterTimer = setTimeout(function () {
        deleteText(function () {
          typewriterTimer = setTimeout(runCycle, 400);
        });
      }, pauseMs);
    });
  }

  /** 启动打字机：先打出第一个名字，再进入循环 */
  function startTypewriter() {
    var first = NAMES[0];
    currentNameIndex = 0;
    typewriterName.textContent = first;

    var deleteMs = first.length * DELETE_SPEED;
    var pauseMs  = Math.max(SWITCH_INTERVAL - deleteMs, MIN_PAUSE);

    typewriterTimer = setTimeout(function () {
      deleteText(function () {
        typewriterTimer = setTimeout(runCycle, 400);
      });
    }, pauseMs);
  }

  // ===================== 共享头像过渡 =====================
  function updateAvatarPosition() {
    var scrollY = window.scrollY || window.pageYOffset;
    var winH    = window.innerHeight;

    // 进度 [0, 1]
    var progress = Math.min(Math.max(scrollY / winH, 0), 1);

    var startRect = avatarPlaceholder.getBoundingClientRect();
    var endRect   = avatarTarget.getBoundingClientRect();

    var startX = startRect.left + startRect.width  / 2;
    var startY = startRect.top  + startRect.height / 2;
    var endX   = endRect.left   + endRect.width    / 2;
    var endY   = endRect.top    + endRect.height   / 2;

    var x = startX + (endX - startX) * progress;
    var y = startY + (endY - startY) * progress;

    sharedAvatar.style.left = x + 'px';
    sharedAvatar.style.top  = y + 'px';
    sharedAvatar.style.transform = 'translate(-50%, -50%)';
  }

  // ===================== 首屏淡出 =====================
  function updateFadeLayer() {
    var scrollY = window.scrollY || window.pageYOffset;
    var winH    = window.innerHeight;
    var progress = Math.min(Math.max(scrollY / winH, 0), 1);
    fadeLayer.style.opacity = String(1 - progress);
  }

  // ===================== 滚动处理（RAF 节流） =====================
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateAvatarPosition();
        updateFadeLayer();
        ticking = false;
      });
      ticking = true;
    }
  }

  function onResize() {
    updateAvatarPosition();
    updateFadeLayer();
  }

  // ===================== 暗黑模式切换 =====================
  var themeToggle = document.getElementById('theme-toggle');
  var THEME_KEY = 'echo-homepage-theme'; // 'dark' | 'light' | 'auto'
  var themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function saveTheme(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) { /* ignore */ }
  }

  function applyTheme(mode) {
    var html = document.documentElement;
    html.classList.remove('dark', 'light');
    if (mode === 'dark') {
      html.classList.add('dark');
    } else if (mode === 'light') {
      html.classList.add('light');
    }
    // mode === 'auto': 不添加任何 class，跟随系统
    updateToggleTitle(mode);
  }

  function cycleTheme() {
    var current = getSavedTheme();
    var next;
    if (current === 'auto') {
      next = 'dark';
    } else if (current === 'dark') {
      next = 'light';
    } else {
      next = 'auto';
    }
    saveTheme(next);
    applyTheme(next);
  }

  function getSystemTheme() {
    return themeMediaQuery.matches ? 'dark' : 'light';
  }

  function updateToggleTitle(mode) {
    if (!themeToggle) return;
    var effective = mode === 'auto' ? getSystemTheme() : mode;
    var nextMap = { auto: '暗黑', dark: '明亮', light: '跟随系统' };
    var nextLabel = nextMap[mode];
    var currentLabel = effective === 'dark' ? '暗黑模式' : '明亮模式';
    themeToggle.title = '当前：' + currentLabel + '（' + (mode === 'auto' ? '跟随系统' : '手动') + '） — 点击切换' + nextLabel;
    themeToggle.setAttribute('data-mode', mode);
  }

  function initTheme() {
    applyTheme(getSavedTheme());
    themeToggle.addEventListener('click', cycleTheme);

    // 监听系统主题变化，在 auto 模式下同步更新按钮提示
    if (typeof themeMediaQuery.addEventListener === 'function') {
      themeMediaQuery.addEventListener('change', function () {
        if (getSavedTheme() === 'auto') {
          updateToggleTitle('auto');
        }
      });
    } else {
      // 旧浏览器降级
      themeMediaQuery.addListener(function () {
        if (getSavedTheme() === 'auto') {
          updateToggleTitle('auto');
        }
      });
    }
  }

  // ===================== 入口 =====================
  function init() {
    initTheme();
    fetchWallpaper();
    startTypewriter();
    updateAvatarPosition();
    updateFadeLayer();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
