# AboutMe — 个人介绍主页

> 由 Claude 体系迁移而来（来源：`AboutMe/CLAUDE.md`）。

React + TypeScript + Tailwind CSS v4 的个人介绍页，使用 Vite 构建，产物为静态站点（部署于 Cloudflare Pages）。

## 命令

```bash
npm install
npm run dev        # 本地开发
npm run build      # tsc 类型检查 + vite build，输出 dist/
npm run preview    # 预览构建产物
```

## 架构要点

- **组件**：`src/components/`，两屏结构（FirstScreen / SecondScreen）+ ThemeToggle + SharedAvatar
- **逻辑 hooks**：`src/hooks/`，useTheme（三态主题）、useTypewriter（打字机）、useWallpaper（Bing 壁纸，三段式：缓存 → 快照 → api 每日刷新）、useScrollProgress（rAF 节流滚动进度）
- **共享头像过渡**：SharedAvatar 为 fixed 定位的单 `<img>`，useEffect 中通过 `getBoundingClientRect()` 在首屏占位（originRef）与第二屏占位（targetRef）之间线性插值定位
- **主题系统**：CSS 变量两层（`:root` 明亮 / `.dark` 暗黑），Tailwind `@theme inline` 将语义色映射到变量；用户三态选择（auto/dark/light）存在 `localStorage['echo-homepage-theme']`，useTheme 计算生效主题并同步 `<html>` 上的 `.dark` class；`index.html` 内置预载脚本防闪烁
- **毛玻璃效果**：`.glass` 基础类（@layer components），`bg-glass + backdrop-blur-[20px] + border-glass-border`
- **数据**：名字列表、联系方式、项目链接统一放在 `src/data/site.ts`
- **响应式断点**：移动端基础样式 + `min-[481px]` + `md:`（768px+）
- **边缘函数**：`functions/api/` 下为 Cloudflare Pages Functions（`wallpaper.js` 当日元数据代理、`wallpaper-image/[[path]].js` 图片本体流式代理），随 Git 集成构建自动部署；只用标准 Web API（Request/Response/fetch），不引 Node 依赖

## 编辑注意事项

- 所有颜色值定义在 `src/index.css` 的 `:root` / `.dark` 变量中，改色需同步两套
- 图标为内联 SVG 组件（`src/components/icons.tsx`，body 取自 material-symbols / fa7-brands / carbon / streamline 四个 Iconify 集合），新增图标时向该文件添加组件
- 静态文件（favicon-32.png / apple-touch-icon.png / avatar.webp / wallpaper.json / wallpaper.jpg / robots.txt / sitemap.xml / _headers）放在 `public/`，构建时自动复制到 `dist/`；`wallpaper.json` 与壁纸图本体 `wallpaper.jpg` 由 `scripts/fetch-wallpaper.mjs` 在构建时从 Bing 官方 API 抓取生成（图片下载到本地，作为首屏快照与兜底）；运行时每日新鲜度走 `functions/` 边缘代理（`/api/wallpaper` + `/api/wallpaper-image/<id>`），前端绝不直连 bing.com
- 新增组件时保持无未使用变量/参数（tsconfig strict）
