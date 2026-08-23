// 构建时从 Bing 官方壁纸 API 抓取当日壁纸（1920×1080），写入 public/wallpaper.json。
//
// 为什么在构建时抓而不是运行时抓：
// - 官方 HPImageArchive 响应无 CORS 头，浏览器 fetch 会被拦截（第三方代理又慢且是单点）
// - 构建时注入后，壁纸 URL 随 index.html 以 preload 方式下发（vite.config.ts 注入），
//   壁纸图在 HTML 阶段即并行下载，LCP 关键路径不再经过 JS → API 串行等待
//
// 失败策略：保留已有的 wallpaper.json（构建不中断）；若从未成功过，页面回退到首屏底色。
// 想保持每日新鲜：让部署平台（CF Pages / GitHub Action）每日触发一次构建即可。
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public', 'wallpaper.json');
const IMG_OUT = join(ROOT, 'public', 'wallpaper.jpg');
const IMG_TMP = join(ROOT, 'public', 'wallpaper.jpg.tmp');
const API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';

function formatDate(yyyymmdd) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

try {
  const res = await fetch(API, {
    headers: { 'User-Agent': 'Mozilla/5.0 (echo-homepage build)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const image = data?.images?.[0];
  if (!image?.url || !image?.startdate) throw new Error('unexpected payload');
  const remoteUrl = 'https://www.bing.com' + image.url;

  // 下载壁纸图本体到 public/wallpaper.jpg（同源加载，运行时零第三方请求；
  // 依赖 bing.com 跨域图在部分网络环境下会被拦截导致壁纸不显示）
  const imgRes = await fetch(remoteUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (echo-homepage build)' },
    signal: AbortSignal.timeout(60000),
  });
  if (!imgRes.ok) throw new Error(`image HTTP ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`image too small (${buf.length}B)`);
  writeFileSync(IMG_TMP, buf);
  renameSync(IMG_TMP, IMG_OUT);

  const payload = {
    date: formatDate(image.startdate),
    url: '/wallpaper.jpg',
    copyright: image.copyright ?? 'Bing 每日壁纸',
  };
  const next = JSON.stringify(payload, null, 2) + '\n';
  // 注意：不要 process.exit()——Node 24 on Windows 下 undici 连接未关闭时强制退出会触发 libuv 断言崩溃
  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === next) {
    console.log('[wallpaper] unchanged:', payload.date);
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, next, 'utf8');
    console.log('[wallpaper] updated:', payload.date, '-', remoteUrl, '-> /wallpaper.jpg');
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  rmSync(IMG_TMP, { force: true });
  if (existsSync(OUT) && existsSync(IMG_OUT)) {
    console.warn('[wallpaper] fetch failed, keeping existing wallpaper.json + wallpaper.jpg:', msg);
  } else {
    console.warn('[wallpaper] fetch failed, no local wallpaper (page falls back to plain background):', msg);
  }
}
