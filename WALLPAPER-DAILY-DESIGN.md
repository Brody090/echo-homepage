# 壁纸每日更换 — 根因诊断与修复方案设计

- 任务：t1（壁纸每日更换:根因诊断与方案设计）
- 作者：arch-analyzer（架构分析员）
- 目标仓库：github.com/Brody090/echo-homepage · 工作区 `E:\Project\AboutMe`
- 交付对象：fix-engineer（按第 11 节实施清单执行）、reviewer（按第 12 节验证手册验收）
- 状态：设计定稿，待实施

---

## 1. 根因诊断（证据链）

| # | 事实 | 证据（仓库文件） |
|---|------|------------------|
| F1 | 壁纸数据只在**构建时**抓取：`scripts/fetch-wallpaper.mjs` 从 Bing `HPImageArchive` 抓当日图，把图片本体写入 `public/wallpaper.jpg`，把元数据写入 `public/wallpaper.json`（`url` 指向同源 `/wallpaper.jpg`） | `scripts/fetch-wallpaper.mjs:15-51` |
| F2 | 运行时**只读静态快照**：`useWallpaper` 仅 `fetch('/wallpaper.json')`，失败时读 localStorage 当日缓存 | `src/hooks/useWallpaper.ts:66-90` |
| F3 | 部署形态是**纯静态站点**（Cloudflare Pages，构建命令 `npm run build`，输出 `dist/`），没有服务端进程 | `README.md:110-127` |
| F4 | 官方 Bing API **无 CORS 头**，浏览器不能直接 fetch（这正是"构建时注入"这个历史方案存在的原因） | `scripts/fetch-wallpaper.mjs:3-6`、`README.md:88` |
| F5 | 上一轮修复的教训：浏览器环境跨域加载 `www.bing.com` 图片会失败，**图片必须同源（或经本站代理）** | `scripts/fetch-wallpaper.mjs:35-36`、`README.md:88` |
| F6 | 项目代码自己都承认了局限："想保持每日新鲜：让部署平台每日触发一次构建即可"——但没有任何定时构建机制存在 | `scripts/fetch-wallpaper.mjs:9`；仓库无 `.github/workflows/`（已确认不存在） |

**根因**：`wallpaper.json` / `wallpaper.jpg` 是**构建时快照**。静态部署后，除非有人再推一次构建，这两个文件永远冻结在最后一次构建的日期 → 壁纸永远不变。"无法每日更换"不是 bug，而是当前架构（构建时注入）在没有每日重建机制下的**必然结果**。

**结论**：需要一个**运行时可变的壁纸来源**，同时满足"图片同源、无 CORS 问题、不依赖第三方代理、免费额度内"四大约束。

---

## 2. 约束清单（方案必须全部满足）

- **C1 无服务端**：Cloudflare Pages 静态部署，唯一可用的服务端能力是 **Pages Functions（边缘函数）**。
- **C2 无 CORS**：Bing `HPImageArchive` 响应无 CORS 头 → 浏览器直连不可行，必须由边缘函数代取（服务端 fetch 不受 CORS 约束）。
- **C3 图片同源**：图片最终必须以本站路径（`/api/...` 或 `/wallpaper.jpg`）加载，禁止运行时引用 `www.bing.com` 图片域。
- **C4 快照机制必须保留**：构建时快照是**兜底**，同时支撑 LCP preload（`vite.config.ts` 的 `wallpaperPreload` 插件把 `/wallpaper.jpg` 注入 index.html preload）。本方案**不改**这条链路。
- **C5 不引入第三方代理**：biturl 等代理已弃用/不可靠/单点隐私风险，明确排除。
- **C6 免费额度**：Pages Free 100k 请求/天。设计必须保证每次页面加载**不**回源 Bing——靠边缘缓存把回源率压到每天每 PoP 一两次。
- **C7 本地开发可用**：`vite dev` / `vite preview` 下没有 Functions 运行时，页面必须照常工作（静默降级到快照）。

---

