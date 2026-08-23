# ROUND2 统一验证与回归审查报告

- 任务：t4（统一验证与回归审查）attempt 2
- 作者：reviewer（审查员）
- 时间：2026-08-23
- 范围：t2（壁纸每日更换：边缘代理 + 每日刷新）与 t3（毛玻璃质感优化 + 第二屏重设计）
- 验收依据：`WALLPAPER-DAILY-DESIGN.md` §12 验证手册；t2/t3 任务输出

---

## 0. 结论摘要

| 类别 | 结果 |
|------|------|
| 构建 | ✅ `npm run build` 全绿（tsc strict + 壁纸抓取 + vite build，163ms） |
| t3 UI 变更 | ✅ 通过（1 处轻微缺陷已修复：LinkCard 悬停位移动画） |
| t2 壁纸链路 | ✅ 通过（**1 处关键缺陷已修复**：imageId 从 urlbase 提取被截断，详见 §2.1） |
| 动态冒烟 | ✅ functions 直载 / vite preview / wrangler pages dev 三路全绿 |
| 遗留风险 | ⚠️ 线上部署后验证（§6）；可选 Deploy Hook 需用户自建 |

**本次 reviewer 直接修改的文件**（均保持构建通过，改动最小化）：

1. `src/components/LinkCard.tsx` — transition 增加 `translate`（修复 hover 上浮/箭头位移不跟动画）。
2. `functions/api/wallpaper.js` — imageId 改为从 `img.url` 提取（urlbase 兜底），修复关键缺陷。
3. `README.md` — 本地验证 Functions 命令加 `--compatibility-date` 提示 + 修正 preview 降级描述。

---

## 1. 构建验证

```
npm run build = tsc --noEmit && node scripts/fetch-wallpaper.mjs && vite build
[wallpaper] unchanged: 2026-08-22   (快照已存在，幂等跳过)
vite v8.2.0 ✓ built in 163ms（终版）
dist/index.html                4.48 kB │ gzip: 1.81 kB
dist/assets/index-CwVMlE_q.css 26.68 kB │ gzip: 6.02 kB
dist/assets/index-Bm7c_Tmo.js 210.74 kB │ gzip: 67.80 kB
```

- tsc strict 全绿：无未使用变量/参数（人工复核 Reveal/LinkCard/SecondScreen 亦无死代码）。
- dist/ 不入库（gitignored），无基线可比；函数 `functions/` 不属于 vite 产物，随 Git 集成由 Pages 单独部署（README 已说明）。
- 构建前后多次执行均幂等（快照抓取失败时保留旧图，构建不中断——脚本行为复核 ✓）。
- `dist/index.html` 首屏 preload 注入回归 ✓：`<link rel="preload" as="image" href="/wallpaper.jpg" fetchpriority="low">`。

---

## 2. 壁纸链路（t2）核对

### 2.1 ⚠️ 关键缺陷：imageId 截断（已修复）

**现象**：`functions/api/wallpaper.js` 原实现从 Bing 响应的 `urlbase` 字段提取 imageId。实测 2026-08-22 Bing zh-CN 响应：

```
urlbase = "/th?id=OHR.EndofHeatY26_ZH-CN8936468848"                                  ← 无分辨率后缀
url     = "/th?id=OHR.EndofHeatY26_ZH-CN8936468848_1920x1080.jpg&rf=...&pid=hp"     ← 完整 id
```

- 按截断 id 请求上游 `www.bing.com/th?id=OHR.EndofHeatY26_ZH-CN8936468848` → **404**；
- 按完整 id 请求 → 200 image/jpeg（341,462 B）。

**影响**：生产环境 `/api/wallpaper` 返回的 `url` 指向必然 404 的图片端点 → 前端探针预加载永远失败 → 每日刷新整体失效（静默退化为快照），即"无法每日更换"问题在生产环境原样复现。本地 wrangler 冒烟本可暴露，但 t2 实施环境 shell 沙箱故障未实测。

**修复**（最小改动）：提取源改为 `img.url`（构建脚本 `fetch-wallpaper.mjs` 同款字段），`urlbase` 仅作兜底；白名单正则与一步校验不变。修复后直载实测：meta 200 完整 id → 图片 200 image/jpeg。

