# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

纯原生 HTML/CSS/JS 个人介绍页，无框架，无构建步骤。三个文件严格分离：结构(index.html)、样式(style.css)、逻辑(script.js)。

## 开发方式

直接打开 `index.html` 即可预览。无需构建、打包、安装依赖。

## 架构要点

- **共享头像过渡**：`#shared-avatar` 为 `position: fixed` 的单个 `<img>` 元素，JS 在 scroll 事件中通过 `getBoundingClientRect()` 在两个不可见占位元素（`#avatar-placeholder` 在第一屏，`#avatar-target` 在第二屏）之间线性插值位置
- **主题系统**：CSS 自定义属性三层回退 — `:root`（明亮默认）→ `@media (prefers-color-scheme: dark)`（系统暗黑）→ `html.dark`/`html.light`（手动覆盖，最高优先级）。JS 通过 `localStorage` 持久化用户在 auto/dark/light 三态间的选择
- **毛玻璃效果**：`.glass` 基础类使用 `rgba()` 背景 + `backdrop-filter: blur(20px)` + 半透明边框
- **滚动驱动**：RAF 节流的 scroll 处理，`progress = clamp(scrollY / windowHeight, 0, 1)` 同时驱动头像位移和首屏淡出
- **打字机效果**：递归 `setTimeout` 实现逐字打印/删除，名字从 `['Echo', 'LoveEcho', '菠萝']` 中随机轮换（不与上一次重复），周期约 3s
- **壁纸**：启动时 fetch Bing 每日壁纸 API，加载完成后添加 `.loaded` class 触发 opacity 过渡

## 编辑注意事项

- 所有尺寸、颜色值定义在 `:root` CSS 变量中，暗黑/明亮主题各一套。修改颜色时需同步更新四组变量（`:root`、`@media dark`、`html.dark`、`html.light`）
- 响应式断点：768px（平板）和 480px（小屏手机），修改组件尺寸时需检查对应断点下的覆盖规则
- `.no-wrap` 工具类用于防止 CJK 词语在换行时被拆分
- JS 使用 IIFE + `'use strict'` 模式，所有变量限定在闭包内