## 3. 方案总览

```
浏览器 (useWallpaper)
 │ ① 同步读 localStorage（0 等待，若有当日缓存直接渲染）
 │ ② GET /wallpaper.json（同源快照，构建时注入，CDN 缓存 1h）→ 立即渲染 ←—— 首屏零等待路径（不变）
 │ ③ 后台 GET /api/wallpaper（边缘函数，CDN s-maxage=30min）→ 若 date 更新 → 探针预加载新图 → 换图
 │ ④ 图片 GET /api/wallpaper-image/<OHR.id>（边缘函数代取 bing 图片，同源、immutable 缓存）
 ▼
Cloudflare Pages Functions（新）
 /api/wallpaper ────────────► fetch Bing HPImageArchive（无 CORS 问题，服务端代取）
 /api/wallpaper-image/[id] ─► fetch www.bing.com/th?id=...（流式回传，严格白名单校验）
 ▼
Bing 官方 API / 图片 CDN
```

核心思想：**快照负责"快"（首屏），Functions 负责"新"（每日更换）**。两者接口契约同构（都是 `{date,url,copyright}`），前端拿到谁都能渲染，谁新用谁。

---

## 4. 方案 A（首选）：Cloudflare Pages Functions 边缘代理

### 4.1 端点一：`GET /api/wallpaper` — 当日壁纸元数据

**文件落点**：`functions/api/wallpaper.js`（Pages Functions 按文件路径自动路由，部署时随 `dist/` 一起上传，Git 集成自动生效，无需 `_routes.json`）。

**接口契约**：

```jsonc
// 200 OK
{
  "date": "2026-08-23",                                    // Bing startdate → YYYY-MM-DD，与快照格式完全一致
  "url": "/api/wallpaper-image/OHR.YellowstoneTrail_ZH-CN231234_1920x1080.jpg",  // 本站代理图地址（内容寻址）
  "copyright": "在处暑时节的村庄田野与寺庙佛塔… (© jia yu/Getty Images)"          // 空值兜底 "Bing 每日壁纸"
}
// 失败：502 {"error":"..."} + Cache-Control: no-store（禁止 CDN 缓存错误）
```

- 形状与 `public/wallpaper.json` **同构**，前端复用同一个 `WallpaperData` 类型，零新增类型。
- `url` 使用**内容寻址**：`/api/wallpaper-image/<imageId>`，`imageId` 取自 Bing 响应的 `urlbase`（`/th?id=OHR.xxx` 去掉前缀），**每天一个不同 URL** → 可安全 `immutable` 缓存（见 4.3 缓存回卷分析）。
- 服务端 fetch Bing：`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN`，带 UA 头（与构建脚本一致），**手动 `AbortController` + `setTimeout(12s)` 超时**——注意 workerd 运行时 `AbortSignal.timeout` 存在未捕获 DOMException 的已知问题（cloudflare/workerd#1020），禁止使用（构建脚本在 Node 里用它没问题，Functions 里不行）。

**缓存头（成功响应）**：

```
Cache-Control: public, max-age=300, s-maxage=1800, stale-while-revalidate=3600
```

- `s-maxage=1800`：共享缓存（Cloudflare 边缘）30 分钟——Bing 每日换图后，全球边缘 30 分钟内收敛到新日期；回源量 ≈ 每 PoP 每 30 分钟 1 次，远低于免费额度。
- `stale-while-revalidate=3600`：Bing 抖动/超时期间，边缘返回旧 JSON（旧日期 → 前端日期比较逻辑直接忽略，无害）。
- `max-age=300`：浏览器缓存 5 分钟，页面刷新不重复打边缘。

**参考实现**（供 fix-engineer 落地，最终以评审为准）：