**教训**：Bing `urlbase` 字段格式并不可靠（历史上带 `&rf=` 与分辨率后缀，现可能裸截断），`url` 字段才是稳定完整形态。设计文档 §4.1 对 urlbase 格式的假设已过时。

### 2.2 函数实现审查

`functions/api/wallpaper.js`（GET /api/wallpaper）：

- ✅ 标准 Web API（fetch/Response/AbortController），无 Node 依赖；workerd 可用。
- ✅ 手动 `AbortController + setTimeout(12s)` 超时，未用 workerd 有已知 bug 的 `AbortSignal.timeout`。
- ✅ 成功：`{date,url,copyright}` 与快照同构；`Cache-Control: public, max-age=300, s-maxage=1800, stale-while-revalidate=3600` 逐字符合设计。
- ✅ 失败：502 + `no-store`；异常不污染缓存。
- ✅ `mkt=zh-CN` 与构建脚本一致；README 已注明改市场需两处同步（E10）。
- ⚠️ 轻微：502 响应体含 `err.message`（可能带 Bing URL 等内部细节）。信息面低风险，保留（便于排障）。

`functions/api/wallpaper-image/[[path]].js`（GET /api/wallpaper-image/<id>）：

- ✅ 路由偏离说明：设计文档写 `[imageId].js`，实际用 `[[path]].js` 通配捕获（fix-engineer 理由：单括号命名段非 Pages 文档化路由形态）。URL 契约 `/api/wallpaper-image/<id>` 与设计完全一致，`[[path]]` 是安全超集——多段/空段经 `join('/')` 后必含 `/` 或空串，被白名单正则拒绝。wrangler 实测路由成立，接受该偏离。
- ✅ 安全（防开放代理）：白名单 `^OHR\.[A-Za-z0-9_.\-]{1,160}$`，上游地址硬编码拼接 `https://www.bing.com/th?id=`，无 SSRF/任意代理面。非法输入 4 类实测（`../etc`、多段数组、完整 URL、空串）全部 404 + `no-store`；编码穿越 `%2e%2e%2fetc` 在 wrangler 实测 404。
- ✅ 图片：流式回传、Content-Type 透传（且校验 `image/*`）、`Cache-Control: public, max-age=31536000, immutable`、`X-Content-Type-Options: nosniff`（`_headers` 对 Functions 不生效，函数内显式设置 ✓）。
- ✅ 上游 404 时（含截断 id 场景）返回 404 + no-store——错误绝不进缓存。
- ✅ CORS：无需额外 CORS 头——前端请求与图片均同源（本站域名）。
- ✅ 内容寻址：每日不同 URL → immutable 安全；JSON 与图片的日期一致性由前端日期比较协调，无缓存回卷错配。

### 2.3 前端 `useWallpaper.ts` 核对

- ✅ 三段式与设计一致：① 同步读 `localStorage['echo-homepage-wallpaper']`（惰性 useState，0ms）→ ② `fetch('/wallpaper.json')` 快照（仅 `date` 严格更新才应用）→ ③ 后台 `fetch('/api/wallpaper')`，仅 `date` 严格更新时 `new Image()` 探针预加载成功后才换图并写缓存。
- ✅ 首屏路径零回归：快照逻辑保留；快照失败且无缓存时回退纯底色（历史行为）。
- ✅ 静默降级：阶段 ③ 404/502/JSON 解析失败 → catch 静默（`import.meta.env.DEV` 才有一条 warn）；生产零噪音。
- ✅ 防破图：探针 onload 成功才 `apply`；onerror 保持当前画面，`Wallpaper.tsx` 的 onError 不回退到纯色（设计 §5.2）。
- ✅ 日期比较：`YYYY-MM-DD` 字典序比较（`isNewer`），同日期不换图不重复下载（E7）。
- ✅ 跨夜标签页：`visibilitychange` → visible 时重查（E3）。
- ✅ 缓存兼容：沿用旧 key 与结构 `{date,url,copyright}`，readCache 容错损坏/隐私模式（E6）。
- ✅ 无前端直连 bing.com / biturl.top：grep 确认第三方请求仅 `/api/wallpaper`（走本站函数）。
- ✅ `cancelled` 守卫 + `dateRef` 镜像，无闭包旧值/卸载后 setState 问题。
- ⚠️ 观察：Bing 换图时刻（UTC 16:30 后）与 CDN 30 分钟收敛期间用户可能看昨日图——与设计 E2 一致，属可接受设计。

