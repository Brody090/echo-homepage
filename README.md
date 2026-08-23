# Echo's Homepage

[![License](https://img.shields.io/github/license/Brody090/echo-homepage)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-✓-f38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

Echo 的个人主页 — 基于 **React 19 + TypeScript + Tailwind CSS v4** 构建，Apple 毛玻璃风格，支持三态主题切换与 Bing 每日壁纸，构建为静态站点并部署于 Cloudflare Pages。

## ✨ 特性

- **Bing 每日壁纸（快照兜底 + 边缘每日刷新）** — 构建阶段从 Bing 官方 API 抓取当日壁纸并下载图片本体到本地 `wallpaper.jpg`（`wallpaper.json` 记录日期/版权）作为首屏快照与兜底；运行时后台经 Cloudflare Pages Functions 边缘代理（`/api/wallpaper`）拿当日新图，日期更新时自动换图。所有第三方请求均走本站 functions，前端零直连第三方
- **LCP 关键路径优化** — 壁纸 URL 在构建时注入 `index.html` 的 `<link rel="preload">`，配合头像高优先级预加载与 `preconnect` / `dns-prefetch` 资源提示，壁纸随 HTML 并行下载
- **打字机效果** — `useTypewriter` 逐字打印名字（Echo / LoveEcho / 菠萝）并循环轮换
- **共享头像过渡** — `SharedAvatar` 以 fixed 定位，随滚动进度在首屏与第二屏占位之间平滑插值移动
- **Apple 毛玻璃风格** — `.glass` 组件类：`backdrop-blur-[20px]` + 半透明背景
- **三态主题切换** — 自动 / 暗黑 / 明亮，CSS 变量双层定义，`localStorage` 持久化，预载脚本防闪烁
- **完整 SEO** — Open Graph / Twitter Card / JSON-LD 结构化数据（Person + WebSite）、sitemap.xml、robots.txt
- **安全响应头与缓存策略** — `_headers` 配置 X-Frame-Options、X-Content-Type-Options、Referrer-Policy 及分资源缓存策略
- **响应式适配** — 移动端优先，断点 `min-[481px]` / `md:`（768px+）

## 🛠 技术栈

| 分类   | 技术                                          | 版本       |
| ------ | --------------------------------------------- | ---------- |
| 框架   | React / React DOM                             | ^19.2.8    |
| 语言   | TypeScript                                    | ^7.0.2     |
| 样式   | Tailwind CSS                                  | ^4.3.3     |
| 构建   | Vite                                          | ^8.2.0     |
| 图标   | 内联 SVG（`src/components/icons.tsx`）        | —          |
| 部署   | Cloudflare Pages                              | 静态站点   |

## 📁 项目结构

```text
.
├─ index.html                 # HTML 入口：SEO meta + 资源提示 + 防闪烁主题脚本
├─ vite.config.ts             # Vite 配置：wallpaperPreload 插件（壁纸 preload 注入）
├─ tsconfig.json
├─ functions/                 # Cloudflare Pages Functions（随 Git 集成构建自动部署）
│  └─ api/
│     ├─ wallpaper.js         # GET /api/wallpaper：当日壁纸元数据（边缘代取 Bing，短缓存）
│     └─ wallpaper-image/
│        └─ [[path]].js       # GET /api/wallpaper-image/<id>：图片本体流式代理（内容寻址，immutable）
├─ public/                    # 静态资源（构建时复制到 dist/）
│  ├─ favicon-32.png          # 站点图标（32×32）
│  ├─ apple-touch-icon.png    # Apple 触屏图标（180×180）
│  ├─ avatar.webp             # 头像（本地化 260×260 webp）
│  ├─ wallpaper.json          # 构建时注入的当日壁纸信息（scripts/fetch-wallpaper.mjs 生成）
│  ├─ wallpaper.jpg           # 构建时下载到本地的壁纸图本体（同源加载）
│  ├─ robots.txt              # 爬虫规则 + sitemap 引用
│  ├─ sitemap.xml             # 站点地图
│  └─ _headers                # Cloudflare Pages 安全响应头 + 缓存策略
├─ scripts/
│  └─ fetch-wallpaper.mjs     # 构建时从 Bing 官方 API 抓取当日壁纸
└─ src/
   ├─ main.tsx                # React 入口
   ├─ App.tsx                 # 组装两屏与共享头像
   ├─ index.css               # Tailwind v4 主题令牌 + 毛玻璃基础类
   ├─ vite-env.d.ts           # Vite 客户端类型声明
   ├─ data/
   │  └─ site.ts              # 名字、联系方式、项目链接等常量
   ├─ hooks/
   │  ├─ useTheme.ts          # 三态主题（auto/dark/light）+ localStorage 持久化
   │  ├─ useTypewriter.ts     # 打字机效果（逐字打印/删除循环）
   │  ├─ useWallpaper.ts      # 三段式壁纸：缓存 → 快照 → api 每日刷新（日期比较 + 探针预加载）
   │  └─ useScrollProgress.ts # rAF 节流的滚动进度（0-1）
   └─ components/
      ├─ FirstScreen.tsx      # 首屏：壁纸 + 打字机名字 + 介绍卡片
      ├─ SecondScreen.tsx     # 第二屏：联系方式 + 项目链接
      ├─ SharedAvatar.tsx     # fixed 定位的共享头像（滚动插值过渡）
      ├─ ThemeToggle.tsx      # 毛玻璃主题切换按钮
      ├─ Typewriter.tsx       # 打字机文字渲染 + 闪烁光标
      ├─ Wallpaper.tsx        # 全屏壁纸图片（加载淡入）
      ├─ DescriptionCard.tsx  # 个人介绍毛玻璃卡片
      ├─ LinkCard.tsx         # 链接卡片（row 联系人 / list 项目）
      ├─ SectionTitle.tsx     # 带图标的章节标题
      └─ icons.tsx            # 内联 SVG 图标组件
```

## ⚙️ 关键实现

### 壁纸管线（快照兜底 + 边缘每日刷新）

壁纸分两层：构建时快照负责「快」（首屏 preload 即热图，也是最终兜底），Cloudflare Pages Functions 负责「新」（运行时每日更换）：

1. `scripts/fetch-wallpaper.mjs` 从 Bing 官方 `HPImageArchive` 接口抓取当日 1920×1080 壁纸，把图片本体下载到 `public/wallpaper.jpg`（原子写入），并把日期/版权写入 `public/wallpaper.json`（`url` 指向同源 `/wallpaper.jpg`）；
2. `vite.config.ts` 的 `wallpaperPreload` 插件读取该 JSON，把壁纸 URL 注入 `index.html` 的 `<link rel="preload" as="image" fetchpriority="low">`；
3. 运行时 `useWallpaper` 先同步读 `localStorage` 缓存、再 `fetch('/wallpaper.json')`，壁纸图随 HTML 解析阶段同源并行下载，任何网络环境都不受第三方域名可用性影响（快照失败则用缓存兜底，与历史行为一致）；
4. 渲染后后台请求 `/api/wallpaper`（`functions/api/wallpaper.js` 边缘代取 Bing，服务端 fetch 不受 CORS 约束），返回与快照同构的 `{date,url,copyright}`；仅当 `date` 严格更新时，探针预加载 `/api/wallpaper-image/<id>` 成功后才换图（图片本体由 `functions/api/wallpaper-image/[[path]].js` 流式代理，最终同源加载）；标签页从后台回前台时重查。本地 dev / preview 无 functions 环境时该请求 404，静默降级到快照。

> 官方 API 无 CORS 头，浏览器直接 `fetch` 会被拦截——因此运行时的新鲜度与图片都必须经本站 functions 代理，前端绝不直连 `bing.com`。JSON 缓存 `s-maxage=1800`（边缘 30 分钟内收敛到新日期）+ 图片 URL 内容寻址（每日不同 → `immutable` 缓存一年），回源量 ≈ 每 PoP 每 30 分钟 1 次，远低于免费额度；错误响应一律 `no-store`。抓取或下载失败时保留已有 `wallpaper.json` / `wallpaper.jpg`，构建不中断；从未成功过则页面回退首屏纯底色。更改壁纸市场（`mkt`）需同步改 `functions/api/wallpaper.js` 与 `scripts/fetch-wallpaper.mjs` 两处常量。

### 主题系统

- CSS 变量两层：`:root`（明亮）/ `.dark`（暗黑），Tailwind `@theme inline` 将语义色映射到变量；
- 用户三态选择（`auto` / `dark` / `light`）持久化于 `localStorage['echo-homepage-theme']`，`useTheme` 计算生效主题并同步 `<html>` 上的 `.dark` class；
- `index.html` 内置同步预载脚本，在首屏渲染前完成主题切换，避免暗黑模式闪烁。

### 共享头像过渡

`SharedAvatar` 为 fixed 定位的单 `<img>`，`useEffect` 中通过 `getBoundingClientRect()` 在首屏占位（`originRef`）与第二屏占位（`targetRef`）之间按滚动进度线性插值定位。

## 🚀 本地开发

```bash
npm install
npm run dev        # 开发服务器（HMR）
npm run wallpaper  # 手动抓取当日 Bing 壁纸（写入 public/wallpaper.json + wallpaper.jpg）
npm run build      # tsc 类型检查 + 抓取壁纸 + Vite 构建，输出 dist/
npm run preview    # 本地预览构建产物
```

## 📦 部署

静态构建产物，输出目录为 `dist/`。

### Cloudflare Pages（Git 集成）

在 Cloudflare Dashboard 中连接仓库，配置：

- **构建命令**：`npm run build`
- **输出目录**：`dist`

`functions/` 目录随 Git 集成构建**自动部署**（Pages Functions 按文件路径自动路由 `/api/*`），无需任何额外配置；`_headers` 不作用于 Functions 响应，缓存与安全头由函数自身设置。

本地验证 Functions：

```bash
npm run build && npx wrangler pages dev dist --compatibility-date=2026-06-10   # 然后 curl localhost:8788/api/wallpaper
```

（旧版 wrangler 内置 workerd 支持的兼容日期可能落后于当天，未指定时本地启动会报 `requires compatibility date`——加 `--compatibility-date` 固定到其支持范围即可，本项目只用标准 Web API，与日期无关；线上 Pages 由平台管理兼容日期，无需此参数。`vite dev` / `vite preview` 下无 Functions 运行时，`/api/wallpaper` 会 404 或被 SPA fallback 返回 index.html，前端 JSON 解析失败后静默降级，页面照常显示快照壁纸。）

### Cloudflare Pages（Wrangler CLI）

```bash
npx wrangler pages deploy dist/    # 自动带上项目根的 functions/ 目录
```

> 壁纸快照为「构建时抓取」，想让它也保持每日新鲜（可选，锦上添花）：在 Cloudflare Dashboard 的 Pages 项目下创建 Deploy Hook，把 hook URL 存为仓库 secret `CF_DEPLOY_HOOK`，`.github/workflows/daily-wallpaper.yml` 会每日（北京时间 00:30）触发一次重建；也可手动在 Actions 页触发 `workflow_dispatch`。

## 📄 License

[MIT](LICENSE) © Echo (LoveEcho)