```js
// functions/api/wallpaper.js
const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
const UA = 'Mozilla/5.0 (echo-homepage edge)';

export async function onRequestGet() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    let res;
    try {
      res = await fetch(BING_API, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('bing HTTP ' + res.status);
    const data = await res.json();
    const img = data?.images?.[0];
    if (!img?.urlbase || !img?.startdate) throw new Error('unexpected payload');
    const imageId = img.urlbase.split('id=')[1] ?? '';
    if (!/^OHR\.[A-Za-z0-9_.\-]{1,160}$/.test(imageId)) throw new Error('bad image id: ' + imageId);
    const date = `${img.startdate.slice(0, 4)}-${img.startdate.slice(4, 6)}-${img.startdate.slice(6, 8)}`;
    return Response.json(
      { date, url: `/api/wallpaper-image/${imageId}`, copyright: img.copyright || 'Bing 每日壁纸' },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
```

### 4.2 端点二：`GET /api/wallpaper-image/:imageId` — 图片本体代理

**文件落点**：`functions/api/wallpaper-image/[imageId].js`（动态路由，`context.params.imageId` 取参）。

**接口契约**：

```
GET /api/wallpaper-image/OHR.YellowstoneTrail_ZH-CN231234_1920x1080.jpg
200 → 图片字节流（1920×1080 jpg），Content-Type 透传上游，约 200-600KB
      Cache-Control: public, max-age=31536000, immutable
      X-Content-Type-Options: nosniff
404 → 非法 id / 上游失败，Cache-Control: no-store（错误绝不进缓存）
```

**防开放代理（安全关键）**：`imageId` 必须满足白名单正则 `^OHR\.[A-Za-z0-9_.\-]{1,160}$`，不通过直接 404。上游地址**硬编码拼接** `https://www.bing.com/th?id=<imageId>`——攻击者无法借这个端点抓任意 URL（无 SSRF、无任意内容代理面）。注意 `_headers` 文件对 Functions 响应不生效，`X-Content-Type-Options: nosniff` 要在函数内显式设置。

**参考实现**：

```js
// functions/api/wallpaper-image/[imageId].js
const UA = 'Mozilla/5.0 (echo-homepage edge)';
const ID_RE = /^OHR\.[A-Za-z0-9_.\-]{1,160}$/;

export async function onRequestGet(context) {
  const imageId = context.params.imageId ?? '';
  if (!ID_RE.test(imageId)) {
    return new Response('bad image id', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    let upstream;
    try {
      upstream = await fetch('https://www.bing.com/th?id=' + imageId, {
        headers: { 'User-Agent': UA },
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!upstream.ok) throw new Error('bing image HTTP ' + upstream.status);
    const type = upstream.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) throw new Error('not an image: ' + type);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return new Response('image fetch failed', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
```

### 4.3 缓存设计总表与「缓存回卷错配」分析

| 资源 | Cache-Control | 理由 |
|------|---------------|------|
| `/api/wallpaper`（JSON） | `public, max-age=300, s-maxage=1800, stale-while-revalidate=3600` | 30 分钟内全球收敛到新日期；SWR 抗 Bing 抖动 |
| `/api/wallpaper-image/:id`（图片） | `public, max-age=31536000, immutable` | URL 内容寻址：同 URL = 同图片 = 永不变，缓存一年只省流量 |
| 两个端点的错误响应 | `Cache-Control: no-store` | 失败状态绝不能污染缓存 |
| `/wallpaper.json`（快照，已有） | `public, max-age=3600`（`public/_headers:13-14`） | **不动**，快照只作兜底 |

**为什么图片端点必须内容寻址（关键决策）**：若图片用固定 URL（如 `/api/wallpaper-image`）且缓存 1 天，会出现在日期翻转时「新 JSON 日期 + 旧缓存图片」的错配窗口（最长 24h）。内容寻址（URL 含 Bing 当日图片 id）让"日期变了 ⇒ URL 变了 ⇒ 必然回源新图"，从根上消灭错配。JSON 与图片之间的依赖关系完全由前端日期比较协调（见 6.3）。

### 4.4 文件落点汇总

