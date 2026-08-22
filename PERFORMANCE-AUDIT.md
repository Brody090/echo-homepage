# AboutMe 加载性能现状审计报告

> 审计日期：2026-08-22 · 审计对象：`E:\Project\AboutMe`（React 19 + Vite 8 + Tailwind v4，Cloudflare Pages 部署）
> 基线构建：`npm run build`（tsc --noEmit + vite build，1.90s，31 modules）
> 本文档只做审计，未修改任何源代码。

---

## 0. 结论速览（TL;DR）

按「对加载速度的伤害」排序的五个最大问题：

| # | 问题 | 实测数据 | 影响 |
|---|------|---------|------|
| 1 | 壁纸链路依赖第三方慢代理 `bing.biturl.top` | API 请求 **11.6s**（345B JSON）；壁纸图为 UHD **2.65MB** | LCP 主杀手：壁纸要等 JS 执行 → API 返回 → 2.65MB 下载 |
| 2 | `logo.png` **707KB**（1254×1254 RGB PNG）当 favicon 用 | 线上实测同一文件 707KB | 首访白白下载 ~690KB；favicon 请求缓慢 |
| 3 | `_headers` 无任何缓存规则 | 线上实测自己资源的响应头 `Cache-Control: public, max-age=0, must-revalidate` | **每次访问**全部资源都要 revalidate（含 707KB logo、JS、CSS） |
| 4 | 无 preconnect / preload / fetchpriority | index.html 无任何资源提示 | 头像（115KB）、壁纸、图标全部串行晚启动 |
| 5 | `@iconify/react` 运行时从 api.iconify.design 拉 10 个图标 | 4 个集合请求（0.6~6s/个）+ 图标 pop-in 造成 CLS + bundle 多 ~15-17KB | 次屏图标延迟 + 布局抖动 + 第三方单点 |

**另：线上站点（010912.top）仍是旧版原生 JS 构建**（未哈希的 `style.css`/`script.js` + `code.iconify.design` web component）。本仓库的 React 新版尚未部署——任何优化都必须部署后才对用户生效。

基线包体：JS **218.4KB**（gzip 70.6 / brotli 60.2）、CSS **20.8KB**（gzip 4.9）、HTML **3.9KB**（gzip 1.5）、logo **707KB**（不可压缩）。运行时第三方流量：壁纸 API + 2.65MB 壁纸图 + 115KB 头像 + 4 个图标请求。

---

## 1. 产物大小清单（优化前基线）

`npm run build` 后 `dist/` 全量清单（原始 / gzip(zlib, level 9) / brotli 实测）：

| 文件 | 原始 | gzip | brotli | 说明 |
|------|------|------|--------|------|
| `assets/index-DSxJFIP3.js` | 218,395 B (218.4 KB) | 69,680 B (70.6 KB*) | 60,201 B | React 19 + react-dom + iconify 客户端 + 应用代码 |
| `assets/index-DPuu1XS6.css` | 20,842 B (20.8 KB) | 4,893 B | 4,252 B | Tailwind v4 已 purge，属正常水平 |
| `index.html` | 3,901 B | 1,523 B | 1,083 B | 含内联主题脚本与 JSON-LD |
| `logo.png` | **707,274 B (707 KB)** | 694,145 B | 692,857 B | 1254×1254、8bit RGB（无 alpha），PNG 本身已压缩，gzip 无收益 |
| `sitemap.xml` | 261 B | 198 B | 150 B | |
| `robots.txt` | 63 B | 79 B | 67 B | |
| `_headers` | 142 B | 133 B | 99 B | 仅安全头，无缓存规则（见 §4） |

\* vite 自报 gzip 70.59KB（计算方式略异），与 zlib 实测 69.68KB 基本一致。

**首访传输合计（brotli 计）**：≈ 1.1 + 4.3 + 60.2 + 692.9 ≈ **758KB**，再加上运行时第三方：壁纸 API 345B + 壁纸图 **2.65MB**（UHD）+ 头像 **115KB** + Iconify 4 个请求（~3-5KB）≈ **3.5MB 首访**。

**优化后目标（预估）**：logo ≤20KB（多尺寸拆分）、壁纸图改 1920×1080 后 ≈300-600KB 且随首帧即加载、头像压缩至 ~15KB、bundle 减 15-17KB raw。首访传输可降至 ~800KB 级别，且渲染链路上的串行等待从「JS→API(11.6s)→2.65MB」变为「HTML→直接加载」。

