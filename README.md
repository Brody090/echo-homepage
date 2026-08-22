# Echo's Homepage

[![License](https://img.shields.io/github/license/Brody090/echo-homepage)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-✓-f38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

🔗 **线上地址：[https://010912.top](https://010912.top)**

Echo 的个人主页 — 基于 **React 19 + TypeScript + Tailwind CSS v4** 构建，Apple 毛玻璃风格，支持三态主题切换，部署于 Cloudflare Pages。

## ✨ 特性

- **Bing 每日壁纸** — `useWallpaper` 自动获取当日 Bing 壁纸作为首屏背景，淡入过渡
- **打字机效果** — `useTypewriter` 逐字打印名字（Echo / LoveEcho / 菠萝）并循环轮换
- **共享头像过渡** — `SharedAvatar` 以 fixed 定位，随滚动进度在首屏与第二屏占位之间平滑插值移动
- **Apple 毛玻璃风格** — `.glass` 组件类：`backdrop-blur-[20px]` + 半透明背景
- **三态主题切换** — 自动 / 暗黑 / 明亮，CSS 变量双层定义，`localStorage` 持久化，预载脚本防闪烁
- **完整 SEO** — Open Graph / Twitter Card / JSON-LD 结构化数据（Person + WebSite）、sitemap.xml、robots.txt
- **安全响应头** — `_headers` 配置 X-Frame-Options、X-Content-Type-Options、Referrer-Policy 等
- **响应式适配** — 移动端优先，断点 `min-[481px]` / `md:`（768px+）

## 🛠 技术栈

|分类|技术|版本|
|------|------|------|
|框架|React|^19.2.8|
|语言|TypeScript|^7.0.2|
|样式|Tailwind CSS|^4.3.3|
|构建|Vite|^8.2.0|
|图标|内联 SVG（src/components/icons.tsx）|—|
|部署|Cloudflare Pages|静态站点|

## 📁 项目结构

```text
src/
├─ main.tsx               # React 入口
├─ App.tsx                # 组装两屏与共享头像
├─ index.css              # Tailwind v4 主题令牌 + 毛玻璃基础类
├─ vite-env.d.ts          # Vite 客户端类型声明
├─ data/
│  └─ site.ts             # 名字、联系方式、项目链接等常量
├─ hooks/
│  ├─ useTheme.ts         # 三态主题（auto/dark/light）+ localStorage 持久化
│  ├─ useTypewriter.ts    # 打字机效果（逐字打印/删除循环）
│  ├─ useWallpaper.ts     # 获取 Bing 每日壁纸
│  └─ useScrollProgress.ts # rAF 节流的滚动进度（0-1）
└─ components/
   ├─ FirstScreen.tsx     # 首屏：壁纸 + 打字机名字 + 介绍卡片
   ├─ SecondScreen.tsx    # 第二屏：联系方式 + 项目链接
   ├─ SharedAvatar.tsx    # fixed 定位的共享头像（滚动插值过渡）
   ├─ ThemeToggle.tsx     # 毛玻璃主题切换按钮
   ├─ Typewriter.tsx      # 打字机文字渲染 + 闪烁光标
   ├─ Wallpaper.tsx       # 全屏壁纸图片（加载淡入）
   ├─ DescriptionCard.tsx # 个人介绍毛玻璃卡片
   ├─ LinkCard.tsx        # 链接卡片（row 联系人 / list 项目）
   └─ SectionTitle.tsx    # 带图标的章节标题

public/                   # 静态资源（构建时复制到 dist/）
├─ favicon-32.png          # 站点图标（32×32）
├─ apple-touch-icon.png    # Apple 触屏图标（180×180）
├─ avatar.webp             # 头像（本地化 260×260 webp）
├─ wallpaper.json          # 构建时注入的当日壁纸（scripts/fetch-wallpaper.mjs 生成）
├─ robots.txt              # 爬虫规则 + sitemap 引用
├─ sitemap.xml             # 站点地图
└─ _headers                # Cloudflare Pages 安全响应头 + 缓存策略
```

## 🌐 域名

|域名|用途|
|------|------|
|[010912.top](https://010912.top)|主站|
|img.010912.top|图片 / 头像 CDN|
|[email.010912.top](https://email.010912.top)|临时邮箱|
|[newyear.010912.top](https://newyear.010912.top)|新年倒计时|

## 🚀 本地开发

```bash
npm install
npm run dev      # 开发服务器（HMR）
npm run build    # tsc 类型检查 + Vite 构建，输出 dist/
npm run preview  # 本地预览构建产物
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

Wrangler 配置见 [`wrangler.toml`](wrangler.toml)。

## 📄 License

[MIT](LICENSE) © Echo