```
E:\Project\AboutMe\
├─ functions/                          ← 新增目录（Pages Functions 约定，项目根）
│  └─ api/
│     ├─ wallpaper.js                  ← 新增：GET /api/wallpaper
│     └─ wallpaper-image/
│        └─ [imageId].js               ← 新增：GET /api/wallpaper-image/:imageId
├─ public/                             ← 不动（快照兜底链保持原样）
├─ scripts/fetch-wallpaper.mjs         ← 不动
├─ vite.config.ts                      ← 不动（preload 注入照旧指向快照 /wallpaper.jpg）
└─ src/hooks/useWallpaper.ts           ← 修改（见第 6 节）
```

---

## 5. 前端 `useWallpaper` 改造设计

### 5.1 数据流（三段式升级）

```
阶段 1（同步，0ms）：localStorage 读缓存 → 有则立即渲染（可能是昨天 api 存下的图，作为占位）
阶段 2（快照，~ms）：  fetch('/wallpaper.json') → 比当前新（或无当前）则应用 → 首屏稳定画面
阶段 3（新鲜度，后台）：fetch('/api/wallpaper') → 仅当 date 严格更新 → 探针预加载 → 换图
```

- 阶段 2 逻辑 = 现有代码（快照 + 失败走缓存），**基本保留**。
- 阶段 3 是新增：挂在阶段 2 完成之后（不阻塞首屏），以及 `document.visibilitychange`（hidden→visible 时重查）——覆盖"标签页跨夜打开"场景。

### 5.2 探针预加载（防破图，必须实现）

`Wallpaper.tsx` 的 `onError` 会把 `failed=true` 且**不再重试**，一旦换到坏图，整页壁纸变纯色。因此**禁止直接 setState 换 src**，必须先探针：

```ts
// 换图前预检：新 URL 加载成功才切换，失败保持当前画面（快照/旧缓存仍在屏上）
const probe = new Image();
probe.onload = () => { /* setState(新数据) + 写 localStorage */ };
probe.onerror = () => { /* 静默保持当前，仅 console.warn */ };
probe.src = next.url;
```

注意：换图后 `Wallpaper` 会因 `src` 变化重新走 800ms 渐显——这是既有行为，可接受，不做交叉淡入（超出本任务范围）。

### 5.3 日期比较规则（唯一协调机制）

```ts
// date 均为 YYYY-MM-DD，ISO 格式字符串字典序 == 时间序，直接比较
const isNewer = (a?: string, b?: string) => !!a && (!b || a > b);
```

- 快照/API 数据仅当 `isNewer(next.date, current.date)` 才升级。
- **同日期一律不换**：快照与 api 同日期时保持快照图（它已被 preload，换图是纯浪费）。
- localStorage 缓存继续用现有 key `echo-homepage-wallpaper`，结构不变（`{date,url,copyright}`），api 数据写入同一个 key——旧 key 数据与新逻辑天然兼容，无需迁移。

### 5.4 参考伪代码（供 fix-engineer 落地）

```ts
// useWallpaper v2 骨架（在现有实现上增量改造）
useEffect(() => {
  // [保留] 阶段 1+2：localStorage 同步读 + fetch('/wallpaper.json') 快照（apply 改为带日期比较）
  // ...
  // [新增] 阶段 3：后台取新鲜度
  const refreshFromApi = () => {
    fetch('/api/wallpaper', { cache: 'default' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status)))
      .then(data => {
        if (typeof data?.url !== 'string' || !data.url) throw new Error('bad api payload');
        if (!isNewer(data.date, currentDateRef.current)) return; // 不比当前新 → 忽略
        const probe = new Image();
        probe.onload = () => apply({ date: data.date, url: data.url, copyright: data.copyright || FALLBACK_COPYRIGHT });
        probe.onerror = () => { /* 静默保持当前 */ };
        probe.src = data.url;
      })
      .catch(err => {
        if (import.meta.env.DEV) console.warn('api 壁纸刷新不可用，保持快照:', err?.message ?? err);
        // 生产环境完全静默：api 404/502 → 快照画面无感
      });
  };
  refreshFromApi();
  const onVisible = () => { if (document.visibilityState === 'visible') refreshFromApi(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => { cancelled = true; document.removeEventListener('visibilitychange', onVisible); };
}, []);
```