**JS bundle 构成估算**：react-dom-client 生产包 536KB raw（压缩后约 175KB）、react 17KB raw、iconify 客户端段 ≈ **15-17KB raw（~5KB gzip，实测 bundle 中 200,857→210,646 区段）**、应用代码 <5KB。最大的 JS 减肥手段是换 Preact（可省 ~35KB gzip），但重构成本高、收益对本静态站有限，列为低优先（§6-P2）。

---

## 2. 关键渲染路径（index.html / dist/index.html）

构建后的渲染链：

```
HTML(3.9KB, 含内联主题脚本) → CSS(20.8KB, <head> link, 阻塞首绘)
  → JS(218KB, <script type=module>, defer 不阻塞解析但整站内容由 React 渲染)
  → React mount → fetch(bing.biturl.top, 实测 11.6s) → setState
  → <img src=www.bing.com UHD 2.65MB> → 渐显(fade-in 800ms)
```

- **阻塞资源**：仅 CSS 阻塞首绘（4.9KB gzip，尚可）；JS 为 defer module 不阻塞 HTML 解析，但首屏文字/头像/壁纸全部依赖它执行。
- **内联主题脚本**（index.html:74-83）：同步设置 `.dark` class 防 FOUC，做法正确，保留。
- **缺失项**：无 `<link rel="preconnect">`、无 `<link rel="preload">`、无 `fetchpriority`/`loading`/`decoding` 属性、壁纸/头像无尺寸占位（好在定位为 absolute/fixed + 占位 div 有尺寸，CLS 可控）。
- **LCP 链现状**：LCP 候选是 h1 打字机文字（JS 执行后即出现）与全屏壁纸图（晚得多但尺寸最大，出现时计为最大内容绘制）。壁纸的串行链：JS 执行 → API 11.6s → 2.65MB 下载 → 解码，**LCP 极可能被壁纸图拖到 5-15s+**（本机实测 API 单项就 11.6s）。
- **修复后 LCP 链**（构建时注入壁纸 URL，§6-1）：HTML → CSS → 壁纸 `<img>`（预连接 www.bing.com，1920×1080 约 300-600KB）→ LCP ≈ 图片下载时间 1-3s，或 h1 文字 <1s。

---

## 3. 外部网络请求盘点

源码与 index.html 中的全部外部请求（grep `src/` + `index.html` 确认）：

| 域名 | 用途 | 实测延迟 | 大小 | 风险评估 |
|------|------|---------|------|---------|
| `bing.biturl.top` | 壁纸 JSON API（`src/hooks/useWallpaper.ts:3`） | **GET 11.6s** | 345B | **高危**：第三方个人代理、官方 API 无 CORS 的替代品、HEAD 不支持、单点故障、每次挂载都请求 |
| `www.bing.com`（`th?id=...`） | 壁纸图片本体 | HEAD 0.23s | **2,657,049B (2.65MB, UHD)** | 响应带 `Cache-Control: max-age=691200`（8 天），可缓存；UHD 分辨率过大 |
| `www.bing.com` HPImageArchive | 官方壁纸 API（替代方案） | 0.28s | 856B | **响应无 `Access-Control-Allow-Origin`，浏览器 fetch 会被 CORS 拦截**；`format=js` 是裸 JSON 非 JSONP，script 标签不可用。→ 只能在构建机/服务端调用（§6-1） |
| `img.010912.top` | 头像 webp（`src/data/site.ts:7`） | HEAD 2.97s（一次因 TLS 撤销链超时 15.4s） | **117,938B (115KB)** | 自建图床；115KB 对 80-130px 展示尺寸过大；无尺寸/优先级控制 |
| `api.iconify.design` | Iconify 图标（4 个集合：material-symbols / fa7-brands / carbon / streamline，共 10 个图标） | 0.59-5.97s | ~914B/请求 | 每次访问 4 个第三方请求；图标到达前无占位 → pop-in CLS；v6 客户端还内置 unisvg 等回退域 |
| `code.iconify.design` | ⚠️ 仅线上**旧版**页面：iconify-icon.min.js 阻塞 head 脚本 | 1.5s | — | 新版 React 构建无此项，部署新版即消除 |
| `github.com` / `t.me` | JSON-LD sameAs 与链接（点击才用） | — | — | 无需 preconnect |