### 2.4 降级链实测（vite preview，无 Functions）

| 请求 | 期望 | 实测 |
|------|------|------|
| `/` | 200 | ✅ 200（4,489 B，preload 注入 ✓） |
| `/wallpaper.json` | 200 快照 | ✅ 200 application/json（176 B） |
| `/wallpaper.jpg` | 200 图片 | ✅ 200 image/jpeg（341,462 B） |
| `/api/wallpaper` | 404 或 SPA fallback | ✅ 200 text/html（SPA fallback 返回 index.html，**非 404**） |
| `/api/wallpaper-image/OHR.test` | 同上 | ✅ 200 text/html（SPA fallback） |

> 修正认知：vite preview 对未知路径做 SPA fallback（200 + index.html），并非 404。前端 `res.json()` 对 HTML 抛错 → catch 静默降级，行为等价（vite dev 下同样如此）。已同步修正 README 描述。

### 2.5 边界情况对照（设计 §10）

E1 dev/preview 无 functions → ✅ 静默降级（见 2.4）；E2 日期翻转 CDN 滞后 → ✅ 设计内收敛；E3 跨夜标签页 → ✅；E4 Bing 故障 → ✅ 502/404 no-store + 前端静默；E5 探针失败 → ✅ 保持当前画面；E6 localStorage 异常 → ✅ try/catch；E7 同日期 → ✅ 短路；E8 恶意 id → ✅ 白名单 404（4 类实测）；E9 多标签页 → ✅ 各自命中 CDN 缓存；E10 市场不一致 → ✅ README 注明。

---

## 3. 动态冒烟记录

### 3.1 functions 直载（宿主 Node 直接调用 onRequestGet，真实请求 Bing）

修复后结果：

```
meta   200  cc="public, max-age=300, s-maxage=1800, stale-while-revalidate=3600"
       date=2026-08-22  url=/api/wallpaper-image/OHR.EndofHeatY26_ZH-CN8936468848_1920x1080.jpg
image  200  image/jpeg  immutable  nosniff  341,462 B
非法 id（../etc | [a,b] | https://evil.com | ''）全部 404 + no-store
```

### 3.2 wrangler pages dev 集成（真实 Pages 路由层）

```
npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-10
/api/wallpaper        200  缓存头正确、date 当日、url 完整 id        ✅
<meta.url> 图片       200  image/jpeg + immutable + nosniff (341,462B) ✅
/api/wallpaper-image/%2e%2e%2fetc  404 no-store                      ✅
/api/wallpaper-image/OHR..x        404 no-store                      ✅
/                     200 静态站                                      ✅
/wallpaper.json       200 application/json                            ✅
```

> 环境说明：wrangler 4.98.0 内置 workerd 最高支持 compat date 2026-06-10，未指定时按当天(2026-08-23)启动报错 `requires compatibility date`——本地工具链问题，非代码问题；已写入 README 提示。

### 3.3 验证手册（§12）覆盖情况

- 12.1 本地：① 快照日期 ✓（2026-08-22）；② dev 页面 + api 降级 ✓（preview 实测等价路径）；③ Block URL 降级 ✓（代码路径同 2.4）；④ build + wrangler 双函数 ✓（3.2）；⑤ preview ✓（2.4）。
- 12.3 回归清单：preload 仍在 ✓；无网络回退纯色 ✓（快照失败逻辑未动）；主题/打字机/滚动进度未触碰 ✓（git diff 不含其文件）；build 全绿 ✓。

---

## 4. UI 回归（t3）核对

### 4.1 目视检查点（t3 输出 7 项）逐项核对