（`currentDateRef` 为 `useRef` 镜像当前 date，避免闭包旧值；cancelled 守卫沿用现有模式。）

---

## 6. 失败降级链（全链路）

```
渲染优先级：localStorage（同步）→ /wallpaper.json 快照 → /api/wallpaper 新图 → 保持现状
任意环节失败时的行为：
  /api/wallpaper 404/502/超时/JSON 异常（含本地 dev、vite preview 无 functions 环境）
    → 静默忽略（生产零 console 噪音），画面停留在快照/缓存 —— 与今日体验完全一致 ✓
  新图探针加载失败（bing 图片 404、代理 404）
    → 静默保持当前画面，绝不出现纯色回退 ✓
  /wallpaper.json 快照失败
    → 现有逻辑：localStorage 当日缓存 → 纯底色（不变）✓
  localStorage 不可用（隐私模式）
    → 现有 try/catch（不变）✓
```

**最坏情况**（api 长期不可用 + 无新构建）：退化为当前行为——固定快照壁纸。**任何单点故障都不会让页面比今天更糟**，这是本方案的核心安全属性。

---

## 7. 方案 B（可选兜底）：GitHub Actions 每日构建，保持快照新鲜

Functions 已解决"每日更换"，快照每日刷新是**锦上添花**（让 preload 的图也是当日图、api 挂掉时兜底图不过时）。两个实施选项：

**选项 B1（推荐，最简单）：Cloudflare Pages Deploy Hook + 定时 curl**
- 在 Cloudflare Dashboard → Pages 项目 → Settings → Builds & deployments → Deploy hooks 创建一个 hook（得到 `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<id>`）；
- 仓库新增 secrets：`CF_DEPLOY_HOOK`；
- 工作流文件 `.github/workflows/daily-wallpaper.yml`：

```yaml
name: Daily Wallpaper Refresh
on:
  schedule:
    # UTC 16:30 = 北京时间 00:30，Bing zh-CN 换图之后
    - cron: '30 16 * * *'
  workflow_dispatch: {}
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare Pages build
        run: curl -fsS -X POST "${{ secrets.CF_DEPLOY_HOOK }}"
```

（Deploy Hook 触发的是**仓库当前分支头的重新构建**，`npm run build` 内置的 `fetch-wallpaper.mjs` 会抓当日图 → 快照每日更新。零 wrangler 认证成本。）

**选项 B2：wrangler 直接部署**（需要 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` 两个 secrets）：

```yaml
name: Daily Wallpaper Deploy
on:
  schedule: [{ cron: '30 16 * * *' }]
  workflow_dispatch: {}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - run: npx wrangler pages deploy dist --project-name=echo-homepage
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

> 注意：B2 的 `wrangler pages deploy dist` 会**同时上传 `functions/`**，行为与 Git 集成一致，无冲突。若站点已用 Git 集成自动构建，B1 足够；B2 是 B1 不可用时的替代。两者都是**可选实施项**。

---

## 8. README 更新要点（随实施一起改）

1. 特性列表"Bing 每日壁纸（构建时注入）"改为两层描述：快照兜底 + Functions 每日刷新；
2. "关键实现 → 壁纸管线"增加第 4 步：运行时 `useWallpaper` 后台请求 `/api/wallpaper` 拿当日图（经 `functions/` 边缘代理），仅日期更新时换图；
3. "部署"一节补充说明：
   - `functions/` 目录随 Git 集成构建**自动部署**，无需任何额外配置；
   - 本地验证 Functions：`npm run build && npx wrangler pages dev dist`（`vite dev` 下无 functions，属预期降级）；
   - 可选：Deploy Hook 每日刷新快照（第 7 节）。

---

## 9. 明确不做的事

