// 构建时从 Bing 官方壁纸 API 抓取当日壁纸，生成 1280 / 1920 / UHD 多尺寸本地快照。
// 前端通过 srcSet 按设备选择，避免手机一律下载 4K；所有图片均为同源静态资源。
// 抓取失败时保留已有快照，构建不中断；从未成功过则页面回退首屏纯底色。
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT, 'public');
const OUT = join(PUBLIC_DIR, 'wallpaper.json');
const API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
const UA = 'Mozilla/5.0 (echo-homepage build)';
const VARIANTS = [
  { resolution: '1280x720', width: 1280, file: 'wallpaper-1280.jpg' },
  { resolution: '1920x1080', width: 1920, file: 'wallpaper-1920.jpg' },
  { resolution: 'UHD', width: 3840, file: 'wallpaper.jpg' },
].map(variant => ({
  ...variant,
  out: join(PUBLIC_DIR, variant.file),
  tmp: join(PUBLIC_DIR, `${variant.file}.tmp`),
}));

function formatDate(yyyymmdd) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function toResolutionUrl(url, resolution) {
  return url.replace(/([?&]id=[^&]*?)_(?:\d+x\d+|UHD)\.jpg/, `$1_${resolution}.jpg`);
}

/** 下载图片本体并校验大小；失败抛错由调用方决定回退。 */
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`image too small (${buf.length}B)`);
  return buf;
}

/** 非原始尺寸不可用时回退原图，但不把原图伪装成对应宽度的 srcSet 候选。 */
async function downloadVariant(variant, originalUrl) {
  const url = toResolutionUrl(originalUrl, variant.resolution);
  try {
    return {
      buffer: await downloadImage(url),
      source: `/${variant.file} ${variant.width}w`,
    };
  } catch (err) {
    if (url === originalUrl) throw err;
    console.warn(`[wallpaper] ${variant.resolution} fetch failed, using original image:`, err?.message ?? err);
    return { buffer: await downloadImage(originalUrl), source: null };
  }
}

try {
  const res = await fetch(API, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const image = data?.images?.[0];
  if (!image?.url || !image?.startdate) throw new Error('unexpected payload');
  const originalUrl = 'https://www.bing.com' + image.url;

  // 三个尺寸并行下载；全部成功后才替换现有文件，避免部分失败破坏快照。
  const results = await Promise.all(VARIANTS.map(variant => downloadVariant(variant, originalUrl)));
  mkdirSync(PUBLIC_DIR, { recursive: true });
  results.forEach((result, index) => writeFileSync(VARIANTS[index].tmp, result.buffer));
  results.forEach((_, index) => renameSync(VARIANTS[index].tmp, VARIANTS[index].out));

  const payload = {
    date: formatDate(image.startdate),
    url: '/wallpaper.jpg',
    srcSet: results.map(result => result.source).filter(Boolean).join(', '),
    copyright: image.copyright ?? 'Bing 每日壁纸',
  };
  const next = JSON.stringify(payload, null, 2) + '\n';
  // 不要 process.exit()：Node 24 on Windows 下 undici 连接未关闭时强制退出会触发 libuv 断言崩溃。
  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === next) {
    console.log('[wallpaper] unchanged:', payload.date);
  } else {
    writeFileSync(OUT, next, 'utf8');
    console.log('[wallpaper] updated:', payload.date, '- responsive local snapshots');
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  VARIANTS.forEach(variant => rmSync(variant.tmp, { force: true }));
  if (existsSync(OUT) && existsSync(join(PUBLIC_DIR, 'wallpaper.jpg'))) {
    console.warn('[wallpaper] fetch failed, keeping existing wallpaper snapshot:', msg);
  } else {
    console.warn('[wallpaper] fetch failed, no local wallpaper (page falls back to plain background):', msg);
  }
}