**实测注意**：以上延迟来自 Windows + curl（schannel 撤销检查会显著放大 TLS 握手时间，本机出现过 15.4s 撤销失败）；浏览器实际更快，但**相对差异有效**（bing.biturl.top 11.6s vs 官方 API 0.28s 是服务端差异）。

---

## 4. public/ 文件完备性

- **`public/_headers`**：只有 4 条安全头（X-Frame-Options / nosniff / Referrer-Policy / X-Robots-Tag），**无任何 Cache-Control 规则**。Cloudflare Pages 对未声明缓存的资源默认 `Cache-Control: public, max-age=0, must-revalidate`——已在线上实测证实（`www.010912.top/style.css` 响应头）。后果：每次访问所有资源（含 707KB logo）都要带 ETag 往返验证。→ 必须补缓存规则（§6-3）。
- **`public/robots.txt`**：完备（Allow / + Sitemap 指向）。
- **`public/sitemap.xml`**：完备；`lastmod` 为 2026-07-15，部署时可顺手更新（非性能项）。

---

## 5. LCP 与 CLS 评估

**LCP**：见 §2——现状 LCP 由「文字（JS 执行后）」或「壁纸图（API+2.65MB 之后）」竞争，壁纸图胜出时 LCP 极差。头像（fixed，无尺寸属性但定位与类尺寸固定）不影响布局，但它是第二 LCP 候选图。

**CLS**：
- 首屏低风险：头像 fixed + 两侧占位 div 尺寸固定；壁纸 absolute 铺满；系统字体栈无 FOIT；打字机 h1 有 `min-h` 防护；主题脚本防 FOUC。做得不错。
- 主要 CLS 源：**Iconify 图标 pop-in**——数据到达前渲染为空（无宽度），到达后插入，SecondScreen 的联系卡片/项目列表会整体跳动。
- 次要：`useScrollProgress` 驱动的 SharedAvatar 用 React state 每帧改 `left/top`（触发 layout，`will-change` 只提升合成层不能消除 layout），且 useEffect 每帧重复 `getBoundingClientRect()` 两个占位；建议改 transform + rect 缓存（运行时流畅度，非加载项，P2）。

---

## 6. 优化建议清单（按「收益/成本」排序）

### P0 — 高收益 / 低成本（强烈建议全部做）

**1. 壁纸改为「构建时注入 + 官方 Bing API + 本地缓存兜底」**
- 改哪里：新增 `scripts/fetch-wallpaper.mjs`（Node 脚本，构建机 fetch `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN`，官方、无 CORS 限制、实测 0.28s），输出 `public/wallpaper.json`（含 `url`(1920×1080 版，非 UHD)、`copyright`）；`src/hooks/useWallpaper.ts` 改为「读 `/wallpaper.json` → 立即渲染 → localStorage 按日期缓存 → 可选后台经 biturl 刷新」；`package.json` build 脚本前加 `node scripts/fetch-wallpaper.mjs`。若想保持每日新鲜，可配 GitHub Action / CF Pages 每日重建。
- 预期收益：消除 11.6s 串行 API 等待与第三方单点；壁纸图随首帧即开始加载（LCP 从 5-15s 级降到 1-3s 级）；UHD 2.65MB → 1920×1080 约 300-600KB。**这是本清单收益最大的一项。**
- 成本：低（~30 行脚本 + hook 改造）。
- 备选（若坚持运行时取图）：至少改 `resolution=1920x1080` 并加 localStorage 日期 TTL 缓存（每访必拉 → 每日一次）。

**2. logo.png 拆分压缩（707KB → ≤20KB）**
- 改哪里：`public/logo.png` 替换为多尺寸产物（favicon 32/48、apple-touch-icon 180、可选 512 for manifest），`index.html:62/69` 的 `<link rel="icon">` / `<link rel="apple-touch-icon">` 指向对应尺寸；保留一份 `logo-512.png` 给 og:image 场景。
- 预期收益：首访省 ~690KB；favicon/触屏图标即时呈现。
- 成本：极低（一次图片导出即可，`dist/logo.png` 随构建自动更新）。