| 不做 | 原因 |
|------|------|
| ❌ 引入第三方代理服务（biturl 等） | 已弃用/不可靠/单点故障/隐私风险，且违背 C5 |
| ❌ 浏览器直接 fetch Bing API/图片 | API 无 CORS 头；图片跨域在部分网络环境被拦截（上一轮修复的教训） |
| ❌ 改构建时快照机制（`scripts/fetch-wallpaper.mjs`、`vite.config.ts` preload、`public/_headers`） | 它是兜底 + LCP 快路径，改了反而破坏首屏性能 |
| ❌ Service Worker / CacheStorage 方案 | 复杂度高、首访无效、与 CDN 缓存重复，收益为零 |
| ❌ Cloudflare KV / D1 等付费绑定 | C6 免费额度内用不上；边缘缓存已足够 |
| ❌ 修改 `Wallpaper.tsx` 的 onError 行为（允许重试/交叉淡入） | 探针预加载（5.2）已在前端消解破图风险；交叉淡入属 UI 优化，另立任务 |

---

## 10. 边界情况清单（实现与评审对照检查）

| # | 场景 | 预期行为 |
|---|------|----------|
| E1 | 本地 `npm run dev` / `vite preview`（无 functions） | `/api/wallpaper` 404 → 静默，快照正常渲染（dev 控制台有一条 warn） |
| E2 | 日期翻转后用户首次访问（CDN JSON 缓存可能滞后 30 分钟） | 30 分钟内看到昨日图（与"无此方案"一致），随后自动收敛；绝不出现日期与图错配（内容寻址） |
| E3 | 标签页跨夜打开 | visibilitychange 重查 api → 换当日图 |
| E4 | Bing API/图片 CDN 故障 | 502/404 + no-store → 前端静默保持快照 |
| E5 | 探针预加载失败（代理 404） | 保持当前画面，不出现纯色/破图 |
| E6 | localStorage 禁用/损坏 | 现有 try/catch，正常降级 |
| E7 | 同日期重复请求 | 日期比较短路，不换图不重复下载 |
| E8 | 恶意/异常 `imageId` | 白名单正则 404（防开放代理） |
| E9 | 多标签页同时打开 | 各标签独立请求，命中同一 CDN 缓存，无竞态 |
| E10 | `mkt=zh-CN` 与快照市场不一致（未来改市场） | 需同步改 `functions/api/wallpaper.js` 与 `scripts/fetch-wallpaper.mjs` 两处常量（README 注明） |

---

## 11. 实施清单（文件级 diff 计划，交付 fix-engineer）

| # | 文件 | 动作 | 风险 | 验证方法 |
|---|------|------|------|----------|
| 1 | `functions/api/wallpaper.js` | **新增**（4.1 参考实现） | 低。独立路由，不影响现有资产 | 本地 `npm run build && npx wrangler pages dev dist` 后 `curl -s localhost:8788/api/wallpaper` 应返回当日 JSON；上线后 `curl -sI https://010912.top/api/wallpaper` 检查 Cache-Control 与日期 |
| 2 | `functions/api/wallpaper-image/[imageId].js` | **新增**（4.2 参考实现） | **中（安全面）**：防开放代理依赖白名单正则 | `curl -sI .../api/wallpaper-image/<合法id>` 200 image/jpeg + immutable；`curl -s .../api/wallpaper-image/..%2Fetc` 与非法字符 → 404；`curl -sI` 确认错误响应 no-store |
| 3 | `src/hooks/useWallpaper.ts` | **修改**：保留快照/缓存逻辑；新增阶段 3（api 刷新 + 日期比较 + 探针预加载 + visibilitychange）；`currentDateRef`；dev-only warn | **中**：这是唯一触碰运行时行为的改动 | 本地 dev 验证（见 12.1）；`tsc --noEmit` 通过；确认无新增未使用变量（tsconfig strict） |
| 4 | `src/data/site.ts` | **可选**：加 `WALLPAPER_API_URL = '/api/wallpaper'` 常量（或留在 hook 内） | 无 | — |
| 5 | `README.md` | **修改**：第 8 节三点 | 无 | 通读确认与实际行为一致 |
| 6 | `.github/workflows/daily-wallpaper.yml` | **可选**：新增（7 节 B1/B2 择一） | 低。需要用户在自己账号建 Deploy Hook / secrets（团队无法代办，输出为交付说明） | `workflow_dispatch` 手动触发一次，Dashboard 确认触发新构建 |
| — | `scripts/fetch-wallpaper.mjs`、`vite.config.ts`、`public/_headers`、`Wallpaper.tsx`、`FirstScreen.tsx` | **明确不改** | — | 回归确认 preload 注入与快照渲染照旧（12.1） |

