// Cloudflare Pages Functions: GET /api/wallpaper-image/<imageId>
// 白名单代理 Bing 图片本体，避免开放代理；1280 / UHD 缺失时回退 1920 原图。
const UA = 'Mozilla/5.0 (echo-homepage edge)';
const ID_RE = /^OHR\.[A-Za-z0-9_.\-]{1,160}$/;
const TIMEOUT_MS = 15_000;

async function fetchImage(imageId) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch('https://www.bing.com/th?id=' + imageId, {
      headers: { 'User-Agent': UA },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet(context) {
  const raw = context.params?.path;
  const imageId = Array.isArray(raw) ? raw.join('/') : String(raw ?? '');
  if (!ID_RE.test(imageId)) {
    return new Response('bad image id', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    let upstream = await fetchImage(imageId);
    const fallbackId = imageId.replace(/_(?:UHD|1280x720)\.jpg$/, '_1920x1080.jpg');
    if (!upstream.ok && fallbackId !== imageId) {
      try { await upstream.body?.cancel(); } catch { /* 已关闭的响应体无需处理 */ }
      upstream = await fetchImage(fallbackId);
    }
    if (!upstream.ok) throw new Error('bing image HTTP ' + upstream.status);

    const type = upstream.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) throw new Error('not an image: ' + type);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': type,
        // URL 含每日图片 id，响应内容固定；即使回退原图也不会随后变为另一张图。
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return new Response('image fetch failed', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
