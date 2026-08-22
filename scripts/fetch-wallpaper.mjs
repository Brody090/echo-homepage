// 构建时从 Bing 官方壁纸 API 抓取当日壁纸（1920×1080），写入 public/wallpaper.json。
//
// 为什么在构建时抓而不是运行时抓：
// - 官方 HPImageArchive 响应无 CORS 头，浏览器 fetch 会被拦截（第三方代理又慢且是单点）
// - 构建时注入后，壁纸 URL 随 index.html 以 preload 方式下发（vite.config.ts 注入），
//   壁纸图在 HTML 阶段即并行下载，LCP 关键路径不再经过 JS → API 串行等待
//
// 失败策略：保留已有的 wallpaper.json（构建不中断）；若从未成功过，页面回退到首屏底色。
// 想保持每日新鲜：让部署平台（CF Pages / GitHub Action）每日触发一次构建即可。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public', 'wallpaper.json');
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
  const payload = {
    date: formatDate(image.startdate),
    url: 'https://www.bing.com' + image.url,
    copyright: image.copyright ?? 'Bing 每日壁纸',
  };
  const next = JSON.stringify(payload, null, 2) + '\n';
  // 注意：不要 process.exit()——Node 24 on Windows 下 undici 连接未关闭时强制退出会触发 libuv 断言崩溃
  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === next) {
    console.log('[wallpaper] unchanged:', payload.date);
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, next, 'utf8');
    console.log('[wallpaper] updated:', payload.date, '-', payload.url);
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (existsSync(OUT)) {
    console.warn('[wallpaper] fetch failed, keeping existing wallpaper.json:', msg);
  } else {
    console.warn('[wallpaper] fetch failed, no wallpaper.json (page falls back to plain background):', msg);
  }
}