**3. `public/_headers` 补缓存规则**
- 改哪里：`public/_headers` 追加：
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  /logo*.png
    Cache-Control: public, max-age=86400
  /index.html
    Cache-Control: no-cache
  ```
  （Vite 产物带内容哈希，immutable 安全；其他文件保守 86400 即可，sitemap/robots 给 `public, max-age=86400`。）
- 预期收益：回访从「全部资源 revalidate（现状，实测证实）」变为 0 请求/本地命中，回访速度质的提升。
- 成本：极低。

**4. index.html 加 preconnect / preload / fetchpriority**
- 改哪里：`index.html` `<head>`：
  ```html
  <link rel="preconnect" href="https://img.010912.top" crossorigin>
  <link rel="preconnect" href="https://www.bing.com" crossorigin>
  <link rel="preload" as="image" href="https://img.010912.top/file/网站相关/1784033194646_Github头像.webp" fetchpriority="high">
  ```
- 预期收益：头像在 HTML 阶段即并行下载（提前 1-3s，成为可靠 LCP 候选）；省一次 TLS 握手；壁纸图域预连接配合 §6-1 收益叠加。
- 成本：极低。注意 `crossorigin` 必须与实际请求的 CORS 模式一致（img 标签不带 crossOrigin 属性时 preconnect 可不加 crossorigin——按 §6-7 的统一原则处理）。

### P1 — 中收益 / 低成本（建议做）

**5. Iconify → 内联 SVG（专题评估见 §7.1）**
- 改哪里：新增 `src/components/icons.tsx` 集中 10 个 SVG 组件（sunny / dark-mode / computer / mail-rounded / telegram / blogger-b / stacked-email-outline-rounded / interface-time-rewind… / android-contacts / ibm-cloud-projects）；替换 `LinkCard.tsx`、`SectionTitle.tsx`、`ThemeToggle.tsx` 中的 `<Icon>`；从 package.json 移除 `@iconify/react`。
- 预期收益：消除 4 个第三方运行时请求与图标 pop-in CLS；bundle -15~17KB raw（~5KB gzip）；为将来加 CSP 铺路。
- 成本：中低（一次性提取 SVG path，图标名与 Iconify 集一一对应，语义不变）。

**6. 头像压缩与优先级**
- 改哪里：向 `img.010912.top` 上传 260×260（130px@2x）webp 版本（115KB → 预计 10-20KB），`src/data/site.ts` 的 `AVATAR_URL` 指向新版；`SharedAvatar.tsx` 的 `<img>` 加 `decoding="async"`（fetchpriority 由 §6-4 的 preload 承担）。
- 预期收益：头像传输 -100KB，展示延迟大幅下降。
- 成本：低（一次图片重导出+上传）。

**7. Wallpaper 渐显语义修正**
- 改哪里：`Wallpaper.tsx` / `useWallpaper.ts`——`loaded` 应在 `<img onLoad>` 时置 true，而不是 JSON resolve 时（现状：图还在下载就 opacity 100%，800ms 渐显在图片到达前就结束了，出现「先空白后闪出」）。
- 预期收益：视觉正确 + LCP 信号更早稳定。
- 成本：极低。顺带给 Wallpaper img 加 `decoding="async"`。

### P2 — 低收益或高成本（按需）

- **apex→www 跳转**（部署层）：实测 `010912.top/` 301 到 `www.010912.top/`，首访多一跳；若 CF Pages 配置允许 apex 直出可省一个 RTT。
- **SharedAvatar 运行时优化**：rect 只在 mount/resize 时测一次；`left/top` 改 `transform: translate3d`；或 progress 用 rAF 直接改 style 绕过 React 重渲染。运行时滚动流畅度提升。
- **Preact 替换 react-dom**：可省 ~35KB gzip，但对单页静态站收益/成本比差，不建议现在做。
- **CSP / HSTS / Permissions-Policy**：安全加固（非性能），可在 Iconify 去除后加 CSP。
- **sitemap lastmod**：部署时更新为当天。

---

## 7. 专题评估

### 7.1 Iconify 运行时图标请求能否去掉？——**能，且强烈建议去掉**
- 全站仅 10 个图标、4 个图标集，全部静态已知（site.ts 与各组件中硬编码），无动态图标名场景，不存在「必须运行时拉取」的理由。
- 现状成本：bundle +15~17KB raw；每次访问 4 个第三方 API 请求（实测 0.6~6s，含冷 TLS 更慢）；图标到达前无占位 → pop-in CLS；api.iconify.design 单点。
- 去除方式：`src/components/icons.tsx` 集中内联 SVG 组件（从 Iconify 站点下载这 10 个图标的 SVG body，属性对齐 `currentColor` + `1em` 尺寸），替换 3 个消费组件，删除 `@iconify/react` 依赖。UI 零变化，请求数 -4，CLS 源消除，bundle 减小，离线可渲染。

### 7.2 头像图与壁纸图的加载优先级
- **头像**（小、位置固定、情感核心）：最高优先级——`<link rel="preload" as="image">` + `fetchpriority="high"`，让它在 HTML 阶段与 CSS/JS 并行下载；压缩至 ≤20KB。
- **壁纸**（大、背景、可渐进）：走「构建时注入 URL」后随首帧加载，`fetchpriority="low"` + `decoding="async"`，把网络预算让给头像与文字；不要再用 UHD（2.65MB），1920×1080 足够覆盖 4K 以下屏幕做背景。
- 顺序应为：文字/CSS > 头像 > 壁纸，而不是现在的「壁纸串行拖垮一切」。

### 7.3 preconnect 该加哪些域名
- **必加**：`https://img.010912.top`（头像，每访必拉）；`https://www.bing.com`（壁纸图本体，每访必拉；若 §6-1 落地则必须）。
- **若保留运行时壁纸 API**：加 `https://bing.biturl.top`（但这只是给 11.6s 的慢代理省 TLS，治标不治本）。
- **若保留 Iconify**：加 `https://api.iconify.design`（按 §7.1 去除后无需）。
- **不加**：`github.com` / `t.me` / `010912.top` 子域（点击后才用，可加 `dns-prefetch` 作为廉价保险）。
- 原则：preconnect 只给「首屏必然请求的第三方源」，且 `crossorigin` 属性要与目标资源的 CORS 模式一致；其余用 `dns-prefetch`。