| # | 检查点 | 结果 | 证据 |
|---|--------|------|------|
| ① | 亮/暗卡片顶部 1px 高光边、saturate 更鲜活 | ✅ 代码+产物级 | `.glass::before` 渐变 ring + mask-composite 编译进产物；`:root/.dark` 双套 `--glass-highlight`(0.6/0.12) 与 `--glass-saturate`(180%/150%)；无 mask 支持时退化为顶部高光洗刷（无害） |
| ② | 头像落位后与「嗨，我是」胶囊间距自然 | ✅ 代码级 | targetRef 占位（80/100/130px 三档 + mb-4/5/10 = 16/20/40px）与 SharedAvatar 同尺寸；占位在 Reveal 之外，不受动画 transform 影响 |
| ③ | 分区依次错落淡入，reduced-motion 直接显示 | ✅ 代码级 | Reveal（IntersectionObserver threshold 0.15，delay 0/90/180/240ms，一次触发后 disconnect）；`prefers-reduced-motion` 双保险（JS matchMedia 立即 setVisible + CSS media query） |
| ④ | 项目卡悬停上浮+阴影加深+标签可见（移动端隐藏标签） | ✅ 已修复 | 阴影/背景 hover ✓；**上浮动画原不生效（Tailwind v4 `translate` 属性未被 transition 覆盖）——已修复**；标签 `max-[480px]:hidden` ✓ |
| ⑤ | 移动端模糊半径更小、文字清晰 | ✅ 产物级 | `@media (width<=480px){:root{--glass-blur:12px;--screen-blur:8px}}` 编译在后、两主题生效 |
| ⑥ | 页脚内容不足一屏时贴底 | ✅ 代码级 | 页脚 Reveal `mt-auto` 于 `min-h-screen flex-col` 容器 |
| ⑦ | 主题切换无闪白、光晕/分隔线跟随主题 | ✅ 代码级 | index.html 预载脚本未动；`--accent-glow`/`--divider` 双套定义，光晕与分隔线均 var() 引用 |

> 说明：①⑥⑦ 为代码/产物级验证（本环境无浏览器渲染通道）；② 的"间距自然"为几何推导。建议部署后人工目视复核一遍（5 分钟）。

### 4.2 重点回归

- **SharedAvatar 过渡链**：SharedAvatar.tsx 未改动（git diff 无此文件）；SecondScreen targetRef 占位 div 原样保留（尺寸三档 + mb 未动）；FirstScreen originRef 未动；插值逻辑原样。✅
- **亮/暗双套 CSS 变量**：:root 与 .dark 24 项逐一比对，键集合完全一致（新增 --glass-highlight/--glass-saturate/--glass-blur/--screen-blur/--accent-glow 双套齐全）；--shadow-sm/md/lg 修复为组合投影 stack（原为纯色导致 box-shadow 无效的历史 bug，现已生效）。✅
- **.glass 语义兼容**：类名与旧用法（DescriptionCard、首屏版权角标、LinkCard、SecondScreen 胶囊）全部兼容；ThemeToggle 仍用内联 utilities + 新增 inset 高光 shadow（产物编译验证）。✅
- **prefers-reduced-motion**：JS + CSS 双覆盖（见 4.1③）。✅
- **移动端 blur 降档**：480px 以下 20→12px（卡片）、16→8px（整屏）。✅
- **响应式三档**：移动端基础 + `min-[481px]` + `md:` 沿用；SectionTitle 移动端居中、分隔线 `max-[767px]:hidden`；联系卡移动端堆叠、md 并排。✅

### 4.3 t3 修改的缺陷（reviewer 修复记录）

**LinkCard 悬停位移动画失效**：Tailwind v4 将 `hover:-translate-y-1` / `group-hover:translate-x-1` 编译为 CSS `translate` 属性，而卡片 `transition-[transform,box-shadow,background]` 只声明 `transform` → 上浮与箭头位移瞬跳（阴影/背景却平滑 300ms）。修复：`transition-[translate,box-shadow,background]`（产物 CSS 验证根因）。图标徽章 `transition-transform` 在 v4 含 translate/scale/rotate，本就正常。

