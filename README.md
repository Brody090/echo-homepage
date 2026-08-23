# Echo's Homepage

[![License](https://img.shields.io/github/license/Brody090/echo-homepage)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-✓-f38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

Echo 的个人主页 — 基于 **React 19 + TypeScript + Tailwind CSS v4** 构建，Apple 毛玻璃风格，支持三态主题切换与 Bing 每日壁纸，构建为静态站点并部署于 Cloudflare Pages。

## ✨ 特性

- **Bing 每日壁纸（构建时注入）** — 构建阶段从 Bing 官方 API 抓取当日壁纸并把图片本体下载到本地 `wallpaper.jpg`（`wallpaper.json` 记录日期/版权），运行时完全同源加载、零第三方请求，加载失败自动回退 `localStorage` 当日缓存或纯底色
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
   │  ├─ useWallpaper.ts      # 读取同源壁纸 JSON + 本地缓存兜底
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

### 壁纸管线（构建时注入）

壁纸不在运行时请求第三方 API，而是在构建时抓取：

1. `scripts/fetch-wallpaper.mjs` 从 Bing 官方 `HPImageArchive` 接口抓取当日 1920×1080 壁纸，把图片本体下载到 `public/wallpaper.jpg`（原子写入），并把日期/版权写入 `public/wallpaper.json`（`url` 指向同源 `/wallpaper.jpg`）；
2. `vite.config.ts` 的 `wallpaperPreload` 插件读取该 JSON，把壁纸 URL 注入 `index.html` 的 `<link rel="preload" as="image" fetchpriority="low">`；
3. 运行时 `useWallpaper` 只需 `fetch('/wallpaper.json')`，壁纸图随 HTML 解析阶段同源并行下载，任何网络环境都不受第三方域名可用性影响。

> 官方 API 无 CORS 头，浏览器直接 `fetch` 会被拦截；且把运行时对 `www.bing.com` 图片 CDN 的跨域依赖搬到构建机，既消除了 11.6s 级串行 API 等待，也避免了部分网络环境下第三方图被拦截导致壁纸不显示的问题。抓取或下载失败时保留已有 `wallpaper.json` / `wallpaper.jpg`，构建不中断；从未成功过则页面回退首屏纯底色。

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

### Cloudflare Pages（Wrangler CLI）

```bash
npx wrangler pages deploy dist/
```

> 壁纸为「构建时抓取」，想保持每日新鲜可让部署平台（Cloudflare Pages / GitHub Actions）每日定时触发一次构建。

## 📄 License

[MIT](LICENSE) © Echo (LoveEcho)