---

## 12. 验证手册（交付 reviewer）

### 12.1 本地验证（不需要 Cloudflare 账号）

1. `npm run wallpaper` → 确认 `public/wallpaper.json` 日期为今日；
2. `npm run dev` → 打开页面：首屏壁纸正常（快照路径）；DevTools Network 中 `/api/wallpaper` 为 404，Console 有一条 dev warn；**页面无任何报错、壁纸不闪不破**（验证 E1）；
3. DevTools → 勾选 Block request URL `*/api/wallpaper` → 刷新 → 页面与步骤 2 完全一致（验证降级链）；
4. `npm run build && npx wrangler pages dev dist` → `curl localhost:8788/api/wallpaper` 返回当日 JSON；把返回的 `url` 粘到浏览器打开，图片正常显示（验证两个 functions 本地可用）；
5. `npm run preview` → 行为同步骤 2（vite preview 无 functions，属预期）。

### 12.2 线上验证（部署后）

1. `curl -s https://010912.top/api/wallpaper | jq .` → `date` 为当日、`url` 为 `/api/wallpaper-image/OHR...` 形态；
2. `curl -sI https://010912.top/api/wallpaper` → `Cache-Control: public, max-age=300, s-maxage=1800, stale-while-revalidate=3600`；
3. `curl -sI <返回的图片URL>` → `200`、`Content-Type: image/jpeg`、`Cache-Control: ... immutable`；
4. 连续两次 `curl -s https://010912.top/api/wallpaper` 返回一致（缓存命中）；等待/模拟日期翻转后，`date` 变化且图片 URL 变化（内容寻址生效）；
5. 浏览器实测：DevTools Network 确认快照 `/wallpaper.jpg` 先渲染、`/api/wallpaper` 后台请求、日期不同时壁纸更新且无破图闪现；
6. 负向：`curl -s -o /dev/null -w "%{http_code}" "https://010912.top/api/wallpaper-image/%2e%2e%2fetc"` → 404。

### 12.3 回归清单（确认未破坏既有功能）

- [ ] 首屏 preload（`index.html` 中的 `/wallpaper.jpg` `<link rel="preload">`）仍在；
- [ ] 无网络时页面回退纯色（既有行为）；
- [ ] 主题切换、打字机、滚动进度不受影响（本次未触碰）；
- [ ] `npm run build` 全绿（tsc 严格模式 + vite 构建）。

---

## 13. 给 captain 的决策摘要

1. **根因确认**：静态快照 + 无每日重建 = 壁纸冻结；证据见第 1 节 F1-F6。
2. **方案**：Cloudflare Pages Functions 双端点边缘代理（JSON 短缓存 + 内容寻址图片 immutable 缓存），前端保持"快照先渲染 → 后台 api 刷新 → 日期更新才探针换图"；构建快照机制**原样保留**作兜底。
3. **关键设计决策**：图片 URL 内容寻址（消灭缓存回卷错配）、错误响应 no-store、白名单正则防开放代理、探针预加载防破图、workerd 禁用 `AbortSignal.timeout`。
4. **可选实施**：GitHub Actions + Deploy Hook 每日构建（B1 优先）。
5. **交付物**：本设计文档 + 第 11 节实施清单（fix-engineer 可直接执行）+ 第 12 节验证手册（reviewer 验收依据）。