---

## 8. 测量方法与口径说明

- **构建**：`npm run build`（tsc --noEmit ✓ + vite build ✓，1.90s），产物清单见 §1。
- **压缩比**：gzip = zlib gzipSync(level 9)；brotli = zlib brotliCompressSync 默认参数，对 `dist/` 全部文件逐一实测。
- **网络测量**：curl.exe 实测（GET/HEAD、跟随重定向、--max-time 25-45s），含响应头捕获。延迟含本机 schannel 撤销检查开销，**浏览器实际会更快**；相对差异（同环境不同域对比）有效。
- **线上基线**：`https://010912.top/` → 301 → `https://www.010912.top/`（Cloudflare），**线上仍是旧版原生构建**（`style.css`/`script.js` 未哈希、`code.iconify.design/iconify-icon.min.js` 阻塞加载），本仓库 React 新版未部署；线上自资源实测 `max-age=0, must-revalidate`。
- **LCP/CLS**：代码级评估（无浏览器 Lighthouse 环境），结论基于渲染链与布局代码推演。

## 9. 附：关键实测记录

```
构建产物（dist/）：index.html 3901B | index-*.css 20842B | index-*.js 218395B | logo.png 707274B
线上文档：010912.top → www.010912.top 200, 7110B, 2.5~8.0s（旧版页面）
线上自资源响应头：Cache-Control: public, max-age=0, must-revalidate（style.css 实测）
bing.biturl.top GET：200, 345B, 11.626s  → 返回 UHD URL（2,657,049B）
www.bing.com th?id HEAD：200, 0.232s, Content-Length 2657049, Cache-Control max-age=691200
www.bing.com HPImageArchive(format=js)：200, 856B, 0.277s, application/json，无 ACAO 头（浏览器 fetch 不可用）
img.010912.top 头像 HEAD：200, 2.972s, 117938B（一次 CRYPT_E_REVOCATION_OFFLINE 15.4s）
api.iconify.design material-symbols.json?icons=...：200, 914B, 0.586s（冷连接 5.97s）
线上旧版 script.js：8.6KB | style.css：14.8KB | logo.png：707274B（与仓库一致）
logo.png 尺寸：1254×1254, 8bit, colorType 2(RGB 无 alpha)
bundle 内 iconify 代码段：200,857~210,646（≈15-17KB raw）
```