### 4.4 site.ts 事实核对

- 联系方式：`mailto:janemlewisa29@gmail.com`、`https://t.me/FastTalker_bot` ✅ 与事实清单逐字一致。
- 项目：`010912.top`（博客）、`email.010912.top`（临时邮箱）、`newyear.010912.top`（新年倒计时）✅ 链接/图标/标签与 git HEAD 完全一致（ui-designer 仅新增 description/tags 字段）。
- 实测站点：010912.top = 本站主页（title "Echo's Homepage"）；email.010912.top = "Temp Email"（description "即开即用的临时邮箱小工具" ✅）；newyear.010912.top 抓取失败（TLS/反爬），但 "跨年倒计时活动页，TypeScript 开发" 与 DescriptionCard 既有文案（"近期小项目：新年倒计时（TypeScript开发）"）一致 ✅。
- 结论：无事实性错误，未改文案。

---

## 5. README / 文档更新核对

- 特性、项目结构、壁纸管线 4 步、部署（functions 自动部署、wrangler 验证命令、Deploy Hook 可选）、mkt 同步注意——与实现一致 ✅。
- `README` 本地验证命令已由 reviewer 补 `--compatibility-date` 提示（见 §3.2 环境说明）。
- `.github/workflows/daily-wallpaper.yml`：方案 B1（Deploy Hook + curl），cron `30 16 * * *`（北京时间 00:30），`workflow_dispatch` 手动可触发 ✅。需用户自建 hook + secret（团队无法代办，README 已说明）。
- AGENTS.md / CLAUDE.md 已同步三段式与 functions 描述 ✅。

---

## 6. 遗留风险与部署后验证

1. **线上 Functions 生效验证（部署后必做，§12.2）**：
   - `curl -s https://010912.top/api/wallpaper | jq .` → date 当日、url 为 `/api/wallpaper-image/OHR..._1920x1080.jpg` 形态（**必须是带分辨率后缀的完整 id**，若又出现裸 id 说明修复未上线）；
   - `curl -sI https://010912.top/api/wallpaper` → `Cache-Control: public, max-age=300, s-maxage=1800, stale-while-revalidate=3600`；
   - `curl -sI <返回图片URL>` → 200 image/jpeg + immutable；
   - 负向：`%2e%2e%2fetc` → 404。
2. **Deploy Hook 每日快照刷新**：可选，需用户创建 hook 与 `CF_DEPLOY_HOOK` secret（B1 工作流已就位）。
3. **目视复核**：①⑥⑦ 检查点及整体视觉建议部署后人工扫一眼（本环境无浏览器渲染通道）。
4. **环境级阻塞项（已绕行）**：本环境全部 agent 会话的 pwsh 沙箱存在 ACL 故障（`grantWrite(E:\Project\AboutMe)` 失败），无法直接跑 npm/wrangler；本报告全部动态验证经宿主进程通道（dev_stage 临时工具，已清理）完成，结果可信。若后续轮次继续开发，建议 captain 反馈该环境问题。
5. **wrangler 兼容日期**：本地 wrangler 4.98 需 `--compatibility-date=2026-06-10`（已写入 README）；升级 wrangler 后可不带。

---

## 7. 附：t2/t3 改动文件总览（git status）

```
修改：AGENTS.md, CLAUDE.md, README.md, src/components/{LinkCard,SecondScreen,SectionTitle,ThemeToggle}.tsx,
      src/data/site.ts, src/hooks/useWallpaper.ts, src/index.css,
      functions/api/wallpaper.js（reviewer 修复）
新增：.github/workflows/daily-wallpaper.yml, functions/api/wallpaper.js,
      functions/api/wallpaper-image/[[path]].js, src/components/Reveal.tsx,
      WALLPAPER-DAILY-DESIGN.md（t1）
未触碰（回归确认）：SharedAvatar.tsx, Wallpaper.tsx, FirstScreen.tsx, App.tsx, icons.tsx,
      hooks/{useTheme,useTypewriter,useScrollProgress}.ts, vite.config.ts, scripts/fetch-wallpaper.mjs,
      public/_headers, index.html
```

（完）
